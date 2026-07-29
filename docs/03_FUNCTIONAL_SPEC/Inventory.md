# Inventario

**Status: Built (solo como servicio interno — sin pantalla propia)**

> Verificado contra `backend/app/Services/InventoryService.php`, `backend/app/Models/Producto.php` (campo `stock_actual`), `backend/app/Models/Movimiento.php`, y una búsqueda exhaustiva en `frontend/app` que confirma que **no existe una pantalla `/inventario`** independiente. No hay `InventoryController` ni rutas `GET/POST /api/v1/inventario`. Todo lo que hoy existe de "Inventario" es el campo `stock_actual` en `productos` (ver `Products.md`) y el historial en `movimientos` (ver `Movements.md`), ambos accesibles hoy solo indirectamente a través del pipeline de Captura IA. Reemplaza el borrador de la sección 23 del master spec, que describía un módulo mucho más amplio (entradas/salidas manuales, métodos de costeo PEPS/UEPS/Promedio, alertas configurables, dashboard propio de inventario) del que no existe ni una fracción construida fuera de lo que Captura IA usa internamente.

## Purpose

Ser la única fuente de verdad del stock actual de cada producto, y el único punto de escritura de ese stock — de modo que cualquier módulo futuro (Compras, Ventas, ajustes manuales, Captura IA) mueva inventario a través del mismo camino, sin una segunda fuente de verdad.

## Business Flow

1. Un movimiento de inventario (hoy: únicamente generado desde Captura IA, ver `AI_Capture.md` y `Movements.md`) llama a `InventoryService::registrarMovimiento()`.
2. El Service registra el movimiento (`movimientos`, con `stock_anterior`/`stock_nuevo`) y actualiza `productos.stock_actual` — dentro de la misma transacción, con `lockForUpdate()` para evitar condiciones de carrera bajo escritura concurrente.
3. No existe hoy ningún flujo manual de "ajuste de inventario" o "conteo físico" iniciado por el usuario desde una pantalla dedicada.

## Actors

- **Pipeline de Captura IA** (actor técnico): único consumidor real de `InventoryService::registrarMovimiento()` hoy.
- **Usuario de empresa**: no tiene ninguna interacción directa con "Inventario" como módulo separado — su única ventana al stock es la columna "Stock" de `/productos` (datos mock) y la línea de tiempo de `/movimientos` (datos mock).

## Screens

**Ninguna pantalla dedicada existe.** No hay `/inventario` en `frontend/app`. Lo más cercano son:
- La columna de stock en `/productos` (ver `Products.md`).
- La línea de tiempo de `/movimientos` (ver `Movements.md`).

## Fields

El único campo de "inventario" persistido es `productos.stock_actual` (decimal, excluido de `$fillable`, solo modificable por `InventoryService`). No hay tabla `inventario` separada en el esquema actual — a diferencia de lo que sugería el borrador original (sección 29-30 del master spec listaba `productos`, no una tabla `inventario` aparte; confirmado también en `04_TECHNICAL_SPEC/Database.md`, que no lista `inventario` entre las entidades reales).

## Validation Rules

`InventoryService::registrarMovimiento()` es responsable de validar la dirección del movimiento (si `entrada` suma o `salida` resta) — esta regla vive exclusivamente ahí, ningún otro módulo (incluyendo Captura IA) la reimplementa. Validaciones de cantidades negativas o stock insuficiente se manejan vía `StockInsuficienteException` (ver `AI_Capture.md`, sección de errores) — comportamiento exacto (¿bloquea siempre o solo en salidas?) a confirmar leyendo el Service directamente si se construye un flujo manual.

## Permissions

`movimientos.ver`, `movimientos.crear` existen en el catálogo de permisos sembrado y son los permisos más cercanos a "Inventario" — no hay permisos `inventario.*` en el catálogo actual. Ninguno enforced todavía a nivel de middleware.

## Loading States

No aplica — no hay pantalla.

## Empty States

No aplica — no hay pantalla.

## Error States

Los únicos errores relacionados con inventario hoy son los que surgen dentro del pipeline de Captura IA (`StockInsuficienteException` → 409). Ver `AI_Capture.md`.

## Business Rules

- **Propiedad exclusiva del stock**: `stock_actual` en `productos` solo puede ser modificado por `InventoryService`. Ningún otro Service o Action escribe stock directamente — esta es la regla central de todo el diseño (Single Source of Truth), citada tanto en la sección 74 del master spec como en `04_TECHNICAL_SPEC/Architecture.md`.
- Toda escritura de stock corre dentro de una transacción con `lockForUpdate()` para evitar condiciones de carrera.
- No existen hoy métodos de costeo (PEPS/UEPS/Promedio), alertas configurables, ni un dashboard de inventario — todo eso es aspiracional (borrador original), no construido.

## Acceptance Criteria

- [x] `InventoryService::registrarMovimiento()` es el único punto de escritura de `stock_actual` en todo `app/` (verificado por inspección durante la revisión de arquitectura pre-Fase 4, documentado en la sección 74 del master spec).
- [ ] **A validar en implementación**: comportamiento exacto ante intento de salida con stock insuficiente, cuando exista un flujo manual que lo ejercite fuera de Captura IA.
- [ ] **A validar en implementación**: cualquier criterio de aceptación de una futura pantalla `/inventario` — no existe todavía, nada que aceptar.

## Edge Cases

- Dos movimientos concurrentes sobre el mismo producto — mitigado por `lockForUpdate()` dentro de la transacción de `InventoryService`, pero sin una prueba de carga documentada todavía.
- Producto con `stock_minimo`/`stock_maximo` sin definir (nulos) — comportamiento de las alertas de "stock bajo" (hoy solo visual en `/productos` con datos mock) ante un mínimo nulo, no confirmado.

## Future Improvements

- Definir si "Inventario" se convierte en un módulo/pantalla propio (ajustes manuales, conteos físicos) o si permanece como un servicio interno consumido únicamente por otros módulos (Captura IA hoy; Compras/Ventas si se construyen — ver `FUTURE/Purchases.md`/`FUTURE/Sales.md`).
- Métodos de costeo (PEPS/UEPS/Promedio ponderado) — mencionados en el borrador original, sin ninguna decisión de producto tomada todavía sobre si son necesarios para el negocio real.
- Alertas de stock mínimo/máximo activas (hoy `StockUpdated` se dispara como evento de dominio pero no tiene listeners — ver `AI_Capture.md`, "Eventos de dominio").
- Si se construye un flujo manual de ajuste de inventario, debe pasar por `InventoryService::registrarMovimiento()` igual que Captura IA — nunca un segundo camino de escritura de stock.
