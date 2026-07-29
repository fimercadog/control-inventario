# Autenticación

**Status: Built**

> Verificado contra `backend/app/Http/Controllers/Api/Auth/AuthController.php`, `PasswordResetController.php`, `backend/routes/api.php`, `backend/app/Services/Auth/*`, `frontend/app/login`, `frontend/app/olvide-password`, `frontend/app/restablecer-password`, `frontend/store/slices/auth-slice.ts`. Corresponde al Módulo 1 (Authentication) del roadmap Auth & RBAC — completo. Reemplaza el borrador original de las secciones 17-19 del master spec, que describía un módulo distinto (registro propio, sin JWT, sin cookies httpOnly) al que realmente se construyó.

## Purpose

Permitir que un usuario ya provisto de cuenta (no hay registro público) inicie sesión, mantenga su sesión activa de forma segura entre recargas, y pueda recuperar el acceso si olvida su contraseña — todo sin exponer nunca el refresh token a JavaScript.

## Business Flow

1. **Login**: el usuario ingresa email + contraseña (+ "Recordarme" opcional) en `/login`. El backend valida credenciales, `is_active` y `email_verified_at`, registra el intento en `security_logs` (éxito o fallo), y responde con un access token JWT (15 min, en el body) y un refresh token opaco en una cookie `httpOnly`/`Secure`/`SameSite=Lax` (7 días, o 30 con "Remember Me").
2. **Sesión activa**: cada request de negocio adjunta `Authorization: Bearer <access_token>`. Un interceptor de axios lo agrega desde Redux (memoria, nunca `localStorage`).
3. **Refresh silencioso**: al recibir un 401 (access token vencido), el interceptor llama `POST /auth/refresh` (la cookie viaja sola) una única vez, obtiene un nuevo access token, y reintenta la request original. Si el refresh también falla, se limpia la sesión y se redirige a `/login`.
4. **Logout**: revoca la sesión actual en `auth_sessions` y hace blacklist del JWT vigente.
5. **Recuperar contraseña**: `/olvide-password` solicita el email y siempre responde con un mensaje genérico (no revela si el correo existe). Si el correo es válido, se envía un enlace firmado. `/restablecer-password?token=...&email=...` permite definir una nueva contraseña; al completarse, se revocan **todas** las sesiones activas del usuario (todas las `auth_sessions`).
6. **Alta de usuarios**: no existe registro público. Los usuarios se crean únicamente por invitación (Módulo 6, `usuarios.invitar`) — fuera del alcance de esta pantalla y todavía no construido (ver `Users.md`).

## Actors

- **Usuario de empresa** (`empresa_id` no nulo): flujo estándar de login/logout/reset descrito arriba.
- **Platform Super Admin** (`empresa_id = null`, `is_platform_admin = true`): mismo flujo de login; sin empresa asociada, usado para soporte/operaciones internas.
- **Visitante no autenticado**: solo puede alcanzar `/login`, `/olvide-password`, `/restablecer-password`.

## Screens

- **`/login`** (`frontend/app/login/page.tsx`): formulario email + contraseña + checkbox "Mantener la sesión iniciada", enlace a "¿Olvidaste tu contraseña?". Validación con `zod` + `react-hook-form`. Si ya hay sesión autenticada, redirige a `/dashboard`.
- **`/olvide-password`** (`frontend/app/olvide-password/page.tsx`): formulario de un solo campo (email). Tras enviar, muestra una confirmación genérica ("si ese correo existe...") en vez de navegar, para no filtrar si el correo existe.
- **`/restablecer-password`** (`frontend/app/restablecer-password/page.tsx`): lee `token` y `email` de la query string. Si faltan, muestra un mensaje de enlace inválido con acción para solicitar uno nuevo. Si están presentes, formulario de nueva contraseña + confirmación; al completarse redirige a `/login` tras 2 segundos.

## Fields

| Pantalla | Campo | Tipo | Notas |
|---|---|---|---|
| Login | email | string, email | requerido |
| Login | password | string | requerido |
| Login | rememberMe | boolean | opcional, default `false` |
| Olvidé contraseña | email | string, email | requerido |
| Restablecer contraseña | password | string, mín. 8 caracteres | requerido |
| Restablecer contraseña | passwordConfirmation | string | debe coincidir con `password` |
| Restablecer contraseña | token, email | string (query params) | provistos por el enlace del correo, no editables |

## Validation Rules

- Frontend: `zod` valida formato de email y presencia de campos antes de enviar (mensajes en español bajo cada input).
- Backend: `LoginRequest`, `ForgotPasswordRequest`, `ResetPasswordRequest` (Form Requests de Laravel) validan antes de llegar al Controller.
- Contraseña nueva: mínimo 8 caracteres, debe coincidir con su confirmación (client-side vía `.refine()` de zod; también server-side).

## Permissions

Ninguno de estos endpoints exige un permiso de Spatie — son la puerta de entrada al sistema de permisos, no una acción protegida por él. `POST /auth/logout` y `GET /auth/me` sí exigen `auth:api` + `tenant` (sesión válida), pero no un permiso específico.

## Loading States

- Login: botón pasa a "Ingresando..." con spinner (`Loader2`), deshabilitado mientras `status === "loading"` en el slice de Redux.
- Olvidé contraseña: botón "Enviando..." con spinner mientras la petición está en curso.
- Restablecer contraseña: botón "Guardando..." con spinner; formulario completo se reemplaza por un spinner centrado mientras se resuelven los `searchParams` (`Suspense` boundary de Next.js).

## Empty States

No aplica — estas pantallas son formularios, no listados.

## Error States

- Login: credenciales inválidas o cuenta inactiva → mensaje de error inline sobre el formulario (rojo, `bg-destructive/10`). El backend nunca distingue "email no existe" de "contraseña incorrecta" en el mensaje.
- Restablecer contraseña: token expirado o inválido → mensaje "No pudimos restablecer tu contraseña. El enlace puede haber expirado." (HTTP 422). Enlace sin `token`/`email` en la URL → pantalla de "enlace inválido o incompleto" con acción para solicitar uno nuevo.
- Fallo de red genérico: mensaje de error del `ApiError` capturado, mostrado inline.

## Business Rules

- El refresh token nunca es accesible desde JavaScript (cookie `httpOnly`); el access token nunca se persiste (`localStorage`/`sessionStorage`), solo vive en memoria (Redux).
- `POST /auth/password/olvide` responde siempre con el mismo mensaje de éxito, exista o no el correo (anti-enumeración de usuarios).
- Cambiar la contraseña (reset) revoca todas las `auth_sessions` activas del usuario — cierra sesión en todos los dispositivos.
- Todas las rutas de negocio (Captura IA y las que se agreguen) exigen `auth:api` desde este módulo en adelante — nunca hay una ventana de acceso anónimo a un endpoint de negocio.
- El JWT incluye el claim `empresa_id`, usado más adelante por `IdentifyTenant` para fijar el tenant de la request.

## Acceptance Criteria

- [x] Un usuario válido puede iniciar sesión y llegar a `/dashboard`.
- [x] Una sesión sobrevive a una recarga dura del navegador gracias al refresh silencioso.
- [x] "Recordarme" extiende `auth_sessions.expires_at` a 30 días en vez de 7.
- [x] La cookie de refresh token es invisible a `document.cookie` (httpOnly verificado en navegador real).
- [x] Un intento de login fallido queda registrado en `security_logs`.
- [x] `/olvide-password` nunca revela si un correo está registrado.
- [x] Restablecer la contraseña revoca todas las sesiones activas previas.

## Edge Cases

- Doble submit del formulario de login (doble click) — el botón se deshabilita durante `status === "loading"`, pero no hay throttling explícito del lado backend documentado más allá de `security_logs`.
- Refresh token robado y reutilizado tras rotación — el diseño (nunca reutilizar el mismo valor) previene el replay, pero no hay una pantalla de "actividad sospechosa" todavía (ver `Roles.md`/futuro Módulo 8, Security Logs).
- Usuario navega directo a `/restablecer-password` sin `token`/`email` — cubierto (pantalla de enlace inválido).
- Cuenta desactivada (`is_active = false`) intenta iniciar sesión — rechazada por `AuthenticationService::login()`, pero el mensaje exacto mostrado al usuario no está documentado en detalle; a validar en implementación de Módulo 4.

## Future Improvements

- MFA: columnas `two_factor_enabled`/`two_factor_secret`/`two_factor_confirmed_at` ya existen en `users`, pero ningún flujo de login las usa todavía.
- Pantalla de sesiones activas / revocación individual (Módulo 7, `GET/DELETE /auth/sesiones`) — endpoint documentado en `04_TECHNICAL_SPEC/API.md`, sin pantalla construida.
- Pantalla de intentos de login / auditoría de seguridad (Módulo 8) sobre los datos que `security_logs` ya está acumulando desde este módulo.
