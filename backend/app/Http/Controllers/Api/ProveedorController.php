<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Proveedor\StoreProveedorRequest;
use App\Http\Requests\Proveedor\UpdateProveedorRequest;
use App\Http\Resources\ProductoProveedor\ProductoProveedorResource;
use App\Http\Resources\Proveedor\ProveedorResource;
use App\Http\Support\ApiResponse;
use App\Models\Proveedor;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * FEATURE-003 (docs/03_FUNCTIONAL_SPEC/Suppliers.md). Mismo patrón que
 * ProductoController: route-model-binding + TenantScope automático +
 * Policy como segunda capa de defensa. Borrado siempre lógico
 * (`estado = inactivo`) — no existe ni existirá un DELETE físico
 * expuesto por este controller.
 */
class ProveedorController extends Controller
{
    public function __construct(
        private readonly AuditLogger $auditoria,
    ) {
    }

    /**
     * Búsqueda simple por nombre/NIT/contacto — volumen esperado es bajo
     * (catálogo de proveedores por empresa), consistente con el mismo
     * criterio ya usado en ProductoController::index().
     */
    public function index(Request $request): JsonResponse
    {
        $query = Proveedor::query()->withCount('movimientos');

        if ($busqueda = $request->query('busqueda')) {
            $query->where(function ($q) use ($busqueda) {
                $q->where('nombre', 'like', "%{$busqueda}%")
                    ->orWhere('nit', 'like', "%{$busqueda}%")
                    ->orWhere('contacto', 'like', "%{$busqueda}%");
            });
        }

        // Por defecto solo activos — inactivos visibles únicamente vía
        // filtro explícito (GLOBAL UI STANDARD: "Hidden from normal
        // listings. Visible only through administrator filters.").
        if ($request->query('estado') !== 'todos') {
            $query->where('estado', $request->query('estado', 'activo'));
        }

        $proveedores = $query->orderBy('nombre')->paginate(50);

        return ApiResponse::success([
            'items' => ProveedorResource::collection($proveedores)->resolve(),
            'meta' => [
                'current_page' => $proveedores->currentPage(),
                'per_page' => $proveedores->perPage(),
                'total' => $proveedores->total(),
                'last_page' => $proveedores->lastPage(),
            ],
        ]);
    }

    public function store(StoreProveedorRequest $request): JsonResponse
    {
        $this->authorize('create', Proveedor::class);

        $proveedor = Proveedor::create([
            ...$request->validated(),
            'estado' => $request->validated()['estado'] ?? 'activo',
        ]);

        $this->registrarAuditoria($request, $proveedor, 'proveedores.crear', $proveedor->only(['nombre', 'nit']));

        return ApiResponse::success(new ProveedorResource($proveedor), 'Proveedor creado correctamente', 201);
    }

    public function show(Proveedor $proveedor): JsonResponse
    {
        $this->authorize('view', $proveedor);

        return ApiResponse::success(new ProveedorResource($proveedor->loadCount('movimientos')));
    }

    public function update(UpdateProveedorRequest $request, Proveedor $proveedor): JsonResponse
    {
        $this->authorize('update', $proveedor);

        $proveedor->update($request->validated());

        $this->registrarAuditoria($request, $proveedor, 'proveedores.editar', $proveedor->only(['nombre', 'nit', 'estado']));

        return ApiResponse::success(new ProveedorResource($proveedor), 'Proveedor actualizado correctamente');
    }

    /**
     * GLOBAL RULE: "Physical DELETE is NEVER allowed from the UI." Este
     * es el único mecanismo de "eliminar" un proveedor — deshabilita,
     * nunca borra la fila. Preserva relaciones, historial y auditoría
     * (movimientos.proveedor_id sigue apuntando aquí sin problema).
     */
    public function disable(Request $request, Proveedor $proveedor): JsonResponse
    {
        $this->authorize('delete', $proveedor);

        $proveedor->update(['estado' => 'inactivo']);

        $this->registrarAuditoria($request, $proveedor, 'proveedores.deshabilitar', ['estado' => 'inactivo']);

        return ApiResponse::success(new ProveedorResource($proveedor), 'Proveedor deshabilitado correctamente');
    }

    /** "Products" tab en la Ficha de Proveedor (FEATURE-005). */
    public function productos(Proveedor $proveedor): JsonResponse
    {
        $this->authorize('view', $proveedor);

        $asociaciones = $proveedor->productosAsociados()
            ->where('estado', 'activo')
            ->with('producto')
            ->orderByDesc('es_principal')
            ->get();

        return ApiResponse::success(ProductoProveedorResource::collection($asociaciones)->resolve());
    }

    public function enable(Request $request, Proveedor $proveedor): JsonResponse
    {
        $this->authorize('update', $proveedor);

        $proveedor->update(['estado' => 'activo']);

        $this->registrarAuditoria($request, $proveedor, 'proveedores.habilitar', ['estado' => 'activo']);

        return ApiResponse::success(new ProveedorResource($proveedor), 'Proveedor habilitado correctamente');
    }

    /**
     * @param array<string, mixed> $valoresNuevos
     */
    private function registrarAuditoria(Request $request, Proveedor $proveedor, string $accion, array $valoresNuevos): void
    {
        $this->auditoria->registrarAccionManual(
            empresaId: $proveedor->empresa_id,
            usuarioId: $request->user()?->id,
            modulo: 'proveedores',
            accion: $accion,
            auditableType: Proveedor::class,
            auditableId: $proveedor->id,
            valoresNuevos: $valoresNuevos,
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );
    }
}
