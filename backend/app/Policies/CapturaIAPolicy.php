<?php

namespace App\Policies;

use App\Models\CapturaIA;
use App\Models\User;

/**
 * Fase 4.6 (Authorization Completion, docs/security/ROLES_MATRIX.md):
 * autorización = pertenencia de empresa Y permiso, mismo estándar que el
 * resto del ERP. Permisos separados por responsabilidad, confirmado
 * explícitamente por el propietario del proyecto:
 * - `captura-ia.usar`: crear una captura (foto/voz/foto+voz) y verla.
 * - `captura-ia.revisar`: corregir un detalle de baja confianza antes de
 *   confirmar — ability propia `review()`, separada de `update()` (antes
 *   compartían la misma ability; `actualizarDetalle()` en el controller
 *   ahora llama `review`, no `update`).
 * - `captura-ia.confirmar`: confirmar o descartar una captura ya
 *   procesada — sigue siendo `update()`, ya existía antes de esta fase.
 * - `captura-ia.gestionar`: sembrado para configuración futura; ninguna
 *   acción real lo consume todavía (no existe pantalla de configuración
 *   de Captura IA), mismo patrón que `roles.gestionar`/`usuarios.invitar`.
 */
class CapturaIAPolicy
{
    public function viewAny(User $user): bool
    {
        return ($user->is_platform_admin || $user->empresa_id !== null) && $user->can('captura-ia.usar');
    }

    public function create(User $user): bool
    {
        return ($user->is_platform_admin || $user->empresa_id !== null) && $user->can('captura-ia.usar');
    }

    public function view(User $user, CapturaIA $captura): bool
    {
        return $this->ownedBy($user, $captura) && $user->can('captura-ia.usar');
    }

    /** Corregir un detalle de baja confianza antes de confirmar. */
    public function review(User $user, CapturaIA $captura): bool
    {
        return $this->ownedBy($user, $captura) && $user->can('captura-ia.revisar');
    }

    /** Confirmar o descartar una captura ya procesada. */
    public function update(User $user, CapturaIA $captura): bool
    {
        return $this->ownedBy($user, $captura) && $user->can('captura-ia.confirmar');
    }

    public function delete(User $user, CapturaIA $captura): bool
    {
        return $this->ownedBy($user, $captura);
    }

    private function ownedBy(User $user, CapturaIA $captura): bool
    {
        return $user->is_platform_admin || $user->empresa_id === $captura->empresa_id;
    }
}
