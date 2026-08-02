<?php

namespace App\Repositories;

use App\Models\Role;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Módulo 5 — Role Management (2026-08-02, docs/security/ROLES_MATRIX.md).
 * `TenantScope` (Módulo 2) ya filtra `Role::query()` por empresa
 * automáticamente — este Repository no repite ese filtro a mano.
 */
class RoleRepository
{
    /**
     * @param array{busqueda?: string, estado?: string} $filtros
     */
    public function paginar(array $filtros, int $porPagina = 20): LengthAwarePaginator
    {
        $query = Role::query()->withCount(['permissions', 'usuarios']);

        if (! empty($filtros['busqueda'])) {
            $query->where('name', 'like', '%'.$filtros['busqueda'].'%');
        }

        if (($filtros['estado'] ?? null) !== 'todos') {
            $query->where('estado', $filtros['estado'] ?? 'activo');
        }

        return $query->orderBy('name')->paginate($porPagina);
    }

    public function crear(string $name, string $estado = 'activo'): Role
    {
        return Role::create(['name' => $name, 'guard_name' => 'api', 'estado' => $estado]);
    }

    public function actualizar(Role $role, array $datos): Role
    {
        $role->update($datos);

        return $role;
    }

    public function cambiarEstado(Role $role, string $estado): Role
    {
        $role->update(['estado' => $estado]);

        return $role;
    }

    /**
     * @param array<int, string> $permisos nombres del catálogo global (guard 'api')
     */
    public function sincronizarPermisos(Role $role, array $permisos): Role
    {
        $role->syncPermissions($permisos);

        return $role;
    }

    public function contarUsuariosAsignados(Role $role): int
    {
        return $role->usuarios()->count();
    }

    /**
     * @return Collection<int, User>
     */
    public function usuariosAsignados(Role $role): Collection
    {
        return $role->usuarios()->orderBy('users.name')->get(['users.id', 'users.name', 'users.email', 'users.is_active']);
    }
}
