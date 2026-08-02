<?php

namespace App\Http\Controllers\Api;

use App\DTO\Role\RoleDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Role\StoreRoleRequest;
use App\Http\Requests\Role\UpdateRoleRequest;
use App\Http\Resources\Role\RoleResource;
use App\Http\Support\ApiResponse;
use App\Models\Role;
use App\Services\RoleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Módulo 5 — Role Management (2026-08-02, docs/security/ROLES_MATRIX.md).
 * Sin `destroy()` a propósito — un rol nunca se elimina físicamente, solo
 * se activa/desactiva (GLOBAL RULE, sesión 2026-07-29, confirmado también
 * específicamente para Roles: "Roles are never physically deleted, only
 * activated/deactivated").
 */
class RoleController extends Controller
{
    public function __construct(
        private readonly RoleService $roles,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Role::class);

        $roles = $this->roles->listar([
            'busqueda' => $request->query('busqueda'),
            'estado' => $request->query('estado'),
        ]);

        return ApiResponse::success([
            'items' => RoleResource::collection($roles)->resolve(),
            'meta' => [
                'current_page' => $roles->currentPage(),
                'per_page' => $roles->perPage(),
                'total' => $roles->total(),
                'last_page' => $roles->lastPage(),
            ],
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

    public function show(Role $role): JsonResponse
    {
        $this->authorize('view', $role);

        return ApiResponse::success(new RoleResource($role->load('permissions')->loadCount('usuarios')));
    }

    public function update(UpdateRoleRequest $request, Role $role): JsonResponse
    {
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
    public function desactivar(Request $request, Role $role): JsonResponse
    {
        $this->authorize('delete', $role);

        $role = $this->roles->deshabilitar($role, $request);

        return ApiResponse::success(new RoleResource($role->load('permissions')), 'Rol desactivado correctamente');
    }

    public function activar(Request $request, Role $role): JsonResponse
    {
        $this->authorize('update', $role);

        $role = $this->roles->habilitar($role, $request);

        return ApiResponse::success(new RoleResource($role->load('permissions')), 'Rol activado correctamente');
    }

    /** Pestaña "Usuarios" en la ficha del Rol. */
    public function usuarios(Role $role): JsonResponse
    {
        $this->authorize('view', $role);

        $usuarios = $this->roles->usuariosAsignados($role);

        return ApiResponse::success($usuarios->map(fn ($u) => [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'is_active' => (bool) $u->is_active,
        ])->values());
    }
}
