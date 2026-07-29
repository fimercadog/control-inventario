# Security — Technical Spec

> Fuente: master spec §60-61 (principios generales, evergreen) + implementación real verificada en `backend/app/Models/Scopes/TenantScope.php`, `Models/Concerns/BelongsToEmpresa.php`, `Http/Middleware/IdentifyTenant.php`, `Services/Auth/*`, `Policies/*`, `AGENTS.md`. Consistente con `Architecture.md` y `Database.md`.

## 1. Principios (master spec §60, evergreen)

Least Privilege, Defense in Depth, Zero Trust, Secure by Default, Fail Secure, Audit Everything. Estos principios no son aspiracionales solo en el papel — se materializan concretamente en el diseño de `TenantScope` (fail-closed, ver §3) y en la regla dura de permisos (§4).

## 2. Autenticación — JWT + refresh tokens (implementado, Módulo 1)

- Access token: JWT (`tymon/jwt-auth`, guard `api`), TTL corto (`JWT_TTL=15` minutos, `.env.example`), claim custom `empresa_id` (`User::getJWTCustomClaims()`).
- Refresh token: string opaco de 64 caracteres (`Str::random(64)`), **nunca JWT** — se guarda solo su hash SHA-256 en `auth_sessions.refresh_token_hash`, nunca el valor en claro. Viaja en una cookie `httpOnly`, `Secure`, `SameSite=Lax` — nunca accesible desde JavaScript, nunca en `localStorage` (`Architecture.md`, "Tokens en cookies httpOnly").
- TTL del refresh: 7 días normal, 30 días con "Remember Me" (`AUTH_REFRESH_TOKEN_TTL_DAYS`, `AUTH_REFRESH_TOKEN_REMEMBER_TTL_DAYS`).
- **Rotación**: cada `POST /auth/refresh` revoca el refresh token usado y emite uno nuevo (`RefreshTokenService::rotate()`) — el mismo valor nunca se reutiliza, lo que permite detectar reuso de un token robado (si un token ya revocado se presenta de nuevo, la request falla).
- **Revocación individual**: `auth_sessions` (una fila por sesión activa) es lo que hace posible cerrar una sesión específica sin invalidar las demás — un JWT puro no es revocable individualmente sin esta tabla.
- **Logout**: revoca la sesión actual + blacklist del JWT vigente (feature nativa de `tymon/jwt-auth`, `auth('api')->invalidate()`).
- **Reset de contraseña**: revoca **todas** las `auth_sessions` activas del usuario (`AuthenticationService::forcePasswordReset()` → `revokeAllForUser()`).
- Cada intento de login (éxito o fallo) se registra en `security_logs`, incluso para emails que no existen (`AuthenticationService::recordAttempt()`), sin enumeración de usuarios en la respuesta de `/auth/password/olvide` (siempre responde genérico).

Ver `docs/08_ADR/ADR-006-jwt-authentication.md` y `ADR-007-refresh-tokens.md`.

## 3. Aislamiento multi-tenant — dos capas de defensa (implementado, Módulo 2)

### Capa 1 — Global Scope automático, fail-closed

`App\Models\Scopes\TenantScope` se aplica a todo modelo que use el trait `App\Models\Concerns\BelongsToEmpresa` (`Producto`, `Categoria`, `Movimiento`, `CapturaIA`, `Role`). Lee el tenant actual de `App\Services\Auth\TenantContext` (singleton por request, registrado en `AppServiceProvider`).

**Diseño fail-closed verificado en código** (`TenantScope::apply()`):
```php
if ($context->isBypassed()) { return; }        // solo Platform Super Admin
$empresaId = $context->empresaId();
if ($empresaId === null) {
    $builder->whereRaw('1 = 0');               // CERO filas, nunca "todas las filas"
    return;
}
$builder->where($model->getTable().'.empresa_id', $empresaId);
```
Si el contexto de tenant todavía no se resolvió (código que consulta antes de que `IdentifyTenant` corra, o un test que olvidó fijarlo), la consulta devuelve cero filas — nunca el catálogo completo de todas las empresas. Esto cumple literalmente la regla de `AGENTS.md`: "No tenant context must return zero records."

`BelongsToEmpresa::bootBelongsToEmpresa()` además **fuerza** `empresa_id` en `creating()` al valor de `TenantContext`, ignorando cualquier valor que haya llegado por mass-assignment desde el request — cierra la vía de ataque de mandar un `empresa_id` distinto en el payload (`AGENTS.md`: "Never trust empresa_id coming from the request").

### Capa 2 — Verificación explícita en Policies

Cada Policy (`ProductoPolicy`, `MovimientoPolicy`, `CapturaIAPolicy`) verifica de nuevo `$model->empresa_id === $user->empresa_id` (u `$user->is_platform_admin`) — respaldo por si algún código bypassea `TenantScope` intencionalmente (`withoutGlobalScope`) en el futuro. Ejemplo real, `ProductoPolicy::ownedBy()`:
```php
return $user->is_platform_admin || $user->empresa_id === $producto->empresa_id;
```

### Middleware que activa todo — `IdentifyTenant`

Único punto de la request que fija `TenantContext::setEmpresaId()` y `PermissionRegistrar::setPermissionsTeamId()` (el team-id de Spatie). Corre siempre después de `auth:api` (ver `routes/api.php`: middleware `['auth:api', 'tenant']` juntos, nunca `auth:api` solo en una ruta de negocio). Para el Platform Super Admin (`is_platform_admin = true`), llama `TenantContext::bypass()` y fija el team-id de Spatie a `null` — nunca "una empresa más".

Ver `docs/08_ADR/ADR-008-multi-tenant-isolation.md` y `ADR-009-tenantscope.md`.

## 4. Autorización — permisos, nunca nombres de rol

Regla dura verificada en `AGENTS.md` y en el diseño de `Architecture.md`: toda Policy/Middleware/Controller debe verificar **permisos** (`$user->can('productos.editar')`), nunca `hasRole('Admin')`. Los roles son empaquetado administrativo de permisos para la UI de gestión de cada empresa; el motor de autorización real no debe conocer que existen roles.

**Estado real del código**: las tres Policies existentes (`ProductoPolicy`, `MovimientoPolicy`, `CapturaIAPolicy`) hoy solo verifican pertenencia a empresa (Capa 2 de tenant isolation, arriba), **no** verifican un permiso Spatie específico todavía — eso es el Módulo 3 (Authorization/RBAC), no implementado. `spatie/laravel-permission` con Teams (`team_foreign_key = empresa_id`) ya está instalado y `Role` ya está subclasificado con `BelongsToEmpresa` (`Models/Role.php`), pero el catálogo de permisos, el seeder, y el chequeo `$user->can(...)` en las Policies reales todavía no existen. Ver `docs/08_ADR/ADR-010-rbac-teams.md`.

## 5. Platform Super Admin

Usuario sin `empresa_id` (`null`) y `is_platform_admin = true`. `TenantScope` se desactiva completamente para él (`bypass()`), pero **sigue pasando por el mismo chequeo de permisos que cualquier otro usuario** cuando el Módulo 3 lo implemente — nunca un `Gate::before()` que apruebe todo, para no crear una puerta trasera sin auditoría (`Architecture.md`). Un usuario normal nunca puede tener `is_platform_admin = true` — se valida a nivel de aplicación (constraint lógica, no de base de datos).

## 6. Contraseñas

Hash con el driver de Laravel (`Hash::check()` en `AuthenticationService::login()`, cast `'password' => 'hashed'` en `User::casts()` — usa el algoritmo configurado en `config/hashing.php`, por defecto bcrypt en Laravel 12; el master spec §60 pide Argon2id explícitamente — **brecha real**: verificar/ajustar `config/hashing.php` antes de producción si Argon2id es un requisito duro). Nunca en texto plano, nunca por correo, nunca en logs (no hay ningún `Log::` que incluya `password` en el código auditado).

## 7. Rate limiting

**No verificado en código** — no se encontró configuración de throttle específica para `/auth/login` o `/auth/password/olvide` en `routes/api.php` más allá del throttle por defecto de Laravel (`api` middleware group). El master spec §60 pide 5 intentos para login y 3 para recuperación; esto es una brecha real a cerrar, no una decisión tomada. *(Inferido: sin evidencia de implementación — flag explícito.)*

## 8. Headers de seguridad, CSRF, validación de archivos

- **Headers de seguridad** (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS) — no se encontró middleware dedicado en el backend auditado. Brecha real, no implementada. *(Inferido: sin evidencia en código.)*
- **CSRF** — no aplica en el sentido clásico de formularios server-rendered (API stateless + JWT); la superficie relevante es CORS con `supports_credentials: true` y `allowed_origins` explícito (nunca `*`), que sí está implementado (`config/cors.php`).
- **Validación de archivos** (Captura IA) — `Requests/CapturaIA/StoreFotoRequest.php` y afines validan la entrada vía Laravel `FormRequest` (extensión/tamaño esperables de un upload de imagen/audio); `CapturaArchivoStorage` persiste el archivo original en el disco privado `local` antes de cualquier procesamiento. No se auditó en detalle la validación MIME/extensión exacta en este documento — ver el `FormRequest` correspondiente para el detalle vigente.

## 9. Auditoría (implementado, genérico)

`App\Models\AuditLog` — inmutable por diseño: `update()` y `delete()` sobreescritos para lanzar `LogicException` explícitamente (no solo "no hay endpoint", el propio modelo lo impide). Campos: `usuario_id`, `empresa_id`, `modulo`, `accion`, relación polimórfica `auditable_type`/`auditable_id`, `valores_anteriores`/`valores_nuevos` (JSON), `resultado`, `ip`, `user_agent`. Hoy solo `Services/Audit/AuditLogger::registrarCapturaIA()` escribe en esta tabla (un registro por captura de IA) — el master spec §61 pide cubrir Login/Logout/Crear/Editar/Eliminar/Importar/Exportar/Cambio de permisos/Cambio de contraseña de forma genérica; **eso todavía no está cableado para Auth** (login/logout se registran en `security_logs`, que es un modelo distinto con un propósito distinto — intentos de acceso, no acciones de negocio ya autenticadas). Ampliar `AuditLogger` a más módulos es trabajo de cada módulo nuevo, no una tarea aparte.

`App\Models\SecurityLog` — intentos de login (éxito y fallo), de solo-inserción (`UPDATED_AT = null`), incluye intentos de actores no autenticados (a diferencia de `AuditLog`).

## 10. Validación de entrada

Backend: `Illuminate\Foundation\Http\FormRequest` para toda entrada (`LoginRequest`, `ForgotPasswordRequest`, `ResetPasswordRequest`, `StoreFotoRequest`, etc.) — nunca se confía en datos crudos del `Request` dentro de un Controller. Frontend: Zod + React Hook Form están en las dependencias (`package.json`) pero no hay formularios complejos construidos aún que los ejerciten a fondo (no hay CRUD de Productos en el frontend todavía). Regla dura (master spec §60, `AGENTS.md`): la validación del frontend es solo UX — el backend revalida siempre, nunca confía en lo que envía el navegador.

## 11. Resumen de brechas reales (no inferencia — ausencia verificada en código)

| Control | Master Spec §60-61 | Estado real |
|---|---|---|
| Rate limiting específico login/recuperación | 5 / 3 intentos | No verificado — solo throttle por defecto de Laravel |
| Headers de seguridad (CSP, HSTS, etc.) | Requeridos | No implementados |
| Argon2id explícito | Requerido | Hash driver por defecto de Laravel (bcrypt salvo config explícita) — verificar `config/hashing.php` |
| RBAC con permisos reales en Policies | `$user->can()` en toda acción | Solo tenant-ownership implementado; permisos Spatie pendientes (Módulo 3) |
| Auditoría genérica multi-módulo | Todo evento importante | Solo Captura IA cableado hoy |
