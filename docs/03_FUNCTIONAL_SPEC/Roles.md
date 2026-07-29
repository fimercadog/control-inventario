# Roles y Permisos (RBAC)

**Status: Built (infraestructura de datos y motor de permisos) — sin enforcement por ruta ni UI de gestión todavía**

> Verificado contra `backend/app/Models/Role.php`, `backend/config/permission.php`, `backend/database/seeders/PermissionSeeder.php`, `backend/database/migrations/2026_07_28_183606_create_permission_tables.php`, `2026_07_28_183607_add_empresa_foreign_key_to_roles_table.php`, `2026_07_28_190001_add_empresa_foreign_keys_to_permission_pivot_tables.php`, `backend/app/Models/User.php` (trait `HasRoles`), `frontend/lib/api/types.ts` (`AuthenticatedUser.permissions: string[]`). Corresponde a los Módulos 0-2 (Fundamentos, Authentication, Company Isolation) del roadmap Auth & RBAC — completos. El **motor** de permisos (catálogo, roles por empresa vía Teams de Spatie, aislamiento por tenant) está construido y probado (25 tests adversariales de Company Isolation). Lo que **no** está construido es: el middleware que aplica un permiso específico a una ruta de negocio (Módulo 3 — Authorization, pendiente `[ ]` en el roadmap), el CRUD de roles por empresa (Módulo 5 — Role Management, pendiente), y el `PermissionContext`/sidebar dinámico en el frontend (también Módulo 3). Reemplaza el borrador de la sección 19 del master spec, que no anticipaba el modelo real (roles por empresa vía Teams, permisos globales fijos, regla dura de nunca usar nombres de rol en lógica de negocio).

## Purpose

Permitir que cada empresa administre sus propios roles (ej. "Bodeguero", "Supervisor"), construidos a partir de un catálogo global y fijo de permisos que el cliente no puede editar — y que toda decisión de autorización en el sistema se base en el permiso concreto que una acción requiere, nunca en el nombre de un rol.

## Business Flow

1. El catálogo de permisos es global y fijo: se siembra vía `PermissionSeeder` (`productos.*`, `movimientos.*`, `captura-ia.*`, `usuarios.*`, `roles.*`, `auditoria.ver`, `plataforma.*`) y solo crece cuando se construye una feature nueva — nunca lo edita un cliente.
2. Cada empresa gestiona sus propios roles (`roles.empresa_id` como `team_foreign_key` de Spatie) — un rol nunca es visible ni aplicable fuera de su empresa.
3. Un usuario recibe uno o más roles (`model_has_roles`, con el `empresa_id` fijado por `TenantScope`); cada rol trae consigo un subconjunto de permisos del catálogo global (`role_has_permissions`).
4. En cada request autenticada, `GET /auth/me` devuelve `permissions: string[]` — los permisos efectivos del usuario, ya resueltos, listos para que el frontend decida qué mostrar (cuando exista ese frontend — ver "Future Improvements").
5. **Hoy**: ningún endpoint de negocio (Captura IA) valida un permiso específico — solo exige sesión válida + tenant identificado. La validación permiso-por-permiso es exactamente el trabajo del Módulo 3, pendiente.

## Actors

- **Usuario de empresa**: tiene uno o más roles de su empresa, cada uno con un subconjunto del catálogo de permisos.
- **Platform Super Admin** (`is_platform_admin = true`, sin `empresa_id`): nunca tiene un rol de empresa; sus permisos son del namespace reservado `plataforma.*`, y **nunca** se le otorgan vía un `Gate::before()` que apruebe todo — cada acción suya también pasa por el mismo chequeo de permiso que cualquier otro usuario.

## Screens

**Ninguna pantalla de gestión existe todavía.** No hay `/roles` ni `/roles/{id}` en `frontend/app`. La gestión de roles por empresa (CRUD + asignación de permisos del catálogo) es el Módulo 5 (Role Management), pendiente.

## Fields

Modelo de datos ya construido:

| Tabla | Campos clave | Notas |
|---|---|---|
| `permissions` (Spatie) | `name` (`recurso.accion`), `guard_name` | catálogo global, `guard_name = 'api'` |
| `roles` (Spatie + `App\Models\Role`) | `name`, `guard_name`, `empresa_id` | único por `(empresa_id, name, guard_name)` |
| `model_has_roles` | `role_id`, `model_id`, `model_type`, `empresa_id` (team) | FK a `empresa_id` agregada explícitamente (migración `2026_07_28_190001`) |
| `model_has_permissions` | ídem | permisos directos a un usuario, sin pasar por un rol (soportado por Spatie, uso no confirmado en el diseño real) |
| `role_has_permissions` | `permission_id`, `role_id` | conecta un rol de una empresa con permisos del catálogo global |

## Validation Rules

- Un rol es único por `(empresa_id, name, guard_name)` — dos empresas pueden tener ambas un rol llamado "Supervisor" sin colisión.
- Un usuario normal (`empresa_id` no nulo) nunca puede tener `is_platform_admin = true` — validado a nivel de aplicación (`UserPolicy`/`RoleService` según el diseño; no una constraint de base de datos).
- Los permisos `plataforma.*` nunca son asignables a un rol de empresa — son namespace reservado, exclusivo de usuarios `is_platform_admin = true`.

## Permissions

Catálogo completo ya sembrado (`PermissionSeeder`, 15 permisos): `productos.ver/crear/editar/eliminar`, `movimientos.ver/crear`, `captura-ia.usar/revisar/confirmar`, `usuarios.ver/editar/invitar`, `roles.ver/gestionar`, `auditoria.ver`, `plataforma.empresas.ver`, `plataforma.usuarios.ver`. Este mismo documento es, en cierto sentido, autorreferencial: `roles.ver`/`roles.gestionar` son los permisos que gatearán la futura pantalla de gestión de roles.

## Loading States

No aplica — no hay pantalla.

## Empty States

No aplica — no hay pantalla.

## Error States

No aplica todavía a nivel de UI. A nivel de backend: cualquier intento de bypass de `TenantScope` (ej. `withoutGlobalScope`) queda cubierto por la segunda capa de defensa — verificación explícita en cada Policy (`$model->empresa_id === $user->empresa_id`).

## Business Rules

- **Regla dura**: todo Policy/Middleware/Controller verifica **permisos** (`$user->can('productos.editar')`), nunca `hasRole(...)`. Los roles son solo un empaquetado administrativo para la UI de gestión; el motor de autorización real no sabe que existen roles como concepto de negocio.
- **Defensa en profundidad, dos capas**: (1) `TenantScope` automático sobre todo modelo `empresa_id`-scoped, incluido `Role`; (2) verificación explícita en cada Policy, por si un scope se bypasea intencionalmente en el futuro.
- Los permisos son fijos (solo se agregan vía seeder al construir features nuevas); los roles son 100% gestionables por cada empresa — nunca al revés.
- `Role` (subclase de `Spatie\Permission\Models\Role`) existe únicamente para heredar `TenantScope`: el scoping por equipo de Spatie (`setPermissionsTeamId`) protege su propia lógica interna (`hasRole()`, `can()`), pero **no** protege consultas Eloquent directas como `Role::all()` — sin esta subclase, esas consultas quedarían sin aislar por empresa.

## Acceptance Criteria

- [x] Un rol creado en la Empresa A nunca es visible ni aplicable a un usuario de la Empresa B (probado: 25 tests adversariales de Company Isolation).
- [x] `GET /auth/me` devuelve los permisos efectivos del usuario ya resueltos.
- [x] Un usuario normal nunca puede auto-asignarse `is_platform_admin = true`.
- [ ] **Pendiente (Módulo 3)**: un endpoint de negocio (ej. Captura IA) rechaza con 403 a un usuario autenticado que no tiene el permiso específico requerido.
- [ ] **Pendiente (Módulo 5)**: un usuario con `roles.gestionar` puede crear un rol, asignarle permisos del catálogo, y asignarlo a otro usuario de su empresa.
- [ ] **Pendiente (Módulo 3, frontend)**: el sidebar oculta ítems de navegación para los que el usuario no tiene el permiso correspondiente.

## Edge Cases

- Usuario con múltiples roles cuyos permisos se solapan — el modelo de Spatie resuelve esto de forma nativa (unión de permisos de todos los roles); sin un caso de prueba específico documentado todavía en este repo.
- Rol sin ningún permiso asignado — válido a nivel de esquema; comportamiento de UI (Módulo 5) ante ese caso, a definir.
- Platform Super Admin intentando una acción `productos.*` (no tiene empresa) — rechazado, porque no tiene ese permiso namespaced a ninguna empresa; su alcance real son exclusivamente los permisos `plataforma.*`.

## Future Improvements

- **Módulo 3 (Authorization/RBAC)**: `PermissionCheckerInterface`, Policies aplicadas a rutas reales de Producto/Movimiento/CapturaIA/Role/User, middleware `EnsurePermission`, `PermissionContext` + hook `usePermission(perm)` en el frontend, sidebar dinámico que oculta ítems sin permiso.
- **Módulo 5 (Role Management)**: `GET/POST/PATCH/DELETE /roles` (ya documentados en `04_TECHNICAL_SPEC/API.md`, sin Controller construido), `GET /permisos` (catálogo de solo lectura para la UI de asignación), y la pantalla `/roles` completa.
- Considerar si `model_has_permissions` (permisos directos a un usuario, sin rol intermedio) se usa alguna vez en el diseño real, o si se prohíbe explícitamente para mantener "los roles son el único empaquetado de permisos" como regla simple.
