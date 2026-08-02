# Informe Final — Fase 4.6: Authorization Completion (RC1)

## Resumen del trabajo realizado

Los tres módulos que `docs/security/ROLES_MATRIX.md` dejó documentados a propósito como Gap 5 tras Fase 4.5 (Productos, Movimientos, Captura IA) ganaron enforcement de permiso real en su Policy, combinado con AND sobre la pertenencia de empresa ya existente — nunca reemplazándola. Decisión confirmada explícitamente por el propietario del proyecto: **"I do NOT want two different authorization models inside the ERP. Therefore, before Phase 5 starts, let's completely close the authorization layer."**

Con esta fase cerrada, las 9 Policies de recursos de negocio del ERP (de las 10 existentes — `UserPolicy` es la única excepción deliberada, anterior a Fase 4.5/4.6) comparten exactamente el mismo modelo de autorización. No queda ningún módulo con un segundo estándar. `docs/security/ROLES_MATRIX.md` cierra su último gap de alcance conocido y pasa a `Status: Approved — arquitectura de autorización completa`.

Durante esta fase se identificó y corrigió además un hallazgo de arquitectura independiente del alcance original, descrito en "Correcciones realizadas".

## Funcionalidades implementadas

**Productos** — sigue el patrón estándar del ERP:
- `ProductoPolicy`: `viewAny()`/`create()` nuevos; `view()`/`update()`/`delete()` ahora exigen `ownedBy() && can('permiso')`. `update()` gatea también `registrarIngreso()` y `enable()` (mismo permiso, `productos.editar`); `delete()` gatea `disable()` (`productos.gestionar`).
- `ProductoController::index()` gana `authorize('viewAny', Producto::class)`.
- Permiso `productos.eliminar` renombrado a `productos.gestionar` — nunca hay un DELETE físico, el nombre viejo no reflejaba el comportamiento real; los otros 8 módulos con esa misma acción ya usaban `gestionar`.

**Movimientos** — respeta el ledger append-only:
- `MovimientoPolicy`: `viewAny()`/`create()` nuevos, exigen `movimientos.ver`/`movimientos.crear`. `update()` (solo metadata descriptiva) queda **deliberadamente sin cambios** — no existe `movimientos.editar` en el catálogo; los permisos solo controlan quién crea o ve movimientos, nunca quién edita metadata, por decisión de negocio explícita.
- `MovimientoController::index()` gana `authorize('viewAny', Movimiento::class)`.

**Captura IA** — permiso separado por responsabilidad:
- `CapturaIAPolicy`: `viewAny()`/`create()` exigen `captura-ia.usar` (crear+ver); ability nueva `review()` exige `captura-ia.revisar` (corregir un detalle de baja confianza); `update()` (confirmar/descartar) exige `captura-ia.confirmar`.
- `CapturaIAController`: `foto()`/`voz()`/`fotoVoz()`/`index()` ganan `authorize()`; `actualizarDetalle()` cambia de `authorize('update', ...)` a `authorize('review', ...)`.
- Permiso nuevo `captura-ia.gestionar` sembrado para configuración futura, sin consumidor todavía — mismo patrón que `roles.gestionar`/`usuarios.invitar`.

**Tests nuevos** (403 para usuario de la misma empresa sin permiso; usuario autorizado sigue teniendo éxito; aislamiento cross-company sigue probado): `ProductoControllerTest`, `MovimientoControllerTest` (incluye un test dedicado que prueba que editar metadata NO requiere permiso, por diseño), `CapturaIAControllerTest`.

## Correcciones realizadas

- **Hallazgo de arquitectura: caché de permisos de Spatie no es team-aware.** Al escribir `CompanyIsolationHttpTest` (ambas empresas necesitan permisos reales simultáneamente por primera vez en la suite), 3 tests fallaban con 403 en vez de éxito, de forma intermitente según el orden de ejecución. Investigación profunda del código interno de `spatie/laravel-permission` (`PermissionRegistrar::getHydratedPermissionCollection()`) confirmó la causa raíz: la caché de permisos se construye una sola vez, de forma global, vía una query sobre `App\Models\Role` — que tiene `TenantScope` como global scope (Módulo 2). La primera vez que la caché se construye, "congela" únicamente los roles de la empresa que estaba activa en ese instante dentro de la relación `roles` de cada `Permission`; cualquier otra empresa que reutilice esa caché (mismo proceso, mismo cache store compartido) hereda permisos incorrectos hasta que la caché se invalide. No es un bug introducido por esta fase — es una interacción latente entre la caché global de Spatie y el `TenantScope` que ya existía, que solo se manifestó al ejercitar por primera vez el caso de dos empresas con permisos reales dentro del mismo proceso/request lifecycle.
  - **Fix aplicado**: `IdentifyTenant` (el único punto de la request que fija `TenantContext`/team-id de Spatie) ahora llama `PermissionRegistrar::forgetCachedPermissions()` en cada request, inmediatamente después de fijar el team. Esto garantiza que la caché se reconstruya siempre correctamente acotada al team de la request activa, antes de que cualquier chequeo de permiso ocurra. Costo aceptado: una query adicional por request (reconstruir la caché) en vez de aprovechar el TTL configurado — para el volumen de RC1, la correctitud multi-tenant pesa más que el ahorro.
  - Sin este fix, el bug es potencialmente explotable en producción bajo cualquier cache store con TTL > 0 (no solo el store `array` de testing): si la caché se construye durante una request de la Empresa A y otra request de la Empresa B llega antes de que expire, B podría heredar temporalmente permisos calculados sobre los roles de A.
- Descartadas antes de llegar al fix real: colisión de nombres de rol entre empresas (se corrigió usar nombres distintos en los tests como buena práctica, pero no era la causa raíz), timing de `forgetCachedPermissions()` dentro del propio test (no alcanzaba sin el fix en `IdentifyTenant`), permisos wildcard (confirmado deshabilitado en `config/permission.php`).

## Relaciones verificadas

- Ningún test de aislamiento multi-tenant pre-existente se rompió: `TenantScope` sigue siendo la primera barrera (404 antes de que la Policy evalúe nada) para los tres módulos.
- Colateral esperado y corregido: varios archivos de test que ya existían (`ProductoProveedorControllerTest`, `ProveedorControllerTest`, `Unit/Security/TenantScopeTest`, `Feature/Auth/AuthenticationTest`, `Feature/ErrorHandlingTest`) ejercitan endpoints de Producto/Captura IA (`registrarIngreso`, la doble autorización de `ProductoProveedorController` sobre el Producto padre, un request HTTP genérico de humo, y el manejo de errores del proveedor de IA) con usuarios que antes no necesitaban ningún permiso — ahora sí, porque `ProductoPolicy`/`CapturaIAPolicy` los exige. Corregido otorgando los permisos correspondientes en cada `setUp()`/test, sin relajar ninguna aserción de negocio.
- `ProductoProveedorControllerTest` confirma que el "doble chequeo por diseño" documentado en Fase 4.5 (`ProductoProveedorController` autoriza primero contra `ProductoPolicy` sobre el Producto padre, luego contra `ProductoProveedorPolicy` sobre la asociación) ahora exige permiso real en ambas capas — antes, la primera capa solo verificaba pertenencia.
- El rol "Administrador" de Demo Data (`RoleSeeder`, vía `Permission::all()`) recibe automáticamente el permiso renombrado y el nuevo `captura-ia.gestionar` sin cambios de código — sincronizado manualmente en la base de datos de desarrollo existente (`database/database.sqlite`) para no requerir un `migrate:fresh --seed` destructivo, mismo procedimiento que Fase 4.5.

## Cambios en Backend

**Archivos creados:**

- `backend/database/migrations/2026_08_02_100000_rename_productos_eliminar_permission.php` — rename de datos (`UPDATE permissions SET name = ...`), preserva `id` y todas las asociaciones existentes en `role_has_permissions`/`model_has_permissions`; `down()` reversible.
- `docs/05_IMPLEMENTATION/AuthorizationCompletion.md` (este documento).

**Archivos modificados:**

- `backend/database/seeders/PermissionSeeder.php` (`productos.eliminar` → `productos.gestionar`, `captura-ia.gestionar` nuevo).
- `backend/app/Policies/ProductoPolicy.php`, `MovimientoPolicy.php`, `CapturaIAPolicy.php` (`viewAny()` nuevo, permiso AND pertenencia; `CapturaIAPolicy` gana la ability `review()`).
- `backend/app/Http/Controllers/Api/ProductoController.php`, `MovimientoController.php`, `CapturaIAController.php` (`authorize('viewAny', ...)`/`authorize('create', ...)` agregados; `CapturaIAController::actualizarDetalle()` cambia a `authorize('review', ...)`).
- `backend/app/Http/Middleware/IdentifyTenant.php` (`forgetCachedPermissions()` en cada request — ver "Correcciones realizadas").
- `backend/tests/Feature/ProductoControllerTest.php`, `MovimientoControllerTest.php`, `CapturaIA/CapturaIAControllerTest.php` (rol/permisos en `setUp()`, tests nuevos de 403).
- `backend/tests/Feature/Security/CompanyIsolationHttpTest.php` (ambos `userA`/`userB` ganan permisos reales de Captura IA en `setUp()`, necesario para que el foco del archivo — aislamiento por empresa — se pueda seguir probando ahora que las acciones exigen permiso).
- `backend/tests/Feature/ProductoProveedorControllerTest.php`, `ProveedorControllerTest.php`, `Unit/Security/TenantScopeTest.php`, `Feature/Auth/AuthenticationTest.php`, `Feature/ErrorHandlingTest.php` (colateral — permisos de Producto/Captura IA otorgados donde el test ya ejercitaba esos endpoints; ver "Relaciones verificadas").

**Reutilizados sin cambios:** `CategoriaPolicy`, `MarcaPolicy`, `UnidadMedidaPolicy`, `StockPolicy`, `ProveedorPolicy`, `ProductoProveedorPolicy`, `UserPolicy` — fuera de alcance de esta fase (ya alineados en Fase 4.5, o deliberadamente sin segundo factor en el caso de `UserPolicy`).

## Cambios en Frontend

Ninguno en esta fase — Fase 4.6 es exclusivamente backend (Policy/permisos), igual que Fase 4.5. El demo user (rol Administrador) conserva acceso completo a las pantallas ya construidas sin ningún cambio visible, porque su rol recibe automáticamente todo el catálogo de permisos.

## Cambios en Base de Datos

- 1 permiso renombrado in-place (`productos.eliminar` → `productos.gestionar`, mismo `id`, migración de datos).
- 1 fila nueva en `permissions` (`captura-ia.gestionar`, vía `PermissionSeeder`).
- Catálogo total: 40 → 41 permisos.

## Documentación actualizada

- `docs/security/ROLES_MATRIX.md` — Gap 5 cerrado; catálogo de permisos, secciones 2/4/5/7 y el resumen de gaps actualizados; corregido de paso un error de conteo de Policies heredado de Fase 4.5 (el documento afirmaba "11 de 12"/"14 Policies", el conteo real verificado contra `app/Policies/*.php` es 10 Policies, 9 con permiso real tras esta fase).
- `docs/04_TECHNICAL_SPEC/API.md` — Captura IA (ya no remite al futuro Módulo 3 para el permiso, que ya está enforced), Productos y Movimientos ganan nota de permisos Fase 4.6.
- `docs/04_TECHNICAL_SPEC/Security.md` §4 y §11 — mismo error de conteo de Policies corregido; estado de RBAC actualizado a Fase 4.6.
- `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` — sección "Regla de Negocio — Autorización (RBAC)" actualizada: Productos/Movimientos/Captura IA ya no figuran como pendientes; se agrega la excepción de Movimientos (editar metadata sin permiso propio) como parte de la regla permanente.
- `docs/05_IMPLEMENTATION/AuthorizationCompletion.md` (este documento — nuevo).
- `CHANGELOG.md` — entrada nueva.

## Resultado de las pruebas

- **Backend:** `php artisan test` → **232/232 passing** (767 assertions; era 228/228 antes de esta fase — 4 tests nuevos netos: 1 por módulo en Producto/Movimiento/Captura IA + 1 test dedicado a la excepción de Movimientos, sin restar ningún test existente).
- **Frontend:** sin cambios de código; no aplica typecheck/build nuevo.
- **Verificación manual de la base de datos de desarrollo**: catálogo de permisos re-sembrado (41 permisos totales), ambos roles "Administrador" (Fidel OS Demo y Distribuidora Andina S.A.S.) resincronizados con el catálogo completo vía `PermissionRegistrar`/`syncPermissions()`, sin recurrir a `migrate:fresh`. Confirmado sin duplicados: `productos.eliminar` ya no existe, `productos.gestionar`/`captura-ia.gestionar` sí.

## Estado final del módulo

🟢 **Completo** — los tres módulos nombrados explícitamente por el propietario del proyecto (Productos, Movimientos, Captura IA) ya exigen pertenencia de empresa Y permiso, con las excepciones deliberadas documentadas (editar metadata de Movimientos, y `UserPolicy` que queda fuera de alcance de ambas fases por decisión previa de RC1 Fase 4).

Con esto, **la arquitectura de autorización de Fidel OS se considera completa**: todo módulo de negocio existente comparte exactamente el mismo modelo RBAC. No debería requerirse trabajo de autorización adicional salvo para módulos futuros (Roles, Auditoría, Módulo 6 de Invitaciones). `docs/security/ROLES_MATRIX.md` pasa a `Status: Approved — arquitectura de autorización completa`. La Fase 5 (Roles UI) puede comenzar.

## Control de versiones

- **Rama:** `main`.
- **Commit:** `89b69eb` — `feat(auth): Phase 4.6 - close authorization layer for Productos, Movimientos, Captura IA (RC1)`.

## Confirmación de push

✅ Ejecutado correctamente: `3e74bc6..89b69eb  main -> main` contra `origin` (GitHub).

## Estado del informe

☐ Pendiente
☐ Requiere correcciones
**☑ Aprobado — pendiente de confirmación del propietario del proyecto**
