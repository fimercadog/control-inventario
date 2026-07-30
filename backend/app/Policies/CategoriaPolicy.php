<?php

namespace App\Policies;

use App\Models\Categoria;
use App\Models\User;

/**
 * RC1 Fase 1 (docs/03_FUNCTIONAL_SPEC/Categories.md). Mismo patrón que
 * ProveedorPolicy.
 */
class CategoriaPolicy
{
    public function create(User $user): bool
    {
        return $user->is_platform_admin || $user->empresa_id !== null;
    }

    public function view(User $user, Categoria $categoria): bool
    {
        return $this->ownedBy($user, $categoria);
    }

    public function update(User $user, Categoria $categoria): bool
    {
        return $this->ownedBy($user, $categoria);
    }

    public function delete(User $user, Categoria $categoria): bool
    {
        return $this->ownedBy($user, $categoria);
    }

    private function ownedBy(User $user, Categoria $categoria): bool
    {
        return $user->is_platform_admin || $user->empresa_id === $categoria->empresa_id;
    }
}
