<?php

namespace App\Policies;

use App\Models\Proveedor;
use App\Models\User;

/**
 * FEATURE-003 (docs/03_FUNCTIONAL_SPEC/Suppliers.md). Mismo patrón que
 * ProductoPolicy — solo verifica pertenencia a la empresa.
 *
 * Fase 4.5 (Authorization Alignment, docs/security/ROLES_MATRIX.md):
 * autorización = pertenencia de empresa Y permiso. `update()` gatea tanto
 * la edición real de campos como `enable()` (que reutiliza esta misma
 * ability, sin cambios de controller), por eso usa `proveedores.editar`.
 * `delete()` gatea únicamente `disable()`, con `proveedores.gestionar`.
 */
class ProveedorPolicy
{
    public function viewAny(User $user): bool
    {
        return ($user->is_platform_admin || $user->empresa_id !== null) && $user->can('proveedores.ver');
    }

    public function create(User $user): bool
    {
        return ($user->is_platform_admin || $user->empresa_id !== null) && $user->can('proveedores.crear');
    }

    public function view(User $user, Proveedor $proveedor): bool
    {
        return $this->ownedBy($user, $proveedor) && $user->can('proveedores.ver');
    }

    public function update(User $user, Proveedor $proveedor): bool
    {
        return $this->ownedBy($user, $proveedor) && $user->can('proveedores.editar');
    }

    public function delete(User $user, Proveedor $proveedor): bool
    {
        return $this->ownedBy($user, $proveedor) && $user->can('proveedores.gestionar');
    }

    private function ownedBy(User $user, Proveedor $proveedor): bool
    {
        return $user->is_platform_admin || $user->empresa_id === $proveedor->empresa_id;
    }
}
