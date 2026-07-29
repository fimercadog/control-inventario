# ADR-010: RBAC vía `spatie/laravel-permission` con Teams (`team_foreign_key = empresa_id`)

## Estado
Accepted (Verified) para el diseño. **Parcialmente implementado** — ver "Estado de implementación".

## Fecha
No verificable con fecha exacta (ver ADR-001). Proxy verificable: `backend/database/migrations/2026_07_28_183606_create_permission_tables.php` y `2026_07_28_183607_add_empresa_foreign_key_to_roles_table.php`, fechadas `2026-07-28`.

## Contexto
Cada empresa (tenant) necesita gestionar sus propios roles de forma independiente, mientras que el catálogo de permisos disponibles debe ser global y fijo (solo se agrega vía seeder al construir features nuevas).

## Problema
¿Cómo implementar "roles por empresa, permisos globales" sin construir un sistema de particionado de roles desde cero?

## Alternativas evaluadas
La fuente citada abajo sí registra el motivo de la elección (evitar reinventar el particionado), lo cual documenta parcialmente una alternativa descartada: construir una tabla de roles custom con `empresa_id` propio en vez de usar la feature de Teams de un paquete existente.

> *"`spatie/laravel-permission` (con Teams habilitado, `team_foreign_key = empresa_id`) — motor de roles/permisos. Es la pieza de infraestructura que hace cumplir 'roles por empresa, permisos globales' sin reinventar el particionado."* — `docs/04_TECHNICAL_SPEC/Architecture.md`, línea 44.

No se documentó si se evaluaron otros paquetes de RBAC (por ejemplo, `bouncer` o una implementación propia) antes de elegir `spatie/laravel-permission` específicamente.

## Decisión
Usar `spatie/laravel-permission` con la feature Teams habilitada, usando `empresa_id` como `team_foreign_key`. `roles` es único por `(empresa_id, name, guard_name)`, no global. Los permisos (`permissions`) son un catálogo global y fijo, formato `recurso.accion`, con un namespace reservado `plataforma.*` exclusivo para `is_platform_admin = true`. Domain/Application nunca importan clases de Spatie directamente, solo `PermissionCheckerInterface`.

**Fuentes verificadas:**
- `docs/04_TECHNICAL_SPEC/Architecture.md`, línea 44 (citada arriba).
- `docs/04_TECHNICAL_SPEC/Architecture.md`, línea 38: *"Los permisos `plataforma.*` (...) son un namespace reservado del catálogo global, otorgado únicamente a usuarios `is_platform_admin = true` — nunca a un rol de una empresa."*
- `docs/04_TECHNICAL_SPEC/Database.md`, línea 41–43: *"`permissions` (Spatie) — catálogo global y fijo, sembrado por seeder (...). `roles` (Spatie + Teams) — `empresa_id` como `team_foreign_key`. Único por `(empresa_id, name, guard_name)`, no global. `model_has_roles` / `model_has_permissions` / `role_has_permissions` (Spatie, con soporte de Teams)."*
- `docs/04_TECHNICAL_SPEC/API.md`, línea 61: *"GET `/roles` (...) — requiere `roles.gestionar`; siempre acotado a la empresa del usuario (Teams de Spatie)."*
- Código real: `backend/config/permission.php`, línea 138: `'teams' => true`. `backend/app/Models/Role.php` (existe, subclase con `BelongsToEmpresa` según `docs/04_TECHNICAL_SPEC/Architecture.md` línea 78).
- `AGENTS.md` §"Security Rules": exige autorización por permiso (`$user->can()`), nunca por nombre de rol — consistente con, pero no exclusivo de, esta elección de paquete.

## Consecuencias
- Cada empresa gestiona sus propios roles de forma completamente independiente; los permisos disponibles son los mismos para todas las empresas.
- Dependencia de un paquete de terceros (`spatie/laravel-permission`) para una pieza de seguridad central — mitigado, según la fuente, por aislar su uso detrás de `PermissionCheckerInterface` en vez de importarlo directamente en Domain/Application.
- El chequeo real de permisos (`$user->can()`) en las Policies de negocio, y el seeder del catálogo, corresponden al Módulo 3 (Authorization), **todavía no construido** — ver "Estado de implementación".

## Impacto
Alto — es la infraestructura de autorización de todo el sistema; determina cómo se modelan roles y permisos para todos los módulos futuros.

## Referencias
- `docs/04_TECHNICAL_SPEC/Architecture.md` (líneas 38, 44)
- `docs/04_TECHNICAL_SPEC/Database.md` (líneas 41–43)
- `docs/04_TECHNICAL_SPEC/API.md` línea 61
- `docs/04_TECHNICAL_SPEC/Security.md`
- `backend/config/permission.php`

## Estado de implementación
**Parcial.** El modelo `Role` (con `BelongsToEmpresa`) y el paquete con Teams habilitado ya están instalados y configurados en código (`config/permission.php`, migraciones de permisos y roles). El catálogo de permisos, el seeder, y el chequeo `$user->can()` real dentro de Policies de negocio corresponden al Módulo 3 (Authorization/RBAC), que según `docs/00_VISION/Roadmap.md` **no está construido todavía**.

## Información Faltante
No se documentó si se evaluaron alternativas a `spatie/laravel-permission` (otro paquete, o una implementación propia de roles/permisos). Se documenta el motivo funcional de la elección de Teams como mecanismo (evitar reinventar el particionado por empresa), no una comparación formal entre paquetes de RBAC.
