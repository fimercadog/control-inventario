<?php

namespace App\Policies;

use App\Models\Role;
use App\Models\User;

/**
 * Módulo 5 — Role Management (2026-08-02, docs/security/ROLES_MATRIX.md
 * secciones 2/6). A diferencia del resto de los módulos del ERP (que usan
 * 4 permisos `ver/crear/editar/gestionar`), Roles usa deliberadamente
 * solo 2 — decisión ya documentada y aprobada en ROLES_MATRIX.md antes de
 * escribir este código: `roles.ver` para lectura, `roles.gestionar` para
 * crear/editar/activar/desactivar, todo junto. No hay `roles.crear` ni
 * `roles.editar` en el catálogo — no se agregan aquí.
 */
class RolePolicy
{
    public function viewAny(User $user): bool
    {
        return ($user->is_platform_admin || $user->empresa_id !== null) && $user->can('roles.ver');
    }

    public function view(User $user, Role $role): bool
    {
        return $this->ownedBy($user, $role) && $user->can('roles.ver');
    }

    public function create(User $user): bool
    {
        return ($user->is_platform_admin || $user->empresa_id !== null) && $user->can('roles.gestionar');
    }

    public function update(User $user, Role $role): bool
    {
        return $this->ownedBy($user, $role) && $user->can('roles.gestionar');
    }

    public function delete(User $user, Role $role): bool
    {
        return $this->ownedBy($user, $role) && $user->can('roles.gestionar');
    }

    private function ownedBy(User $user, Role $role): bool
    {
        return $user->is_platform_admin || $user->empresa_id === $role->empresa_id;
    }
}
