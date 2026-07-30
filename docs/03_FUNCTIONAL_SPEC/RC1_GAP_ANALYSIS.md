# RC1 — Functional Module Inventory & Gap Analysis

**Fecha:** 2026-07-29
**Fase:** Functional Specification Review (implementación detenida por instrucción explícita hasta aprobación de este documento)
**Alcance:** Auditoría real del código actual (backend, frontend, rutas, políticas, tests, specs) contra los 14 módulos requeridos para RC1 y el Global CRUD Standard.

> Nota de transparencia: durante la implementación de FEATURE-009 (Movimientos CRUD) y antes de recibir la instrucción de detenerme, ya se habían aplicado dos migraciones (`add_estado_to_movimientos_table`, `add_stock_estado_to_productos_table`) y se creó un servicio sin usar (`app/Services/ProveedorResolver.php`). Son cambios aditivos e inertes — ninguna tabla/columna existente cambió de significado, ningún endpoint las consume todavía. Se dejan tal cual (revertirlas sería una acción destructiva no solicitada) y quedan listados como "ya aplicado, no consumido" en la tabla de abajo. No se escribió ni se tocó ningún controlador, ruta, recurso, request, policy ni test nuevo después de recibir la instrucción de detenerme.

---

## Paso 1 — Inventario Funcional de Módulos

| # | Módulo | En sidebar | Backend | Frontend | Rutas | Permisos | Tests | Status |
|---|--------|:---:|---|---|---|---|---|---|
| 1 | Dashboard | ✅ | ❌ (sin endpoint propio) | ✅ (mock data) | ❌ | N/A | ❌ | Built (frontend, datos simulados) |
| 2 | Captura IA | ✅ | ✅ `CapturaIAController` completo | ✅ | ✅ `v1/captura-ia/*` | ✅ `CapturaIAPolicy` (catálogo sembrado, sin enforcement de ruta) | ✅ `CapturaIAControllerTest` + `CompanyIsolationHttpTest` | Built — único bloqueo restante: prueba end-to-end con imágenes reales (ver TestExecutionReport.md) |
| 3 | Productos | ✅ | ⚠️ parcial — falta `disable`/`enable` | ⚠️ parcial — sin columna Status ni acción Activar/Desactivar en la lista | ⚠️ sin ruta de deshabilitar | ✅ `ProductoPolicy` (incluye `delete()`, sin ruta que lo use) | ✅ `ProductoControllerTest` | Built con gap de Logical Delete (ver abajo) |
| 4 | Categorías | ❌ | ⚠️ solo modelo/migración (`Categoria`), sin controller | ❌ | ❌ | ❌ | ❌ | **Missing** como módulo administrativo |
| 5 | Marcas | ❌ | ❌ (campo de texto libre `marca` en Producto, no es entidad) | ❌ | ❌ | ❌ | ❌ | **Missing** — no existe como entidad |
| 6 | Unidades de Medida | ❌ | ❌ (campo de texto libre `unidad_medida` en Producto, no es entidad) | ❌ | ❌ | ❌ | ❌ | **Missing** — no existe como entidad |
| 7 | Stock | ❌ | ❌ — solo `stock_actual/minimo/maximo` en Producto; migración `stock_estado` ya aplicada pero sin consumir; sin `StockController` | ❌ | ❌ | ❌ | ❌ | **Missing** — diseño ya acordado con el usuario esta sesión (ver nota abajo), sin implementar |
| 8 | Movimientos | ✅ | ⚠️ solo vía `InventoryService` (efecto secundario); migración `estado` ya aplicada pero sin consumir; **no existe `MovimientoController` ni rutas `/api/v1/movimientos`** | ⚠️ pantalla real pero 100% mock data (`lib/mock/data.ts`), sin Crear/Editar/Anular | ❌ (fuera de las rutas anidadas de Productos/Proveedores) | ✅ `MovimientoPolicy` (`view`/`delete`, sin `create`/`update`) | ⚠️ solo cobertura indirecta vía Productos/Proveedores | **Missing** como módulo CRUD independiente — mayor gap funcional después de Usuarios/Roles |
| 9 | Proveedores | ✅ | ✅ CRUD completo + disable/enable + tab de productos asociados | ✅ lista con columna Estado + Activar/Desactivar + Crear visible | ✅ | ✅ `ProveedorPolicy` | ✅ `ProveedorControllerTest`, `ProductoProveedorControllerTest` | **Built — cumple el estándar completo, es la referencia** |
| 10 | Clientes | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | **Missing** (`FUTURE/Customers.md`: "Planned") |
| 11 | Usuarios | ❌ | ❌ (solo `AuthController`: login/logout/me, sin CRUD administrativo) | ❌ | ❌ | ❌ | ❌ | **Missing** (`Users.md`: "Planned") |
| 12 | Roles | ❌ | ⚠️ motor Spatie + tablas de permisos migradas y sembradas, sin `RoleController` | ❌ | ❌ | ❌ | ❌ | **Missing** como módulo CRUD (`Roles.md`: "infraestructura sin UI de gestión") |
| 13 | Auditoría | ❌ | ⚠️ `AuditLog`/`AuditLogger` escriben registros reales desde todos los módulos, pero no hay endpoint de lectura | ❌ | ❌ | ❌ | ❌ | **Missing** como módulo de consulta (`FUTURE/Auditoria.md`: "Planned") |
| 14 | Configuración | ✅ (footer, no en el grupo principal) | ❌ sin persistencia propia | ✅ pantalla real, mayoría de campos deshabilitados/no funcionales | ❌ | N/A | ❌ | Built parcial (`Settings.md`: "sin persistencia backend propia") |

**Nota sobre Stock (módulo 7):** en esta misma sesión se acordó explícitamente con el usuario el diseño — Stock NO es una entidad independiente; es una vista de gestión sobre `Producto` (stock_actual/minimo/maximo) más nuevos movimientos correctivos vía `InventoryService`. "Eliminar" un registro de Stock es solo una deshabilitación administrativa: nunca reversa cantidades, nunca crea un movimiento automático. Este acuerdo de arquitectura ya está tomado; falta implementarlo.

---

## Paso 2 — Cumplimiento del Global CRUD Standard

Estándar requerido: **List, View, Create, Edit, Status, Logical Delete** (excepción: Usuarios → List, View, Create, Edit, Activate, Deactivate, Reset Password — **nunca Delete**).

| Módulo | List | View | Create | Edit | Status visible | Logical Delete |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Captura IA | ✅ | ✅ | N/A (se genera por IA) | ✅ (corregir detalle) | ✅ | ✅ (`descartar`) |
| Productos | ✅ | ✅ | ✅ | ✅ | ❌ **falta en lista y sin acción de UI** | ❌ **no existe endpoint ni botón** |
| Proveedores | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Producto↔Proveedor | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Movimientos | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Stock | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Categorías | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Marcas | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Unidades de Medida | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Clientes | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Usuarios (Create/Edit/Activate/Deactivate/Reset Password) | ❌ | ❌ | ❌ | ❌ | ❌ | N/A (Delete nunca aplica) |
| Roles | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Auditoría (solo lectura por diseño) | ❌ | ❌ | N/A | N/A | N/A | N/A |
| Configuración (no administrativo, no aplica CRUD) | N/A | N/A | N/A | N/A | N/A | N/A |

---

## Paso 3 — Consistencia de UI (botón "Crear" visible)

| Módulo | Botón Crear visible |
|---|:---:|
| Productos | ✅ "Nuevo producto" |
| Proveedores | ✅ "Nuevo Proveedor" |
| Producto↔Proveedor (tab) | ✅ "Asociar proveedor" |
| Movimientos | ❌ no existe |
| Stock | ❌ no existe (módulo no implementado) |
| Categorías / Marcas / Unidades de Medida | ❌ no existen como módulos |
| Clientes | ❌ no existe |
| Usuarios | ❌ no existe |
| Roles | ❌ no existe |

---

## Paso 4 — Validación del Sidebar

Sidebar actual (`frontend/components/app-sidebar.tsx`, `NAV_ITEMS`): **Dashboard, Captura IA, Productos, Proveedores, Movimientos** (5 de 8 mínimos solicitados en el mensaje previo del usuario; 5 de 14 si se cuenta el inventario completo de este paso). "Configuración" existe pero vive en el footer, fuera del grupo `NAV_ITEMS`.

**Faltan del sidebar:** Stock, Usuarios, Roles (bloqueantes explícitos de RC1) y, del inventario completo de 14, también Categorías, Marcas, Unidades de Medida, Clientes, Auditoría.

---

## Paso 5 — Reporte Final

### 1. Módulos existentes (código real, no mock)
Captura IA, Productos (parcial), Proveedores, Producto↔Proveedor.

### 2. Módulos faltantes
Stock, Movimientos (como CRUD independiente — hoy es un efecto secundario + pantalla mock), Categorías, Marcas, Unidades de Medida, Clientes, Usuarios, Roles (como CRUD — el motor de permisos sí existe), Auditoría (como módulo de consulta).

### 3. Operaciones CRUD faltantes
- **Productos:** Logical Delete (Activar/Desactivar) — ni endpoint ni botón.
- **Movimientos:** el módulo completo (Create/View/Edit-restringido/Anular) — no existe ningún endpoint `/api/v1/movimientos`.
- **Stock:** el módulo completo.
- **Usuarios, Roles, Categorías, Marcas, Unidades de Medida, Clientes:** el CRUD completo, no existen.

### 4. Entradas de menú faltantes
Stock, Usuarios, Roles (bloqueantes explícitos). Adicionalmente, si se decide construir los módulos completos: Categorías, Marcas, Unidades de Medida, Clientes, Auditoría.

### 5. Permisos faltantes
- `MovimientoPolicy`: falta `create()` y `update()` (hoy solo `view`/`delete`).
- `ProductoPolicy`: `delete()` ya existe pero no tiene ruta que lo invoque.
- No existen Policies para: Categoria, Marca, UnidadMedida, Cliente, User (administrativo), Role, AuditLog.
- Catálogo de permisos Spatie sembrado pero sin enforcement de ruta en ningún módulo todavía (`Roles.md` lo documenta explícitamente) — decisión pendiente de si RC1 requiere activarlo o sigue diferido.

### 6. Rutas faltantes
`v1/movimientos/*`, `v1/stock/*`, `v1/categorias/*`, `v1/marcas/*`, `v1/unidades-medida/*`, `v1/clientes/*`, `v1/usuarios/*` (administrativo, distinto de `v1/auth/*`), `v1/roles/*`, `v1/auditoria/*`, `POST/POST v1/productos/{producto}/deshabilitar` y `/habilitar`.

### 7. Tests faltantes
`MovimientoControllerTest`, `StockControllerTest`, `UserControllerTest`, `RoleControllerTest`, y tests de disable/enable para `ProductoControllerTest` una vez exista esa ruta. Ningún módulo nuevo tiene tests todavía porque ningún módulo nuevo tiene código todavía.

### 8. Recomendaciones

1. **Priorizar por bloqueo explícito de RC1 primero:** Stock, Movimientos (CRUD real), Usuarios, Roles — en ese orden, o el que el usuario prefiera, dado que Movimientos y Stock comparten la misma extensión de `InventoryService` (ajustes con signo) y conviene construirlos juntos.
2. **Cerrar el gap de Productos (Logical Delete) junto con Movimientos/Stock**, ya que es pequeño (una ruta + un botón, mismo patrón que Proveedores) y deja el módulo más maduro totalmente alineado al estándar.
3. **Decidir el alcance real de Categorías/Marcas/Unidades de Medida/Clientes antes de construirlos**: hoy Marca y Unidad de Medida son texto libre, no entidades — convertirlas en catálogos administrables es un cambio de modelo de datos (no solo una pantalla nueva) y afecta a `Producto` y a cualquier fixture/test existente. Recomiendo una decisión explícita de alcance antes de tocar código ahí.
4. **Auditoría de solo lectura** es la más barata de las faltantes (los datos ya existen y son reales) — un `AuditoriaController::index()` de solo lectura sería el gap más rápido de cerrar si se prioriza.
5. **Roles/permisos:** confirmar si RC1 requiere activar el enforcement de rutas o si se mantiene diferido (decisión ya tomada para FEATURE-006 en una ronda anterior de esta sesión: "sin enforcement de ruta todavía, admin asigna contraseña directamente") — de mantenerse, el módulo Roles es solo CRUD de catálogo sin cambiar el comportamiento de autorización existente.
6. **No se requiere revertir** las dos migraciones aditivas ya aplicadas (`movimientos.estado`, `productos.stock_estado`) — son inertes hasta que el módulo correspondiente las consuma; revertirlas y volver a crearlas sería trabajo redundante.

---

**Este documento no autoriza ninguna implementación por sí mismo.** Se detiene aquí a la espera de la aprobación/priorización del usuario, según lo solicitado explícitamente.
