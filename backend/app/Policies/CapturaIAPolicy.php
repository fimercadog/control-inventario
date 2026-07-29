<?php

namespace App\Policies;

use App\Models\CapturaIA;
use App\Models\User;

/**
 * Solo verifica pertenencia a la empresa (docs/04_ARCHITECTURE.md, Módulo 2
 * — Company Isolation): defensa en profundidad por si `TenantScope` alguna
 * vez se bypasea (`withoutGlobalScope`) o el registro llegó por otra vía
 * (ej. una relación cargada desde otro modelo). Los permisos finos
 * (`captura-ia.revisar`, etc.) se agregan en el Módulo 3 sin tocar esto.
 */
class CapturaIAPolicy
{
    public function view(User $user, CapturaIA $captura): bool
    {
        return $this->ownedBy($user, $captura);
    }

    public function update(User $user, CapturaIA $captura): bool
    {
        return $this->ownedBy($user, $captura);
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
