# Implementación — Auth Módulo 1: Authentication

> Documento retroactivo, reconstruido de `docs/00_VISION/Roadmap.md`, `docs/04_TECHNICAL_SPEC/Architecture.md`/`API.md`, y verificado contra `backend/app/Http/Controllers/Api/Auth/AuthController.php`, `PasswordResetController.php`, `AuthenticationService.php`, `RefreshTokenService.php` y los tests reales.

## Estado

**Completo.** Verificado por navegador real (login/logout, cookie httpOnly invisible a JS, sesión sobrevive un reload duro vía refresh silencioso, "Remember Me" extiende `auth_sessions.expires_at` a 30 días).

## Goal

Dar acceso real (login/logout/refresh/recuperación de contraseña) al sistema, reemplazando la sesión local de demo descrita en `DEMO.md`, y cerrar todas las rutas de negocio (Captura IA) detrás de autenticación — cero endpoints públicos salvo los propios de conseguir una sesión.

## Scope

- `POST /api/v1/auth/login` — email + password, devuelve access token (JWT, en el body) + cookie httpOnly con el refresh token.
- `POST /api/v1/auth/logout` — revoca la sesión activa y pone el access token en blacklist.
- `POST /api/v1/auth/refresh` — rota el refresh token (uno de un solo uso; el anterior deja de servir) y emite un nuevo access token.
- `GET /api/v1/auth/me` — usuario autenticado + lista de permisos (vacía si no tiene roles asignados).
- `POST /api/v1/auth/password/olvide` — solicita restablecimiento; respuesta siempre genérica, exista o no el email (anti user-enumeration).
- `POST /api/v1/auth/password/restablecer` — restablece con token válido; revoca todas las sesiones activas del usuario al hacerlo.
- `security_logs`: cada intento de login (exitoso o no) queda registrado con email, ip, user agent, resultado y motivo.
- Redux auth-slice real en frontend + interceptor de Axios con refresh silencioso.
- Pantallas reales: `/login`, `/olvide-password`, `/restablecer-password`.
- Todas las rutas de Captura IA quedan detrás de `auth:api` (+ `tenant`, ver Módulo 2).

## Out of Scope

- Registro de usuario / invitación (Módulo 6).
- Gestión de roles/permisos finos por endpoint (Módulo 3).
- 2FA (columnas preparadas en Módulo 0, sin flujo funcional).
- Listado/revocación de sesiones activas desde UI (Módulo 7).

## Dependencies

- Auth Módulo 0 (paquetes JWT/Spatie, migraciones de `users`/`auth_sessions`/`security_logs`).
- `bootstrap/app.php` — manejo centralizado de excepciones y `redirectGuestsTo(fn () => null)` (ver Risks/bug real corregido).

## Database Changes

Ninguna migración nueva propia de este módulo — usa `auth_sessions` y `security_logs` ya creadas en el Módulo 0. Escribe en ambas en tiempo de ejecución (no en el esquema).

## API Changes

```
POST /api/v1/auth/login              (público)
POST /api/v1/auth/refresh            (público — la protección es la cookie httpOnly + rotación)
POST /api/v1/auth/password/olvide    (público)
POST /api/v1/auth/password/restablecer (público)
POST /api/v1/auth/logout             (auth:api + tenant)
GET  /api/v1/auth/me                 (auth:api + tenant)
```

Contrato de login (verificado en `AuthController::login()`): el **access token va en el body de la respuesta** (`data.access_token`, `token_type: Bearer`, `expires_in`), nunca en una cookie — se guarda en memoria del cliente, nunca en `localStorage`. El **refresh token va únicamente en una cookie httpOnly** (`secure`, `sameSite` configurables vía `config/auth_sessions.php`), invisible a JavaScript. `AuthController` es el único lugar del código que lee o escribe esa cookie.

`GET /me` requiere `tenant` además de `auth:api` porque su respuesta incluye `permissions`, que depende de que el team id de Spatie ya esté fijado por `IdentifyTenant`.

Errores del módulo: credenciales inválidas → 401 con el mismo mensaje genérico sin importar si falló el email o el password (`Correo o contraseña incorrectos.`); cuenta inactiva → 403 (`Esta cuenta está desactivada...`); email sin verificar → 403 (`Debes verificar tu correo...`); refresh sin cookie o con token ya rotado → 401 (`Tu sesión expiró...`); token de reseteo inválido/expirado → 422, mensaje genérico (`No pudimos restablecer tu contraseña...`).

## Frontend Changes

- Redux Toolkit auth-slice (estado de sesión, access token en memoria).
- Interceptor de Axios: ante un 401 por access token expirado, intenta `refresh` silenciosamente antes de reintentar la request original.
- Pantallas: `/login`, `/olvide-password`, `/restablecer-password` (reales, ya no la sesión local mock descrita en `DEMO.md` §3 — **nota**: `DEMO.md` sigue documentando la sesión local como estado del MVP; a la fecha de esta migración eso ya cambió con este módulo. Ver `docs/07_RELEASE/KnownIssues.md`).

## Security

- Access token nunca en `localStorage` — mitiga XSS robando el token de sesión de escritura.
- Refresh token en cookie httpOnly, `secure`, con `sameSite` configurado — invisible a JS, mitiga XSS y CSRF combinados.
- Refresh tokens son de un solo uso (rotación): reutilizar uno viejo tras refrescar falla con 401.
- Logout revoca la sesión (`auth_sessions.revoked_at`) y pone el access token en blacklist de JWT — un token robado antes del logout deja de servir inmediatamente.
- Restablecer contraseña revoca **todas** las sesiones activas del usuario (no solo la que originó el cambio).
- Mensajes de error deliberadamente genéricos en login (no revelan si el email existe) y en "olvidé mi contraseña" (misma respuesta exista o no el email) — anti user-enumeration.
- **Bug real encontrado y corregido**: sin header `Accept: application/json`, Laravel intentaba redirigir a `route('login')` (inexistente en esta API) y devolvía 500 en vez de 401. Corregido con `redirectGuestsTo(fn () => null)` en `bootstrap/app.php`.

## Permissions

Ninguno todavía — la autorización fina (Módulo 3) no depende de este módulo para autenticar, solo para saber quién es el usuario.

## Events

`App\Events\Auth\UserLoggedIn`, `UserLoggedOut`, `PasswordWasReset`.

## Tests

- `backend/tests/Feature/Auth/AuthenticationTest.php` — 11 tests: login válido (incluye verificación de `security_logs` y `auth_sessions`); password incorrecto sin revelar cuál campo falló; email inexistente con el mismo mensaje; cuenta inactiva rechazada; email sin verificar rechazado; refresh rota el token y el viejo deja de servir; refresh sin cookie falla limpio; logout revoca sesión y pone el access token en blacklist; `/me` devuelve usuario + permisos vacíos si no tiene roles; rutas de negocio rechazan anónimos; rutas de negocio aceptan autenticado.
- `backend/tests/Feature/Auth/PasswordResetTest.php` — 4 tests: respuesta genérica aun para email desconocido; se envía la notificación real cuando el email existe; reset válido cambia el password y revoca todas las sesiones; token inválido falla limpio con 422.

## Risks

- El interceptor de refresh silencioso en frontend puede generar una race condition si múltiples requests fallan por 401 simultáneamente (no verificado con test automatizado — parte del gap de tests de frontend).
- `DEMO.md` (raíz del repo) todavía describe el login como sesión local mock — desactualizado respecto a este módulo; cross-referenciado en `docs/07_RELEASE/KnownIssues.md`, pero `DEMO.md` en sí no se modifica (fuera del alcance de esta migración, según `docs/SDD_MIGRATION_PLAN.md` §1.8).

## Checklist

- [x] Backend: login/logout/refresh/me implementados.
- [x] Password reset (olvide/restablecer) implementado.
- [x] `security_logs` registrando cada intento.
- [x] Todas las rutas de negocio (Captura IA) detrás de `auth:api`.
- [x] Frontend: auth-slice, interceptor de refresh, pantallas reales.
- [x] Verificado por navegador real (cookie httpOnly, reload duro, Remember Me).
- [x] Tests backend pasando (15 tests entre ambos archivos).
- [ ] Tests de frontend automatizados (gap — ver `docs/06_TESTS/MasterTestPlan.md`).

## Definition of Done

Cumplida a nivel de código, tests backend y verificación manual. Gaps que persisten (compartidos por todo el proyecto): sin tests de frontend automatizados, sin CI/CD, `DEMO.md` desalineado en su descripción del login (documentado como known issue, no corregido en este alcance).
