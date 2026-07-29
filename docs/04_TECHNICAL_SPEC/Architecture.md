# 04 Architecture

## Arquitectura General

Frontend (Next.js)
↓
API REST (Laravel)
↓
MySQL

## Decisiones

- Desacoplado
- JWT
- empresa_id

## Módulo Captura IA

Ver sección 74 de _ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md. Backend (Fase 3) completo; frontend pendiente.
Proveedor de IA consumido vía un único AIProviderInterface — nunca acoplado directo a OpenAI. Captura IA no contiene reglas de negocio: solo extrae y delega en ProductService/InventoryService.
Nota: módulo Auth/JWT todavía no existe en este backend; estos endpoints no son aptos para producción hasta que se construya.

## Módulo Auth & RBAC (Fase 5)

### Decisiones de producto (confirmadas)

- **Roles por empresa**: cada empresa gestiona sus propios roles (ej. "Bodeguero", "Supervisor"), construidos a partir de un catálogo global y fijo de permisos. Los permisos NO son editables por el cliente; los roles sí.
- **Alta de usuarios por invitación**: no existe registro público. Un usuario con `usuarios.invitar` crea la invitación (email + rol inicial); el invitado verifica su correo y define su contraseña. Sin invitación no hay cuenta ni empresa asociada.
- **Tokens en cookies httpOnly**: el refresh token viaja en una cookie `httpOnly`, `Secure`, `SameSite=Lax`, nunca accesible desde JS. El access token (JWT de corta duración) se devuelve en el body del login/refresh y se guarda solo en memoria (Redux), nunca en `localStorage`.
- **Ningún endpoint de negocio queda público durante el desarrollo**: el guard JWT (`auth:api`) se aplica a *todas* las rutas de negocio existentes (Captura IA y las que se agreguen) desde el Módulo 1, antes de que exista RBAC o aislamiento por empresa. El endurecimiento es incremental y explícito: 1) autenticado → 2) su propia empresa → 3) su permiso específico. Nunca hay una ventana donde una ruta de negocio acepte tráfico anónimo.

### Platform Super Admin

Existe un usuario de plataforma que **no pertenece a ninguna empresa** (`empresa_id = null`, `is_platform_admin = true`). Es para soporte/operaciones internas de Fidel OS, no para el cliente.

- `TenantScope` se **desactiva por completo** para este usuario (no es "una empresa más" — no tiene ninguna, así que no hay `empresa_id` contra el cual filtrar).
- Aun así, **cada acción sigue pasando por el mismo chequeo de permisos** que cualquier otro usuario (`$user->can('plataforma.empresas.ver')`, etc.) — nunca se usa un `Gate::before()` que apruebe todo por ser super admin. Eso violaría "toda acción de negocio valida un permiso" y crearía una puerta trasera sin auditoría.
- Los permisos `plataforma.*` (ver/gestionar empresas, ver usuarios de cualquier empresa) son un namespace reservado del catálogo global, otorgado únicamente a usuarios `is_platform_admin = true` — nunca a un rol de una empresa.
- Un usuario normal (con `empresa_id`) nunca puede tener `is_platform_admin = true`; se valida en el `UserPolicy`/`RoleService`, no solo en la base de datos.

### Paquetes

- `tymon/jwt-auth` — autenticación JWT sobre el guard `api`. Emite el access token (15 min).
- `spatie/laravel-permission` (con **Teams** habilitado, `team_foreign_key = empresa_id`) — motor de roles/permisos. Es la pieza de infraestructura que hace cumplir "roles por empresa, permisos globales" sin reinventar el particionado; Domain/Application nunca importan clases de Spatie directamente, solo `PermissionCheckerInterface`.

### Regla dura: nunca nombres de rol en lógica de negocio

Todo Policy/Middleware/Controller verifica **permisos** (`$user->can('productos.editar')`), nunca `hasRole(...)`. Los roles son solo un empaquetado administrativo de permisos para la UI de gestión; el motor de autorización real no sabe que existen roles.

### Aislamiento por empresa (defensa en profundidad, dos capas)

1. **Global Scope automático** (`TenantScope`) aplicado a todo modelo `empresa_id`-scoped (Producto, Categoria, Movimiento, CapturaIA, Role). Se resuelve contra el `empresa_id` del usuario autenticado (fijado por un middleware `IdentifyTenant` justo después de auth). Ninguna consulta puede "olvidar" el filtro — es automático a nivel Eloquent. Se omite únicamente para `is_platform_admin = true`.
2. **Verificación explícita en cada Policy** (`$model->empresa_id === $user->empresa_id`) como respaldo, por si algún scope se bypassea intencionalmente (`withoutGlobalScope`) en el futuro.

### Flujo de tokens

1. `POST /auth/login` valida credenciales + `is_active` + `email_verified_at`. Emite access token JWT (15 min, claims: `user_id`, `empresa_id`) y un refresh token **opaco** (no JWT — así es revocable individualmente sin necesitar blacklist), hasheado y guardado en `auth_sessions` junto a IP/device/expiración (7 días normal, 30 días con "Remember Me").
2. Cada request usa `Authorization: Bearer <access_token>`.
3. Al expirar el access token, el frontend llama `POST /auth/refresh` (la cookie httpOnly viaja sola); el backend valida el hash contra `auth_sessions`, **rota** el refresh token (nunca se reutiliza el mismo valor) y emite un nuevo access token.
4. `POST /auth/logout` revoca la sesión actual (`auth_sessions.revoked_at`) y hace blacklist del JWT vigente (feature nativa de tymon).
5. Cambiar la contraseña (reset) revoca **todas** las sesiones activas del usuario.

### Estructura de carpetas (Clean Architecture, sigue el patrón ya usado en Captura IA)

```text
app/Contracts/Auth/        TokenServiceInterface, PermissionCheckerInterface
app/DTO/Auth/               AuthenticatedUserDTO, TokenPairDTO, SessionDTO, InviteUserDTO
app/Services/Auth/          AuthenticationService, TenantService, InvitationService,
                             PasswordResetService, EmailVerificationService, SessionService,
                             RoleService, UserService, ProfileService
app/Repositories/Auth/      AuthSessionRepository
app/Policies/               UserPolicy, RolePolicy, ProductoPolicy, MovimientoPolicy, CapturaIAPolicy
app/Http/Middleware/        EnsurePermission, IdentifyTenant
app/Http/Controllers/Api/Auth/  AuthController, UserController, InvitationController,
                                 PasswordResetController, EmailVerificationController,
                                 SessionController, RoleController, PermissionController,
                                 ProfileController
app/Models/                 Role (Spatie + empresa_id), Permission (Spatie), AuthSession, SecurityLog
app/Events/Auth/            UserLoggedIn, UserLoggedOut, UserInvited, InvitationAccepted,
                             PasswordResetRequested, PasswordWasReset, EmailVerified,
                             RoleCreated, RoleUpdated, PermissionsSyncedToRole, SessionRevoked,
                             UserDeactivated
app/Listeners/Auth/         LogAuthEventToAuditLog (a diferencia de Captura IA, aquí SÍ se construyen
                             listeners desde ya — Audit Logs es requisito explícito de esta fase)
```

### MFA — preparado, no implementado

`users` incluye `two_factor_enabled`, `two_factor_secret` (cast `encrypted`), `two_factor_confirmed_at` desde el Módulo 0. Ningún flujo de login los usa todavía — es únicamente para no requerir otra migración de `users` cuando se construya MFA en una fase futura.

### Frontend

- `store/slices/auth-slice.ts`: reemplaza la sesión local mock por estado real (`user`, `permissions: string[]`, `accessToken` en memoria — nunca persistido). Thunks: `login`, `logout`, `refresh`, `fetchMe`.
- Interceptor de axios: agrega el `Authorization` header desde Redux; en un 401 intenta un único `refresh` silencioso (cookie) y reintenta la request original; si falla, `logout` + redirect a `/login`. `withCredentials: true`.
- `PermissionContext` + hook `usePermission(perm)` — envuelve el estado de Redux, evita repetir `useAppSelector` en cada pantalla.
- `useRequireAuth` se extiende con un `requiredPermission` opcional — si falta, renderiza una pantalla 403 amigable en vez de redirigir (el usuario sí está autenticado, solo le falta un permiso).
- Sidebar dinámico: cada item de `NAV_ITEMS` declara un `permission?: string`; los que el usuario no tiene simplemente no se renderizan (no aparecen deshabilitados — no hay "upsell" de features bloqueadas).
