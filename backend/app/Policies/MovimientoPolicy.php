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
 *
 * Fase 4.6 (Authorization Completion, docs/security/ROLES_MATRIX.md):
 * decisión de negocio confirmada explícitamente — "Permissions only
 * control who can create or view movements." `viewAny()`/`view()` exigen
 * `movimientos.ver`, `create()` exige `movimientos.crear`. `update()`
 * (metadata descriptiva únicamente — nunca los campos contables, ver
 * `UpdateMovimientoRequest`) queda **sin cambios, deliberadamente**: no
 * existe `movimientos.editar` en el catálogo y no se agrega aquí — el
 * alcance de esta fase es explícito ("solo crear o ver"), no una edición
 * de metadata que ya estaba fuera de esa lista.
 */
class MovimientoPolicy
{
    public function viewAny(User $user): bool
    {
        return ($user->is_platform_admin || $user->empresa_id !== null) && $user->can('movimientos.ver');
    }

    public function view(User $user, Movimiento $movimiento): bool
    {
        return $this->ownedBy($user, $movimiento) && $user->can('movimientos.ver');
    }

    public function create(User $user): bool
    {
        return ($user->is_platform_admin || $user->empresa_id !== null) && $user->can('movimientos.crear');
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
