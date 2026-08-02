<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Categoria\StoreCategoriaRequest;
use App\Http\Requests\Categoria\UpdateCategoriaRequest;
use App\Http\Resources\Categoria\CategoriaResource;
use App\Http\Resources\Producto\ProductoResource;
use App\Http\Support\ApiResponse;
use App\Models\Categoria;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * RC1 (docs/03_FUNCTIONAL_SPEC/Categories.md). Mismo patrón exacto que
 * ProveedorController: route-model-binding + TenantScope automático +
 * Policy como segunda capa de defensa. Borrado siempre lógico
 * (`estado = inactivo`) — no existe ni existirá un DELETE físico
 * expuesto por este controller. Deshabilitar una categoría con
 * productos asociados es seguro: `productos.categoria_id` es nullable
 * con `nullOnDelete()`, la relación nunca se rompe (los productos
 * simplemente dejan de ver esa categoría en listados "activos", igual
 * que un Proveedor deshabilitado con movimientos ya registrados).
 */
class CategoriaController extends Controller
{
    public function __construct(
        private readonly AuditLogger $auditoria,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Categoria::class);

        $query = Categoria::query()->withCount('productos');

        if ($busqueda = $request->query('busqueda')) {
            $query->where(function ($q) use ($busqueda) {
                $q->where('nombre', 'like', "%{$busqueda}%")
                    ->orWhere('descripcion', 'like', "%{$busqueda}%");
            });
        }

        // Por defecto solo activas — inactivas visibles únicamente vía
        // filtro explícito (GLOBAL UI STANDARD).
        if ($request->query('estado') !== 'todos') {
            $query->where('estado', $request->query('estado', 'activo'));
        }

        $categorias = $query->orderBy('nombre')->paginate(100);

        return ApiResponse::success([
            'items' => CategoriaResource::collection($categorias)->resolve(),
            'meta' => [
                'current_page' => $categorias->currentPage(),
                'per_page' => $categorias->perPage(),
                'total' => $categorias->total(),
                'last_page' => $categorias->lastPage(),
            ],
        ]);
    }

    public function store(StoreCategoriaRequest $request): JsonResponse
    {
        $this->authorize('create', Categoria::class);

        $categoria = Categoria::create([
            ...$request->validated(),
            'estado' => $request->validated()['estado'] ?? 'activo',
        ]);

        $this->registrarAuditoria($request, $categoria, 'categorias.crear', $categoria->only(['nombre']));

        return ApiResponse::success(new CategoriaResource($categoria), 'Categoría creada correctamente', 201);
    }

    public function show(Categoria $categoria): JsonResponse
    {
        $this->authorize('view', $categoria);

        return ApiResponse::success(new CategoriaResource($categoria->loadCount('productos')));
    }

    public function update(UpdateCategoriaRequest $request, Categoria $categoria): JsonResponse
    {
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
    public function disable(Request $request, Categoria $categoria): JsonResponse
    {
        $this->authorize('delete', $categoria);

        $categoria->update(['estado' => 'inactivo']);

        $this->registrarAuditoria($request, $categoria, 'categorias.deshabilitar', ['estado' => 'inactivo']);

        return ApiResponse::success(new CategoriaResource($categoria), 'Categoría deshabilitada correctamente');
    }

    public function enable(Request $request, Categoria $categoria): JsonResponse
    {
        $this->authorize('update', $categoria);

        $categoria->update(['estado' => 'activo']);

        $this->registrarAuditoria($request, $categoria, 'categorias.habilitar', ['estado' => 'activo']);

        return ApiResponse::success(new CategoriaResource($categoria), 'Categoría habilitada correctamente');
    }

    /** "Productos" tab de la Ficha de Categoría. */
    public function productos(Categoria $categoria): JsonResponse
    {
        $this->authorize('view', $categoria);

        $productos = $categoria->productos()
            ->with(['categoria', 'marca', 'unidadMedida'])
            ->orderBy('nombre')
            ->get();

        return ApiResponse::success(ProductoResource::collection($productos)->resolve());
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
