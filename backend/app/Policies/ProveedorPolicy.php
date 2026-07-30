<?php

namespace App\Policies;

use App\Models\Proveedor;
use App\Models\User;

/**
 * FEATURE-003 (docs/03_FUNCTIONAL_SPEC/Suppliers.md). Mismo patrón que
 * ProductoPolicy — solo verifica pertenencia a la empresa.
 */
class ProveedorPolicy
{
    public function create(User $user): bool
    {
        return $user->is_platform_admin || $user->empresa_id !== null;
    }

    public function view(User $user, Proveedor $proveedor): bool
    {
        return $this->ownedBy($user, $proveedor);
    }

    public function update(User $user, Proveedor $proveedor): bool
    {
        return $this->ownedBy($user, $proveedor);
    }

    public function delete(User $user, Proveedor $proveedor): bool
    {
        return $this->ownedBy($user, $proveedor);
    }

    private function ownedBy(User $user, Proveedor $proveedor): bool
    {
        return $user->is_platform_admin || $user->empresa_id === $proveedor->empresa_id;
    }
}
