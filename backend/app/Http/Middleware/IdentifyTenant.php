<?php

namespace App\Http\Middleware;

use App\Services\Auth\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\Response;

/**
 * Corre justo después de que `auth:api` resuelve al usuario (docs/04_ARCHITECTURE.md,
 * Módulo 2 — Company Isolation). Es el ÚNICO lugar de la request que fija:
 *
 * 1. `TenantContext` — lo que lee `TenantScope` para filtrar cada query.
 * 2. El team id de Spatie (`setPermissionsTeamId`) — sin esto, los roles/
 *    permisos por empresa (Módulo 0) nunca quedaban realmente aislados en
 *    el ciclo de vida real de una request (solo en los tests que lo fijaban
 *    a mano).
 *
 * Se usa junto con `auth:api` en las rutas de negocio, nunca solo (ver
 * routes/api.php).
 */
class IdentifyTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        $context = app(TenantContext::class);
        $registrar = app(PermissionRegistrar::class);

        if ($user->is_platform_admin) {
            $context->bypass();
            $registrar->setPermissionsTeamId(null);
        } else {
            $context->setEmpresaId($user->empresa_id);
            $registrar->setPermissionsTeamId($user->empresa_id);
        }

        return $next($request);
    }
}
