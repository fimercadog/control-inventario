<?php

namespace App\Policies;

use App\Models\Movimiento;
use App\Models\User;

/**
 * Solo verifica pertenencia a la empresa (docs/04_ARCHITECTURE.md, Módulo 2
 * — Company Isolation). RC1 Fase 3 (docs/03_FUNCTIONAL_SPEC/Movements.md):
 * `create()`/`update()` habilitados ahora que existe `MovimientoController`.
 * `delete()` se deja tal cual (no invocado por ningún controller — un
 * movimiento nunca se elimina ni se anula, decisión confirmada
 * explícitamente por el propietario del proyecto al iniciar esta unidad
 * de trabajo, que reemplaza el diseño especulativo de "anular" descrito
 * en la migración `add_estado_to_movimientos_table` de una sesión
 * anterior — esa columna `estado` queda inerte a propósito).
 */
class MovimientoPolicy
{
    public function view(User $user, Movimiento $movimiento): bool
    {
        return $this->ownedBy($user, $movimiento);
    }

    public function create(User $user): bool
    {
        return $user->is_platform_admin || $user->empresa_id !== null;
    }

    public function update(User $user, Movimiento $movimiento): bool
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
