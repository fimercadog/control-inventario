<?php

namespace App\Policies;

use App\Models\Movimiento;
use App\Models\User;

/**
 * Solo verifica pertenencia a la empresa (docs/04_ARCHITECTURE.md, Módulo 2
 * — Company Isolation). Aún no existe un endpoint REST de Movimientos
 * (fuera de alcance de este MVP); protege el modelo desde ya.
 */
class MovimientoPolicy
{
    public function view(User $user, Movimiento $movimiento): bool
    {
        return $this->ownedBy($user, $movimiento);
    }

    public function delete(User $user, Movimiento $movimiento): bool
    {
        return $this->ownedBy($user, $movimiento);
    }

    private function ownedBy(User $user, Movimiento $movimiento): bool
    {
        return $user->is_platform_admin || $user->empresa_id === $movimiento->empresa_id;
    }
}
