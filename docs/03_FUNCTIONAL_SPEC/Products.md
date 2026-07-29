# Productos

**Status: Built (esqueleto delgado — sin CRUD propio)**

> Verificado contra `backend/app/Models/Producto.php`, `backend/database/migrations/2026_07_28_015312_create_productos_table.php`, `backend/app/Services/ProductService.php`, `frontend/app/(app)/productos/page.tsx`, `frontend/lib/mock/data.ts`. **No existe `ProductoController`, ni rutas `GET/POST/PATCH/DELETE /api/v1/productos` en `backend/routes/api.php`.** El único punto de escritura real sobre `productos` es `ProductService`, consumido internamente por el pipeline de Captura IA (ver `AI_Capture.md`) — no hay un formulario de alta/edición de producto en ningún lugar del sistema. La pantalla `/productos` del frontend es una tabla de solo lectura sobre datos simulados (`lib/mock/data.ts`), no sobre la API real. Reemplaza el borrador de la sección 21 del master spec, que describía un CRUD completo (búsquedas avanzadas, acciones masivas) nunca construido.

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

- **`/productos`** (`frontend/app/(app)/productos/page.tsx`): tabla con búsqueda por nombre/marca, filtro por categoría, columnas Producto (con miniatura de color), Categoría, Presentación, Stock (resaltado en rojo si está por debajo del mínimo), Precio, y un menú de acciones (`Editar`, `Ver movimientos`) — **ninguna de las dos acciones del menú está implementada**, son elementos de UI sin handler.
- No existe una pantalla de "Nuevo producto" ni un formulario de edición en ningún punto del frontend.

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

- Construir `ProductoController` con CRUD real (`GET/POST/PATCH/DELETE /api/v1/productos`), `StoreProductoRequest`/`UpdateProductoRequest`, y conectar la pantalla `/productos` a la API real.
- Conectar los botones "Editar" y "Ver movimientos" del menú de acciones a una pantalla/modal real.
- Búsquedas avanzadas y acciones masivas descritas en el borrador original (sección 21 del master spec) — no implementadas, evaluar si siguen siendo necesarias antes de construirlas.
- Aplicar los permisos `productos.ver/crear/editar/eliminar` una vez exista el Módulo 3 (Authorization/RBAC) y el CRUD real.
