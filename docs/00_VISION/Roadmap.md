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
- [ ] **Módulo 4 — User Management**: CRUD/listado de usuarios de la empresa, activar/desactivar, ver actividad (`last_activity_at`, `last_login_ip`).
- [ ] **Módulo 5 — Role Management**: CRUD de roles por empresa + asignación de permisos del catálogo global.
- [ ] **Módulo 6 — Invitaciones**: invitar usuario (con rol ya existente de Módulo 5), aceptar invitación, verificación de email.
- [ ] **Módulo 7 — Active Sessions**: listar/revocar sesiones + "Remember Me".
- [ ] **Módulo 8 — Security Logs**: pantalla de intentos de login / auditoría de seguridad (los eventos y `security_logs` ya existen desde Módulo 1; aquí se construye la superficie de consulta).
- [ ] **Módulo 9 — User Profile**: avatar, tema, idioma, timezone.
