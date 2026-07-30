<?php

namespace App\Policies;

use App\Models\Marca;
use App\Models\User;

/**
 * RC1 Fase 1 (docs/03_FUNCTIONAL_SPEC/Brands.md). Mismo patrón que
 * ProveedorPolicy.
 */
class MarcaPolicy
{
    public function create(User $user): bool
    {
        return $user->is_platform_admin || $user->empresa_id !== null;
    }

    public function view(User $user, Marca $marca): bool
    {
        return $this->ownedBy($user, $marca);
    }

    public function update(User $user, Marca $marca): bool
    {
        return $this->ownedBy($user, $marca);
    }

    public function delete(User $user, Marca $marca): bool
    {
        return $this->ownedBy($user, $marca);
    }

    private function ownedBy(User $user, Marca $marca): bool
    {
        return $user->is_platform_admin || $user->empresa_id === $marca->empresa_id;
    }
}
