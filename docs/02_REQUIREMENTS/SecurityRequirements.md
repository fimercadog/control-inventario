# Requisitos de Seguridad

Fuente: `_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` §11 (Seguridad) y §60 (Seguridad, detallado), cruzado con las reglas reales y ya vinculantes de `AGENTS.md` y `04_TECHNICAL_SPEC/Architecture.md`.

## Principios (§60 del master spec)

- Least Privilege.
- Defense in Depth.
- Zero Trust.
- Secure by Default.
- Fail Secure.
- Audit Everything.

## Autenticación — estado real: [BUILT]

- JWT (`tymon/jwt-auth`) sobre el guard `api`. Access token de corta duración (15 min).
- Refresh token **opaco** (no JWT), hasheado, almacenado en `auth_sessions`, viaja en cookie `httpOnly`, `Secure`, `SameSite=Lax` — nunca accesible desde JavaScript, nunca en `localStorage`.
- Rotación de refresh token en cada uso (nunca se reutiliza el mismo valor).
- Logout revoca la sesión (`auth_sessions.revoked_at`) y hace blacklist del JWT vigente.
- Resetear contraseña revoca **todas** las sesiones activas del usuario.
- Hash de contraseñas: verificar mecanismo real contra el hashing configurado en Laravel (bcrypt por defecto salvo configuración explícita de Argon2id — el master spec pedía Argon2id explícitamente; confirmar configuración real antes de asumir cumplimiento total).

## Autorización — estado real: [BUILT parcial / PLANNED]

- **Regla dura, ya vinculante**: autorización siempre por permiso (`$user->can('productos.editar')`), nunca por nombre de rol (`$user->hasRole('Admin')`). Codificada en `AGENTS.md` y seguida en el código existente.
- El motor de permisos (Spatie + Teams) y el catálogo de permisos existen y están sembrados.
- La verificación de permisos específicos en cada endpoint de negocio (middleware de autorización, Policies) es el **Módulo 3 — Authorization/RBAC**, todavía **[PLANNED]**. Hasta que se complete, los endpoints de negocio exigen autenticación (`auth:api`) pero no necesariamente el permiso granular correspondiente.
- Nunca se validan permisos únicamente desde el frontend — toda autorización debe reverificarse en Laravel.

## Aislamiento multi-tenant — estado real: [BUILT]

Esta es la protección de seguridad más verificada del sistema hasta la fecha (25 tests adversariales pasando):

- **Nunca confiar en `empresa_id` proveniente del request.** El contexto de empresa se deriva siempre del usuario autenticado, vía middleware `IdentifyTenant`.
- **Fail-closed**: sin contexto de tenant resuelto, toda consulta scoped debe devolver cero registros, nunca todos.
- `TenantScope` (global scope de Eloquent) aplicado automáticamente a todo modelo `empresa_id`-scoped (Producto, Categoria, Movimiento, CapturaIA, Role, AuditLog). Se omite únicamente para `is_platform_admin = true`.
- Verificación explícita adicional en cada Policy (`$model->empresa_id === $user->empresa_id`) como defensa en profundidad, por si un scope se bypassea intencionalmente en el futuro (`withoutGlobalScope`).
- El Platform Super Admin (`empresa_id = null`, `is_platform_admin = true`) nunca obtiene acceso "gratis" vía `Gate::before()` — cada acción sigue validando un permiso explícito del namespace `plataforma.*`.

## Validación de entrada

- Toda entrada se valida en backend (Laravel FormRequest) — nunca confiar solo en la validación de frontend (Zod/React Hook Form), que existe únicamente como UX, no como control de seguridad.

## Rate Limiting

Declarado en el master spec, verificar implementación real antes de asumir cumplimiento:

- Login: 5 intentos.
- Recuperación de contraseña: 3 intentos.
- API general: configurable.

## Headers de seguridad

Declarados como requisito (§60): Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Strict-Transport-Security. Verificar configuración real en el servidor/proxy antes de asumir cumplimiento — no confirmado en esta revisión de documentación.

## Archivos subidos (relevante para Captura IA — fotos)

- Validar extensión, MIME type y tamaño.
- Renombrar archivos al guardarlos (nunca conservar el nombre original del cliente).
- Nunca ejecutar archivos subidos por el usuario.

## Auditoría de seguridad

- `security_logs`: registra intentos de login, exitosos y fallidos, incluyendo actores no autenticados — de solo inserción, nunca editable ni eliminable.
- `audit_logs`: registra acciones de negocio (crear, editar, eliminar, cambios de permisos/contraseña) — también de solo inserción.

## Gap explícito

No se ha realizado una auditoría de seguridad formal (pentest o revisión externa) sobre el sistema hasta la fecha de este documento. La cobertura de seguridad verificada hoy proviene de los tests adversariales automatizados del Módulo 2 (aislamiento multi-tenant), no de una auditoría integral que cubra headers, rate limiting o hashing de contraseñas en producción.
