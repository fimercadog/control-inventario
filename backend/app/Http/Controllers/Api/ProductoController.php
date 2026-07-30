<?php

namespace App\Http\Controllers\Api;

use App\Enums\TipoMovimiento;
use App\Http\Controllers\Controller;
use App\Http\Requests\Movimiento\StoreIngresoRequest;
use App\Http\Requests\Producto\StoreProductoRequest;
use App\Http\Requests\Producto\UpdateProductoRequest;
use App\Http\Resources\Movimiento\MovimientoResource;
use App\Http\Resources\Producto\ProductoResource;
use App\Http\Support\ApiResponse;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Services\Audit\AuditLogger;
use App\Services\InventoryService;
use App\Services\ProductService;
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
 * `{producto}` se resuelve por route-model-binding; TenantScope ya filtra
 * automáticamente (Módulo 2 — Company Isolation), y `authorize()` es la
 * segunda capa de defensa explícita, mismo patrón que CapturaIAController.
 */
class ProductoController extends Controller
{
    public function __construct(
        private readonly ProductService $productos,
        private readonly InventoryService $inventario,
        private readonly AuditLogger $auditoria,
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

        $this->auditoria->registrarAccionManual(
            empresaId: $empresaId,
            usuarioId: $request->user()->id,
            modulo: 'productos',
            accion: 'productos.crear_manual',
            auditableType: Producto::class,
            auditableId: $producto->id,
            valoresNuevos: $producto->only(['codigo', 'nombre', 'marca_id', 'categoria_id']),
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return ApiResponse::success(
            new ProductoResource($producto->load(['categoria', 'marca', 'unidadMedida'])),
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
     */
    public function index(Request $request): JsonResponse
    {
        $productos = Producto::query()
            ->with(['categoria', 'marca', 'unidadMedida'])
            ->when(
                $request->query('estado') !== 'todos',
                fn ($query) => $query->where('estado', $request->query('estado', 'activo'))
            )
            ->orderBy('nombre')
            ->paginate(100);

        return ApiResponse::success([
            'items' => ProductoResource::collection($productos)->resolve(),
            'meta' => [
                'current_page' => $productos->currentPage(),
                'per_page' => $productos->perPage(),
                'total' => $productos->total(),
                'last_page' => $productos->lastPage(),
            ],
        ]);
    }

    public function show(Producto $producto): JsonResponse
    {
        $this->authorize('view', $producto);

        return ApiResponse::success(new ProductoResource($producto->load(['categoria', 'marca', 'unidadMedida'])));
    }

    public function update(UpdateProductoRequest $request, Producto $producto): JsonResponse
    {
        $this->authorize('update', $producto);

        $datos = $request->validated();
        $datos['empresa_id'] = $producto->empresa_id;

        // RC1 Fase 1 (docs/03_FUNCTIONAL_SPEC/Brands.md, UnitsOfMeasure.md):
        // `marca_nuevo`/`unidad_medida_nuevo` (quick-create) se resuelven a
        // un id real antes de guardar — $producto->update() por sí solo no
        // puede crear filas de catálogo.
        if (array_key_exists('marca_nuevo', $datos) || array_key_exists('marca_id', $datos)) {
            $datos['marca_id'] = $this->productos->resolverMarcaId($datos);
        }
        if (array_key_exists('unidad_medida_nuevo', $datos) || array_key_exists('unidad_medida_id', $datos)) {
            $datos['unidad_medida_id'] = $this->productos->resolverUnidadMedidaId($datos);
        }

        $producto->update($datos);

        return ApiResponse::success(
            new ProductoResource($producto->load(['categoria', 'marca', 'unidadMedida'])),
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
    public function registrarIngreso(StoreIngresoRequest $request, Producto $producto): JsonResponse
    {
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
        [$proveedorId, $proveedorNombre] = $this->resolverProveedor($request, $datos, $producto);

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
        );

        $this->auditoria->registrarAccionManual(
            empresaId: $producto->empresa_id,
            usuarioId: $request->user()->id,
            modulo: 'movimientos',
            accion: 'movimientos.registrar_ingreso_manual',
            auditableType: \App\Models\Movimiento::class,
            auditableId: $movimiento->id,
            valoresNuevos: $movimiento->only(['producto_id', 'tipo', 'cantidad', 'stock_nuevo', 'proveedor', 'lote']),
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return ApiResponse::success(
            new ProductoResource($producto->fresh()->load(['categoria', 'marca', 'unidadMedida'])),
            'Ingreso registrado correctamente',
            201
        );
    }

    /**
     * @param array<string, mixed> $datos
     * @return array{0: ?int, 1: ?string} [proveedor_id, nombre denormalizado]
     */
    private function resolverProveedor(Request $request, array $datos, Producto $producto): array
    {
        if (! empty($datos['proveedor_nuevo'])) {
            $proveedor = Proveedor::create(['nombre' => $datos['proveedor_nuevo']]);

            $this->auditoria->registrarAccionManual(
                empresaId: $proveedor->empresa_id,
                usuarioId: $request->user()->id,
                modulo: 'proveedores',
                accion: 'proveedores.crear_rapido',
                auditableType: Proveedor::class,
                auditableId: $proveedor->id,
                valoresNuevos: ['nombre' => $proveedor->nombre, 'origen' => 'registrar_ingreso'],
                ip: $request->ip(),
                userAgent: $request->userAgent(),
            );

            return [$proveedor->id, $proveedor->nombre];
        }

        if (! empty($datos['proveedor_id'])) {
            $proveedor = Proveedor::findOrFail($datos['proveedor_id']);

            return [$proveedor->id, $proveedor->nombre];
        }

        // FEATURE-005: sin selección explícita, cae al proveedor principal
        // asociado (si existe) en vez de dejar el movimiento sin proveedor.
        $principal = $producto->proveedorPrincipal();

        if ($principal !== null) {
            return [$principal->proveedor_id, $principal->proveedor?->nombre];
        }

        return [null, null];
    }

    /**
     * GLOBAL RULE: "Physical DELETE is NEVER allowed from the UI." Único
     * mecanismo de "eliminar" un producto — deshabilita, nunca borra la
     * fila. Preserva movimientos, asociaciones con proveedores y
     * auditoría (mismo patrón que ProveedorController::disable()).
     * Corrección de auditoría funcional, docs/06_TESTS/DemoDataAudit.md.
     */
    public function disable(Request $request, Producto $producto): JsonResponse
    {
        $this->authorize('delete', $producto);

        $producto->update(['estado' => 'inactivo']);

        $this->auditoria->registrarAccionManual(
            empresaId: $producto->empresa_id,
            usuarioId: $request->user()->id,
            modulo: 'productos',
            accion: 'productos.deshabilitar',
            auditableType: Producto::class,
            auditableId: $producto->id,
            valoresNuevos: ['estado' => 'inactivo'],
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return ApiResponse::success(
            new ProductoResource($producto->fresh()->load(['categoria', 'marca', 'unidadMedida'])),
            'Producto deshabilitado correctamente'
        );
    }

    public function enable(Request $request, Producto $producto): JsonResponse
    {
        $this->authorize('update', $producto);

        $producto->update(['estado' => 'activo']);

        $this->auditoria->registrarAccionManual(
            empresaId: $producto->empresa_id,
            usuarioId: $request->user()->id,
            modulo: 'productos',
            accion: 'productos.habilitar',
            auditableType: Producto::class,
            auditableId: $producto->id,
            valoresNuevos: ['estado' => 'activo'],
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return ApiResponse::success(
            new ProductoResource($producto->fresh()->load(['categoria', 'marca', 'unidadMedida'])),
            'Producto habilitado correctamente'
        );
    }

    public function movimientos(Producto $producto): JsonResponse
    {
        $this->authorize('view', $producto);

        $movimientos = $producto->movimientos()->latest()->paginate(20);

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
}
