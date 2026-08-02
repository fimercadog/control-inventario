<?php

namespace App\Policies;

use App\Models\UnidadMedida;
use App\Models\User;

/**
 * RC1 Fase 1 (docs/03_FUNCTIONAL_SPEC/UnitsOfMeasure.md). Mismo patrón que
 * ProveedorPolicy.
 *
 * Fase 4.5 (Authorization Alignment, docs/security/ROLES_MATRIX.md):
 * autorización = pertenencia de empresa Y permiso. `update()` gatea tanto
 * la edición real de campos como `enable()` (que reutiliza esta misma
 * ability, sin cambios de controller), por eso usa `unidades-medida.editar`.
 * `delete()` gatea únicamente `disable()`, con `unidades-medida.gestionar`.
 */
class UnidadMedidaPolicy
{
    public function viewAny(User $user): bool
    {
        return ($user->is_platform_admin || $user->empresa_id !== null) && $user->can('unidades-medida.ver');
    }

    public function create(User $user): bool
    {
        return ($user->is_platform_admin || $user->empresa_id !== null) && $user->can('unidades-medida.crear');
    }

    public function view(User $user, UnidadMedida $unidadMedida): bool
    {
        return $this->ownedBy($user, $unidadMedida) && $user->can('unidades-medida.ver');
    }

    public function update(User $user, UnidadMedida $unidadMedida): bool
    {
        return $this->ownedBy($user, $unidadMedida) && $user->can('unidades-medida.editar');
    }

    public function delete(User $user, UnidadMedida $unidadMedida): bool
    {
        return $this->ownedBy($user, $unidadMedida) && $user->can('unidades-medida.gestionar');
    }

    private function ownedBy(User $user, UnidadMedida $unidadMedida): bool
    {
        return $user->is_platform_admin || $user->empresa_id === $unidadMedida->empresa_id;
    }
}
