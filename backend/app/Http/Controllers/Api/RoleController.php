<?php

namespace App\Http\Controllers\Api;

use App\DTO\Report\ReporteResultadoDTO;
use App\DTO\Role\RoleDTO;
use App\Http\Controllers\Concerns\FiltersByEmpresa;
use App\Http\Controllers\Concerns\ResolvesPagination;
use App\Http\Controllers\Controller;
use App\Http\Requests\Role\StoreRoleRequest;
use App\Http\Requests\Role\UpdateRoleRequest;
use App\Http\Resources\Role\RoleResource;
use App\Http\Support\ApiResponse;
use App\Models\Role;
use App\Services\Reports\ReporteExportService;
use App\Services\RoleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Módulo 5 — Role Management (2026-08-02, docs/security/ROLES_MATRIX.md).
 * Sin `destroy()` a propósito — un rol nunca se elimina físicamente, solo
 * se activa/desactiva (GLOBAL RULE, sesión 2026-07-29, confirmado también
 * específicamente para Roles: "Roles are never physically deleted, only
 * activated/deactivated").
 */
class RoleController extends Controller
{
    use FiltersByEmpresa;
    use ResolvesPagination;

    public function __construct(
        private readonly RoleService $roles,
        private readonly ReporteExportService $exportador,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Role::class);

        $roles = $this->roles->listar([
            'busqueda' => $request->query('busqueda'),
            'estado' => $request->query('estado'),
        ], $this->perPageDeRequest($request, 20));

        return ApiResponse::success([
            'items' => RoleResource::collection($roles)->resolve(),
            'meta' => $this->metaDePaginacion($roles),
        ]);
    }

    public function store(StoreRoleRequest $request): JsonResponse
    {
        $this->authorize('create', Role::class);

        $role = $this->roles->crear(RoleDTO::fromArray($request->validated()), $request);

        return ApiResponse::success(
            new RoleResource($role->load('permissions')),
            'Rol creado correctamente',
            201
        );
    }

    public function show(int $role): JsonResponse
    {
        $role = $this->resolverParaEmpresaActual(Role::class, $role);
        $this->authorize('view', $role);

        return ApiResponse::success(new RoleResource($role->load('permissions')->loadCount('usuarios')));
    }

    public function update(UpdateRoleRequest $request, int $role): JsonResponse
    {
        $role = $this->resolverParaEmpresaActual(Role::class, $role);
        $this->authorize('update', $role);

        $role = $this->roles->actualizar($role, RoleDTO::fromArray($request->validated()), $request);

        return ApiResponse::success(new RoleResource($role->load('permissions')), 'Rol actualizado correctamente');
    }

    /**
     * GLOBAL RULE: "Physical DELETE is NEVER allowed from the UI." Único
     * mecanismo de "eliminar" un rol — desactiva, nunca borra la fila.
     * Rechaza con 409 (`RoleHasAssignedUsersException`) si el rol todavía
     * tiene usuarios asignados. Verbo `desactivar`/`activar` (no
     * `deshabilitar`/`habilitar`) a propósito — mismo patrón que
     * `UserController`, el módulo más análogo a Roles (identidad/acceso,
     * no catálogo de inventario), ya documentado así en `API.md` antes de
     * escribir este código.
     */
    public function desactivar(Request $request, int $role): JsonResponse
    {
        $role = $this->resolverParaEmpresaActual(Role::class, $role);
        $this->authorize('delete', $role);

        $role = $this->roles->deshabilitar($role, $request);

        return ApiResponse::success(new RoleResource($role->load('permissions')), 'Rol desactivado correctamente');
    }

    public function activar(Request $request, int $role): JsonResponse
    {
        $role = $this->resolverParaEmpresaActual(Role::class, $role);
        $this->authorize('update', $role);

        $role = $this->roles->habilitar($role, $request);

        return ApiResponse::success(new RoleResource($role->load('permissions')), 'Rol activado correctamente');
    }

    /** Pestaña "Usuarios" en la ficha del Rol. */
    public function usuarios(int $role): JsonResponse
    {
        $role = $this->resolverParaEmpresaActual(Role::class, $role);
        $this->authorize('view', $role);

        $usuarios = $this->roles->usuariosAsignados($role);

        return ApiResponse::success($usuarios->map(fn ($u) => [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'is_active' => (bool) $u->is_active,
        ])->values());
    }

    /**
     * Exportación (Work Order "Roles: Exportación CSV y PDF"). Gateada por
     * `roles.ver` (viewAny) — el único permiso de lectura real de este
     * módulo, mismo criterio ya usado en Usuarios (ver el docblock de
     * `UserController::exportarCsv()`): reutiliza `ReporteExportService`
     * (renderizadores genéricos sobre `columnas`/`filas`, sin conocer Roles
     * ni ningún otro reporte) directamente, sin pasar por
     * `ReporteController`/`ReporteService::CATALOGO` — ese catálogo gatea
     * todo uniformemente con `reportes.ver`, un permiso distinto.
     */
    public function exportarCsv(Request $request): StreamedResponse
    {
        $this->authorize('viewAny', Role::class);

        return $this->exportador->csv($this->construirResultadoExport($request));
    }

    public function exportarPdf(Request $request): Response
    {
        $this->authorize('viewAny', Role::class);

        return $this->exportador->pdf($this->construirResultadoExport($request));
    }

    /**
     * Mismas columnas que la tabla de Roles realmente muestra (Nombre,
     * Estado, conteo de Permisos, conteo de Usuarios) — el listado nunca
     * trae los nombres de permisos de cada rol (`RoleRepository::paginar()`
     * solo hace `withCount`, no `with('permissions')`; los nombres reales
     * solo llegan en `show()`), así que exportar más que el conteo
     * implicaría una consulta N+1 por rol para mostrar información que ni
     * siquiera el listado que se está exportando muestra.
     */
    private function construirResultadoExport(Request $request): ReporteResultadoDTO
    {
        $roles = $this->roles->listarParaExportar([
            'busqueda' => $request->query('busqueda'),
            'estado' => $request->query('estado'),
        ]);

        $filas = $roles->values()->map(function (Role $role, int $indice) {
            return [
                'numero' => $indice + 1,
                'nombre' => $role->name,
                'estado' => $role->estado === 'activo' ? 'Activo' : 'Inactivo',
                'permisos' => $role->permissions_count ?? 0,
                'usuarios' => $role->usuarios_count ?? 0,
            ];
        })->all();

        return new ReporteResultadoDTO(
            clave: 'roles',
            titulo: 'Roles',
            columnas: [
                ['clave' => 'numero', 'etiqueta' => '#'],
                ['clave' => 'nombre', 'etiqueta' => 'Nombre'],
                ['clave' => 'estado', 'etiqueta' => 'Estado'],
                ['clave' => 'permisos', 'etiqueta' => 'Permisos'],
                ['clave' => 'usuarios', 'etiqueta' => 'Usuarios'],
            ],
            filas: $filas,
            total: $roles->count(),
        );
    }
}
