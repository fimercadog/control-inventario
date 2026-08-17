<?php

namespace App\Services;

use App\DTO\Role\RoleDTO;
use App\Exceptions\RoleHasAssignedUsersException;
use App\Models\Role;
use App\Repositories\RoleRepository;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Módulo 5 — Role Management (2026-08-02, docs/security/ROLES_MATRIX.md).
 */
class RoleService
{
    public function __construct(
        private readonly RoleRepository $roles,
        private readonly AuditLogger $auditoria,
    ) {
    }

    /**
     * @param array{busqueda?: string, estado?: string} $filtros
     */
    public function listar(array $filtros, int $porPagina = 20): LengthAwarePaginator
    {
        return $this->roles->paginar($filtros, $porPagina);
    }

    public function crear(RoleDTO $datos, Request $request): Role
    {
        $role = $this->roles->crear($datos->name, $datos->estado ?? 'activo');

        if ($datos->permisos !== null) {
            $this->roles->sincronizarPermisos($role, $datos->permisos);
        }

        $this->registrarAuditoria($request, $role, 'roles.crear', ['name' => $role->name]);

        return $role;
    }

    public function actualizar(Role $role, RoleDTO $datos, Request $request): Role
    {
        $cambios = array_filter([
            'name' => $datos->name,
            'estado' => $datos->estado,
        ], fn ($v) => $v !== null);

        if ($cambios !== []) {
            $role = $this->roles->actualizar($role, $cambios);
        }

        if ($datos->permisos !== null) {
            $role = $this->roles->sincronizarPermisos($role, $datos->permisos);
        }

        $this->registrarAuditoria($request, $role, 'roles.editar', ['name' => $role->name, 'estado' => $role->estado]);

        return $role;
    }

    /**
     * @throws RoleHasAssignedUsersException
     */
    public function deshabilitar(Role $role, Request $request): Role
    {
        if ($this->roles->contarUsuariosAsignados($role) > 0) {
            throw new RoleHasAssignedUsersException(
                'Este rol tiene usuarios asignados. Reasígnalos a otro rol antes de desactivarlo.'
            );
        }

        $role = $this->roles->cambiarEstado($role, 'inactivo');

        $this->registrarAuditoria($request, $role, 'roles.deshabilitar', ['estado' => 'inactivo']);

        return $role;
    }

    public function habilitar(Role $role, Request $request): Role
    {
        $role = $this->roles->cambiarEstado($role, 'activo');

        $this->registrarAuditoria($request, $role, 'roles.habilitar', ['estado' => 'activo']);

        return $role;
    }

    /**
     * @return \Illuminate\Support\Collection<int, \App\Models\User>
     */
    public function usuariosAsignados(Role $role): \Illuminate\Support\Collection
    {
        return $this->roles->usuariosAsignados($role);
    }

    /**
     * @param array<string, mixed> $valoresNuevos
     */
    private function registrarAuditoria(Request $request, Role $role, string $accion, array $valoresNuevos): void
    {
        $this->auditoria->registrarAccionManual(
            empresaId: $role->empresa_id,
            usuarioId: $request->user()?->id,
            modulo: 'roles',
            accion: $accion,
            auditableType: Role::class,
            auditableId: $role->id,
            valoresNuevos: $valoresNuevos,
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );
    }
}
