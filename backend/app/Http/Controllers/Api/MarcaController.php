<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\FiltersByEmpresa;
use App\Http\Controllers\Concerns\ResolvesPagination;
use App\Http\Controllers\Controller;
use App\Http\Requests\Marca\StoreMarcaRequest;
use App\Http\Requests\Marca\UpdateMarcaRequest;
use App\Http\Resources\Marca\MarcaResource;
use App\Http\Resources\Producto\ProductoResource;
use App\Http\Support\ApiResponse;
use App\Models\Marca;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * RC1 (docs/03_FUNCTIONAL_SPEC/Brands.md). Mismo patrón exacto que
 * CategoriaController: resolución explícita por empresa (ADR-019,
 * `FiltersByEmpresa`) + Policy como segunda capa de defensa. Borrado
 * siempre lógico (`estado = inactivo`) — no existe ni existirá un DELETE
 * físico expuesto por este controller. Deshabilitar una marca con
 * productos asociados es seguro: `productos.marca_id` es nullable con
 * `nullOnDelete()`, la relación nunca se rompe.
 */
class MarcaController extends Controller
{
    use FiltersByEmpresa;
    use ResolvesPagination;

    public function __construct(
        private readonly AuditLogger $auditoria,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Marca::class);

        $query = $this->paraEmpresaActual(Marca::query())->withCount('productos');

        if ($busqueda = $request->query('busqueda')) {
            $query->where('nombre', 'like', "%{$busqueda}%");
        }

        // Por defecto solo activas — inactivas visibles únicamente vía
        // filtro explícito (GLOBAL UI STANDARD).
        $estado = $request->query('estado', 'activo');
        if ($estado !== 'todos') {
            $query->where('estado', $estado);
        }

        $marcas = $query->orderBy('nombre')->paginate($this->perPageDeRequest($request, 100));

        return ApiResponse::success([
            'items' => MarcaResource::collection($marcas)->resolve(),
            'meta' => $this->metaDePaginacion($marcas),
        ]);
    }

    public function store(StoreMarcaRequest $request): JsonResponse
    {
        $this->authorize('create', Marca::class);

        $marca = Marca::create([
            ...$request->validated(),
            'estado' => $request->validated()['estado'] ?? 'activo',
        ]);

        $this->registrarAuditoria($request, $marca, 'marcas.crear', $marca->only(['nombre']));

        return ApiResponse::success(new MarcaResource($marca), 'Marca creada correctamente', 201);
    }

    public function show(int $marca): JsonResponse
    {
        $marca = $this->resolverParaEmpresaActual(Marca::class, $marca);
        $this->authorize('view', $marca);

        return ApiResponse::success(new MarcaResource($marca->loadCount('productos')));
    }

    public function update(UpdateMarcaRequest $request, int $marca): JsonResponse
    {
        $marca = $this->resolverParaEmpresaActual(Marca::class, $marca);
        $this->authorize('update', $marca);

        $marca->update($request->validated());

        $this->registrarAuditoria($request, $marca, 'marcas.editar', $marca->only(['nombre', 'estado']));

        return ApiResponse::success(new MarcaResource($marca), 'Marca actualizada correctamente');
    }

    /**
     * GLOBAL RULE: "Physical DELETE is NEVER allowed from the UI." Único
     * mecanismo de "eliminar" una marca — deshabilita, nunca borra la
     * fila. Los productos que la referencian conservan su `marca_id`
     * intacto (la integridad referencial nunca se rompe).
     */
    public function disable(Request $request, int $marca): JsonResponse
    {
        $marca = $this->resolverParaEmpresaActual(Marca::class, $marca);
        $this->authorize('delete', $marca);

        $marca->update(['estado' => 'inactivo']);

        $this->registrarAuditoria($request, $marca, 'marcas.deshabilitar', ['estado' => 'inactivo']);

        return ApiResponse::success(new MarcaResource($marca), 'Marca deshabilitada correctamente');
    }

    public function enable(Request $request, int $marca): JsonResponse
    {
        $marca = $this->resolverParaEmpresaActual(Marca::class, $marca);
        $this->authorize('update', $marca);

        $marca->update(['estado' => 'activo']);

        $this->registrarAuditoria($request, $marca, 'marcas.habilitar', ['estado' => 'activo']);

        return ApiResponse::success(new MarcaResource($marca), 'Marca habilitada correctamente');
    }

    /**
     * "Productos" tab de la Ficha de Marca. Simplificación 2026-08-09
     * (mismo hallazgo ya corregido en CategoriaController::productos()):
     * `$marca` ya está cargada en memoria (route-model-binding) — pedirle
     * a `with()` que la vuelva a traer por cada producto era un SELECT
     * evitable. `setRelation` la reutiliza directamente.
     */
    public function productos(int $marca): JsonResponse
    {
        $marca = $this->resolverParaEmpresaActual(Marca::class, $marca);
        $this->authorize('view', $marca);

        $productos = $marca->productos()
            ->with(['categoria', 'unidadMedida'])
            ->orderBy('nombre')
            ->get()
            ->each->setRelation('marca', $marca);

        return ApiResponse::success(ProductoResource::collection($productos)->resolve());
    }

    /**
     * @param array<string, mixed> $valoresNuevos
     */
    private function registrarAuditoria(Request $request, Marca $marca, string $accion, array $valoresNuevos): void
    {
        $this->auditoria->registrarAccionManual(
            empresaId: $marca->empresa_id,
            usuarioId: $request->user()?->id,
            modulo: 'marcas',
            accion: $accion,
            auditableType: Marca::class,
            auditableId: $marca->id,
            valoresNuevos: $valoresNuevos,
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );
    }
}
