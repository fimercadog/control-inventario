<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
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
}
