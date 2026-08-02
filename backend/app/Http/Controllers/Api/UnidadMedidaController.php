<?php

namespace App\Http\Controllers\Api;

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
 * CategoriaController/MarcaController: route-model-binding + TenantScope
 * automático + Policy como segunda capa de defensa. Borrado siempre lógico
 * (`estado = inactivo`) — no existe ni existirá un DELETE físico expuesto
 * por este controller. Deshabilitar una unidad de medida con productos
 * asociados es seguro: `productos.unidad_medida_id` es nullable con
 * `nullOnDelete()`, la relación nunca se rompe.
 */
class UnidadMedidaController extends Controller
{
    public function __construct(
        private readonly AuditLogger $auditoria,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', UnidadMedida::class);

        $query = UnidadMedida::query()->withCount('productos');

        if ($busqueda = $request->query('busqueda')) {
            $query->where(function ($q) use ($busqueda) {
                $q->where('nombre', 'like', "%{$busqueda}%")
                    ->orWhere('abreviatura', 'like', "%{$busqueda}%");
            });
        }

        // Por defecto solo activas — inactivas visibles únicamente vía
        // filtro explícito (GLOBAL UI STANDARD).
        if ($request->query('estado') !== 'todos') {
            $query->where('estado', $request->query('estado', 'activo'));
        }

        $unidades = $query->orderBy('nombre')->paginate(100);

        return ApiResponse::success([
            'items' => UnidadMedidaResource::collection($unidades)->resolve(),
            'meta' => [
                'current_page' => $unidades->currentPage(),
                'per_page' => $unidades->perPage(),
                'total' => $unidades->total(),
                'last_page' => $unidades->lastPage(),
            ],
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

    public function show(UnidadMedida $unidadMedida): JsonResponse
    {
        $this->authorize('view', $unidadMedida);

        return ApiResponse::success(new UnidadMedidaResource($unidadMedida->loadCount('productos')));
    }

    public function update(UpdateUnidadMedidaRequest $request, UnidadMedida $unidadMedida): JsonResponse
    {
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
    public function disable(Request $request, UnidadMedida $unidadMedida): JsonResponse
    {
        $this->authorize('delete', $unidadMedida);

        $unidadMedida->update(['estado' => 'inactivo']);

        $this->registrarAuditoria($request, $unidadMedida, 'unidades-medida.deshabilitar', ['estado' => 'inactivo']);

        return ApiResponse::success(new UnidadMedidaResource($unidadMedida), 'Unidad de medida deshabilitada correctamente');
    }

    public function enable(Request $request, UnidadMedida $unidadMedida): JsonResponse
    {
        $this->authorize('update', $unidadMedida);

        $unidadMedida->update(['estado' => 'activo']);

        $this->registrarAuditoria($request, $unidadMedida, 'unidades-medida.habilitar', ['estado' => 'activo']);

        return ApiResponse::success(new UnidadMedidaResource($unidadMedida), 'Unidad de medida habilitada correctamente');
    }

    /** "Productos" tab de la Ficha de Unidad de Medida. */
    public function productos(UnidadMedida $unidadMedida): JsonResponse
    {
        $this->authorize('view', $unidadMedida);

        $productos = $unidadMedida->productos()
            ->with(['categoria', 'marca', 'unidadMedida'])
            ->orderBy('nombre')
            ->get();

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
