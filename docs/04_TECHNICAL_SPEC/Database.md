# 05 Database

## Entidades

- empresas
- usuarios
- roles
- categorias
- productos
- inventario
- movimientos
- compras
- ventas
- capturas_ia
- capturas_ia_detalle
- audit_logs

## Relaciones

## Índices

## Reglas de negocio

## Módulo Captura IA

Ver sección 74 de _ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md para el diccionario de datos completo.
`capturas_ia_detalle` nunca escribe stock directamente; solo referencia `producto_id` y `movimiento_id` una vez aplicados por los Services existentes.
`capturas_ia` tiene `uuid` (identificador externo) además del id numérico.
`audit_logs` es genérica (no exclusiva de Captura IA) e inmutable — sin update/delete.

## Módulo Catálogos — Categorías, Marcas, Unidades de Medida (RC1 Fase 1, docs/05_IMPLEMENTATION/CatalogModules.md)

### Nuevas entidades

- `marcas` — `id, empresa_id (FK), nombre, estado (default activo), timestamps`.
- `unidades_medida` — `id, empresa_id (FK), nombre, abreviatura (nullable), estado (default activo), timestamps`.
- `categorias` — ya existía (Fase 3 original), sin cambios de esquema; solo gana controller/UI.

### Relaciones

- `productos.marca_id` → `marcas.id` (nullable, `nullOnDelete`).
- `productos.unidad_medida_id` → `unidades_medida.id` (nullable, `nullOnDelete`).
- `productos.categoria_id` → `categorias.id` (ya existente).

### Reglas de negocio

- `productos.marca` y `productos.unidad_medida` (columnas string) se eliminan tras un backfill case-insensitive: cada valor distinto por empresa se convierte en una fila de `Marca`/`UnidadMedida`, y `productos.marca_id`/`unidad_medida_id` apunta a ella.
- El matching de identidad de producto de Captura IA (`nombre + marca + presentación`) pasa a comparar contra `marcas.nombre` vía relación, preservando exactamente la misma semántica case-insensitive/trim que antes.
- Borrado siempre lógico (`estado`) en las tres entidades — nunca DELETE físico.

## Módulo Auth & RBAC (Fase 5)

### Nuevas entidades

- `users` (existente, se extiende):
  - `empresa_id` — **nullable**: obligatorio para usuarios normales, `null` únicamente para el Platform Super Admin (ver más abajo).
  - `is_platform_admin` (boolean, default false) — marca al usuario como administrador de plataforma, no de una empresa.
  - `avatar_path`, `theme` (light/dark/system), `language`, `timezone`, `is_active`, `invited_at`, `invited_by`.
  - `two_factor_enabled` (boolean, default false), `two_factor_secret` (string, nullable, cast `encrypted`), `two_factor_confirmed_at` (timestamp, nullable) — columnas preparadas para MFA; sin lógica de verificación todavía (se implementa en una fase futura).
  - `last_activity_at`, `last_login_ip`, `last_user_agent` — se actualizan en login y en cada refresh de token (no en cada request individual, para no generar escrituras excesivas).
- `permissions` (Spatie) — catálogo global y fijo, sembrado por seeder. Formato `recurso.accion` (ej. `productos.editar`, `roles.gestionar`, `usuarios.invitar`). Incluye un namespace `plataforma.*` de uso exclusivo del Platform Super Admin.
- `roles` (Spatie + Teams) — `empresa_id` como `team_foreign_key`. Único por `(empresa_id, name, guard_name)`, no global.
- `model_has_roles` / `model_has_permissions` / `role_has_permissions` (Spatie, con soporte de Teams).
- `auth_sessions` — registro de refresh tokens: `user_id`, `refresh_token_hash`, `device_name`, `ip_address`, `remember_me`, `last_used_at`, `expires_at`, `revoked_at`. Es lo que hace posible "Active Sessions" y la revocación individual (un JWT puro no se puede revocar sin esto).
- `security_logs` — intentos de login (éxito y fallo): `email`, `user_id` (nullable), `ip_address`, `user_agent`, `success`, `reason`, `created_at`. Distinto de `audit_logs`: aquí se registran también los intentos **fallidos** de actores no autenticados.
- `invitations` — invitaciones pendientes: `email`, `empresa_id`, `role_id`, `token_hash`, `invited_by`, `expires_at`, `accepted_at`.

### Relaciones (Auth & RBAC)

- `users.empresa_id` → `empresas.id` (nullable; obligatorio salvo para `is_platform_admin = true`).
- `roles.empresa_id` → `empresas.id` (rol propiedad de una empresa).
- `role_has_permissions` conecta roles (por empresa) con permisos (catálogo global).
- `auth_sessions.user_id`, `security_logs.user_id`, `invitations.invited_by` → `users.id`.

### Reglas de negocio (Auth & RBAC)

- Los permisos son fijos (solo se agregan vía seeder al construir features nuevas); los roles son 100% gestionables por cada empresa.
- Ningún query de un modelo `empresa_id`-scoped puede saltarse el filtro de tenant: `TenantScope` lo aplica automáticamente (ver 04_ARCHITECTURE.md), excepto para `is_platform_admin = true`.
- Resetear contraseña revoca todas las filas activas de `auth_sessions` del usuario.
- `security_logs` es de solo-inserción (igual que `audit_logs`), nunca se edita ni se borra.
- Un usuario normal (`empresa_id` no nulo) nunca puede tener `is_platform_admin = true`; se valida a nivel de aplicación (constraint lógica, no de base de datos, para no complicar el schema con un CHECK cruzado).
