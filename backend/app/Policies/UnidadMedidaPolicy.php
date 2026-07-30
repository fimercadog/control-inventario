<?php

namespace App\Policies;

use App\Models\UnidadMedida;
use App\Models\User;

/**
 * RC1 Fase 1 (docs/03_FUNCTIONAL_SPEC/UnitsOfMeasure.md). Mismo patrón que
 * ProveedorPolicy.
 */
class UnidadMedidaPolicy
{
    public function create(User $user): bool
    {
        return $user->is_platform_admin || $user->empresa_id !== null;
    }

    public function view(User $user, UnidadMedida $unidadMedida): bool
    {
        return $this->ownedBy($user, $unidadMedida);
    }

    public function update(User $user, UnidadMedida $unidadMedida): bool
    {
        return $this->ownedBy($user, $unidadMedida);
    }

    public function delete(User $user, UnidadMedida $unidadMedida): bool
    {
        return $this->ownedBy($user, $unidadMedida);
    }

    private function ownedBy(User $user, UnidadMedida $unidadMedida): bool
    {
        return $user->is_platform_admin || $user->empresa_id === $unidadMedida->empresa_id;
    }
}
