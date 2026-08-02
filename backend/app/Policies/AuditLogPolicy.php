<?php

namespace App\Policies;

use App\Models\AuditLog;
use App\Models\User;

/**
 * Auditoría (2026-08-02). Solo lectura por diseño — no existe create/
 * update/delete: `AuditLog` es inmutable (lanza `LogicException` en
 * `update()`/`delete()`) y las escrituras las hacen los demás módulos vía
 * `Services\Audit\AuditLogger`, nunca una acción de usuario de este
 * módulo. Un único permiso, `auditoria.ver`, ya sembrado en el catálogo
 * desde antes de este módulo.
 */
class AuditLogPolicy
{
    public function viewAny(User $user): bool
    {
        return ($user->is_platform_admin || $user->empresa_id !== null) && $user->can('auditoria.ver');
    }

    public function view(User $user, AuditLog $auditLog): bool
    {
        return $this->ownedBy($user, $auditLog) && $user->can('auditoria.ver');
    }

    private function ownedBy(User $user, AuditLog $auditLog): bool
    {
        return $user->is_platform_admin || $user->empresa_id === $auditLog->empresa_id;
    }
}
