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
 * `forgetCachedPermissions()` es obligatorio aquí (Fase 4.6, hallazgo de
 * arquitectura): la caché interna de Spatie (`permission.cache`, TTL de
 * horas por config) guarda permisos CON sus roles ya resueltos
 * (`getPermissionsWithRoles()`), y esa consulta pasa por `App\Models\Role`,
 * que tiene `TenantScope` como global scope (Módulo 2). Sin este forget,
 * la primera request que construye la caché la deja "congelada" con los
 * roles de LA EMPRESA QUE ESTABA ACTIVA en ese instante — cualquier otra
 * empresa que reutilice esa caché (mismo proceso en Octane, o mismo cache
 * store compartido en PHP-FPM clásico) heredaría permisos de una empresa
 * ajena hasta que la caché expire. Limpiarla en cada request antes de
 * cualquier check de permisos garantiza que siempre se reconstruya con el
 * team correcto de ESTA request. El rebuild se repite en cada cambio de
 * tenant, pero para el volumen de RC1 la correctitud multi-tenant pesa más
 * que el ahorro de una query.
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

        $registrar->forgetCachedPermissions();

        return $next($request);
    }
}
