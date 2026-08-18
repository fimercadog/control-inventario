# Optimización de base de datos — 2026-08-18

Ejecutada sobre `backend/database/database.sqlite` (la BD real de desarrollo,
no un fixture), con la condición explícita de **cero pérdida de datos**.
Metodología: auditar → backupear → migrar de forma aditiva y reversible →
validar conteos/checksums → correr la suite completa → documentar rollback.

## 1. Backups

Tomados antes de cada tanda de cambios (gitignorados, no se suben):

- `database/database.sqlite.bak-20260818071124` — antes de los índices iniciales.
- `database/database.sqlite.bak-pre-bodega-20260818073959` — antes de la fundación de bodegas.

## 2. Auditoría (solo lectura, antes de tocar nada)

- `PRAGMA foreign_key_check`: **0 violaciones**.
- `PRAGMA integrity_check`: **ok**.
- Huérfanos por FK (valor no-null sin fila padre) en las 39 tablas: **0**.
- Duplicados en claves de negocio (`users.email`, `clientes/proveedores.(empresa_id,nit)`,
  `productos.(empresa_id,codigo)`, etc.): **0**.
- Consistencia `productos.stock_actual` vs. cadena real de `movimientos.stock_nuevo`
  (no la suma naive — `ajuste` puede restar): **0 mismatches** en 1976 productos
  (953 con movimientos, 1023 sin movimientos aún).

Conclusión: la base estaba sana. No había corrupción, huérfanos ni drift de stock
que "reparar" — el trabajo real era de índices faltantes y de la brecha de
bodega/ubicación (punto 8 del review de `diagrama-bd.md`), no de arreglar datos rotos.

## 3. Cambios aplicados (todos aditivos y reversibles)

### 3.1 Índices de FK faltantes

SQLite no indexa FKs automáticamente. Se auditó cada FK contra los índices reales
del archivo y se agregaron los que faltaban:

- [`2026_08_18_090000_add_missing_fk_indexes.php`](../backend/database/migrations/2026_08_18_090000_add_missing_fk_indexes.php) —
  15 índices en tablas núcleo del CRM e inventario. Los más notables: `users.empresa_id`
  (¡la propia tabla de usuarios no tenía índice en su columna de tenant!) y
  `ejecuciones_automatizacion.empresa_id` (única tabla de su migración sin el patrón
  que sí tienen todas sus hermanas).
- [`2026_08_18_091000_add_missing_fk_indexes_peripheral_tables.php`](../backend/database/migrations/2026_08_18_091000_add_missing_fk_indexes_peripheral_tables.php) —
  8 índices más en auditoría/seguridad/captura IA/reportes/invitaciones, priorizando
  `audit_logs` (11k+ filas) y `security_logs` (14.9k+ filas) por volumen.

### 3.2 Relaciones Eloquent faltantes (sin cambios de esquema)

- `Actividad`: se agregaron `cliente()`, `contacto()`, `creadoPor()` — el modelo solo
  exponía `responsable()`, aunque `cliente_id`/`contacto_id`/`creado_por_id` ya existían
  como columnas desde su migración original.
- `ContingenciaSyncLog` y `ContingenciaActividadSyncLog`: se agregó `usuario()` a ambos
  (ninguno la tenía, pese a que el review asumía que uno de los dos sí).

### 3.3 Fundación estructural de bodegas (punto 8 del review)

[`2026_08_18_092000_create_bodegas_and_stock_por_bodega.php`](../backend/database/migrations/2026_08_18_092000_create_bodegas_and_stock_por_bodega.php) —
fase **"expand"** de un expand-contract seguro:

- Tablas nuevas: `bodegas`, `producto_bodega`.
- Columna nueva: `movimientos.bodega_id` (nullable).
- Backfill (copiar, nunca mover): una bodega `Principal` por empresa; una fila en
  `producto_bodega` por cada producto existente con su `stock_actual` copiado;
  `movimientos.bodega_id` backfillado a la bodega Principal de su empresa.
- **`productos.stock_actual` no se tocó** — sigue siendo la fuente de verdad operativa.
  La migración valida (y aborta con rollback automático si algo no cuadra) que:
  el conteo de productos no cambió, la suma de `stock_actual` no cambió, el conteo
  de movimientos no cambió, `producto_bodega` tiene exactamente una fila por producto
  con la misma suma de stock, y ningún movimiento quedó sin `bodega_id`.

**Deliberadamente incompleto**: `InventoryService` (el único escritor de stock) sigue
operando sobre `productos.stock_actual`, no por bodega. Esta migración es la base de
datos para un soporte multi-almacén real, no el soporte en sí — reescribir el servicio,
los controllers que leen `stock_actual` directamente, y el frontend (selector de bodega)
es una fase aparte que toca lógica de negocio ya probada en producción y merece su propia
validación, no algo para incluir de paso en una migración de esquema.

## 4. Conteos antes/después (verificación de cero pérdida de datos)

| Tabla | Antes | Después |
|---|---|---|
| productos | 1976 | 1976 |
| movimientos | 11285 | 11285 |
| clientes | 464 | 464 |
| contactos | 10 | 10 |
| oportunidades | 6 | 6 |
| actividades | 6 | 6 |
| users | 305 | 305 |
| audit_logs | 11021 | 11021 |
| security_logs | 14896 | 14896 |
| **bodegas** | — | **2** (nueva, 1 por empresa) |
| **producto_bodega** | — | **1976** (nueva, 1 por producto) |

Checksum `SUM(productos.stock_actual)` = `SUM(producto_bodega.stock_actual)` =
**128525.37** en ambas tablas. `movimientos.bodega_id IS NULL` = **0**.
Todas las demás tablas (39 en total) sin cambio de conteo.

## 5. Validaciones posteriores

- `PRAGMA foreign_key_check` tras todos los cambios: **0 violaciones**.
- `PRAGMA integrity_check`: **ok**.
- Huérfanos por FK: **0**.
- `ANALYZE` + `VACUUM`: estadísticas del planner refrescadas, archivo compactado
  (23.65MB → 22.41MB en esta segunda pasada).
- Suite completa del backend: **`php artisan test` → 568 passed (1811 assertions)**,
  0 failures. Los tests corren contra `:memory:` (phpunit.xml), no contra el
  `.sqlite` real, así que también confirman que ninguna migración rompió el
  camino de escritura que el resto del código ya ejercita.

## 6. Rollback

Todas las migraciones tienen `down()` reversible y no destruyen datos originales
al revertir (solo quitan lo que ellas mismas agregaron):

```bash
# Revertir la fundación de bodegas (dropea bodegas/producto_bodega/movimientos.bodega_id,
# no toca productos.stock_actual ni ninguna fila preexistente)
php artisan migrate:rollback --path=database/migrations/2026_08_18_092000_create_bodegas_and_stock_por_bodega.php

# Revertir los índices periféricos
php artisan migrate:rollback --path=database/migrations/2026_08_18_091000_add_missing_fk_indexes_peripheral_tables.php

# Revertir los índices núcleo
php artisan migrate:rollback --path=database/migrations/2026_08_18_090000_add_missing_fk_indexes.php
```

Alternativa de último recurso: restaurar cualquiera de los `.bak-*` sobre
`database/database.sqlite` (archivo completo, pre-cambios).

## 7. Pendiente (no aplicado, por decisión explícita)

- **Multi-bodega real** (fase "contract"): reescribir `InventoryService`, los
  controllers/reportes que leen `producto.stock_actual` directo (Kardex, StockController,
  Captura IA), y el frontend, para operar por bodega. Requiere su propio plan y pruebas.
- **Columnas potencialmente legacy** (`movimientos.proveedor` texto libre coexistiendo
  con `proveedor_id`; `clientes.contacto` texto libre coexistiendo con el módulo
  `Contacto`): no se tocaron — no hay evidencia suficiente de que estén muertas sin
  auditar el código que las lee/escribe, y la instrucción explícita fue no eliminar
  columnas sin garantía total. Queda como hallazgo, no como cambio.
- **CHECK constraint en `movimientos.cantidad > 0`**: ya se cumple en el 100% de los
  datos reales y está validado en `StoreMovimientoRequest`/`InventoryService`, pero
  agregarlo a nivel de esquema en SQLite exige reconstruir la tabla completa (SQLite
  no soporta `ADD CONSTRAINT` sobre tablas existentes) — riesgo desproporcionado al
  beneficio marginal dado que ya está garantizado en dos capas de la app. Queda como
  recomendación, no como cambio aplicado.
