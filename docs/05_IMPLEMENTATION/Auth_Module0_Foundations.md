# Implementación — Auth Módulo 0: Fundamentos

> Documento retroactivo, reconstruido de `docs/00_VISION/Roadmap.md`, `docs/04_TECHNICAL_SPEC/Architecture.md`/`Database.md`, y del código real (migraciones, `PermissionSeeder`, `RbacFoundationTest`, `UserModelTest`).

## Estado

**Completo.** Base sobre la que se construyeron los Módulos 1 (Authentication) y 2 (Company Isolation).

## Goal

Sentar las bases de datos, paquetes y configuración necesarias para que exista un sistema de autenticación (JWT) y autorización por roles/permisos (RBAC) aislado por empresa, antes de construir el flujo de login real (Módulo 1) o el aislamiento de datos (Módulo 2).

## Scope

- Paquetes: `tymon/jwt-auth` (JWT) y `spatie/laravel-permission` con **Teams** habilitado (`team_foreign_key = empresa_id`).
- Migración de `users`: `empresa_id` (nullable, FK a `empresas`), `is_platform_admin`, campos de perfil (`avatar_path`, `theme`, `language`, `timezone`), `is_active`, campos de invitación (`invited_at`, `invited_by`), campos preparados para MFA (`two_factor_enabled`, `two_factor_secret`, `two_factor_confirmed_at`), campos de actividad (`last_activity_at`, `last_login_ip`, `last_user_agent`).
- Tablas nuevas: `auth_sessions` (refresh tokens con rotación), `security_logs` (intentos de login), `invitations` (invitación de usuarios por empresa).
- Tablas de `spatie/laravel-permission` (`permissions`, `roles`, `model_has_permissions`, `model_has_roles`, `role_has_permissions`) con `empresa_id` agregado a `roles`, `model_has_roles` y `model_has_permissions` (FKs propias, agregadas aparte para no tocar el archivo generado por el paquete).
- Seeder de catálogo global de permisos (`PermissionSeeder`), incluyendo el namespace `plataforma.*` para el Platform Super Admin.
- Guards configurados para JWT.
- `User` implementa `Tymon\JWTAuth\Contracts\JWTSubject`, con `empresa_id` como custom claim.

## Out of Scope

- Login/logout/refresh reales (Módulo 1).
- Filtrado automático de queries por empresa (`TenantScope`, Módulo 2).
- Cualquier pantalla de frontend — este módulo es puramente backend/infraestructura.
- Permisos finos por endpoint (middleware de autorización — Módulo 3).

## Dependencies

- El thin skeleton de `empresas`/`productos`/`categorias`/`movimientos` ya existente (construido para Captura IA).
- Ninguna dependencia de Captura IA en sentido inverso — Auth es un módulo independiente que luego Captura IA empezó a requerir (Módulo 1 puso todas sus rutas detrás de `auth:api`).

## Database Changes

- `2026_07_28_100001_add_auth_fields_to_users_table.php` — todos los campos listados arriba sobre `users`.
- `2026_07_28_183606_create_permission_tables.php` — tablas estándar de `spatie/laravel-permission` con Teams.
- `2026_07_28_183607_add_empresa_foreign_key_to_roles_table.php` — FK de `roles.empresa_id` → `empresas.id`.
- `2026_07_28_183608_create_auth_sessions_table.php` — `auth_sessions` (`user_id`, `refresh_token_hash` único, `device_name`, `ip_address`, `remember_me`, `last_used_at`, `expires_at`, `revoked_at`).
- `2026_07_28_183609_create_security_logs_table.php` — `security_logs` (`email`, `user_id` nullable, `ip_address`, `user_agent`, `success`, `reason`, `created_at` sin `updated_at`).
- `2026_07_28_183610_create_invitations_table.php` — `invitations` (`email`, `empresa_id`, `role_id` nullable, `token_hash` único, `invited_by`, `expires_at`, `accepted_at`).
- `2026_07_28_190001_add_empresa_foreign_keys_to_permission_pivot_tables.php` — agrega FKs de `empresa_id` en `model_has_roles`/`model_has_permissions` (Spatie las crea solo indexadas, sin FK).

## API Changes

Ninguno — este módulo no expone endpoints. Los endpoints de Auth llegan en el Módulo 1.

## Frontend Changes

Ninguno.

## Security

- `empresa_id` en `users` es **nullable** a propósito: permite la existencia de un Platform Super Admin sin empresa (`is_platform_admin = true`).
- El catálogo de permisos se siembra globalmente (no por empresa); lo que sí es por empresa es la **asignación** de roles/permisos a un usuario, vía el mecanismo de Teams de Spatie.
- `two_factor_secret` nunca se serializa en `toArray()`/`toJson()` del modelo `User` (verificado por test).

## Permissions

Catálogo sembrado por `PermissionSeeder`, incluyendo `productos.ver`, `productos.editar`, `roles.gestionar`, y el namespace `plataforma.*` (ej. `plataforma.empresas.ver`) reservado para el Platform Super Admin. La aplicación real de estos permisos a rutas/Controllers es el Módulo 3 (Authorization), todavía pendiente.

## Events

Ninguno propio de este módulo (los eventos de Auth — `UserLoggedIn`, `UserLoggedOut`, `PasswordWasReset` — se definieron y usan desde el Módulo 1).

## Tests

- `backend/tests/Unit/Auth/RbacFoundationTest.php` — 3 tests: catálogo de permisos sembrado globalmente; un rol otorgado en una empresa no se filtra a otra (mecanismo de Teams); roles con el mismo nombre pueden existir independientemente por empresa.
- `backend/tests/Unit/Auth/UserModelTest.php` — 5 tests: usuario regular pertenece a una empresa y no es platform admin; un Platform Super Admin puede existir sin empresa; `User` implementa `JWTSubject` con el claim `empresa_id`; columnas de 2FA/actividad tienen defaults seguros; `two_factor_secret` nunca se serializa.

## Risks

- El mecanismo de Teams de Spatie depende de que el team id se fije correctamente en cada request (`PermissionRegistrar::setPermissionsTeamId()`) — si algún código nuevo olvida hacerlo, los permisos podrían resolverse contra el team equivocado. Mitigado en la práctica por el middleware `IdentifyTenant` del Módulo 2, que fija el team id en el mismo lugar donde fija `TenantContext`.
- Campos de MFA (`two_factor_*`) están en el esquema pero sin implementación funcional — riesgo de falsa sensación de que 2FA existe; no existe todavía ninguna pantalla ni flujo que los use.

## Checklist

- [x] Paquetes instalados y configurados (JWT, Spatie Teams).
- [x] Migraciones de `users`, `auth_sessions`, `security_logs`, `invitations`, tablas de permisos.
- [x] `PermissionSeeder` con catálogo global, incluyendo `plataforma.*`.
- [x] `User` implementa `JWTSubject`.
- [x] Tests unitarios pasando (8 tests entre `RbacFoundationTest` y `UserModelTest`).
- [x] Verificado: Teams aísla roles por empresa correctamente (test adversarial cross-tenant).
- [ ] Documentación de este módulo como `05_IMPLEMENTATION` retroactivo (este documento — creado en esta migración, no al momento de construir el módulo).

## Definition of Done

Cumplida para el alcance de fundamentos: migraciones aplicadas, seeder funcionando, tests pasando. Como con todo el proyecto: sin CI/CD que verifique esto automáticamente, y sin Changelog previo a esta migración documentando el cambio en su momento.
