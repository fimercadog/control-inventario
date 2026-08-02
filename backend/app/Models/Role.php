<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Spatie\Permission\Models\Role as SpatieRole;

/**
 * Subclase del Role de Spatie únicamente para aplicarle `TenantScope`
 * (docs/04_ARCHITECTURE.md, Módulo 2 — Company Isolation).
 *
 * El scoping por equipo de Spatie (`setPermissionsTeamId`) solo protege
 * su propia lógica interna de chequeo de permisos (`hasRole()`, `can()`),
 * NO consultas Eloquent directas como `Role::all()` o `Role::find($id)`
 * — sin esta clase, esas quedarían sin aislar por empresa. Configurado
 * como el modelo de rol real vía `config('permission.models.role')`.
 */
class Role extends SpatieRole
{
    use BelongsToEmpresa;
    use HasFactory;

    /**
     * Módulo 5 — Role Management (2026-08-02). Relación explícita sobre
     * `model_has_roles` (no la de `HasRoles::roles()` en `User`, que va
     * en la otra dirección) — permite `withCount('usuarios')` en el
     * listado sin N+1, y es la base de la guarda "no desactivar un rol
     * con usuarios asignados" (docs/security/ROLES_MATRIX.md, sección 6).
     */
    public function usuarios(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'model_has_roles', 'role_id', 'model_id')
            ->where('model_has_roles.model_type', User::class);
    }
}
