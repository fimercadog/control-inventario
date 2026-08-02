# Informe Final — Fase 4.5: Authorization Alignment (RC1)

## Resumen del trabajo realizado

Los seis módulos que `docs/security/ROLES_MATRIX.md` identificó sin permiso propio (Categorías, Marcas, Unidades de Medida, Stock, Proveedores, Producto↔Proveedor) ganaron enforcement de permiso real en su Policy, combinado con AND sobre la pertenencia de empresa ya existente — nunca reemplazándola. Decisión confirmada explícitamente por el propietario del proyecto: **"Every business module in Fidel OS must follow the same authorization model. This is not optional."**

Esta unidad de trabajo es una fase de preparación (Fase 4.5), no una fase numerada del roadmap original de 8 — se insertó explícitamente antes de Fase 5 (Roles) para que el módulo de Roles tenga permisos reales de seis módulos más para administrar desde el día uno, en vez de solo `productos.*`/`movimientos.*`/`usuarios.*`.

## Funcionalidades implementadas

Por cada uno de los 6 módulos:

- 4 permisos nuevos en el catálogo (3 para Stock, sin `.crear`): `ver`, `crear`, `editar`, `gestionar` (activar/desactivar).
- Policy actualizada: `viewAny()` nuevo (gatea `index()`, no existía antes en ningún módulo del sistema), `view()`/`create()`/`update()`/`delete()` ahora exigen `ownedBy() && can('permiso')`.
- 6 tests nuevos por módulo (36 en total): usuario autorizado tiene éxito en cada acción (ya cubierto por los tests existentes, ahora con el rol/permiso explícito en `setUp()`), usuario de la misma empresa sin permiso recibe 403 en cada acción, aislamiento cross-company sigue probado (sin cambios, ya pasaba).

## Correcciones realizadas

- **Conflicto de Policy compartida (Stock/Productos)**: `StockController` reutilizaba `ProductoPolicy` (mismo modelo `Producto`, sin tabla propia). Añadir `stock.editar`/`stock.gestionar` dentro de `ProductoPolicy` habría gateado también las acciones de `ProductoController` con el permiso equivocado. Resuelto con una `StockPolicy` dedicada, invocada directamente por `StockController` (inyectada, vía un helper `authorizeStock()`) en vez del atajo `$this->authorize()`, que siempre resuelve por clase de modelo.
- **`docs/04_TECHNICAL_SPEC/API.md` tenía una subsección duplicada y contradictoria de Usuarios** (decía `PATCH` donde el código real usa `POST`) — retirada, la sección real ya escrita en la unidad de trabajo de Usuarios queda como única fuente.
- **`DELETE /roles/{id}` removido de `API.md`** — contradecía la decisión confirmada de que Roles nunca se elimina físicamente.
- **Duplicado accidental en `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md`**: el propietario del proyecto había pegado la misma sección "Regla de Negocio — Movimientos de Inventario" dos veces seguidas (edición propia, fuera de esta unidad de trabajo). Al insertar la nueva "Regla de Negocio — Autorización (RBAC)" en ese archivo (instrucción explícita de esta unidad de trabajo), la copia duplicada quedó reemplazada como efecto colateral de dónde se insertó el texto nuevo — la primera copia del bloque de Movimientos permanece intacta, solo se resolvió la duplicación.

## Relaciones verificadas

- Ningún test de aislamiento multi-tenant pre-existente se rompió: `TenantScope` sigue siendo la primera barrera (404 antes de que la Policy evalúe nada) para los 6 módulos, verificado explícitamente re-corriendo `test_company_b_cannot_*` de cada archivo.
- `Producto↔Proveedor` gana namespace propio (`producto-proveedor.*`), distinto de `proveedores.*` — verificado que un usuario con solo `proveedores.*` (sin `producto-proveedor.*`) recibe 403 al intentar gestionar la asociación, y viceversa (`test_a_user_can_list_products_for_a_supplier` necesitó explícitamente `proveedores.ver` además de `producto-proveedor.*`, porque esa acción vive en `ProveedorController::productos()`, no en `ProductoProveedorController`).
- El rol "Administrador" de Demo Data (`RoleSeeder`, `Permission::all()`) recibe automáticamente los 23 permisos nuevos sin cambios de código — sincronizado manualmente en la base de datos de desarrollo existente (`database/database.sqlite`) para no requerir un `migrate:fresh --seed` destructivo.

## Cambios en Backend

**Archivos creados:**

- `backend/app/Policies/StockPolicy.php`
- `backend/database/migrations/2026_08_02_090000_add_estado_to_roles_table.php`

**Archivos modificados:**

- `backend/database/seeders/PermissionSeeder.php` (23 permisos nuevos)
- `backend/app/Policies/CategoriaPolicy.php`, `MarcaPolicy.php`, `UnidadMedidaPolicy.php`, `ProveedorPolicy.php`, `ProductoProveedorPolicy.php` (`viewAny()` nuevo, permiso AND pertenencia en cada método)
- `backend/app/Http/Controllers/Api/CategoriaController.php`, `MarcaController.php`, `UnidadMedidaController.php`, `ProveedorController.php` (`authorize('viewAny', ...)` agregado a `index()`)
- `backend/app/Http/Controllers/Api/ProductoProveedorController.php` (`authorize('viewAny'/'create', ProductoProveedor::class)` agregado, además de los chequeos existentes sobre el Producto padre)
- `backend/app/Http/Controllers/Api/StockController.php` (usa `StockPolicy` inyectada vía `authorizeStock()`, no `$this->authorize()`)
- `backend/tests/Feature/CategoriaControllerTest.php`, `MarcaControllerTest.php`, `UnidadMedidaControllerTest.php`, `ProveedorControllerTest.php`, `ProductoProveedorControllerTest.php`, `StockControllerTest.php` (rol/permisos en `setUp()`, 1 test nuevo de 403 por archivo)

**Reutilizados sin cambios:** `ProductoPolicy`, `MovimientoPolicy`, `CapturaIAPolicy`, `UserPolicy` — deliberadamente fuera de alcance de esta fase (ver "Estado final").

## Cambios en Frontend

Ninguno en esta fase — Fase 4.5 es exclusivamente backend (Policy/permisos). El demo user (`test@example.com`, rol Administrador) conserva acceso completo a las pantallas ya construidas sin ningún cambio visible, porque su rol recibe automáticamente todo el catálogo de permisos.

## Cambios en Base de Datos

- 23 filas nuevas en `permissions` (vía `PermissionSeeder`).
- `roles.estado` (string, default `activo`) — columna nueva, sin dato existente que migrar (Roles como módulo todavía no se usa desde ninguna UI).

## Documentación actualizada

- `docs/security/ROLES_MATRIX.md` — Gaps 2, 3 y 4 cerrados; nuevo Gap 5 documentado explícitamente (Productos/Movimientos/Captura IA quedan con el mismo tipo de gap, fuera de alcance a propósito).
- `docs/04_TECHNICAL_SPEC/API.md` — secciones de Categorías/Marcas/Unidades de Medida/Stock actualizadas; nueva sección Proveedores/Producto↔Proveedor (no existía); sección duplicada de Usuarios retirada; `DELETE /roles/{id}` removido.
- `docs/04_TECHNICAL_SPEC/Security.md` §4 y §11 — corregidas puntualmente (el resto del documento sigue desactualizado respecto a los módulos de Fase 1 en adelante, fuera de alcance de esta unidad de trabajo, señalado explícitamente en el propio documento).
- `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` — nueva sección "Regla de Negocio — Autorización (RBAC)", agregada por instrucción explícita.
- `docs/05_IMPLEMENTATION/AuthorizationAlignment.md` (este documento — nuevo).
- `CHANGELOG.md` — entrada nueva.

## Resultado de las pruebas

- **Backend:** `php artisan test` → **228/228 passing** (738 assertions; era 222/222 antes de esta fase — 6 tests nuevos, uno por módulo).
- **Frontend:** sin cambios de código; no aplica typecheck/build nuevo.
- **Verificación manual de la base de datos de desarrollo**: catálogo de permisos re-sembrado (40 permisos totales), ambos roles "Administrador" (Empresa Fidel OS Demo y Distribuidora Andina) resincronizados con el catálogo completo vía `PermissionRegistrar`/`syncPermissions()`, sin recurrir a `migrate:fresh` (que habría borrado datos de demo ya poblados).

## Estado final del módulo

🟢 **Completo dentro del alcance confirmado** — los 6 módulos nombrados explícitamente por el propietario del proyecto ya exigen pertenencia de empresa Y permiso. Gap conocido y documentado, no cerrado por esta unidad de trabajo porque no estaba en su alcance: `ProductoPolicy`, `MovimientoPolicy`, `CapturaIAPolicy` siguen sin ese segundo factor — mismo tipo de brecha, pendiente de una decisión explícita separada del propietario del proyecto (¿una Fase 4.6, o se resuelve junto con el Módulo 3 de Authorization/RBAC del roadmap Auth?).

Con esto, **Fase 4.5 queda completa** y `docs/security/ROLES_MATRIX.md` pasa a `Status: Approved`. La Fase 5 (Roles) puede comenzar.

## Control de versiones

- **Rama:** `main`.
- **Commit:** _(pendiente — se completa en el commit de seguimiento tras el push)_.

## Confirmación de push

_(pendiente)_

## Estado del informe

☐ Pendiente
☐ Requiere correcciones
**☑ Aprobado — pendiente de confirmación del propietario del proyecto**
