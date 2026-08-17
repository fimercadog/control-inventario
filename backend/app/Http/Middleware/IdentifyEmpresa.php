<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\Response;

/**
 * Corre justo después de que `auth:api` resuelve al usuario (docs/04_ARCHITECTURE.md,
 * Módulo 2 — Company Isolation). ADR-019: ya no fija ningún contexto de
 * empresa ambiental (`EmpresaContext`/`EmpresaScope`, eliminados) — cada
 * query o resolución de ruta filtra `empresa_id` explícitamente vía
 * `FiltersByEmpresa`. Lo único que este middleware sigue fijando es el
 * team id de Spatie (`setPermissionsTeamId`) — sin esto, los roles/
 * permisos por empresa (Módulo 0) nunca quedan realmente aislados en el
 * ciclo de vida real de una request (solo en los tests que lo fijan a mano).
 *
 * `forgetCachedPermissions()` sigue siendo obligatorio (Fase 4.6, hallazgo de
 * arquitectura): la caché interna de Spatie (`permission.cache`, TTL de
 * horas por config) guarda permisos CON sus roles ya resueltos
 * (`getPermissionsWithRoles()`) y no es team-aware — sin este forget, la
 * primera request que construye la caché la deja "congelada" con los
 * roles de LA EMPRESA QUE ESTABA ACTIVA en ese instante — cualquier otra
 * empresa que reutilice esa caché (mismo proceso en Octane, o mismo cache
 * store compartido en PHP-FPM clásico) heredaría permisos de una empresa
 * ajena hasta que la caché expire. Limpiarla en cada request antes de
 * cualquier check de permisos garantiza que siempre se reconstruya con el
 * team correcto de ESTA request. El rebuild se repite en cada cambio de
 * empresa activa, pero para el volumen de RC1 la correctitud del
 * aislamiento por empresa pesa más que el ahorro de una query.
 *
 * Se usa junto con `auth:api` en las rutas de negocio, nunca solo (ver
 * routes/api.php).
 */
class IdentifyEmpresa
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId($user->is_platform_admin ? null : $user->empresa_id);
        $registrar->forgetCachedPermissions();

        return $next($request);
    }
}
