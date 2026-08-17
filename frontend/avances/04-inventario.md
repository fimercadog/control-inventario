# Fase 4 — Inventario

**Estado: COMPLETA** (Marca-Proveedor bloqueado, sin backend — INC-002, ver `pendientes.md`).

## Productos — construido

Módulo más grande del proyecto hasta ahora: listado + ficha de página completa (`/productos/[id]`, siguiendo el precedente de Usuarios — no un modal, dado el volumen de contenido: 3 tabs).

- **Listado**: búsqueda por nombre o marca (confirmado en `ProductoController::index` — usa `orWhereHas('marca', ...)`), filtro por estado y por categoría (server-side), página 100/página.
- **Crear**: nombre requerido; código/código de barras solo aquí (ausentes de `UpdateProductoRequest` — confirmado contra el Request real, no asumido, mismo patrón Identity que NIT/email). Marca y Unidad de Medida permiten elegir una existente O escribir una nueva (`marca_nuevo`/`unidad_medida_nuevo`, quick-create real del backend); Categoría es solo selección (sin `categoria_nuevo` en el backend). `stock_actual` nunca se envía — nace en 0 siempre.
- **Ficha** (3 tabs):
  - *Detalle*: todos los campos; stock actual marcado explícitamente como solo lectura.
  - *Movimientos*: historial paginado (`GET /productos/{id}/movimientos`), solo lectura.
  - *Proveedores*: asociaciones activas (`GET /productos/{id}/proveedores`), permiso propio `producto-proveedor.*` (distinto de `productos.*`), asociar/deshabilitar — sin "habilitar" (el backend no tiene esa ruta, confirmado).
- **Registrar ingreso**: formulario dedicado desde la ficha (`POST /productos/{id}/movimientos`), proveedor existente o quick-create, mismo patrón mutuamente excluyente.
- **Habilitar/Deshabilitar**: mismo patrón asimétrico `productos.editar`/`productos.gestionar`.
- Sin exportación CSV/PDF (INC-003 — sin endpoint backend).

**Archivos nuevos:** `types/{producto,producto-proveedor}.ts`, `lib/api/{productos,producto-proveedor}.ts`, `hooks/use-producto-detail.ts`, `components/forms/{producto,registrar-ingreso,producto-proveedor}-form.tsx`, `app/productos/{columns.tsx,layout.tsx,page.tsx,[id]/page.tsx}`.

**Verificación:** `tsc`/ESLint/build limpios (un error real de ESLint corregido — `set-state-in-effect` en el tab de Movimientos, resuelto con el mismo patrón de derived-staleness ya usado en el resto del proyecto). Smoke test real: crear producto → abrir ficha → registrar ingreso → verificar en tab Movimientos → tab Proveedores → deshabilitar. Todo funcionó. Ver INC-006 sobre un 401 transitorio de `/auth/refresh` encontrado y caracterizado durante este smoke test (no es un defecto de Productos).

## Producto-Proveedor — satisfecho dentro de Productos

No es una página separada — es la pestaña "Proveedores" de la Ficha de Producto (confirmado: no existe ruta `/producto-proveedor` independiente, solo anidada bajo `/productos/{id}/proveedores`).

## Stock — construido

Opera directamente sobre `Producto` (sin tabla/modelo propio, confirmado). Sin "crear". Editar solo toca `stock_minimo`/`stock_maximo` — el stock actual se muestra de solo lectura en el mismo diálogo. Deshabilitar/Habilitar tocan `stock_estado`, un campo administrativo propio de este módulo, **distinto** de `productos.estado` — nunca afecta el stock actual ni el producto en sí (confirmado contra el Controller real). El listado excluye siempre los productos con `estado` (de Producto) inactivo, sin importar el filtro de este módulo. Filtros: búsqueda (nombre/código), estado (stock_estado), "solo bajo mínimo". Permisos: `stock.ver/editar/gestionar` (sin `crear` — no existe). Sin exportación (INC-003).

## Movimientos — construido

El módulo más delicado por tratarse del ledger de inventario — auditado con cuidado extra antes de construir (ver INC-004 e INC-006 en `incidentes/INCIDENTES.md`).

- **Hallazgo importante**: `MovimientoPolicy::update()` no exige ningún permiso — solo pertenencia a la empresa. Confirmado contra el Policy real (con su propio docblock: "no existe `movimientos.editar` en el catálogo", decisión de negocio deliberada). El frontend usa `movimientos.ver` como proxy para mostrar la edición de metadata, ya que no hay un permiso dedicado que consultar.
- **Triple confirmación de que el ledger es inmutable**: `UpdateMovimientoRequest` (Request), `MovimientoController::update()` (Controller) y `MovimientoPolicy` (docblock) — los tres, independientemente, confirman que `cantidad/tipo/producto_id/proveedor_id/stock_anterior/stock_nuevo` nunca son editables, solo `documento/observacion/lote/vencimiento`. El formulario de edición de este proyecto NUNCA muestra los campos contables como editables — ni siquiera deshabilitados, directamente no existen como inputs.
- **Listado en formato de línea de tiempo** (no tabla) — decisión deliberada de UI, el propio manual lo pide explícitamente ("Listar en formato de línea de tiempo"): badge de tipo con color (verde=Entrada, rojo=Salida, ámbar=Ajuste), delta con signo, stock antes→después, búsqueda (documento o producto), filtro por tipo.
- **Crear**: selector de tipo cambia los campos mostrados — `direccion` solo para Ajuste, `proveedor_id` solo para Entrada (mutuamente excluyente con nada más, coincide con `required_if`/`prohibited_unless` reales del backend).
- Sin deshabilitar/habilitar/eliminar — no existen esas rutas, un movimiento es permanente.

**Archivos nuevos:** `types/{stock,movimiento}.ts`, `lib/api/{stock,movimientos}.ts`, `components/forms/{stock,movimiento}-form.tsx`, `app/stock/{columns.tsx,layout.tsx,page.tsx}`, `app/movimientos/{layout.tsx,page.tsx,movimiento-detail-dialog.tsx}`.

**Correcciones aplicadas antes de cerrar:** un error real de ESLint (`set-state-in-effect`) en el diálogo de detalle de Movimiento — resuelto remontando el formulario interno con `key={movimiento.id}` en vez de resetear estado dentro de un efecto; dos imports sin usar en Stock. `tsc`/ESLint/build limpios tras las correcciones.

**Verificación:** smoke test real (login QA → Stock: 100 filas reales, abrir "Editar umbrales" → Movimientos: 100 entradas reales, abrir detalle de un movimiento, confirmar que los campos contables se muestran de solo lectura). 0 errores de API reales (excluyendo el flake ya caracterizado de `/auth/refresh`, INC-006).

## Marca-Proveedor — bloqueado

Sin endpoint backend (INC-002). No se construye ninguna pantalla — la capa de modelo (Eloquent) existe pero no hay Controller/Rutas que exponerla, y `spec.md` prohíbe crearlas.
