# FidelOS — Functional Module Audit (Complete)

**Fecha:** 2026-07-30
**Alcance:** Auditoría exhaustiva, verificada contra código fuente real (backend, frontend, rutas, migraciones, tests, documentación) — no inferencia. Reemplaza/extiende `RC1_GAP_ANALYSIS.md` (2026-07-29) con 3 módulos adicionales (Reportes, Notificaciones, Perfil) y un checklist más granular por módulo.

> **Nota de transparencia crítica:** al momento de esta auditoría, el trabajo de Fase 1 (Categorías/Marcas/Unidades de Medida) está a medio camino. Se escribieron 3 migraciones nuevas (`create_marcas_table`, `create_unidades_medida_table`, `add_marca_id_and_unidad_medida_id_to_productos_table`) que **NO han sido ejecutadas** (`php artisan migrate:status` las marca `Pending`). También existen ya, sin aplicar todavía a ninguna ruta: modelos `Marca`/`UnidadMedida`, 3 Policies (`CategoriaPolicy`/`MarcaPolicy`/`UnidadMedidaPolicy`), 4 FormRequests, y un hook de frontend (`useCrudList`) sin consumidores todavía. Cero impacto funcional hoy: la base de datos real sigue teniendo `productos.marca`/`productos.unidad_medida` como columnas de texto, y ningún endpoint nuevo es alcanzable. Esta auditoría clasifica Categorías/Marcas/Unidades de Medida como **No Implementado** de cara al usuario, exactamente como pide la instrucción de no inferir por la existencia de archivos.

---

## Resumen General

| # | Módulo | Estado | % Completado |
|---|--------|:---:|---:|
| 1 | Dashboard | ⚫ Mock | 15% |
| 2 | Captura IA | 🟢 Completo | 90% |
| 3 | Productos | 🟢 Completo (corregido 2026-07-30) | 85% |
| 4 | Categorías | 🟢 Completo (implementado 2026-07-30) | 90% |
| 5 | Marcas | 🟢 Completo (implementado 2026-07-30) | 90% |
| 6 | Unidades de Medida | 🟢 Completo (implementado 2026-07-30) | 90% |
| 7 | Stock | 🟢 Completo (implementado 2026-07-30) | 90% |
| 8 | Movimientos | 🟢 Completo (implementado 2026-08-02) | 90% |
| 9 | Proveedores | 🟡 Parcial | 85% |
| 10 | Clientes | 🔴 No Implementado | 0% |
| 11 | Usuarios | 🟢 Completo (implementado 2026-08-02) | 85% |
| 12 | Roles | 🔴 No Implementado | 15% |
| 13 | Auditoría | 🔴 No Implementado | 20% |
| 14 | Configuración | 🟡 Parcial | 25% |
| 15 | Reportes | 🔴 No Implementado | 0% |
| 16 | Notificaciones | 🔴 No Implementado | 5% |
| 17 | Perfil | 🔴 No Implementado | 10% |

---

## Checklist General

- [x] Dashboard (mock)
- [x] Captura IA (completo)
- [x] Productos (completo, corregido 2026-07-30)
- [x] Categorías (completo, implementado 2026-07-30)
- [x] Marcas (completo, implementado 2026-07-30)
- [x] Unidades de Medida (completo, implementado 2026-07-30 — cierra Fase 1)
- [x] Stock (completo, implementado 2026-07-30 — cierra Fase 2)
- [x] Movimientos (completo, implementado 2026-08-02 — cierra Fase 3)
- [x] Proveedores (parcial — falta retrofit + verificación en navegador de tabs nuevas)
- [ ] Clientes
- [x] Usuarios (completo, implementado 2026-08-02 — cierra Fase 4)
- [ ] Roles
- [ ] Auditoría
- [x] Configuración (parcial)
- [ ] Reportes
- [ ] Notificaciones
- [ ] Perfil

---

## Detalle por módulo

### 1. Dashboard — ⚫ Mock

| Capa | Ítem | Estado |
|---|---|:---:|
| Frontend | Sidebar / Ruta / Página | ✔ |
| Frontend | Listado / detalle / crear / editar / eliminar lógico | ✘ (no aplica — es un dashboard, no un CRUD) |
| Frontend | Datos reales | ✘ — `frontend/app/(app)/dashboard/page.tsx` importa `getDashboardStats`, `getLowStockProducts`, `getRecentMovements` desde `frontend/lib/mock/dashboard.ts` |
| Backend | Cualquier ruta/controller | ✘ — cero rutas de dashboard en `backend/routes/api.php` |
| Tests | Unit/Feature/Browser | ✘ |
| Docs | Functional Spec | ✔ `Dashboard.md` (`Status: Built (con datos simulados / mock data)`) |

**Funcionalidades:** ✘ Todo (pantalla 100% decorativa sobre datos falsos).

### 2. Captura IA — 🟢 Completo

| Capa | Ítem | Estado |
|---|---|:---:|
| Backend | Migración/Modelo/Relaciones/Service/Controller/FormRequest/Policy | ✔ (`CapturaIAController`, `CapturaIAPolicy`, servicios OpenAI, `ApplyInventoryMovementAction`) |
| Backend | API REST | ✔ 8 endpoints (`foto`, `voz`, `foto-voz`, index, show, actualizarDetalle, confirmar, descartar) |
| DB | Tabla/Índices/FK | ✔ `capturas_ia`, `capturas_ia_detalle` |
| Frontend | Sidebar/Rutas/Páginas/Crear/Editar/Loading/Errores | ✔ |
| Tests | Unit/Feature | ✔ `CapturaIAControllerTest`, `CompanyIsolationHttpTest`, `ArchitectureReviewTest`, `ProductServiceMatchingTest`, `ApplyInventoryMovementActionTest` |
| Tests | Browser (real, con imágenes reales) | ✘ **bloqueado** — las 2 imágenes de factura/recepción prometidas nunca aparecieron en el repo pese a múltiples búsquedas |
| Docs | Functional/Technical/API/Test | ✔ `AI_Capture.md`, `03_FUNCTIONAL_SPEC/AI_Capture.md`, `TestExecutionReport.md` |

**Funcionalidades:**
✔ Captura por foto ✔ Captura por voz ✔ Captura foto+voz ✔ Matching de identidad de producto ✔ Confirmar manual ✔ Descartar ✔ Corrección de detalle ✔ Idempotencia ✔ Eventos de dominio ✔ Auditoría real ✘ Validación end-to-end con imágenes reales (bloqueada, no por código)

### 3. Productos — 🟢 Completo (corregido 2026-07-30)

| Capa | Ítem | Estado |
|---|---|:---:|
| Backend | Migración/Modelo/Service/Controller/FormRequest/Policy | ✔ |
| Backend | Logical Delete (disable/enable) | ✔ corregido 2026-07-30 — mismo patrón que Proveedores, auditado |
| Frontend | Sidebar/Ruta/Listado/Detalle/Crear/Editar | ✔ |
| Frontend | Columna Estado en listado / acción Activar-Desactivar | ✔ corregido 2026-07-30 — badge de color + `ConfirmDialog` |
| Frontend | Búsqueda | ✔ (cliente, por nombre/marca) |
| Frontend | Filtros | ✔ (categoría, estado) |
| Frontend | Paginación | ✘ (backend pagina a 100, frontend no expone pager — bug real, ver `DemoDataAudit.md`, fuera de alcance de esta corrección) |
| Frontend | Notificaciones (toast) / manejo de errores / loading | ✔ |
| Frontend | Refresco automático (Global UI Standard) | ✔ corregido 2026-07-30 — retrofit a `useCrudList` |
| Frontend | Selector de Categoría en "Nuevo Producto" | ✘ (ausente del diálogo — depende de que exista `CategoriaController`, todavía no construido) |
| Frontend | Selectores de Marca/Unidad de Medida basados en catálogo | ⚠️ siguen siendo texto libre por diseño (quick-create, `marca_nuevo`/`unidad_medida_nuevo`) — pero ahora correctamente conectados al catálogo real (antes se descartaban silenciosamente, bug corregido 2026-07-30) |
| Tests | Feature | ✔ `ProductoControllerTest` (22 casos, incluye disable/enable/filtro/auditoría/aislamiento) |
| Tests | Browser | ✔ verificado en navegador real: badge, filtro, eliminar/habilitar con confirmación, refresco automático, campo Stock deshabilitado en Crear y Editar |
| Docs | Functional Spec | ✔ `Products.md` (Adenda 3) |

**Funcionalidades:**
✔ Crear ✔ Editar ✔ Buscar ✔ Filtrar por categoría/estado ✔ Ver detalle ✔ Asociar proveedor (FEATURE-005) ✔ Registrar ingreso manual ✔ Ver movimientos ✔ Logical Delete/Status (corregido 2026-07-30) ✘ Imagen (campo existe, sin UI de carga) ✘ Kardex dedicado ✘ Auditoría visible en UI (se escribe, no se muestra) ✘ Paginación real (bug pre-existente, documentado en `DemoDataAudit.md`)

### 4. Categorías — 🟢 Completo (implementado 2026-07-30)

| Capa | Ítem | Estado |
|---|---|:---:|
| Backend | Migración/Modelo | ✔ (ya existían desde la Fase 3 original) |
| Backend | Policy/FormRequest | ✔ |
| Backend | Resource/Controller/Rutas | ✔ `CategoriaController` (index/store/show/update/disable/enable/productos), mismo patrón que Proveedores |
| Frontend | Listado (búsqueda, filtro estado, badge, paginación heredada) | ✔ |
| Frontend | Crear/Editar/Ver detalle | ✔ |
| Frontend | Logical Delete + Activar/Desactivar con confirmación | ✔ |
| Frontend | Refresco automático (`useCrudList`) | ✔ |
| Frontend | Pestaña "Productos" en la ficha (relación bidireccional) | ✔ |
| Frontend | Selector de Categoría en el formulario de Producto | ✘ (gap pre-existente, no cerrado por esta unidad — ver `Categories.md`) |
| Tests | Feature | ✔ `CategoriaControllerTest` (12 casos, incluye integridad referencial con Productos) |
| Tests | Browser | ✔ verificado en navegador real: CRUD, filtros, confirmación, relación con Productos, responsive |
| Docs | Functional/Technical/Implementation | ✔ `Categories.md` (Built), `API.md`, `docs/05_IMPLEMENTATION/CategoriasModule.md` |

**Funcionalidades:** ✔ Crear ✔ Editar ✔ Ver detalle ✔ Buscar ✔ Filtrar por estado ✔ Logical Delete/Activar-Desactivar con confirmación ✔ Ver productos asociados (pestaña) ✘ Selector de categoría en el formulario de Producto (gap conocido, documentado)

### 5. Marcas — 🟢 Completo (implementado 2026-07-30)

| Capa | Ítem | Estado |
|---|---|:---:|
| Backend | Migración/Modelo | ✔ (ya existían desde RC1 Fase 1 — Catalog Normalization) |
| Backend | Policy/FormRequest | ✔ |
| Backend | Resource/Controller/Rutas | ✔ `MarcaController` (index/store/show/update/disable/enable/productos), mismo patrón que Categorías/Proveedores |
| Frontend | Listado (búsqueda, filtro estado, badge, paginación heredada) | ✔ |
| Frontend | Crear/Editar/Ver detalle | ✔ |
| Frontend | Logical Delete + Activar/Desactivar con confirmación | ✔ |
| Frontend | Refresco automático (`useCrudList`) | ✔ |
| Frontend | Pestaña "Productos" en la ficha (relación bidireccional) | ✔ |
| Frontend | Selector de Marca en el formulario de Producto | ⚠️ existe un input de texto libre (`marca_nuevo`, find-or-create), no un `Select` real con las marcas ya existentes — gap pre-existente, no cerrado por esta unidad (ver `Brands.md`) |
| Tests | Feature | ✔ `MarcaControllerTest` (13 casos, incluye integridad referencial con Productos) |
| Tests | Browser | ✔ verificado en navegador real: CRUD, filtros, confirmación, relación con Productos, responsive |
| Docs | Functional/Technical/Implementation | ✔ `Brands.md` (Built), `API.md`, `docs/05_IMPLEMENTATION/MarcasModule.md` |

**Funcionalidades:** ✔ Crear ✔ Editar ✔ Ver detalle ✔ Buscar ✔ Filtrar por estado ✔ Logical Delete/Activar-Desactivar con confirmación ✔ Ver productos asociados (pestaña) ✘ Selector de marca (`Select` de catálogo) en el formulario de Producto (gap conocido, documentado)

### 6. Unidades de Medida — 🟢 Completo (implementado 2026-07-30)

| Capa | Ítem | Estado |
|---|---|:---:|
| Backend | Migración/Modelo | ✔ (ya existían desde RC1 Fase 1 — Catalog Normalization) |
| Backend | Policy/FormRequest | ✔ |
| Backend | Resource/Controller/Rutas | ✔ `UnidadMedidaController` (index/store/show/update/disable/enable/productos), mismo patrón que Categorías/Marcas/Proveedores |
| Frontend | Listado (búsqueda, filtro estado, badge, paginación heredada) | ✔ |
| Frontend | Crear/Editar/Ver detalle | ✔ |
| Frontend | Logical Delete + Activar/Desactivar con confirmación | ✔ |
| Frontend | Refresco automático (`useCrudList`) | ✔ |
| Frontend | Pestaña "Productos" en la ficha (relación bidireccional) | ✔ |
| Frontend | Selector de Unidad de Medida en el formulario de Producto | ⚠️ existe un input de texto libre (`unidad_medida_nuevo`, find-or-create), no un `Select` real con las unidades ya existentes — gap pre-existente, no cerrado por esta unidad (ver `UnitsOfMeasure.md`) |
| Tests | Feature | ✔ `UnidadMedidaControllerTest` (13 casos, incluye integridad referencial con Productos) |
| Tests | Browser | ✔ verificado en navegador real: CRUD, filtros, confirmación, relación con Productos, responsive |
| Docs | Functional/Technical/Implementation | ✔ `UnitsOfMeasure.md` (Built), `API.md`, `docs/05_IMPLEMENTATION/UnidadesMedidaModule.md` |

**Funcionalidades:** ✔ Crear ✔ Editar ✔ Ver detalle ✔ Buscar ✔ Filtrar por estado ✔ Logical Delete/Activar-Desactivar con confirmación ✔ Ver productos asociados (pestaña) ✘ Selector de unidad (`Select` de catálogo) en el formulario de Producto (gap conocido, documentado)

Con esta unidad de trabajo se cierra por completo la **Fase 1 (Catalog Normalization)** del roadmap de 8 fases aprobado: Categorías, Marcas y Unidades de Medida ahora tienen el mismo nivel funcional que Productos/Proveedores.

### 7. Stock — 🟢 Completo (implementado 2026-07-30)

Stock **no es una entidad independiente** — no existe tabla ni modelo `Stock`; este módulo es una vista/editor especializado sobre los campos de stock que ya viven en `Producto`. Antes de escribir código, se confirmó explícitamente con el propietario del proyecto el alcance exacto de "Crear"/"Editar" (el brief genérico de CRUD entraba en conflicto directo con la regla de negocio ya acordada el 2026-07-29) — ver `docs/03_FUNCTIONAL_SPEC/Stock.md`, sección "Decisiones confirmadas".

| Capa | Ítem | Estado |
|---|---|:---:|
| Backend | Migración `stock_estado` en `productos` | ✔ ya existía, ahora activa |
| Backend | Resource/Controller/Rutas | ✔ `StockController` (index/show/update/disable/enable) sobre `Producto`, reutiliza `ProductoPolicy` — **sin `store()` a propósito**, no existe "crear un Stock" |
| Backend | `stock_estado` agregado a `$fillable` de `Producto` | ✔ (ningún FormRequest de Producto lo declara — solo `StockController` lo escribe) |
| Frontend | Listado (búsqueda, filtro estado, filtro "bajo mínimo", badge) | ✔ — **sin botón "Nuevo"** a propósito |
| Frontend | Ver detalle / Editar (solo `stock_minimo`/`stock_maximo`, `stock_actual` de solo lectura) | ✔ |
| Frontend | Logical Delete + Activar/Desactivar con confirmación (solo `stock_estado`, nunca cantidad ni `productos.estado`) | ✔ |
| Frontend | Refresco automático (`useCrudList`) | ✔ |
| Frontend | Enlace directo a Ficha de Producto (para Movimientos/ajustes reales) | ✔ |
| Tests | Feature | ✔ `StockControllerTest` (12 casos: sin endpoint de creación, umbrales, rechazo silencioso de `stock_actual`/`estado` en el payload, disable/enable sin tocar cantidad ni catálogo ni generar movimientos, aislamiento multi-tenant) |
| Tests | Browser | ✔ verificado en navegador real: sin botón de creación, solo-lectura de stock actual, edición de umbrales persistente, deshabilitar/habilitar, verificación cruzada de que el ciclo no afecta el producto en `/productos/{id}` ni su conteo de Movimientos, responsive |
| Docs | Functional/Technical/Implementation | ✔ `Stock.md` (nuevo, Built), `API.md`, `docs/05_IMPLEMENTATION/StockModule.md` |

**Funcionalidades:** ✔ Listar (búsqueda, filtro estado, filtro bajo mínimo) ✔ Ver detalle ✔ Editar umbrales (mínimo/máximo) ✔ Logical Delete/Activar-Desactivar administrativo con confirmación ✘ Crear (deliberadamente no aplica) ✘ `stock_actual` editable desde aquí (deliberadamente no aplica — vive en Movimientos)

Con esto se cierra la **Fase 2** del roadmap de 8 fases aprobado.

### 8. Movimientos — 🟢 Completo (implementado 2026-08-02)

| Capa | Ítem | Estado |
| --- | --- | :---: |
| Backend | Modelo/Migración | ✔ (`movimientos`; `estado` sigue **inerte** a propósito — un movimiento nunca se desactiva) |
| Backend | Policy | ✔ `MovimientoPolicy` con `view`/`create`/`update`/`delete` — `delete()` sigue sin invocarse desde ningún controller, a propósito |
| Backend | Controller/Rutas propias (`/api/v1/movimientos`) | ✔ `MovimientoController` (index/show/store/update, sin `destroy`) |
| Backend | Único punto de escritura real | `InventoryService::registrarMovimiento()`, invocado desde Captura IA, `POST /productos/{id}/movimientos` (Entrada), y ahora también `MovimientoController::store()` (Entrada/Salida/Ajuste) |
| Frontend | Pantalla `/movimientos` | ✔ línea de tiempo real sobre `GET /api/v1/movimientos`, con paginación, búsqueda y filtro por tipo reales |
| Frontend | Crear/Editar/Eliminar lógico | ✔ Crear (Entrada/Salida/Ajuste) y Editar (solo metadata descriptiva) ✘ Eliminar/Logical Delete (deliberadamente no existe — ledger append-only) |
| Tests | Feature | ✔ `MovimientoControllerTest` (17 casos: creación de los 3 tipos, rechazo de stock negativo, `direccion` solo para Ajuste, proveedor solo para Entrada, listar/filtrar, editar metadata sin tocar campos contables, ausencia de endpoint de eliminar, aislamiento multi-tenant) |
| Tests | Browser | ✔ verificado en navegador real: login, listado con datos reales (miles de movimientos), paginación real (Página 2 de N), ficha con campos contables de solo lectura y sin botón Eliminar, edición de metadata persistente, responsive, sidebar |
| Docs | Functional Spec | ✔ `Movements.md`, reescrito — Status Built, regla de inmutabilidad como decisión de arquitectura |

**Funcionalidades:** ✔ Registro automático vía Captura IA ✔ Registro manual de Entrada/Salida/Ajuste desde el módulo global ✔ Ver listado real (paginado, filtrable) ✔ Ver detalle ✔ Editar metadata descriptiva ✘ Eliminar/Anular/Logical Delete (deliberadamente no aplica — ver nota de arquitectura en `Movements.md`) ✘ Crear Conteo/Transferencia/Compra/Venta/Producción/Devolución/Consumo/Corrección (tipos no generables todavía, fuera de alcance de esta fase)

Con esto se cierra la **Fase 3** del roadmap de 8 fases aprobado.

### 9. Proveedores — 🟡 Parcial

| Capa | Ítem | Estado |
|---|---|:---:|
| Backend | Migración/Modelo/Service/Controller/FormRequest/Policy | ✔ completo |
| Backend | Producto↔Proveedor (FEATURE-005) | ✔ completo |
| Frontend | Sidebar/Ruta/Listado/Detalle/Crear/Editar/Status/Logical Delete/Búsqueda/Filtros/Notificaciones/Loading/Errores | ✔ todo presente |
| Frontend | Paginación | ⚠️ backend pagina (`meta.total` mostrado), sin controles de página en UI |
| Frontend | Refresco automático (Global UI Standard) | ✘ — todavía parchea estado local a mano (`setProveedores((prev) => ...)`), pendiente retrofit a `useCrudList` |
| Tests | Feature | ✔ `ProveedorControllerTest` (13) + `ProductoProveedorControllerTest` (14) = 27 casos, todos en verde |
| Tests | Browser | ⚠️ verificado para el CRUD original; **no verificado todavía** para las pestañas nuevas de FEATURE-005 (Proveedores en ficha de Producto / Productos en ficha de Proveedor) |
| Docs | Functional Spec | ⚠️ `Suppliers.md` real vive en `docs/03_FUNCTIONAL_SPEC/FUTURE/Suppliers.md`, todavía marcado `Status: Planned` — **nunca se movió/actualizó** pese a estar construido y probado |

**Funcionalidades:**
✔ Crear ✔ Editar ✔ Buscar (nombre/NIT/contacto) ✔ Filtrar por estado ✔ Ver detalle ✔ Activar/Desactivar ✔ Asociar productos (tab) ✔ Proveedor principal ✔ Precio de compra / código de proveedor ✘ Refresco automático estandarizado ✘ Verificación en navegador de las pestañas nuevas ✘ Documento de spec actualizado a `Built`

### 10. Clientes — 🔴 No Implementado

Cero código en ninguna capa. `FUTURE/Customers.md`: `Status: Planned — not yet implemented`.

### 11. Usuarios — 🟢 Completo (implementado 2026-08-02)

| Capa | Ítem | Estado |
| --- | --- | :---: |
| Backend | Controller/Rutas (`/api/v1/usuarios`) | ✔ `UserController` (index/show/activar/desactivar, sin `store`/`destroy`) |
| Backend | Policy | ✔ `UserPolicy` (view/update, pertenencia de empresa — sin `TenantScope` automático en `User`, filtrado manual) |
| Backend | Guardas de negocio | ✔ nunca la propia cuenta, nunca el último usuario activo con `usuarios.editar` — ambas 409, con test dedicado |
| Backend | Revocación de sesiones al desactivar | ✔ `RefreshTokenServiceInterface::revokeAllForUser()` |
| Frontend | Pantalla `/usuarios` | ✔ listado real, búsqueda, filtro de estado, paginación, badge de estado |
| Frontend | Ficha `/usuarios/{id}` | ✔ solo lectura (Actividad + Trazabilidad), acción Activar/Desactivar |
| Frontend | Crear/Editar | ✘ deliberadamente no existen — creación es Módulo 6 (Invitaciones, sin construir), edición de nombre/email pertenece a Perfil |
| Tests | Feature | ✔ `UserControllerTest` (14 casos: listar/buscar/filtrar por empresa, ver detalle con rol, activar, desactivar con auditoría y revocación de sesiones, auto-desactivación rechazada, último admin rechazado, desactivar permitido con otro admin disponible, Platform Admin nunca listado, sin crear/eliminar, aislamiento multi-tenant) |
| Tests | Browser | ✔ verificado en navegador real: login, listado con datos reales de Demo Data (14 usuarios, roles reales), badge de estado, desactivar/reactivar real, fila propia marcada "(tú)" con acción de desactivar deshabilitada, ficha de detalle, responsive, sidebar completo |
| Docs | Functional Spec | ✔ `Users.md` — de "Planned" con preguntas sin resolver a "Approved", con las dos decisiones de negocio (auto-desactivación, último admin) confirmadas explícitamente antes de escribir código (Golden Rule, `AGENTS.md`) |

**Funcionalidades:** ✔ Listar (búsqueda, filtro de estado, filtro de rol vía API) ✔ Ver detalle ✔ Activar ✔ Desactivar (con las dos guardas de negocio) ✘ Crear (Módulo 6, sin construir) ✘ Editar nombre/email/rol (fuera de alcance por diseño — ver `Users.md`) ✘ Eliminar (nunca existe para Usuarios)

Con esto se cierra la **Fase 4** del roadmap de 8 fases aprobado. Nota heredada sin cambios: Módulo 3 (Authorization/RBAC — middleware de permisos granular) sigue sin construir; este módulo usa el mismo nivel de enforcement (aislamiento por empresa real, catálogo de permisos sembrado pero no enforced por ruta) que el resto del roadmap RC1.

### 12. Roles — 🔴 No Implementado (como módulo)

| Capa | Ítem | Estado |
|---|---|:---:|
| Backend | Motor Spatie + `Role` (subclase con TenantScope) | ✔ |
| Backend | Tablas de permisos migradas y sembradas (`PermissionSeeder`) | ✔ |
| Backend | `RoleController`/rutas | ✘ |
| Frontend | Todo | ✘ |
| Docs | `Roles.md` | ✔ honesto: "infraestructura... sin enforcement por ruta ni UI de gestión todavía" |

### 13. Auditoría — 🔴 No Implementado (como módulo de consulta)

| Capa | Ítem | Estado |
|---|---|:---:|
| Backend | `AuditLog` + `AuditLogger` (escritura real) | ✔ — usado por Captura IA, Productos, Proveedores, Producto-Proveedor |
| Backend | Endpoint de lectura (`GET /auditoria`) | ✘ — no existe |
| Frontend | Todo | ✘ |
| Docs | `FUTURE/Auditoria.md` | ✔ `Status: Planned` |

### 14. Configuración — 🟡 Parcial

| Capa | Ítem | Estado |
|---|---|:---:|
| Frontend | Página real, sección Cuenta (nombre/email/avatar/logout) | ✔ funcional, lee Redux real |
| Frontend | Logout | ✔ funciona de extremo a extremo |
| Frontend | Sección Empresa (nombre, zona horaria) | ✘ hardcoded + `disabled` — decorativo |
| Frontend | Umbral de confianza Captura IA | ✘ estático (85%), no editable |
| Frontend | Tema (claro/oscuro/sistema) | ✔ funciona, pero solo client-side (`next-themes`), sin persistir en backend |
| Backend | Cualquier endpoint de persistencia | ✘ — ninguno |
| Docs | `Settings.md` | ✔ honesto: "sin persistencia backend propia" |

**Funcionalidades:** ✔ Ver info de cuenta ✔ Cerrar sesión ✔ Cambiar tema (solo visual) ✘ Editar nombre/avatar ✘ Editar zona horaria/empresa ✘ Configurar umbral de Captura IA

### 15. Reportes — 🔴 No Implementado

Cero código. `FUTURE/Reports.md` lo confirma explícitamente: "no existe ningún endpoint ni pantalla de reportes en el sistema real."

### 16. Notificaciones — 🔴 No Implementado (como módulo)

No existe un centro de notificaciones persistente (sin tabla, sin controller, sin campanita/inbox). Lo único presente es retroalimentación transitoria vía toast (`sonner`), usada consistentemente en toda la app para confirmar acciones — cumple la necesidad de "avisar al usuario" en el momento, pero no es un módulo de notificaciones (sin historial, sin marcar leído/no leído, sin persistencia).

### 17. Perfil — 🔴 No Implementado (como módulo dedicado)

No existe `ProfileController`, no existe ruta `/perfil` ni `PATCH` de ningún campo de usuario, no existe página dedicada. El único endpoint relacionado es `GET /auth/me` (solo lectura). La información de cuenta que sí se ve hoy vive dentro de Configuración, no en un módulo de Perfil propio, y no es editable.

---

## Estadísticas

- **Total módulos definidos:** 17
- **Completos (🟢):** 8 (Captura IA, Productos, Categorías, Marcas, Unidades de Medida, Stock, Movimientos, Usuarios — Usuarios implementado 2026-08-02, cierra Fase 4 completa)
- **Parciales (🟡):** 2 (Proveedores, Configuración)
- **Mock (⚫):** 1 (Dashboard)
- **No implementados (🔴):** 6 (Clientes, Roles, Auditoría, Reportes, Notificaciones, Perfil)
- **Porcentaje real de avance del proyecto** (promedio simple de la columna % Completado de los 17 módulos, actualizado tras Usuarios): **~52%**

---

## Gaps

### Módulos faltantes
Clientes, Roles (como CRUD), Auditoría (como módulo de consulta), Reportes, Notificaciones, Perfil. (Categorías, Marcas, Unidades de Medida — Fase 1 —, Stock — Fase 2 —, Movimientos — Fase 3 — y Usuarios — Fase 4 — ya se cerraron.)

### Funcionalidades faltantes
Logical Delete de Productos (✔ ya corregido 2026-07-30); refresco automático estandarizado en Productos/Proveedores (`useCrudList` aún sin retrofit en Proveedores); selector de catálogo real (`Select` + "+ Crear nuevo") para categoría/marca/unidad en el formulario de Producto — hoy solo existen inputs de texto libre find-or-create para marca/unidad y ningún campo de categoría; persistencia real de Configuración. (CRUD de Movimientos — Fase 3 — y de Usuarios — Fase 4 — ya se cerraron, ambos adaptados a su naturaleza propia: Movimientos es un ledger append-only sin Eliminar/Desactivar; Usuarios es Listar/Ver/Activar/Desactivar sin Crear — ambas decisiones de arquitectura confirmadas, no gaps.)

### APIs faltantes
`/roles`, `/auditoria`, `/reportes`, `/perfil`. (`/categorias`, `/marcas`, `/unidades-medida`, `/stock`, `/movimientos` y `/usuarios` ya se implementaron — Fases 1 a 4 completas.)

### Pantallas faltantes
`/clientes`, `/roles`, `/auditoria`, `/reportes`, `/perfil`. (`/categorias`, `/marcas`, `/unidades-medida`, `/stock`, `/movimientos` y `/usuarios` ya se implementaron.)

### CRUD incompletos
Configuración (no es CRUD real, es un formulario decorativo). (Movimientos y Usuarios ya no aplican aquí: sus alcances reducidos — "Listar/Ver/Crear" para Movimientos, "Listar/Ver/Activar/Desactivar" para Usuarios — son decisiones de arquitectura confirmadas, no gaps — ver `Movements.md`/`Users.md`.)

### Permisos faltantes
No existen Policies para Cliente, Role, AuditLog, Reporte. (Categoria/Marca/UnidadMedida ya tienen Policy + controller propio; Stock reutiliza `ProductoPolicy`; Usuarios tiene `UserPolicy` propia desde el 2026-08-02.)

### Relaciones faltantes
Ninguna pendiente en Fases 1-4 — `productos.categoria_id`/`marca_id`/`unidad_medida_id`/`stock_estado` aplicadas, en uso, y expuestas por sus respectivos controllers.

### Tests faltantes
`RoleControllerTest`, `AuditoriaControllerTest`, y toda prueba de navegador para Reportes/Perfil/Notificaciones (no aplica, no existen). (`CategoriaControllerTest`, `MarcaControllerTest`, `UnidadMedidaControllerTest`, `StockControllerTest`, `MovimientoControllerTest` y `UserControllerTest` ya existen.)

### Documentación faltante
`Suppliers.md` real sigue en `FUTURE/` marcado `Planned` pese a estar construido — nunca se actualizó su estado. `TestExecutionReport.md` no refleja FEATURE-005/008 todavía. (`Stock.md` ya se escribió el 2026-07-30, cerrando el gap que esta misma sección señalaba.)

---

**Este documento no autoriza ninguna implementación nueva por sí mismo — es un inventario, no una aprobación de alcance.**
