# Movimientos

**Status: Built (backend real; pantalla con datos simulados)**

> Verificado contra `backend/app/Models/Movimiento.php`, `backend/database/migrations/2026_07_28_015313_create_movimientos_table.php`, `frontend/app/(app)/movimientos/page.tsx`, `frontend/lib/mock/data.ts` (`MOCK_MOVEMENTS`). El modelo `Movimiento` y su tabla son reales y ya se escriben en producción — pero únicamente como efecto secundario de `InventoryService::registrarMovimiento()` llamado desde Captura IA (ver `AI_Capture.md`). **No existe `MovimientoController` ni rutas `GET /api/v1/movimientos`** — la pantalla `/movimientos` es una línea de tiempo de solo lectura sobre `lib/mock/data.ts`, no sobre la base de datos real. Reemplaza el borrador de la sección 24 del master spec, que listaba 8 tipos de movimiento (Compra, Venta, Ajuste, Transferencia, Producción, Devolución, Consumo, Corrección) de los cuales solo un subconjunto (los que Captura IA puede generar: entrada, salida, ajuste, conteo, transferencia) tiene alguna posibilidad real de ocurrir hoy.

## Purpose

Dejar un registro inmutable y completo de cada cambio de stock — quién, cuándo, cuánto, y por qué — como base de auditoría y trazabilidad del inventario.

## Business Flow

1. Un movimiento se crea únicamente dentro de `InventoryService::registrarMovimiento()`, llamado hoy solo desde el pipeline de Captura IA tras confirmar/aplicar una detección.
2. El registro captura `stock_anterior` y `stock_nuevo` en el momento exacto de la escritura (dentro de la transacción con `lockForUpdate()`).
3. El usuario puede (en la pantalla, hoy con datos de ejemplo) buscar por producto y filtrar por tipo, viendo los movimientos agrupados por día en una línea de tiempo.
4. Los movimientos **nunca se editan ni se eliminan** una vez creados.

## Actors

- **Pipeline de Captura IA** (actor técnico): único creador real de movimientos hoy.
- **Usuario de empresa** con permiso `movimientos.ver` (catálogo sembrado, sin enforcement todavía) para consultar el historial.

## Screens

- **`/movimientos`** (`frontend/app/(app)/movimientos/page.tsx`): línea de tiempo agrupada por día ("Hoy", "Ayer", fecha completa), con búsqueda por nombre de producto y filtro por tipo (Todos / Entradas / Salidas / Ajustes / Conteos / Transferencias). Cada ítem muestra ícono según tipo, color de producto, nombre, hora, usuario, badge de origen, y cantidad con signo (verde `+` para entrada, rojo `-` para salida).

## Fields

Columnas reales de `movimientos` (`Movimiento::$fillable`):

| Campo | Tipo | Notas |
|---|---|---|
| empresa_id | FK | vía `TenantScope`/`BelongsToEmpresa` |
| producto_id | FK | |
| usuario_id | FK | quién generó el movimiento |
| tipo | string | valores usados hoy: `entrada`, `salida`, `ajuste`, `conteo`, `transferencia` (los que el contrato de IA puede emitir) |
| documento | string, nullable | documento origen |
| cantidad | decimal | |
| stock_anterior | decimal | snapshot al momento del movimiento |
| stock_nuevo | decimal | snapshot al momento del movimiento |
| costo | decimal, nullable | |
| precio | decimal, nullable | |
| observacion | text, nullable | |

## Validation Rules

No hay `FormRequest` de movimiento porque no hay endpoint que reciba un movimiento directamente desde el frontend — todo movimiento nace dentro de `InventoryService`, alimentado por el contrato ya validado de Captura IA (ver `AI_Capture.md`).

## Permissions

Catálogo sembrado: `movimientos.ver`, `movimientos.crear`. Ninguno enforced todavía.

## Loading States

No implementado — la línea de tiempo renderiza datos mock de forma síncrona.

## Empty States

- Filtro/búsqueda sin resultados: `EmptyState` con ícono `SearchX`, título "No encontramos movimientos", descripción "Prueba con otro producto o tipo de movimiento", acción "Limpiar filtros".
- Historial completamente vacío (empresa nueva sin ningún movimiento): mismo componente de empty state que la búsqueda sin resultados en el código actual — no diferenciado; a revisar si vale la pena distinguir "sin datos" de "sin resultados de filtro" en la implementación real.

## Error States

No implementado — sin llamada de red real, no hay manejo de error de API en esta pantalla.

## Business Rules

- **Inmutabilidad**: un movimiento nunca se edita ni se elimina una vez creado — es el registro de auditoría del stock.
- Cada movimiento guarda el snapshot de `stock_anterior`/`stock_nuevo` en el momento exacto de la escritura, no un valor recalculado después.
- El tipo de movimiento (`tipo`) determina si `cantidad` suma o resta del stock — esa lógica vive en `InventoryService::registrarMovimiento()`, nunca duplicada en el frontend ni en Captura IA.

## Acceptance Criteria

- [x] Cada aplicación exitosa de una detección de Captura IA genera exactamente un registro en `movimientos` con `stock_anterior`/`stock_nuevo` correctos.
- [x] Un movimiento nunca queda huérfano de su `AuditLog` correspondiente (ver `AI_Capture.md`).
- [ ] **A validar en implementación**: la pantalla `/movimientos` consumiendo `GET /api/v1/movimientos` real, paginado, filtrable por tipo/producto/fecha desde el backend.
- [ ] **A validar en implementación**: comportamiento de los tipos de movimiento no generables hoy por Captura IA (compra, venta, producción, devolución, consumo, corrección) — no existe código que los emita todavía.

## Edge Cases

- Movimiento con `cantidad` fraccionaria (producto vendido/medido por unidad no entera) — el campo es `decimal`, soportado a nivel de esquema; comportamiento de UI/redondeo no verificado.
- Gran volumen de movimientos históricos — la paginación real (`paginate(20)`, patrón ya usado en `CapturaIAController::index()`) todavía no existe para movimientos porque no hay endpoint; a definir al construirlo.

## Future Improvements

- Construir `MovimientoController` con `GET /api/v1/movimientos` (listado paginado, filtrable) y conectar `/movimientos` a datos reales.
- Kardex por producto (ver `FUTURE/Kardex.md`, spec planificada) como vista derivada de este mismo historial de movimientos, no una tabla paralela.
- Habilitar los tipos de movimiento no cubiertos por Captura IA (compra, venta, producción, devolución, consumo, corrección) cuando/si se construyen los módulos que los originan (`FUTURE/Purchases.md`, `FUTURE/Sales.md`).
- Exportación de movimientos (Excel/CSV/PDF) — mencionada en el borrador original de Reportes (`FUTURE/Reports.md`), no construida.
