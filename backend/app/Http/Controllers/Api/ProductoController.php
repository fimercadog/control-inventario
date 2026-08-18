<?php

namespace App\Http\Controllers\Api;

use App\Enums\TipoMovimiento;
use App\Http\Controllers\Concerns\FiltersByEmpresa;
use App\Http\Controllers\Concerns\ResolvesPagination;
use App\Http\Controllers\Controller;
use App\Http\Requests\Movimiento\StoreIngresoRequest;
use App\Http\Requests\Producto\StoreProductoRequest;
use App\Http\Requests\Producto\UpdateProductoRequest;
use App\Http\Resources\Movimiento\MovimientoResource;
use App\Http\Resources\Producto\ProductoResource;
use App\Http\Support\ApiResponse;
use App\Models\Producto;
use App\Services\Audit\AuditLogger;
use App\Services\InventoryService;
use App\Services\ProductService;
use App\Services\ProveedorResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Ficha de producto (docs/03_FUNCTIONAL_SPEC/Products.md, adenda
 * "Ficha de Producto"). Alcance deliberadamente acotado: detalle, edición
 * de catálogo, y el historial de movimientos de este producto — nunca
 * `stock_actual` (propiedad exclusiva de InventoryService) ni el módulo
 * Kardex/Auditoría/Exportaciones completos (siguen en
 * docs/03_FUNCTIONAL_SPEC/FUTURE/, sin construir).
 *
 * `{producto}` se resuelve explícitamente por empresa (ADR-019,
 * `FiltersByEmpresa`) — ya no por route-model-binding automático — y
 * `authorize()` sigue siendo la segunda capa de defensa explícita, mismo
 * patrón que CapturaIAController.
 */
class ProductoController extends Controller
{
    use FiltersByEmpresa;
    use ResolvesPagination;

    public function __construct(
        private readonly ProductService $productos,
        private readonly InventoryService $inventario,
        private readonly AuditLogger $auditoria,
        private readonly ProveedorResolver $proveedores,
    ) {
    }

    /**
     * FEATURE-001 (docs/03_FUNCTIONAL_SPEC/Products.md, Adenda 2).
     * Reutiliza ProductService::crear() — el mismo servicio que usa
     * Captura IA, sin duplicar la lógica de creación. `stock_actual`
     * nace en 0 (mismo invariante de siempre); el stock inicial se
     * asigna después vía "Registrar ingreso" (registrarIngreso() abajo).
     */
    public function store(StoreProductoRequest $request): JsonResponse
    {
        $this->authorize('create', Producto::class);

        $empresaId = $request->user()->empresa_id;

        $producto = $this->productos->crear([
            ...$request->validated(),
            'empresa_id' => $empresaId,
        ]);

        $this->registrarAuditoria(
            $request,
            $empresaId,
            'productos',
            'productos.crear_manual',
            Producto::class,
            $producto->id,
            $producto->only(['codigo', 'nombre', 'marca_id', 'categoria_id']),
        );

        return ApiResponse::success(
            new ProductoResource($this->conRelaciones($producto)),
            'Producto creado correctamente',
            201
        );
    }

    /**
     * Listado real del catálogo — reemplaza el consumo de datos mock
     * (`lib/mock/data.ts`) que tenía hoy `frontend/app/(app)/productos/page.tsx`.
     *
     * Corrección de auditoría funcional (docs/06_TESTS/DemoDataAudit.md,
     * "Corrección del Módulo Productos", 2026-07-30): por defecto solo
     * activos — inactivos visibles únicamente vía filtro explícito
     * `estado=todos` (GLOBAL UI STANDARD, mismo criterio que Proveedores).
     *
     * `busqueda` agregado en la auditoría de cierre de módulo (2026-08-11):
     * Productos era el único de los 5 controllers de catálogo sin filtro
     * server-side (Categoría/Marca/Unidad de Medida/Proveedor ya lo
     * tenían) — el frontend filtraba solo la página cargada (100
     * productos), dejando invisibles los productos más allá de esa
     * página. Busca por nombre o por nombre de marca, mismo criterio que
     * ya usaba el filtro client-side que este cambio reemplaza.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Producto::class);

        $estado = $request->query('estado', 'activo');

        $productos = $this->paraEmpresaActual(Producto::query())
            ->with(['categoria', 'marca', 'unidadMedida'])
            ->when($estado !== 'todos', fn ($query) => $query->where('estado', $estado))
            ->when($request->query('busqueda'), fn ($query, $busqueda) => $query->where(
                fn ($q) => $q->where('nombre', 'like', "%{$busqueda}%")
                    ->orWhereHas('marca', fn ($m) => $m->where('nombre', 'like', "%{$busqueda}%"))
            ))
            // Paginación real (Work Order "Paginación global", 2026-08-17):
            // antes el filtro de Categoría se aplicaba client-side sobre la
            // página ya cargada — con paginación real de verdad eso solo
            // filtraría dentro de la página actual, no el catálogo entero.
            // Se mueve al servidor, mismo criterio que ya usan Estado/Búsqueda.
            ->when($request->query('categoria_id'), fn ($query, $categoriaId) => $query->where('categoria_id', $categoriaId))
            ->orderBy('nombre')
            ->paginate($this->perPageDeRequest($request, 100));

        return ApiResponse::success([
            'items' => ProductoResource::collection($productos)->resolve(),
            'meta' => $this->metaDePaginacion($productos),
        ]);
    }

    public function show(int $producto): JsonResponse
    {
        $producto = $this->resolverParaEmpresaActual(Producto::class, $producto);
        $this->authorize('view', $producto);

        return ApiResponse::success(new ProductoResource($this->conRelaciones($producto)));
    }

    public function update(UpdateProductoRequest $request, int $producto): JsonResponse
    {
        $producto = $this->resolverParaEmpresaActual(Producto::class, $producto);
        $this->authorize('update', $producto);

        $datos = $request->validated();
        $datos['empresa_id'] = $producto->empresa_id;

        // RC1 Fase 1 (docs/03_FUNCTIONAL_SPEC/Brands.md, UnitsOfMeasure.md):
        // `marca_nuevo`/`unidad_medida_nuevo` (quick-create) se resuelven a
        // un id real antes de guardar — $producto->update() por sí solo no
        // puede crear filas de catálogo. Los tres resolvers (incluido
        // categoria_id, sin variante `_nuevo`) verifican pertenencia a la
        // empresa actual — auditoría de cierre de módulo, 2026-08-11.
        if (array_key_exists('marca_nuevo', $datos) || array_key_exists('marca_id', $datos)) {
            $datos['marca_id'] = $this->productos->resolverMarcaId($datos);
        }
        if (array_key_exists('unidad_medida_nuevo', $datos) || array_key_exists('unidad_medida_id', $datos)) {
            $datos['unidad_medida_id'] = $this->productos->resolverUnidadMedidaId($datos);
        }
        if (array_key_exists('categoria_id', $datos)) {
            $datos['categoria_id'] = $this->productos->resolverCategoriaId($datos);
        }

        $producto->update($datos);

        return ApiResponse::success(
            new ProductoResource($this->conRelaciones($producto)),
            'Producto actualizado correctamente'
        );
    }

    /**
     * FEATURE-002 (docs/03_FUNCTIONAL_SPEC/Products.md, Adenda 2).
     * Reutiliza InventoryService::registrarMovimiento() — único punto de
     * escritura de stock_actual y movimientos, mismo que usa Captura IA.
     * "Kardex" se satisface porque movimientos() abajo ya refleja este
     * nuevo registro de inmediato — no se construye un módulo aparte.
     */
    public function registrarIngreso(StoreIngresoRequest $request, int $producto): JsonResponse
    {
        $producto = $this->resolverParaEmpresaActual(Producto::class, $producto);
        $this->authorize('update', $producto);

        $datos = $request->validated();

        // FEATURE-003: "Select existing supplier or Create supplier
        // quickly" — mutuamente excluyentes. Si se crea uno nuevo, queda
        // dado de alta como un Proveedor real (mismo módulo, misma
        // auditoría), no como un registro descartable.
        // FEATURE-005: si no se especifica proveedor explícitamente, usa
        // el proveedor principal asociado al producto (si existe) —
        // "default to the primary supplier while allowing selection of
        // another associated supplier".
        [$proveedorId, $proveedorNombre] = $this->proveedores->resolver($request, $datos, $producto);

        $movimiento = $this->inventario->registrarMovimiento(
            producto: $producto,
            tipo: TipoMovimiento::Entrada,
            cantidad: (float) $datos['cantidad'],
            documento: $datos['documento'] ?? null,
            observacion: $datos['observacion'] ?? null,
            usuarioId: $request->user()->id,
            costo: isset($datos['costo']) ? (float) $datos['costo'] : null,
            proveedor: $proveedorNombre,
            lote: $datos['lote'] ?? null,
            vencimiento: $datos['vencimiento'] ?? null,
            proveedorId: $proveedorId,
            bodegaId: isset($datos['bodega_id']) ? (int) $datos['bodega_id'] : null,
        );

        $this->registrarAuditoria(
            $request,
            $producto->empresa_id,
            'movimientos',
            'movimientos.registrar_ingreso_manual',
            \App\Models\Movimiento::class,
            $movimiento->id,
            $movimiento->only(['producto_id', 'bodega_id', 'tipo', 'cantidad', 'stock_nuevo', 'proveedor', 'lote']),
        );

        return ApiResponse::success(
            new ProductoResource($this->conRelaciones($producto->fresh())),
            'Ingreso registrado correctamente',
            201
        );
    }

    /**
     * GLOBAL RULE: "Physical DELETE is NEVER allowed from the UI." Único
     * mecanismo de "eliminar" un producto — deshabilita, nunca borra la
     * fila. Preserva movimientos, asociaciones con proveedores y
     * auditoría (mismo patrón que ProveedorController::disable()).
     * Corrección de auditoría funcional, docs/06_TESTS/DemoDataAudit.md.
     */
    public function disable(Request $request, int $producto): JsonResponse
    {
        $producto = $this->resolverParaEmpresaActual(Producto::class, $producto);
        $this->authorize('delete', $producto);

        $producto->update(['estado' => 'inactivo', 'inhabilitado_por_stock' => false]);

        $this->registrarAuditoria(
            $request,
            $producto->empresa_id,
            'productos',
            'productos.deshabilitar',
            Producto::class,
            $producto->id,
            ['estado' => 'inactivo', 'inhabilitado_por_stock' => false],
        );

        return ApiResponse::success(
            new ProductoResource($this->conRelaciones($producto)),
            'Producto deshabilitado correctamente'
        );
    }

    public function enable(Request $request, int $producto): JsonResponse
    {
        $producto = $this->resolverParaEmpresaActual(Producto::class, $producto);
        $this->authorize('update', $producto);

        $producto->update(['estado' => 'activo', 'inhabilitado_por_stock' => false]);

        $this->registrarAuditoria(
            $request,
            $producto->empresa_id,
            'productos',
            'productos.habilitar',
            Producto::class,
            $producto->id,
            ['estado' => 'activo', 'inhabilitado_por_stock' => false],
        );

        return ApiResponse::success(
            new ProductoResource($this->conRelaciones($producto)),
            'Producto habilitado correctamente'
        );
    }

    public function movimientos(int $producto): JsonResponse
    {
        $producto = $this->resolverParaEmpresaActual(Producto::class, $producto);
        $this->authorize('view', $producto);

        $movimientos = $producto->movimientos()->with('bodega')->latest()->paginate(20);

        return ApiResponse::success([
            'items' => MovimientoResource::collection($movimientos)->resolve(),
            'meta' => [
                'current_page' => $movimientos->currentPage(),
                'per_page' => $movimientos->perPage(),
                'total' => $movimientos->total(),
                'last_page' => $movimientos->lastPage(),
            ],
        ]);
    }

    /**
     * Simplificación 2026-08-09 (revisión "Reuse"/"Simplification"): mismo
     * shape repetido 4 veces en este controller — solo variaban módulo,
     * acción, tipo/id auditado y los valores nuevos. Espejo del patrón ya
     * usado en ProductoProveedorController::registrarAuditoria().
     */
    private function registrarAuditoria(
        Request $request,
        int $empresaId,
        string $modulo,
        string $accion,
        string $auditableType,
        int $auditableId,
        array $valoresNuevos,
    ): void {
        $this->auditoria->registrarAccionManual(
            empresaId: $empresaId,
            usuarioId: $request->user()->id,
            modulo: $modulo,
            accion: $accion,
            auditableType: $auditableType,
            auditableId: $auditableId,
            valoresNuevos: $valoresNuevos,
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );
    }

    /**
     * Simplificación 2026-08-09 (revisión "Simplification"): mismo
     * `->load([...])` repetido 6 veces en este controller.
     */
    private function conRelaciones(Producto $producto): Producto
    {
        return $producto->load(['categoria', 'marca', 'unidadMedida']);
    }
}
