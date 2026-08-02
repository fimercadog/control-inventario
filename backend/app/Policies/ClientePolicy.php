<?php

namespace App\Policies;

use App\Models\Cliente;
use App\Models\User;

/**
 * Módulo Clientes (2026-08-02) — mismo modelo de autorización que el
 * resto del ERP desde Fase 4.5/4.6 (docs/security/ROLES_MATRIX.md):
 * pertenencia de empresa Y permiso, nunca uno solo. `update()` gatea
 * también `habilitar()` (misma ability, sin cambios de controller);
 * `delete()` gatea únicamente `deshabilitar()`.
 */
class ClientePolicy
{
    public function viewAny(User $user): bool
    {
        return ($user->is_platform_admin || $user->empresa_id !== null) && $user->can('clientes.ver');
    }

    public function create(User $user): bool
    {
        return ($user->is_platform_admin || $user->empresa_id !== null) && $user->can('clientes.crear');
    }

    public function view(User $user, Cliente $cliente): bool
    {
        return $this->ownedBy($user, $cliente) && $user->can('clientes.ver');
    }

    public function update(User $user, Cliente $cliente): bool
    {
        return $this->ownedBy($user, $cliente) && $user->can('clientes.editar');
    }

    public function delete(User $user, Cliente $cliente): bool
    {
        return $this->ownedBy($user, $cliente) && $user->can('clientes.gestionar');
    }

    private function ownedBy(User $user, Cliente $cliente): bool
    {
        return $user->is_platform_admin || $user->empresa_id === $cliente->empresa_id;
    }
}
