<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\FiltersByEmpresa;
use App\Http\Controllers\Concerns\ResolvesPagination;
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
 * ProductoController: resolución explícita por empresa (ADR-019,
 * `FiltersByEmpresa`) + Policy como segunda capa de defensa. Borrado
 * siempre lógico (`estado = inactivo`) — no existe ni existirá un DELETE
 * físico expuesto por este controller.
 */
class ProveedorController extends Controller
{
    use FiltersByEmpresa;
    use ResolvesPagination;

    public function __construct(
        private readonly AuditLogger $auditoria,
    ) {}

    /**
     * Búsqueda simple por nombre/NIT/contacto — volumen esperado es bajo
     * (catálogo de proveedores por empresa), consistente con el mismo
     * criterio ya usado en ProductoController::index().
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Proveedor::class);

        $query = $this->paraEmpresaActual(Proveedor::query())->withCount('movimientos');

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
        $estado = $request->query('estado', 'activo');
        if ($estado !== 'todos') {
            $query->where('estado', $estado);
        }

        $proveedores = $query->orderBy('nombre')->paginate($this->perPageDeRequest($request, 50));

        return ApiResponse::success([
            'items' => ProveedorResource::collection($proveedores)->resolve(),
            'meta' => $this->metaDePaginacion($proveedores),
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

    public function show(int $proveedor): JsonResponse
    {
        $proveedor = $this->resolverParaEmpresaActual(Proveedor::class, $proveedor);
        $this->authorize('view', $proveedor);

        return ApiResponse::success(new ProveedorResource($proveedor->loadCount('movimientos')));
    }

    public function update(UpdateProveedorRequest $request, int $proveedor): JsonResponse
    {
        $proveedor = $this->resolverParaEmpresaActual(Proveedor::class, $proveedor);
        $this->authorize('update', $proveedor);

        $proveedor->update($request->validated());

        // getChanges(), no un ->only() fijo — mismo fix que ClienteService,
        // captura exactamente los campos que cambiaron (email/teléfono/
        // etc. incluidos). `updated_at` excluido: se toca en cada save.
        $cambios = collect($proveedor->getChanges())->except('updated_at')->all();

        if ($cambios !== []) {
            $this->registrarAuditoria($request, $proveedor, 'proveedores.editar', $cambios);
        }

        return ApiResponse::success(new ProveedorResource($proveedor), 'Proveedor actualizado correctamente');
    }

    /**
     * GLOBAL RULE: "Physical DELETE is NEVER allowed from the UI." Este
     * es el único mecanismo de "eliminar" un proveedor — deshabilita,
     * nunca borra la fila. Preserva relaciones, historial y auditoría
     * (movimientos.proveedor_id sigue apuntando aquí sin problema).
     */
    public function disable(Request $request, int $proveedor): JsonResponse
    {
        $proveedor = $this->resolverParaEmpresaActual(Proveedor::class, $proveedor);
        $this->authorize('delete', $proveedor);

        $proveedor->update(['estado' => 'inactivo']);

        $this->registrarAuditoria($request, $proveedor, 'proveedores.deshabilitar', ['estado' => 'inactivo']);

        return ApiResponse::success(new ProveedorResource($proveedor), 'Proveedor deshabilitado correctamente');
    }

    /** "Products" tab en la Ficha de Proveedor (FEATURE-005). */
    public function productos(int $proveedor): JsonResponse
    {
        $proveedor = $this->resolverParaEmpresaActual(Proveedor::class, $proveedor);
        $this->authorize('view', $proveedor);

        $asociaciones = $proveedor->productosAsociados()
            ->where('estado', 'activo')
            ->with('producto')
            ->orderByDesc('es_principal')
            ->get();

        return ApiResponse::success(ProductoProveedorResource::collection($asociaciones)->resolve());
    }

    public function enable(Request $request, int $proveedor): JsonResponse
    {
        $proveedor = $this->resolverParaEmpresaActual(Proveedor::class, $proveedor);
        $this->authorize('update', $proveedor);

        $proveedor->update(['estado' => 'activo']);

        $this->registrarAuditoria($request, $proveedor, 'proveedores.habilitar', ['estado' => 'activo']);

        return ApiResponse::success(new ProveedorResource($proveedor), 'Proveedor habilitado correctamente');
    }

    /**
     * @param  array<string, mixed>  $valoresNuevos
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
