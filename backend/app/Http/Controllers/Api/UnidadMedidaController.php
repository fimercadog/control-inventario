<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\FiltersByEmpresa;
use App\Http\Controllers\Concerns\ResolvesPagination;
use App\Http\Controllers\Controller;
use App\Http\Requests\UnidadMedida\StoreUnidadMedidaRequest;
use App\Http\Requests\UnidadMedida\UpdateUnidadMedidaRequest;
use App\Http\Resources\Producto\ProductoResource;
use App\Http\Resources\UnidadMedida\UnidadMedidaResource;
use App\Http\Support\ApiResponse;
use App\Models\UnidadMedida;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * RC1 (docs/03_FUNCTIONAL_SPEC/UnitsOfMeasure.md). Mismo patrón exacto que
 * CategoriaController/MarcaController: resolución explícita por empresa
 * (ADR-019, `FiltersByEmpresa`) + Policy como segunda capa de defensa.
 * Borrado siempre lógico (`estado = inactivo`) — no existe ni existirá un
 * DELETE físico expuesto por este controller. Deshabilitar una unidad de
 * medida con productos asociados es seguro: `productos.unidad_medida_id`
 * es nullable con `nullOnDelete()`, la relación nunca se rompe.
 */
class UnidadMedidaController extends Controller
{
    use FiltersByEmpresa;
    use ResolvesPagination;

    public function __construct(
        private readonly AuditLogger $auditoria,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', UnidadMedida::class);

        $query = $this->paraEmpresaActual(UnidadMedida::query())->withCount('productos');

        if ($busqueda = $request->query('busqueda')) {
            $query->where(function ($q) use ($busqueda) {
                $q->where('nombre', 'like', "%{$busqueda}%")
                    ->orWhere('abreviatura', 'like', "%{$busqueda}%");
            });
        }

        // Por defecto solo activas — inactivas visibles únicamente vía
        // filtro explícito (GLOBAL UI STANDARD).
        $estado = $request->query('estado', 'activo');
        if ($estado !== 'todos') {
            $query->where('estado', $estado);
        }

        $unidades = $query->orderBy('nombre')->paginate($this->perPageDeRequest($request, 100));

        return ApiResponse::success([
            'items' => UnidadMedidaResource::collection($unidades)->resolve(),
            'meta' => $this->metaDePaginacion($unidades),
        ]);
    }

    public function store(StoreUnidadMedidaRequest $request): JsonResponse
    {
        $this->authorize('create', UnidadMedida::class);

        $unidad = UnidadMedida::create([
            ...$request->validated(),
            'estado' => $request->validated()['estado'] ?? 'activo',
        ]);

        $this->registrarAuditoria($request, $unidad, 'unidades-medida.crear', $unidad->only(['nombre', 'abreviatura']));

        return ApiResponse::success(new UnidadMedidaResource($unidad), 'Unidad de medida creada correctamente', 201);
    }

    public function show(int $unidadMedida): JsonResponse
    {
        $unidadMedida = $this->resolverParaEmpresaActual(UnidadMedida::class, $unidadMedida);
        $this->authorize('view', $unidadMedida);

        return ApiResponse::success(new UnidadMedidaResource($unidadMedida->loadCount('productos')));
    }

    public function update(UpdateUnidadMedidaRequest $request, int $unidadMedida): JsonResponse
    {
        $unidadMedida = $this->resolverParaEmpresaActual(UnidadMedida::class, $unidadMedida);
        $this->authorize('update', $unidadMedida);

        $unidadMedida->update($request->validated());

        $this->registrarAuditoria($request, $unidadMedida, 'unidades-medida.editar', $unidadMedida->only(['nombre', 'abreviatura', 'estado']));

        return ApiResponse::success(new UnidadMedidaResource($unidadMedida), 'Unidad de medida actualizada correctamente');
    }

    /**
     * GLOBAL RULE: "Physical DELETE is NEVER allowed from the UI." Único
     * mecanismo de "eliminar" una unidad de medida — deshabilita, nunca
     * borra la fila. Los productos que la referencian conservan su
     * `unidad_medida_id` intacto (la integridad referencial nunca se
     * rompe).
     */
    public function disable(Request $request, int $unidadMedida): JsonResponse
    {
        $unidadMedida = $this->resolverParaEmpresaActual(UnidadMedida::class, $unidadMedida);
        $this->authorize('delete', $unidadMedida);

        $unidadMedida->update(['estado' => 'inactivo']);

        $this->registrarAuditoria($request, $unidadMedida, 'unidades-medida.deshabilitar', ['estado' => 'inactivo']);

        return ApiResponse::success(new UnidadMedidaResource($unidadMedida), 'Unidad de medida deshabilitada correctamente');
    }

    public function enable(Request $request, int $unidadMedida): JsonResponse
    {
        $unidadMedida = $this->resolverParaEmpresaActual(UnidadMedida::class, $unidadMedida);
        $this->authorize('update', $unidadMedida);

        $unidadMedida->update(['estado' => 'activo']);

        $this->registrarAuditoria($request, $unidadMedida, 'unidades-medida.habilitar', ['estado' => 'activo']);

        return ApiResponse::success(new UnidadMedidaResource($unidadMedida), 'Unidad de medida habilitada correctamente');
    }

    /**
     * "Productos" tab de la Ficha de Unidad de Medida. Simplificación
     * 2026-08-09 (mismo hallazgo ya corregido en CategoriaController y
     * MarcaController): `$unidadMedida` ya está cargada en memoria
     * (route-model-binding) — pedirle a `with()` que la vuelva a traer
     * por cada producto era un SELECT evitable. `setRelation` la
     * reutiliza directamente.
     */
    public function productos(int $unidadMedida): JsonResponse
    {
        $unidadMedida = $this->resolverParaEmpresaActual(UnidadMedida::class, $unidadMedida);
        $this->authorize('view', $unidadMedida);

        $productos = $unidadMedida->productos()
            ->with(['categoria', 'marca'])
            ->orderBy('nombre')
            ->get()
            ->each->setRelation('unidadMedida', $unidadMedida);

        return ApiResponse::success(ProductoResource::collection($productos)->resolve());
    }

    /**
     * @param array<string, mixed> $valoresNuevos
     */
    private function registrarAuditoria(Request $request, UnidadMedida $unidadMedida, string $accion, array $valoresNuevos): void
    {
        $this->auditoria->registrarAccionManual(
            empresaId: $unidadMedida->empresa_id,
            usuarioId: $request->user()?->id,
            modulo: 'unidades-medida',
            accion: $accion,
            auditableType: UnidadMedida::class,
            auditableId: $unidadMedida->id,
            valoresNuevos: $valoresNuevos,
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );
    }
}
