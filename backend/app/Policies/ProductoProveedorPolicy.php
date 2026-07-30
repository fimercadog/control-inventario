<?php

namespace App\Policies;

use App\Models\ProductoProveedor;
use App\Models\User;

/**
 * FEATURE-005 (docs/03_FUNCTIONAL_SPEC/Suppliers.md). Mismo patrón que
 * ProductoPolicy/ProveedorPolicy.
 */
class ProductoProveedorPolicy
{
    public function create(User $user): bool
    {
        return $user->is_platform_admin || $user->empresa_id !== null;
    }

    public function view(User $user, ProductoProveedor $asociacion): bool
    {
        return $this->ownedBy($user, $asociacion);
    }

    public function update(User $user, ProductoProveedor $asociacion): bool
    {
        return $this->ownedBy($user, $asociacion);
    }

    public function delete(User $user, ProductoProveedor $asociacion): bool
    {
        return $this->ownedBy($user, $asociacion);
    }

    private function ownedBy(User $user, ProductoProveedor $asociacion): bool
    {
        return $user->is_platform_admin || $user->empresa_id === $asociacion->empresa_id;
    }
}
