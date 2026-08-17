<?php

namespace App\Http\Controllers\Api;

use App\DTO\Report\ReporteResultadoDTO;
use App\Http\Controllers\Concerns\FiltersByEmpresa;
use App\Http\Controllers\Concerns\ResolvesPagination;
use App\Http\Controllers\Controller;
use App\Http\Requests\Categoria\StoreCategoriaRequest;
use App\Http\Requests\Categoria\UpdateCategoriaRequest;
use App\Http\Resources\Categoria\CategoriaResource;
use App\Http\Resources\Producto\ProductoResource;
use App\Http\Support\ApiResponse;
use App\Models\Categoria;
use App\Services\Audit\AuditLogger;
use App\Services\Reports\ReporteExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * RC1 (docs/03_FUNCTIONAL_SPEC/Categories.md). Mismo patrón exacto que
 * ProveedorController: resolución explícita por empresa (ADR-019,
 * `FiltersByEmpresa`) + Policy como segunda capa de defensa. Borrado
 * siempre lógico (`estado = inactivo`) — no existe ni existirá un DELETE
 * físico expuesto por este controller. Deshabilitar una categoría con
 * productos asociados es seguro: `productos.categoria_id` es nullable
 * con `nullOnDelete()`, la relación nunca se rompe (los productos
 * simplemente dejan de ver esa categoría en listados "activos", igual
 * que un Proveedor deshabilitado con movimientos ya registrados).
 */
class CategoriaController extends Controller
{
    use FiltersByEmpresa;
    use ResolvesPagination;

    public function __construct(
        private readonly AuditLogger $auditoria,
        private readonly ReporteExportService $exportador,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Categoria::class);

        $query = $this->paraEmpresaActual(Categoria::query())->withCount('productos');

        if ($busqueda = $request->query('busqueda')) {
            $query->where(function ($q) use ($busqueda) {
                $q->where('nombre', 'like', "%{$busqueda}%")
                    ->orWhere('descripcion', 'like', "%{$busqueda}%");
            });
        }

        // Por defecto solo activas — inactivas visibles únicamente vía
        // filtro explícito (GLOBAL UI STANDARD).
        $estado = $request->query('estado', 'activo');
        if ($estado !== 'todos') {
            $query->where('estado', $estado);
        }

        $categorias = $query->orderBy('nombre')->paginate($this->perPageDeRequest($request, 100));

        return ApiResponse::success([
            'items' => CategoriaResource::collection($categorias)->resolve(),
            'meta' => $this->metaDePaginacion($categorias),
        ]);
    }

    public function store(StoreCategoriaRequest $request): JsonResponse
    {
        $this->authorize('create', Categoria::class);

        // NO simplificar esto a `Categoria::create($request->validated())`:
        // se intentó en esta misma unidad de trabajo (revisión
        // "Simplification") y rompió `CategoriaControllerTest::a_user_can_create_a_category`
        // — aunque la columna tiene `->default('activo')` a nivel de BD,
        // Eloquent no relee ese default en la instancia en memoria tras
        // `create()`, así que `$categoria->estado` queda `null` hasta un
        // `fresh()`. Fijarlo explícitamente aquí no es redundante.
        $categoria = Categoria::create([
            ...$request->validated(),
            'estado' => $request->validated()['estado'] ?? 'activo',
        ]);

        $this->registrarAuditoria($request, $categoria, 'categorias.crear', $categoria->only(['nombre']));

        return ApiResponse::success(new CategoriaResource($categoria), 'Categoría creada correctamente', 201);
    }

    public function show(int $categoria): JsonResponse
    {
        $categoria = $this->resolverParaEmpresaActual(Categoria::class, $categoria);
        $this->authorize('view', $categoria);

        return ApiResponse::success(new CategoriaResource($categoria->loadCount('productos')));
    }

    public function update(UpdateCategoriaRequest $request, int $categoria): JsonResponse
    {
        $categoria = $this->resolverParaEmpresaActual(Categoria::class, $categoria);
        $this->authorize('update', $categoria);

        $categoria->update($request->validated());

        $this->registrarAuditoria($request, $categoria, 'categorias.editar', $categoria->only(['nombre', 'estado']));

        return ApiResponse::success(new CategoriaResource($categoria), 'Categoría actualizada correctamente');
    }

    /**
     * GLOBAL RULE: "Physical DELETE is NEVER allowed from the UI." Único
     * mecanismo de "eliminar" una categoría — deshabilita, nunca borra la
     * fila. Los productos que la referencian conservan su `categoria_id`
     * intacto (la integridad referencial nunca se rompe).
     */
    public function disable(Request $request, int $categoria): JsonResponse
    {
        $categoria = $this->resolverParaEmpresaActual(Categoria::class, $categoria);
        $this->authorize('delete', $categoria);

        $categoria->update(['estado' => 'inactivo']);

        $this->registrarAuditoria($request, $categoria, 'categorias.deshabilitar', ['estado' => 'inactivo']);

        return ApiResponse::success(new CategoriaResource($categoria), 'Categoría deshabilitada correctamente');
    }

    public function enable(Request $request, int $categoria): JsonResponse
    {
        $categoria = $this->resolverParaEmpresaActual(Categoria::class, $categoria);
        $this->authorize('update', $categoria);

        $categoria->update(['estado' => 'activo']);

        $this->registrarAuditoria($request, $categoria, 'categorias.habilitar', ['estado' => 'activo']);

        return ApiResponse::success(new CategoriaResource($categoria), 'Categoría habilitada correctamente');
    }

    /**
     * "Productos" tab de la Ficha de Categoría. Simplificación 2026-08-09
     * (revisión "Efficiency"): `$categoria` ya está cargada en memoria
     * (route-model-binding) — pedirle a `with()` que la vuelva a traer por
     * cada producto era un SELECT evitable. `setRelation` la reutiliza
     * directamente; `ProductoResource::categoria` solo necesita `nombre`,
     * que `$categoria` ya tiene.
     */
    public function productos(int $categoria): JsonResponse
    {
        $categoria = $this->resolverParaEmpresaActual(Categoria::class, $categoria);
        $this->authorize('view', $categoria);

        $productos = $categoria->productos()
            ->with(['marca', 'unidadMedida'])
            ->orderBy('nombre')
            ->get()
            ->each->setRelation('categoria', $categoria);

        return ApiResponse::success(ProductoResource::collection($productos)->resolve());
    }

    /**
     * Exportación (Work Order "Categorías: Exportación CSV y PDF"). Gateada
     * por `categorias.ver` (viewAny) — el permiso de lectura real de este
     * módulo, no `reportes.ver`. Mismo criterio ya aplicado en Usuarios y
     * Roles: reutiliza `ReporteExportService` (renderizadores genéricos
     * sobre `columnas`/`filas`, sin conocer Categorías ni ningún otro
     * reporte) directamente, sin pasar por
     * `ReporteController`/`ReporteService::CATALOGO`, que gatearía todo
     * uniformemente con un permiso distinto.
     */
    public function exportarCsv(Request $request): StreamedResponse
    {
        $this->authorize('viewAny', Categoria::class);

        return $this->exportador->csv($this->construirResultadoExport($request));
    }

    public function exportarPdf(Request $request): Response
    {
        $this->authorize('viewAny', Categoria::class);

        return $this->exportador->pdf($this->construirResultadoExport($request));
    }

    /**
     * Mismo filtrado exacto que `index()` (busqueda sobre nombre O
     * descripcion, estado, empresa, orden), sin paginar — el conjunto
     * completo de resultados filtrados, no solo la página visible.
     * Categorías no tiene capa Repository/Service propia (a diferencia de
     * Roles) — la lógica ya vive inline en este controller, así que la
     * extensión correcta es un método privado aquí, no una capa nueva.
     */
    private function construirResultadoExport(Request $request): ReporteResultadoDTO
    {
        $query = $this->paraEmpresaActual(Categoria::query())->withCount('productos');

        if ($busqueda = $request->query('busqueda')) {
            $query->where(function ($q) use ($busqueda) {
                $q->where('nombre', 'like', "%{$busqueda}%")
                    ->orWhere('descripcion', 'like', "%{$busqueda}%");
            });
        }

        $estado = $request->query('estado', 'activo');
        if ($estado !== 'todos') {
            $query->where('estado', $estado);
        }

        $categorias = $query->orderBy('nombre')->get();

        $filas = $categorias->values()->map(function (Categoria $categoria, int $indice) {
            return [
                'numero' => $indice + 1,
                'nombre' => $categoria->nombre,
                'descripcion' => $categoria->descripcion ?? '',
                'estado' => $categoria->estado === 'activo' ? 'Activo' : 'Inactivo',
                'productos' => $categoria->productos_count ?? 0,
            ];
        })->all();

        return new ReporteResultadoDTO(
            clave: 'categorias',
            titulo: 'Categorías',
            columnas: [
                ['clave' => 'numero', 'etiqueta' => '#'],
                ['clave' => 'nombre', 'etiqueta' => 'Nombre'],
                ['clave' => 'descripcion', 'etiqueta' => 'Descripción'],
                ['clave' => 'estado', 'etiqueta' => 'Estado'],
                ['clave' => 'productos', 'etiqueta' => 'Productos'],
            ],
            filas: $filas,
            total: $categorias->count(),
        );
    }

    /**
     * @param array<string, mixed> $valoresNuevos
     */
    private function registrarAuditoria(Request $request, Categoria $categoria, string $accion, array $valoresNuevos): void
    {
        $this->auditoria->registrarAccionManual(
            empresaId: $categoria->empresa_id,
            usuarioId: $request->user()?->id,
            modulo: 'categorias',
            accion: $accion,
            auditableType: Categoria::class,
            auditableId: $categoria->id,
            valoresNuevos: $valoresNuevos,
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );
    }
}
