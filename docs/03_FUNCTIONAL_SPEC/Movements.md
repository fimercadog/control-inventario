# Movimientos

**Status: Built** (implementado 2026-08-02 — Unidad de Trabajo "Módulo Movimientos (RC1 Fase 3)", cierra la Fase 3 del roadmap de 8 fases aprobado)

> Verificado contra `backend/app/Http/Controllers/Api/MovimientoController.php`, `backend/app/Http/Requests/Movimiento/{Store,Update}MovimientoRequest.php`, `backend/app/Policies/MovimientoPolicy.php`, `backend/tests/Feature/MovimientoControllerTest.php` (17 casos), `frontend/app/(app)/movimientos/page.tsx`, `frontend/app/(app)/movimientos/[id]/page.tsx`, `frontend/components/{movimiento-detail-screen,new-movimiento-dialog}.tsx`. Reemplaza la versión anterior de este documento, que describía la pantalla `/movimientos` como una línea de tiempo sobre `lib/mock/data.ts` sin `MovimientoController` ni rutas propias.
>
> **Decisión arquitectónica confirmada explícitamente por el propietario del proyecto antes de esta unidad de trabajo, y que reemplaza el brief genérico de "mismo CRUD que Productos"**: un movimiento es el registro contable (ledger) del inventario. Es **append-only** — se puede Listar, Ver y Crear (Entrada/Salida/Ajuste), pero **nunca** Editar sus campos contables, ni Eliminar (físico o lógico), ni Desactivar/Reactivar. La única forma de corregir un error es registrar un nuevo movimiento compensatorio (típicamente un Ajuste), preservando el historial completo. Esta regla queda codificada en `MovimientoController`/`MovimientoPolicy`/`UpdateMovimientoRequest` (ver comentarios en cada archivo) y es, a partir de esta unidad de trabajo, una regla arquitectónica del proyecto aplicable a todo módulo presente y futuro que toque el ledger de inventario.

## Purpose

Dejar un registro inmutable y completo de cada cambio de stock — quién, cuándo, cuánto, y por qué — como base de auditoría y trazabilidad del inventario.

## Business Flow

Un movimiento se crea por exactamente dos caminos, ambos convergiendo siempre en `InventoryService::registrarMovimiento()` (nunca hay una escritura directa a `stock_actual` fuera de este Service):

1. **Automático** — el pipeline de Captura IA, al confirmar/aplicar una detección (ver `AI_Capture.md`).
2. **Manual** — un usuario de empresa, desde el módulo global `/movimientos` (botón "Nuevo Movimiento"), elige Entrada/Salida/Ajuste, un producto, y una cantidad. Para Ajuste, además indica explícitamente la dirección (Incremento/Decremento) porque es el único tipo bidireccional; para Entrada, opcionalmente asocia un proveedor existente.
3. En ambos casos, el registro captura `stock_anterior` y `stock_nuevo` en el momento exacto de la escritura (dentro de la transacción con `lockForUpdate()`), y queda enlazado a un `AuditLog` (`movimientos.registrar_{tipo}`).
4. El usuario puede buscar por producto/documento y filtrar por tipo, viendo los movimientos agrupados por día en una línea de tiempo paginada, consumiendo `GET /api/v1/movimientos` real.
5. Puede entrar al detalle de un movimiento (`/movimientos/{id}`) y editar **únicamente** su metadata descriptiva (`documento`, `observación`, `lote`, `vencimiento`) — nunca `tipo`, `cantidad`, `producto`, `proveedor`, `stock_anterior` ni `stock_nuevo`, sin importar lo que el payload envíe (`UpdateMovimientoRequest` ni siquiera declara esos campos).
6. Los movimientos **nunca se editan (en lo contable) ni se eliminan** una vez creados. No existe ninguna acción "Eliminar"/"Desactivar"/"Anular" en ningún endpoint ni pantalla de este módulo.

## Actors

- **Pipeline de Captura IA** (actor técnico): creador automático de movimientos.
- **Usuario de empresa** con permiso `movimientos.ver`/`movimientos.crear` (catálogo sembrado; enforcement real vía `MovimientoPolicy`, ligado a pertenencia de empresa — mismo nivel que el resto de los módulos de este roadmap, no un chequeo de permiso granular por acción todavía): consulta el historial, registra movimientos manuales, y edita metadata descriptiva.

## Screens

- **`/movimientos`** (`frontend/app/(app)/movimientos/page.tsx`): línea de tiempo agrupada por día ("Hoy", "Ayer", fecha completa), búsqueda por producto/documento, filtro por tipo (Todos / Entradas / Salidas / Ajustes / Conteos / Transferencias), botón "Nuevo Movimiento", paginación (Anterior/Siguiente + "Página X de Y", 100 movimientos por página). Cada ítem muestra ícono según tipo, color según signo del delta, nombre de producto, hora, usuario, badge de tipo, y cantidad con signo (verde `+` / rojo `-`).
- **`/movimientos/{id}`** (`frontend/components/movimiento-detail-screen.tsx`): ficha de un movimiento — Producto/Cantidad/Stock anterior/Stock nuevo/Proveedor siempre de solo lectura (marcados explícitamente "(solo lectura)" en la UI), con nota explicando la regla de inmutabilidad. Sección "Metadata" (Documento/Observación/Lote/Vencimiento) editable inline vía botón "Editar". **Sin botón "Eliminar" en ningún lugar de esta pantalla.**
- Diálogo "Nuevo Movimiento" (`frontend/components/new-movimiento-dialog.tsx`): único mecanismo de creación manual — Tipo (Entrada/Salida/Ajuste), Producto (selector, hasta 100 productos activos — mismo límite conocido que el resto de selectores del proyecto), Cantidad, Dirección (solo si Ajuste), Proveedor (solo si Entrada), Documento, Observación.

## Fields

Columnas reales de `movimientos` (`Movimiento::$fillable`) expuestas por `MovimientoResource`:

| Campo | Tipo | Notas |
| --- | --- | --- |
| id | int | |
| tipo | string | `entrada`, `salida`, `ajuste`, `conteo`, `transferencia` — solo los tres primeros son creables manualmente hoy (ver Validation Rules) |
| producto_id / producto / producto_codigo | FK / derivado | solo lectura siempre |
| usuario | derivado | nombre de quien generó el movimiento |
| cantidad | decimal | magnitud siempre positiva |
| delta | decimal, derivado | `stock_nuevo - stock_anterior`, con signo — uniforme para todos los tipos incluyendo un Ajuste negativo |
| stock_anterior / stock_nuevo | decimal | snapshot al momento exacto de la escritura, nunca recalculado después |
| documento | string, nullable | editable (metadata) |
| observacion | text, nullable | editable (metadata) |
| proveedor / proveedor_id | derivado / FK, nullable | solo lectura tras la creación — se fija una sola vez, solo en Entrada |
| lote | string, nullable | editable (metadata) |
| vencimiento | date, nullable | editable (metadata) |
| created_at | datetime | |

## Validation Rules

**`StoreMovimientoRequest`** (`POST /api/v1/movimientos`):

- `producto_id`: requerido, debe existir.
- `tipo`: requerido, uno de `entrada`/`salida`/`ajuste` (Conteo/Transferencia no son creables manualmente todavía — ver Edge Cases).
- `cantidad`: requerida, numérica, `min:0.01`.
- `direccion`: requerida **si y solo si** `tipo=ajuste` (`required_if` + `prohibited_unless`) — `incremento` o `decremento`.
- `proveedor_id`: opcional, debe existir, **prohibido si `tipo` no es `entrada`**.
- `costo`/`precio`: opcionales, numéricos, `min:0`.
- `documento`/`observacion`/`lote`: opcionales, string, `max:255`. `vencimiento`: opcional, fecha.

**`UpdateMovimientoRequest`** (`PATCH /api/v1/movimientos/{id}`): declara **únicamente** `documento`/`observacion`/`lote`/`vencimiento` (todos opcionales) — `cantidad`, `tipo`, `producto_id`, `proveedor_id`, `stock_anterior`, `stock_nuevo` no están declarados en las reglas, así que `$request->validated()` los excluye siempre sin importar el payload enviado (verificado por test enviando esos campos explícitamente).

## Permissions

Catálogo sembrado: `movimientos.ver`, `movimientos.crear`. Enforcement real a nivel de `MovimientoPolicy` (pertenencia de empresa vía `TenantScope`/`BelongsToEmpresa` — un usuario de la Empresa B nunca puede ver/crear/editar un movimiento de la Empresa A, verificado por test); enforcement granular por nombre de permiso (`movimientos.ver` vs `movimientos.crear` como puertas separadas) todavía no implementado, mismo estado que el resto del roadmap.

## Loading States

Spinner "Cargando movimientos..."/"Cargando movimiento..." mientras se resuelve la llamada real a la API (listado y ficha).

## Empty States

- Filtro/búsqueda sin resultados, o historial completamente vacío: `EmptyState` con ícono `SearchX`, título "No encontramos movimientos", descripción "Prueba con otro producto o tipo de movimiento", acción "Limpiar filtros". No diferenciado entre "sin datos" y "sin resultados de filtro" — mismo comportamiento que la versión mock original, no revisado en esta unidad de trabajo.
- Movimiento inexistente o de otra empresa (`/movimientos/{id}` con id inválido o ajeno): `EmptyState` con ícono `ScrollText`, título "No encontramos este movimiento".

## Error States

Errores de red/API se muestran vía `toast` (creación, edición) o el empty state de "no encontrado" (404 en la ficha) — mismo patrón que el resto de los módulos ya construidos.

## Business Rules

- **Inmutabilidad (regla central, ver nota de arquitectura arriba)**: `cantidad`, `tipo`, `producto_id`, `proveedor_id`, `stock_anterior`, `stock_nuevo` son inmutables para siempre una vez creado el movimiento. No existe DELETE físico ni lógico, ni "anular"/deshabilitar/reactivar. `update()` únicamente puede tocar metadata descriptiva. Cualquier corrección se hace registrando un Ajuste compensatorio nuevo.
- Cada movimiento guarda el snapshot de `stock_anterior`/`stock_nuevo` en el momento exacto de la escritura, no un valor recalculado después.
- El tipo de movimiento (`tipo`) determina si `cantidad` suma o resta del stock — esa lógica vive únicamente en `InventoryService::registrarMovimiento()`, nunca duplicada en el frontend ni en el controller. Ajuste es la única excepción bidireccional: el llamador pasa `direccion` (+1/-1) explícitamente; todos los demás tipos dejan que el Service decida según `tipo`.
- Una Salida que dejaría el stock en negativo se rechaza (409) — verificado por test, sin cambios de stock ni movimiento creado.
- Toda escritura de `stock_actual` sigue pasando exclusivamente por `InventoryService::registrarMovimiento()`, nunca directamente desde el controller.

## Acceptance Criteria

- [x] Cada aplicación exitosa de una detección de Captura IA genera exactamente un registro en `movimientos` con `stock_anterior`/`stock_nuevo` correctos.
- [x] Un movimiento nunca queda huérfano de su `AuditLog` correspondiente (ver `AI_Capture.md`).
- [x] La pantalla `/movimientos` consume `GET /api/v1/movimientos` real, paginado (100/página, con controles Anterior/Siguiente), filtrable por tipo/producto/documento desde el backend.
- [x] Un usuario puede registrar manualmente Entrada/Salida/Ajuste desde el módulo global, con `AuditLog` real (`movimientos.registrar_{tipo}`).
- [x] Editar un movimiento solo persiste metadata descriptiva; `cantidad`/`tipo`/`stock_nuevo` enviados en el mismo payload se ignoran siempre (verificado por test dedicado).
- [x] No existe endpoint de eliminar/deshabilitar (`DELETE` → 405; verificado por test).
- [x] Aislamiento multi-tenant verificado (Empresa B no puede ver/crear/editar movimientos de Empresa A).
- [ ] **Fuera de alcance de esta unidad**: comportamiento de los tipos de movimiento no generables hoy (compra, venta, producción, devolución, consumo, corrección) — no existe código que los emita todavía; Conteo/Transferencia existen como valores de `tipo` (heredados de Captura IA) pero no son creables desde el diálogo manual.

## Edge Cases

- Movimiento con `cantidad` fraccionaria (producto vendido/medido por unidad no entera) — el campo es `decimal`, soportado a nivel de esquema; comportamiento de UI/redondeo no verificado explícitamente en esta unidad.
- Gran volumen de movimientos históricos (miles de registros vía Demo Data RC1) — cubierto por la paginación real del backend (`paginate(100)`) y los controles Anterior/Siguiente del frontend, verificado en navegador con datos reales (miles de movimientos, más de una página).
- `tipo=conteo`/`tipo=transferencia`: valores válidos en la base de datos (los emite Captura IA) pero `StoreMovimientoRequest` los rechaza en creación manual — el módulo global de Movimientos solo permite crear Entrada/Salida/Ajuste hoy.

## Future Improvements

- Kardex por producto (ver `FUTURE/Kardex.md`, spec planificada) como vista derivada de este mismo historial de movimientos, no una tabla paralela.
- Habilitar los tipos de movimiento no cubiertos por Captura IA/creación manual (compra, venta, producción, devolución, consumo, corrección) cuando/si se construyen los módulos que los originan (`FUTURE/Purchases.md`, `FUTURE/Sales.md`).
- Exportación de movimientos (Excel/CSV/PDF) — requisito de producto concreto entregado 2026-07-29, ver capacidad compartida `FUTURE/Export.md` y el detalle específico de exportación por producto en `FUTURE/Kardex.md`.
- Campo `rol` del usuario al momento del movimiento — no existe hoy en `movimientos` (solo `usuario_id`); requerido por el mismo requisito de producto que introduce `FUTURE/Auditoria.md`, para exhibir usuario+rol sin nunca exponer el nombre real de la persona. A resolver en Technical Spec si se guarda como snapshot o se resuelve en vivo contra `model_has_roles`.
- Selector de Producto con búsqueda server-side en el diálogo "Nuevo Movimiento" — hoy carga hasta 100 productos activos (mismo límite pre-existente que otros selectores del proyecto); un catálogo más grande necesitaría `GET /productos?busqueda=` real.
