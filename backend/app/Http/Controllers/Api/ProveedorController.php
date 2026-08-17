<?php

namespace App\Http\Controllers\Api;

use App\DTO\Report\ReporteResultadoDTO;
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
use App\Services\Reports\ReporteExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

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
        private readonly ReporteExportService $exportador,
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
     * Exportación (WO "Módulo Proveedores"). Gateada por `proveedores.ver`
     * (viewAny) — mismo criterio ya aplicado en Usuarios/Roles/Categorías:
     * reutiliza `ReporteExportService` directamente, sin pasar por
     * `ReporteController`/`ReporteService::CATALOGO` (ese catálogo gatea
     * todo con `reportes.ver`, un permiso distinto).
     */
    public function exportarCsv(Request $request): StreamedResponse
    {
        $this->authorize('viewAny', Proveedor::class);

        return $this->exportador->csv($this->construirResultadoExport($request));
    }

    public function exportarPdf(Request $request): Response
    {
        $this->authorize('viewAny', Proveedor::class);

        return $this->exportador->pdf($this->construirResultadoExport($request));
    }

    /**
     * Mismo filtrado exacto que index() (busqueda sobre nombre/nit/contacto,
     * estado, empresa), sin paginar. Proveedores no tiene capa Repository/
     * Service propia — la lógica ya vive inline en este controller (WO
     * sección 28: no crear esa capa solo por consistencia), así que la
     * extensión correcta es un método privado aquí.
     */
    private function construirResultadoExport(Request $request): ReporteResultadoDTO
    {
        $query = $this->paraEmpresaActual(Proveedor::query());

        if ($busqueda = $request->query('busqueda')) {
            $query->where(function ($q) use ($busqueda) {
                $q->where('nombre', 'like', "%{$busqueda}%")
                    ->orWhere('nit', 'like', "%{$busqueda}%")
                    ->orWhere('contacto', 'like', "%{$busqueda}%");
            });
        }

        $estado = $request->query('estado', 'activo');
        if ($estado !== 'todos') {
            $query->where('estado', $estado);
        }

        $proveedores = $query->orderBy('nombre')->get();

        $filas = $proveedores->values()->map(function (Proveedor $proveedor, int $indice) {
            return [
                'numero' => $indice + 1,
                'nombre' => $proveedor->nombre,
                'nit' => $proveedor->nit ?? '',
                'contacto' => $proveedor->contacto ?? '',
                'telefono' => $proveedor->telefono ?? '',
                'email' => $proveedor->email ?? '',
                'estado' => $proveedor->estado === 'activo' ? 'Activo' : 'Inactivo',
            ];
        })->all();

        return new ReporteResultadoDTO(
            clave: 'proveedores',
            titulo: 'Proveedores',
            columnas: [
                ['clave' => 'numero', 'etiqueta' => '#'],
                ['clave' => 'nombre', 'etiqueta' => 'Nombre'],
                ['clave' => 'nit', 'etiqueta' => 'NIT'],
                ['clave' => 'contacto', 'etiqueta' => 'Contacto'],
                ['clave' => 'telefono', 'etiqueta' => 'Teléfono'],
                ['clave' => 'email', 'etiqueta' => 'Email'],
                ['clave' => 'estado', 'etiqueta' => 'Estado'],
            ],
            filas: $filas,
            total: $proveedores->count(),
        );
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
