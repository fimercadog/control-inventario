# Stock

**Status: Built** (implementado 2026-07-30 — Unidad de Trabajo "Implementación Completa del Módulo Stock (RC1)", Fase 2 del roadmap de 8 fases aprobado)

> Verificado contra `backend/app/Http/Controllers/Api/StockController.php`, `frontend/app/(app)/stock/page.tsx`, `frontend/components/stock-detail-screen.tsx`, `backend/tests/Feature/StockControllerTest.php` (12 casos). Reemplaza la página stub "pendiente de implementación" que existía desde la Unidad de Trabajo "Sidebar RC1".
>
> Este documento no existía antes de esta unidad de trabajo — solo existía como decisión de diseño verbal, tomada explícitamente por el propietario del proyecto en dos momentos de esta sesión: primero al definir FEATURE-008 (semántica de "eliminar" un registro de Stock), y de nuevo al confirmar el alcance exacto de "Crear"/"Editar" antes de iniciar esta unidad de trabajo (ver sección "Decisiones confirmadas" abajo).

## Decisión arquitectónica central

**Stock NO es una entidad independiente.** No existe una tabla `stock` ni un modelo `Stock`. Cada `Producto` ya trae sus propios campos de stock (`stock_actual`, `stock_minimo`, `stock_maximo`, y una bandera administrativa `stock_estado`, todos columnas de `productos`). El módulo Stock es una vista y un editor especializados sobre esos campos — nunca una entidad nueva.

## Purpose

Dar visibilidad y control administrativo sobre los niveles de stock de cada producto (cantidad actual, umbrales de alerta mínimo/máximo) sin duplicar el catálogo de Productos ni abrir una puerta trasera para modificar cantidades fuera de `InventoryService`.

## Business Flow

1. Un usuario de empresa abre `/stock` y ve el listado de productos con sus campos de stock (por defecto, solo los que tienen `stock_estado = activo`).
2. Puede buscar por nombre/código, filtrar por Estado (Activos/Todos), y filtrar "Solo bajo mínimo" (productos cuyo `stock_actual` está por debajo de su `stock_minimo`).
3. Entra a la ficha de un producto y edita únicamente sus umbrales (`stock_minimo`/`stock_maximo`) — `stock_actual` es siempre de solo lectura en este módulo.
4. Si necesita cambiar la cantidad real, la ficha enlaza directamente a `/productos/{id}` (Ficha de Producto → pestaña Movimientos → Registrar Ingreso), nunca desde aquí.
5. "Eliminar" un registro de Stock es una acción puramente administrativa: lo oculta del listado por defecto de este módulo. Nunca modifica `stock_actual`, nunca genera un movimiento, y nunca afecta si el producto sigue siendo válido en Productos/Captura IA/Proveedores/Movimientos.

## Decisiones confirmadas (antes de iniciar esta unidad de trabajo)

Dado que el brief genérico de la unidad de trabajo pedía un CRUD idéntico al de Productos ("Crear/Editar/Eliminación lógica"), y eso entraba en conflicto directo con la regla de negocio ya establecida (ver FEATURE-008 más abajo), se confirmó explícitamente con el propietario del proyecto antes de escribir código:

- **"Crear" no existe** como acción independiente. El listado de Stock muestra los Productos existentes; no hay botón "Nuevo Stock" — cada producto ya nace con sus propios campos de stock desde su alta en el módulo Productos.
- **"Editar" solo puede tocar `stock_minimo`/`stock_maximo`**. `stock_actual` permanece siempre de solo lectura en este módulo — la única forma real de cambiar la cantidad sigue siendo Entrada/Salida/Ajuste (Movimientos, vía `InventoryService::registrarMovimiento()`).

## Regla de negocio heredada de FEATURE-008 (definida antes en esta misma sesión)

> "Stock is NOT an independent business entity... Deleting a Stock record must NOT: set product stock to zero, create an automatic reversal movement, modify inventory automatically... Logical delete means: disable the Stock record from the Stock module, keep all inventory movements, keep current stock unchanged... If the user wants to reduce stock, they must use: Manual Exit, Stock Adjustment, Inventory Count Adjustment."

Esta unidad de trabajo implementa esa regla literalmente: `disable()`/`enable()` solo tocan `productos.stock_estado`, nunca `stock_actual` ni `productos.estado` (el estado de catálogo del producto).

## Actors

- **Usuario de empresa** con permiso `stock.ver`/`stock.gestionar` (sin catálogo de permisos sembrado todavía para este módulo específico, ni enforcement de ruta — mismo estado que el resto de los módulos de este roadmap).

## Screens

- **`/stock`**: listado (Producto, Actual, Mínimo, Máximo, Estado). Búsqueda por nombre/código, filtro de Estado (Activos/Todos), checkbox "Solo bajo mínimo". **Sin botón "Nuevo"** (decisión confirmada arriba).
- **`/stock/{id}`**: ficha del stock de un producto — Stock actual (solo lectura, con aviso visual si está bajo el mínimo), edición inline de mínimo/máximo, botón Eliminar/Habilitar, y un enlace directo a la Ficha de Producto (`/productos/{id}`) para ver el historial de movimientos o registrar un ingreso real.

## Fields

| Campo | Origen | Editable desde Stock |
|---|---|---|
| stock_actual | `InventoryService::registrarMovimiento()` | **No** — solo lectura |
| stock_minimo | input | Sí |
| stock_maximo | input | Sí |
| stock_estado | toggle Eliminar/Habilitar | Sí (vía acción dedicada, nunca en el form de edición) |

## Validation Rules

- `stock_minimo`: opcional (`sometimes`), numérico, `min:0`.
- `stock_maximo`: opcional (`sometimes`), numérico o `null`, `min:0`.
- `stock_actual` y `estado` (catálogo del producto) están deliberadamente ausentes de `UpdateStockRequest` — ni siquiera declarados en sus reglas, así que un payload que los incluya los ignora silenciosamente (verificado por test).

## Permissions

`stock.ver`, `stock.gestionar` — sin enforcement de ruta todavía, mismo estado que el resto del catálogo de permisos de este roadmap.

## Loading States / Empty States / Error States

Mismos componentes reutilizables que Categorías/Marcas/Unidades de Medida/Proveedores.

## Business Rules

- Borrado siempre lógico (`stock_estado = inactivo`) — nunca DELETE físico, y nunca toca `stock_actual` ni `productos.estado`.
- `stock_estado` es independiente de `productos.estado` (catálogo) a propósito: un producto puede seguir siendo un producto de catálogo válido aunque su Stock esté deshabilitado en este módulo (y viceversa).
- `stock_actual` sigue siendo propiedad exclusiva de `InventoryService::registrarMovimiento()` — ningún endpoint de este controller puede escribirlo, ni por accidente (el campo no está en `$fillable` como propiedad especial, y `UpdateStockRequest` nunca lo declara).

## Acceptance Criteria

- [x] `StockControllerTest` cubre: ausencia de endpoint de creación (405), listar/ver, búsqueda, filtro "bajo mínimo", editar solo umbrales, rechazo silencioso de `stock_actual`/`estado` en el payload de edición, deshabilitar/habilitar sin tocar cantidad ni estado de catálogo ni generar movimientos, aislamiento multi-tenant (12 casos).
- [x] Verificación real en navegador (agent-browser): listado sin botón de creación, stock actual de solo lectura con aviso "bajo mínimo", edición de umbrales persistente, deshabilitar/habilitar con confirmación, verificación cruzada explícita de que el ciclo deshabilitar→habilitar en Stock no afecta el estado de catálogo del producto ni su conteo de Movimientos, responsive.

## Edge Cases

- Producto sin `stock_maximo` configurado (`null`): se muestra "—", nunca un error.
- Producto con `stock_actual` por debajo de `stock_minimo`: se marca visualmente (ícono de alerta en el listado, aviso en la ficha) — es solo informativo, no bloquea ninguna acción.

## Future Improvements

- Notificaciones/alertas automáticas cuando un producto cruza su umbral mínimo — no solicitado, fuera de alcance de RC1 (existe el módulo "Notificaciones" en el backlog general, sin fecha).
- Ajuste de inventario por conteo físico (Stock Adjustment/Inventory Count Adjustment) como tipo de movimiento dedicado — mencionado en la regla de negocio de FEATURE-008 pero pertenece al módulo Movimientos (Fase 3 del roadmap), no a este.
