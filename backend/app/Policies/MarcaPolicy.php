<?php

namespace App\Policies;

use App\Models\Marca;
use App\Models\User;

/**
 * RC1 Fase 1 (docs/03_FUNCTIONAL_SPEC/Brands.md). Mismo patrón que
 * ProveedorPolicy.
 *
 * Fase 4.5 (Authorization Alignment, docs/security/ROLES_MATRIX.md):
 * autorización = pertenencia de empresa Y permiso. `update()` gatea tanto
 * la edición real de campos como `enable()` (que reutiliza esta misma
 * ability, sin cambios de controller), por eso usa `marcas.editar`.
 * `delete()` gatea únicamente `disable()`, con `marcas.gestionar`.
 */
class MarcaPolicy
{
    public function viewAny(User $user): bool
    {
        return ($user->is_platform_admin || $user->empresa_id !== null) && $user->can('marcas.ver');
    }

    public function create(User $user): bool
    {
        return ($user->is_platform_admin || $user->empresa_id !== null) && $user->can('marcas.crear');
    }

    public function view(User $user, Marca $marca): bool
    {
        return $this->ownedBy($user, $marca) && $user->can('marcas.ver');
    }

    public function update(User $user, Marca $marca): bool
    {
        return $this->ownedBy($user, $marca) && $user->can('marcas.editar');
    }

    public function delete(User $user, Marca $marca): bool
    {
        return $this->ownedBy($user, $marca) && $user->can('marcas.gestionar');
    }

    private function ownedBy(User $user, Marca $marca): bool
    {
        return $user->is_platform_admin || $user->empresa_id === $marca->empresa_id;
    }
}
