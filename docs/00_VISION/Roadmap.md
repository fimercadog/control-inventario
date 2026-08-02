# 08 Roadmap

## Fase 1

Especificación

## Fase 2

Backend

## Fase 3

Frontend

## Fase 4

QA

## Fase 5

Deploy

## Módulo Captura IA

Ver sección 74 de _ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md para las 8 sub-fases (Diseño → Backend núcleo → Backend API → Frontend captura → Frontend revisión → QA → Documentar → Deploy).
Estado: **completo**. MVP declarado feature-complete; pasó verificación RC1 (suite de verificación, estados de carga/vacíos/error, walkthrough completo, responsive, animaciones, performance, Demo Mode, `DEMO.md`). `OPENAI_API_KEY` configurada.

## Módulo Auth & RBAC (Fase 5)

Arquitectura completa en 04_ARCHITECTURE.md / 05_DATABASE.md / 06_API.md. Un módulo a la vez; se corren tests después de cada uno. Orden ajustado y aprobado — reemplaza la secuencia original propuesta:

- [x] **Módulo 0 — Fundamentos**: paquetes (`tymon/jwt-auth`, `spatie/laravel-permission` con Teams), migración de `users` (empresa_id nullable, `is_platform_admin`, campos MFA-preparados, campos de actividad), `auth_sessions`, `security_logs`, `invitations`, seeder de catálogo de permisos (incluye namespace `plataforma.*`), guards. Verificado: Teams aísla roles por empresa correctamente (test adversarial cross-tenant).
- [x] **Módulo 1 — Authentication**: login/logout/refresh/me, password reset, `security_logs`, Redux auth-slice real, interceptor axios con refresh silencioso, pantallas `/login`, `/olvide-password`, `/restablecer-password` reales. Todas las rutas de negocio existentes (Captura IA) quedan detrás de `auth:api` — cero endpoints públicos. Verificado por navegador real: login/logout, cookie httpOnly invisible a JS, sesión sobrevive un reload duro vía refresh silencioso, "Remember Me" extiende `auth_sessions.expires_at` a 30 días. Bug real encontrado y corregido: sin `Accept: application/json`, Laravel intentaba `route('login')` (inexistente en esta API) y devolvía 500 en vez de 401 — corregido con `redirectGuestsTo(fn () => null)` en `bootstrap/app.php`.
- [x] **Módulo 2 — Company Isolation**: `TenantScope` global (fail-closed) + `IdentifyTenant` + `BelongsToEmpresa` en Producto/Categoria/Movimiento/CapturaIA/AuditLog/Role, bypass para `is_platform_admin`, Policies de ownership (defensa en profundidad), FKs agregadas a `model_has_roles`/`model_has_permissions`. 25 tests adversariales (HTTP + Eloquent/Policy) más una verificación en vivo contra el servidor real. Bug real encontrado y corregido: `SubstituteBindings` (route-model-binding de `{captura}`) corría, por prioridad de middleware por defecto de Laravel, antes de `IdentifyTenant` — se corrigió con `appendToPriorityList`. Ver el informe completo entregado en el chat para el detalle de arquitectura, pruebas, y riesgos residuales.
- [ ] **Módulo 3 — Authorization (RBAC)**: `PermissionCheckerInterface`, Policies (Producto/Movimiento/CapturaIA/Role/User), middleware de permisos, `PermissionContext`, sidebar dinámico, rutas protegidas.
- [x] **Módulo 4 — User Management** (2026-08-02, RC1 Fase 4): `UserController` (Listar/Ver/Activar/Desactivar — sin Crear, que queda para Módulo 6; sin ningún endpoint de eliminar), `UserPolicy` (pertenencia de empresa, filtrado manual porque `User` no tiene `TenantScope` automático), pantalla `/usuarios` real con búsqueda/filtro/paginación/badge, ficha `/usuarios/{id}` de solo lectura. Dos guardas de negocio confirmadas explícitamente antes de codificar (Golden Rule): un usuario nunca puede desactivar su propia cuenta, ni al último usuario activo de su empresa con `usuarios.editar` — ambas con test dedicado. Desactivar revoca las `auth_sessions` activas del usuario afectado. 14 tests nuevos (`UserControllerTest`), suite completa 222/222 en verde. Sigue **sin** enforcement de permiso granular por ruta (Módulo 3 continúa `[ ]`) — mismo nivel incremental que el resto del roadmap RC1. Ver `docs/03_FUNCTIONAL_SPEC/Users.md`, `docs/05_IMPLEMENTATION/UsersModule.md`.
- [x] **Módulo 5 — Role Management** (2026-08-02): `RoleRepository`/`RoleService`/`RolePolicy`/`RoleController` + `PermissionController` (catálogo de solo lectura, excluye `plataforma.*`), Listar/Ver/Crear/Editar/Activar/Desactivar sin `DELETE` físico (mismo patrón que el resto del ERP), asignación de permisos vía `syncPermissions()` (reemplaza, no acumula), bloqueo de desactivación con 409 si el rol tiene usuarios asignados (`RoleHasAssignedUsersException`). Vertical slice completo: Redux (`roles-slice.ts`), pantallas `/roles` y `/roles/{id}` reales (tab "Usuarios" de solo lectura para hacer accionable el bloqueo de 409), componente reutilizable `PermissionPicker`. 24 tests nuevos (`RoleControllerTest`), incluye 3 tests de regresión para un bug real encontrado y corregido (`RoleAlreadyExists` de Spatie sin capturar en nombre duplicado). Sigue **sin** enforcement de permiso granular por middleware de ruta (Módulo 3 continúa `[ ]`) — mismo nivel incremental que el resto del roadmap. Ver `docs/03_FUNCTIONAL_SPEC/Roles.md`, `docs/security/ROLES_MATRIX.md`, `docs/05_IMPLEMENTATION/RolesModule.md`.
- [ ] **Módulo 6 — Invitaciones**: invitar usuario (con rol ya existente de Módulo 5), aceptar invitación, verificación de email.
- [ ] **Módulo 7 — Active Sessions**: listar/revocar sesiones + "Remember Me".
- [ ] **Módulo 8 — Security Logs**: pantalla de intentos de login / auditoría de seguridad (los eventos y `security_logs` ya existen desde Módulo 1; aquí se construye la superficie de consulta).
- [x] **Módulo 9 — User Profile** (2026-08-02): `ProfileService`+`ProfileController` (`update`/`subirAvatar`/`eliminarAvatar`/`cambiarPassword`) — sin Repository ni Policy propia, a propósito: mutaciones de un único registro ya cargado (`$request->user()`), sin superficie de escalamiento que un permiso necesite cerrar. `AuthenticatedUserResource` (`/auth/me`) gana `avatar_url`/`empresa`/`roles` computados — sin `GET /perfil` redundante. Cambiar la contraseña propia reutiliza `AuthenticationService::forcePasswordReset()` (revoca todas las sesiones), mismo mecanismo que "olvidé mi contraseña". Pantalla `/perfil` real (avatar, datos personales, apariencia, seguridad), nueva entrada "Mi Perfil" en el dropdown de cuenta del sidebar; Configuración pierde su selector de tema duplicado (ahora enlaza a Perfil, una sola fuente de verdad del `theme`). 14 tests nuevos (`ProfileControllerTest`), suite completa 311/311. Encontrado y corregido un bug real de infraestructura ajeno a este módulo: `APP_URL` sin puerto en `.env`/`.env.example` rompía cualquier `Storage::url()` absoluta — nunca se había manifestado porque ningún módulo anterior generaba una. Cierra la secuencia vertical-slice Roles→Auditoría→Reportes→Perfil — los 4 módulos completos. Ver `docs/03_FUNCTIONAL_SPEC/Profile.md`, `docs/05_IMPLEMENTATION/ProfileModule.md`.
