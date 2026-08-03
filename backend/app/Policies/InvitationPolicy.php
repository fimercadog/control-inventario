<?php

namespace App\Policies;

use App\Models\User;

/**
 * Módulo 6 — Invitaciones (2026-08-03). Solo `create()` — no existe
 * "ver"/"editar"/"eliminar" una invitación individual desde la UI todavía
 * (fuera de alcance de esta unidad de trabajo, ver `Users.md`). La
 * resolución por token (`show`/`aceptar`) es pública por diseño — la
 * posesión del token, no un permiso Spatie, es lo que autoriza esas dos
 * acciones, así que viven fuera de cualquier Policy.
 */
class InvitationPolicy
{
    public function create(User $actor): bool
    {
        return ($actor->is_platform_admin || $actor->empresa_id !== null) && $actor->can('usuarios.invitar');
    }
}
