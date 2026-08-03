# Productos

**Status: Built — cumple el Global CRUD Standard completo (List/View/Create/Edit/Status/Logical Delete)**

> Verificado contra `backend/app/Http/Controllers/Api/ProductoController.php`, `backend/app/Models/Producto.php`, `backend/app/Services/ProductService.php`, `frontend/app/(app)/productos/page.tsx`, `frontend/components/product-detail-screen.tsx`. Esta sección estuvo desactualizada por varias fases de esta sesión (describía el estado previo a FEATURE-001/002: sin `ProductoController`, sin rutas, datos mock) — corregida 2026-07-30 junto con la corrección de auditoría funcional que agregó Logical Delete y la columna Estado (ver "Adenda 3" al final de este documento). `marca`/`unidad_medida` ya no son texto libre — son catálogos reales (`Marca`/`UnidadMedida`, RC1 Fase 1) referenciados por `marca_id`/`unidad_medida_id`.

## Purpose

Mantener el catálogo de productos de cada empresa: qué existe, en qué presentación, con qué costo/precio de referencia, y su stock actual — como base para Captura IA e Inventario. Hoy el catálogo solo se puebla indirectamente (vía Captura IA), no mediante una pantalla dedicada de alta manual.

## Business Flow

1. Un producto nace únicamente cuando `ProductService::crear()` lo da de alta — hoy eso ocurre solo desde el pipeline de Captura IA, cuando la IA detecta un producto que no coincide con ninguno existente (`ProductService::buscarCoincidencia()`).
2. El producto se crea con `stock_actual = 0`; el stock se mueve exclusivamente después, vía `InventoryService::registrarMovimiento()`.
3. El usuario puede consultar el catálogo en `/productos` (hoy con datos de ejemplo, no reales) — buscar por nombre/marca y filtrar por categoría.
4. Edición manual de un producto (cambiar nombre, precio, stock mínimo/máximo, etc.): **no existe** — el menú de acciones de la tabla tiene una opción "Editar" que no está conectada a ningún formulario ni endpoint todavía.

## Actors

- **Usuario de empresa** con permiso `productos.ver` (catálogo sembrado, sin enforcement todavía) para consultar el listado.
- **Pipeline de Captura IA** (actor técnico) como único creador real de productos hoy.

## Screens

- **`/productos`** (`frontend/app/(app)/productos/page.tsx`): tabla con búsqueda por nombre/marca, filtro por categoría, columnas Producto (con miniatura de color), Categoría, Presentación, Stock (resaltado en rojo si está por debajo del mínimo), Precio, y un menú de acciones (`Editar`, `Ver movimientos`). **Sección desactualizada** — ver Adenda 1/2/3 más abajo para el estado real ya construido (Ficha de Producto, creación/edición, ingreso manual, Logical Delete). Global UI Standard "CRUD en Modal" (2026-08-03): Crear/Editar/Ver ahora ocurren en modales sobre este mismo listado (`ProductoFormModal`/`ProductoViewModal`) — no existe una ruta `/productos/{id}`; otros módulos que enlazan a un producto usan `/productos?ver={id}` (abre el modal automáticamente y limpia la URL al cerrar).

## Fields

Columnas de `productos` (`backend/database/migrations/2026_07_28_015312_create_productos_table.php` + `Producto::$fillable`):

| Campo | Tipo | Notas |
|---|---|---|
| empresa_id | FK | inferido del usuario autenticado, nunca del request |
| categoria_id | FK | |
| codigo | string | |
| codigo_barras | string, nullable | |
| nombre | string | |
| marca | string | |
| descripcion | text, nullable | |
| presentacion | string | |
| costo | decimal(x,2) | |
| precio | decimal(x,2) | |
| unidad_medida | string | |
| stock_minimo | decimal | usado para el resaltado de "stock bajo" |
| stock_maximo | decimal | |
| stock_actual | decimal | **fuera de `$fillable` a propósito** — solo `InventoryService` puede modificarlo |
| imagen | string, nullable | |
| estado | string | |

## Validation Rules

No hay `FormRequest` de producto (`StoreProductoRequest`/`UpdateProductoRequest`) porque no hay endpoint que los use. Las únicas validaciones reales sobre datos de producto hoy ocurren indirectamente dentro del pipeline de Captura IA (`StoreFotoRequest`, etc. — ver `AI_Capture.md`).

## Permissions

Catálogo sembrado: `productos.ver`, `productos.crear`, `productos.editar`, `productos.eliminar`. **Ninguno enforced todavía** — no hay middleware de permisos aplicado a ninguna ruta de producto porque no hay rutas de producto.

## Loading States

No implementado — la tabla renderiza datos mock de forma síncrona; no hay skeleton ni estado de carga porque no hay una llamada de red real detrás.

## Empty States

- Filtro/búsqueda sin resultados: `EmptyState` con ícono `SearchX`, título "No encontramos productos", descripción "Prueba con otro nombre, marca o categoría", y acción "Limpiar filtros".
- Catálogo completamente vacío (cero productos): no diferenciado explícitamente del estado de "sin resultados de búsqueda" en el código actual — a validar/separar en implementación real.

## Error States

No implementado — sin llamada de red real, no hay manejo de error de API en esta pantalla.

## Business Rules

- `stock_actual` nunca se asigna por asignación directa (`fillable`); solo `InventoryService::registrarMovimiento()` puede modificarlo.
- `ProductService::crear()` únicamente da de alta el catálogo (nombre, marca, categoría, presentación, unidad) con `stock_actual = 0`.
- El matching de identidad de producto (¿es el mismo producto que ya existe?) vive en `ProductService::buscarCoincidencia()`, no duplicado en ningún otro punto del sistema.
- Todo producto está aislado por `empresa_id` vía `TenantScope` (`BelongsToEmpresa` en el modelo) — ninguna consulta puede ver productos de otra empresa.

## Acceptance Criteria

- [x] Un producto detectado por Captura IA que no coincide con ninguno existente se crea correctamente con `stock_actual = 0`.
- [x] `stock_actual` nunca se modifica fuera de `InventoryService`.
- [ ] **A validar en implementación**: alta manual de producto vía formulario dedicado (no existe hoy).
- [ ] **A validar en implementación**: edición manual de un producto existente (no existe hoy).
- [ ] **A validar en implementación**: el listado `/productos` consumiendo datos reales de la API en vez de `lib/mock/data.ts`.

## Edge Cases

- Dos capturas simultáneas detectan "el mismo" producto con variaciones menores de texto (ej. mayúsculas/acentos) — el comportamiento exacto de `buscarCoincidencia()` frente a variaciones no está documentado en detalle; a revisar contra el código real de `ProductService` si se decide construir un CRUD manual.
- Producto sin categoría asignada — `categoria_id` es FK, comportamiento ante nulo no confirmado.

## Future Improvements

- Búsquedas avanzadas y acciones masivas descritas en el borrador original (sección 21 del master spec) — no implementadas, evaluar si siguen siendo necesarias antes de construirlas.
- Aplicar los permisos `productos.ver/crear/editar/eliminar` una vez exista el Módulo 3 (Authorization/RBAC).

---

## Adenda — Ficha de Producto (Status: Approved, pendiente de implementar)

**Origen:** bugs de navegación reportados por el product owner tras la ejecución de pruebas funcionales reales (sesión 2026-07-29): BUG-001, BUG-002 (parcial), BUG-003, BUG-005, BUG-006. Confirmado por auditoría de código (`frontend/app/(app)/productos/`) que hoy no existe ninguna ruta `[id]`, ningún formulario de edición, y que los ítems "Editar"/"Ver movimientos" del menú de acciones son `DropdownMenuItem` sin `onClick` ni `href`.

**Alcance deliberadamente acotado** — esta adenda cubre ÚNICAMENTE una ficha de producto de solo-consulta-y-edición-básica más su historial de movimientos ya existentes. **Explícitamente fuera de alcance** (permanecen en sus propios documentos `Status: Planned`, sin tocar): auditoría genérica (`03_FUNCTIONAL_SPEC/FUTURE/Auditoria.md`), Kardex como módulo/reporte independiente con exportación (`03_FUNCTIONAL_SPEC/FUTURE/Kardex.md`), exportaciones PDF/Excel/CSV (`03_FUNCTIONAL_SPEC/FUTURE/Export.md`). BUG-006 pide que la ficha eventualmente exponga también auditoría/historial completo — eso se deja explícitamente para cuando esos módulos se construyan; esta adenda no los simula ni los adelanta.

### Nueva pantalla: `/productos/[id]` (Ficha de Producto)

> **Nota 2026-08-03:** esta ruta fue reemplazada por un modal (`ProductoViewModal`/`ProductoFormModal`) sobre `/productos` como parte del Global UI Standard "CRUD en Modal" (`docs/05_IMPLEMENTATION/ModalCrudStandard.md`) — la ruta `/productos/[id]` ya no existe. El resto de esta sección describe correctamente la Ficha en sí (pestañas, campos, flujo de negocio); solo el mecanismo de navegación cambió, de página completa a modal con deep-link `/productos?ver={id}`.

**Purpose:** único destino de navegación para "ver el detalle de un producto", consistente sin importar desde qué pantalla se llega (BUG-003/006) — resuelve la ausencia total de una página de detalle.

**Business Flow:**
1. El nombre del producto (y, opcionalmente, la fila completa) en `/productos` es un enlace a `/productos/[id]` (BUG-005).
2. Cualquier referencia a un producto ya registrado en la pantalla de Captura IA (tarjetas de revisión, confirmaciones) enlaza al mismo destino `/productos/[id]` (BUG-001) — nunca una vista distinta.
3. En la ficha, un botón "Editar" abre un formulario (misma ruta, modo edición, o modal — decisión de implementación) sobre los campos editables.
4. Una sección "Movimientos" en la ficha lista el historial de `movimientos` de ESE producto (dato ya real y existente hoy vía Captura IA) — de solo lectura, sin edición ni exportación. NO es el módulo Kardex completo; es una lista embebida simple.
5. Desde `/productos`, el ítem "Ver movimientos" del menú de acciones navega a esta misma sección (ancla `/productos/[id]#movimientos` o pestaña activa) — no una pantalla separada.

**Fields (ficha, solo lectura salvo donde se indica editable):**

| Campo | Editable | Notas |
|---|---|---|
| codigo | No | identificador, no se edita post-creación |
| nombre | Sí | |
| marca | Sí | |
| descripcion | Sí | |
| presentacion | Sí | |
| categoria_id | Sí | select contra categorías de la empresa |
| costo | Sí | |
| precio | Sí | |
| unidad_medida | Sí | |
| stock_minimo | Sí | |
| stock_maximo | Sí | |
| stock_actual | **No** | invariante de arquitectura ya establecida — fuera de `$fillable`, solo `InventoryService` lo modifica (ver Business Rules de este documento). La ficha lo muestra, nunca lo expone como campo editable. |
| imagen | No (esta adenda) | subida/cambio de imagen queda fuera de alcance de este fast-track |
| estado | Sí | activo/inactivo |

**Permissions:** `productos.ver` para consultar la ficha, `productos.editar` para el formulario de edición — ambos ya sembrados en el catálogo (`Roles.md`). Sin enforcement de ruta todavía (Módulo 3 no construido) — mismo estado que el resto del módulo, no se adelanta.

**Validation Rules:** un `UpdateProductoRequest` nuevo, validando los campos editables de la tabla de arriba. `stock_actual` no debe aceptarse en el payload bajo ninguna circunstancia (defensa en profundidad, aunque ya esté fuera de `$fillable`).

**Error States:** producto inexistente o de otra empresa → 404 (mismo patrón que Captura IA, nunca filtrar existencia entre empresas — ver `Security.md`).

**Acceptance Criteria:**
- [x] El nombre del producto en `/productos` navega a `/productos/[id]`.
- [x] Cualquier referencia a producto en Captura IA navega al mismo destino.
- [x] "Editar" persiste cambios reales vía el nuevo endpoint, respetando que `stock_actual` nunca es editable.
- [x] "Ver movimientos" muestra el historial real (no mock) de movimientos de ese producto específico.
- [x] Acceder a la ficha de un producto de otra empresa devuelve 404, nunca los datos.

### Technical Spec — nuevos endpoints (ver `04_TECHNICAL_SPEC/API.md` para el contrato completo una vez implementado)

- `GET /api/v1/productos/{id}` — detalle de producto, scoped por `TenantScope`.
- `PATCH /api/v1/productos/{id}` — actualiza únicamente los campos editables de la tabla de arriba; rechaza `stock_actual` si viene en el payload.
- Reutiliza `GET /api/v1/movimientos` (o la consulta equivalente) filtrado por `producto_id` para la sección de movimientos — no se crea un endpoint de Kardex nuevo.

**Aprobado por el product owner (sesión 2026-07-29) como fast-track acotado, explícitamente excluyendo Auditoría/Kardex/Exportaciones.** Implementación a seguir por `10_GOVERNANCE/MandatoryDevelopmentWorkflow.md` desde Fase 1 en adelante (esta adenda cumple la Fase 0).

---

## Adenda 2 — Creación Manual de Producto e Ingreso Manual (Status: Approved, pendiente de implementar)

**Origen:** FEATURE-001 y FEATURE-002, entregadas por el product owner como bloqueantes de release (sesión 2026-07-29): "Actualmente FidelOS depende de Captura IA para registrar productos e ingresos. Eso no es suficiente para un sistema de inventario." Cierra RF-008/RF-011 (planeados) parcialmente — creación manual, no el módulo completo de Compras.

**Decisiones de alcance confirmadas explícitamente por el product owner** (no asumidas):

1. **`proveedor`, `lote`, `vencimiento` se agregan como columnas simples y nulas en `movimientos`** (migración nueva) — texto libre para `proveedor` (el módulo Proveedores/`FUTURE/Suppliers.md` no existe, no se crea una relación a una tabla que no existe), texto para `lote`, fecha para `vencimiento`. **Esto NO implementa inventario por lote real** (no hay stock separado por lote/vencimiento — `stock_actual` sigue siendo un único acumulado por producto). Son campos descriptivos sobre el movimiento, no un cambio de modelo de inventario.
2. **"Registrar auditoría"** se satisface extendiendo `AuditLogger` (ya existente, ya probado) con un método genérico para acciones manuales — escribe filas reales en la tabla `audit_logs` ya existente. **No se construye la UI/dashboard de `FUTURE/Auditoria.md`** — sigue `Status: Planned`.
3. **"Actualizar Kardex"** se satisface porque la pestaña "Movimientos" de la Ficha de Producto (Adenda 1, ya construida) consulta `producto.movimientos()` en vivo — un movimiento nuevo aparece ahí automáticamente. **No se construye el módulo standalone `FUTURE/Kardex.md`** (reportes, exportación, vista multi-producto).
4. **"Factura"** se mapea al campo ya existente `documento` (no es un campo nuevo) — mismo campo que Captura IA ya usa para el mismo propósito.

### FEATURE-001 — Crear Producto Manual

**Screens:** botón "Nuevo Producto" en `/productos` → formulario (mismos campos editables que la ficha: nombre, marca, descripcion, presentacion, categoria_id, costo, precio, unidad_medida, stock_minimo, stock_maximo, estado, más `codigo`/`codigo_barras` que no son editables post-creación pero sí capturables al crear).

**Business Flow:** al guardar, crea el producto reutilizando `ProductService::crear()` (ya existente — mismo servicio que usa Captura IA, sin duplicar lógica de creación), inicializa `stock_actual = 0` (mismo invariante de siempre — el stock inicial se asigna después vía Registrar Ingreso, FEATURE-002, no en este formulario), registra auditoría (`AuditLogger`, punto 2 arriba), y redirige a `/productos/{id}`.

**Technical Spec:** `POST /api/v1/productos` — `StoreProductoRequest` (mismas reglas que `UpdateProductoRequest` más `nombre` requerido), autorizado por `productos.crear` (ya en el catálogo).

### FEATURE-002 — Registrar Ingreso Manual

**Screens:** botón "Registrar ingreso" en la Ficha de Producto → formulario: cantidad, costo, proveedor, factura (= `documento`), observaciones, lote, vencimiento.

**Business Flow:** al guardar, llama a `InventoryService::registrarMovimiento()` (ya existente — mismo servicio que usa Captura IA, único punto de escritura de `stock_actual` y `movimientos`, sin duplicar lógica) con `tipo = Entrada`, registra auditoría (punto 2 arriba). El stock actualizado y el nuevo movimiento se reflejan de inmediato en la Ficha de Producto (Adenda 1).

**Technical Spec:** `POST /api/v1/productos/{id}/movimientos` — nuevo `StoreIngresoRequest`, autorizado por `movimientos.crear` (ya en el catálogo). `InventoryService::registrarMovimiento()` extendido con parámetros opcionales `proveedor`, `lote`, `vencimiento`.

**Acceptance Criteria:**
- [x] "Nuevo Producto" crea un producto real, con `stock_actual = 0`, y redirige a su ficha.
- [x] Cada creación manual y cada ingreso manual generan una fila real en `audit_logs`.
- [x] "Registrar ingreso" actualiza `stock_actual` y crea un `Movimiento` real; la pestaña Movimientos de la ficha lo refleja sin recargar manualmente el endpoint de movimientos por separado.
- [x] Ningún endpoint nuevo permite a otra empresa crear/ver productos o movimientos ajenos (mismo aislamiento que el resto del sistema).

**Aprobado por el product owner (sesión 2026-07-29) como bloqueante de release, con el alcance exacto de los 4 puntos de arriba** — explícitamente NO incluye construir `FUTURE/Auditoria.md` ni `FUTURE/Kardex.md` como módulos propios, ni inventario por lote real.

---

## Adenda 3 — Logical Delete y Badge de Estado (Status: Approved e implementado, 2026-07-30)

**Origen:** auditoría funcional (`docs/06_TESTS/DemoDataAudit.md`, `docs/03_FUNCTIONAL_SPEC/RC1_FUNCTIONAL_MODULE_AUDIT.md`) detectó que Productos era el único módulo construido sin Logical Delete ni columna Estado visible, a diferencia de Proveedores — inconsistente con el Global CRUD Standard ya exigido a todos los módulos administrativos.

**Cambios:**
- `ProductoController::disable()`/`enable()` — mismo patrón exacto que `ProveedorController`: `estado = inactivo/activo`, nunca DELETE físico, auditado (`productos.deshabilitar`/`productos.habilitar`).
- `ProductoController::index()` — filtro `estado` (activo por defecto, `estado=todos` para ver inactivos), mismo criterio que Proveedores.
- Frontend `/productos`: columna Estado con badge de color (verde/rojo), filtro de Estado, acción "Eliminar (deshabilitar)"/"Habilitar" en el menú de fila con `ConfirmDialog` (confirmación obligatoria antes de ejecutar), refresco automático vía `useCrudList` preservando búsqueda/filtros.
- Ficha de producto: mismo botón Eliminar/Habilitar junto a Editar, mismo `ConfirmDialog`.
- Corrección adicional encontrada en el mismo archivo: el formulario de creación/edición enviaba `marca`/`unidad_medida` como texto libre — claves que el backend ya no acepta desde la normalización de catálogos (RC1 Fase 1) y descartaba silenciosamente. Corregido a `marca_nuevo`/`unidad_medida_nuevo` (mismo patrón mutuamente excluyente que `proveedor_nuevo`).
- Campo "Stock inicial"/"Stock actual" ahora visible pero deshabilitado en ambos formularios (antes solo era texto descriptivo) — refuerza visualmente que el stock nunca se envía desde Crear/Editar Producto.

**Acceptance Criteria:**
- [x] Botón Eliminar funciona mediante eliminación lógica (nunca DELETE físico).
- [x] Columna Estado visible con badges de color en el listado.
- [x] El estado puede activarse y desactivarse, con confirmación previa.
- [x] El stock inicial siempre es 0, campo deshabilitado en Crear y Editar.
- [x] El stock únicamente se modifica desde Movimientos de Inventario.
- [x] Tests backend (22 casos en `ProductoControllerTest`) y verificación real en navegador, ambos en verde.
