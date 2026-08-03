# Informe Final — Implementación Completa del Módulo Movimientos (RC1)

## Resumen del trabajo realizado

Movimientos pasó de pantalla con datos simulados (`lib/mock/data.ts`, sin `MovimientoController` ni rutas propias) a módulo global completo: listar, ver, crear (Entrada/Salida/Ajuste) y editar metadata descriptiva, todo sobre `GET/POST/PATCH /api/v1/movimientos` real. Con esto se cierra la **Fase 3** del roadmap RC1 de 8 fases.

El brief genérico de esta unidad de trabajo pedía un CRUD idéntico al de Productos, incluyendo Eliminar/Desactivar/Reactivar. Antes de escribir código se confirmó explícitamente con el propietario del proyecto que eso entra en conflicto directo con la naturaleza de Movimientos: **es el registro contable (ledger) del inventario, append-only**. El alcance final, confirmado explícitamente, es:

- Un movimiento se puede **Listar**, **Ver** y **Crear** (Entrada/Salida/Ajuste).
- Un movimiento **nunca** se puede Editar en lo contable (`cantidad`/`tipo`/`producto_id`/`proveedor_id`/`stock_anterior`/`stock_nuevo`), **nunca** se puede Eliminar (ni física ni lógicamente), y **nunca** se puede Desactivar/Reactivar.
- `update()` solo puede tocar metadata descriptiva (`documento`/`observación`/`lote`/`vencimiento`), para corregir un error de tipeo sin alterar el registro contable.
- La única forma de corregir un error de fondo es registrar un nuevo movimiento compensatorio (típicamente un Ajuste), preservando el historial completo.

Esta regla queda codificada en `MovimientoController`/`MovimientoPolicy`/`UpdateMovimientoRequest` (comentarios explícitos en cada archivo) y en `docs/03_FUNCTIONAL_SPEC/Movements.md`, y pasa a ser una **regla arquitectónica del proyecto**, aplicable a todo módulo presente y futuro que toque el ledger de inventario — no una decisión de alcance puntual de esta unidad de trabajo.

## Funcionalidades implementadas

- Listar: búsqueda por producto/documento, filtro por tipo, filtro por rango de fechas (backend), paginación real (100/página, controles Anterior/Siguiente + "Página X de Y" en el frontend).
- Ver detalle (`/movimientos/{id}`): Producto/Cantidad/Stock anterior/Stock nuevo/Proveedor siempre de solo lectura, marcados explícitamente en la UI, con nota explicando la regla de inmutabilidad.
- Crear (diálogo "Nuevo Movimiento"): Entrada/Salida/Ajuste. `direccion` (Incremento/Decremento) solo se pide y solo se acepta para Ajuste, el único tipo bidireccional. Proveedor opcional solo para Entrada.
- Editar: únicamente metadata descriptiva (Documento/Observación/Lote/Vencimiento), inline en la ficha.
- Badge de tipo y color por signo del delta (verde/rojo) en listado y ficha.
- Refresco automático tras Crear/Editar (nunca requiere F5) — vía `hooks/use-crud-list.ts`, conservando filtros; tras crear, vuelve a página 1 para mostrar el movimiento nuevo.
- **Deliberadamente NO implementado, por decisión de arquitectura confirmada:** Eliminar, Desactivar/Reactivar — ninguna acción de este tipo existe en ningún endpoint ni pantalla.

## Correcciones realizadas

- **Gap de paginación real, detectado durante esta unidad de trabajo**: el listado llamaba a `GET /api/v1/movimientos` sin `page`, por lo que con datos de volumen real (miles de movimientos vía Demo Data RC1) solo los primeros 100 eran alcanzables — el resto quedaba invisible sin ningún control para pedir la siguiente página, a pesar de que el backend ya devolvía `meta.last_page` correcto. Corregido agregando `page` a `listMovimientos()` y controles Anterior/Siguiente en `/movimientos`, verificado en navegador contra datos reales (más de una página, "Página 2 de N" confirmado).
- **Regresión de sidebar, ajena a este módulo, detectada al revisar el árbol de trabajo antes de empezar**: `app-sidebar.tsx` tenía Clientes/Usuarios/Roles/Auditoría/Reportes/Perfil eliminados del menú (sin relación con Movimientos, y contradiciendo el propio comentario del archivo, que documenta que todo módulo sin backend/frontend completo debe seguir apuntando a una página real de "pendiente de implementación", nunca ocultarse). Además existían dos archivos de respaldo sin seguimiento (`app-sidebar copy.tsx`, `ui/sidebar copy.tsx`), idénticos byte a byte a las versiones ya comiteadas — consistentes con una copia de seguridad hecha antes de un experimento que nunca se revirtió. Escalado al propietario del proyecto antes de tocar nada; confirmado como no intencional. El propietario restauró `app-sidebar.tsx` manualmente durante la sesión; esta unidad de trabajo eliminó los dos archivos de respaldo ya redundantes.

## Relaciones verificadas

- `movimientos.producto_id` → `productos.id`: un movimiento siempre pertenece a un producto real; `StoreMovimientoRequest` exige `exists:productos,id`.
- `movimientos.proveedor_id` → `proveedores.id`, opcional, solo para Entrada — verificado por test (`proveedor_id` rechazado para Salida/Ajuste).
- Aislamiento multi-tenant: un usuario de la Empresa B nunca puede ver/crear/editar un movimiento de la Empresa A ni de un producto de la Empresa A (verificado por test, incluyendo el caso "producto ajeno" que debe responder 404, no 403, para no filtrar existencia).
- `InventoryService::registrarMovimiento()` sigue siendo el único punto de escritura de `stock_actual` — `MovimientoController::store()` nunca escribe stock directamente, solo orquesta el Service (verificado indirectamente por los mismos tests que ya cubrían Captura IA, que siguen en verde).

## Cambios en Backend

**Archivos creados:**

- `backend/app/Http/Controllers/Api/MovimientoController.php` (index/show/store/update — sin `destroy()`, a propósito)
- `backend/app/Http/Requests/Movimiento/StoreMovimientoRequest.php`
- `backend/app/Http/Requests/Movimiento/UpdateMovimientoRequest.php` (declara únicamente metadata descriptiva)
- `backend/tests/Feature/MovimientoControllerTest.php` (17 casos)

**Archivos modificados:**

- `backend/routes/api.php` (grupo `v1/movimientos` — `GET/POST /`, `GET/PATCH /{id}`, sin `DELETE` ni `deshabilitar`/`habilitar`)
- `backend/app/Policies/MovimientoPolicy.php` (`create()`/`update()` agregados; `delete()` se deja intacto pero sin invocar desde ningún controller)
- `backend/app/Http/Resources/Movimiento/MovimientoResource.php` (agrega `producto_id`, `producto`, `producto_codigo`, `usuario`, `delta`, `proveedor_id` — antes era una vista embebida más angosta, usada solo dentro de la Ficha de Producto)
- `backend/app/Services/InventoryService.php` (`registrarMovimiento()` acepta `?int $direccion` opcional, usado únicamente por Ajuste; todo llamador existente que no lo pase mantiene el comportamiento histórico sin cambios)

**Reutilizados sin cambios:** `Movimiento` (modelo/migración ya existían), `TipoMovimiento` (enum), `AuditLogger`.

## Cambios en Frontend

**Archivos creados:**

- `frontend/lib/api/movimientos.ts` (sin `disableMovimiento`/`enableMovimiento`/`deleteMovimiento`, a propósito)
- `frontend/components/movimiento-detail-screen.tsx`
- `frontend/components/new-movimiento-dialog.tsx`
- `frontend/app/(app)/movimientos/[id]/page.tsx`

**Archivos modificados:**

- `frontend/app/(app)/movimientos/page.tsx` (reemplaza por completo el consumo de `lib/mock/data.ts`; agrega paginación real)
- `frontend/lib/api/types.ts` (`Movimiento`, `StoreMovimientoPayload`, `UpdateMovimientoPayload`)

**Reutilizados:** `hooks/use-crud-list.ts`, `components/empty-state.tsx`, `lib/api/productos.ts` (selector de producto), `lib/api/proveedores.ts` (selector de proveedor).

**Ajeno a Movimientos, resuelto en la misma unidad de trabajo:** `frontend/components/app-sidebar.tsx` restaurado a la navegación completa (ver "Correcciones realizadas"); `frontend/components/app-sidebar copy.tsx` y `frontend/components/ui/sidebar copy.tsx` eliminados (respaldos redundantes, idénticos a las versiones ya comiteadas).

## Cambios en Base de Datos

Ninguno — `movimientos` y su migración ya existían desde antes de este roadmap (usada por Captura IA). Compatible con SQLite exclusivamente, verificado con `php artisan test` (SQLite en memoria) y con `database/database.sqlite` (datos de demo reales) sirviendo ambos servidores durante la verificación en navegador.

## Documentación actualizada

- `docs/03_FUNCTIONAL_SPEC/Movements.md` — reescrito por completo: Status Built, Business Flow con los dos caminos de creación (automático/manual), Fields/Validation Rules reales, regla de inmutabilidad como decisión de arquitectura, Acceptance Criteria marcados.
- `docs/04_TECHNICAL_SPEC/API.md` — nueva sección "Módulo Movimientos" con los 4 endpoints.
- `docs/03_FUNCTIONAL_SPEC/RC1_FUNCTIONAL_MODULE_AUDIT.md` — Movimientos pasa de ⚫ Mock/fragmentario a 🟢 Completo; estadísticas generales y sección de gaps actualizadas.
- `docs/05_IMPLEMENTATION/MovimientosModule.md` (este documento — nuevo).
- `CHANGELOG.md` — entrada nueva.

## Resultado de las pruebas

- **Backend:** `php artisan test` → **208/208 passing** (651 assertions). 17 casos nuevos en `MovimientoControllerTest`, cubriendo: registrar Entrada/Salida/Ajuste (incremento y decremento) con `stock_anterior`/`stock_nuevo`/`delta` correctos, rechazo de Salida que dejaría stock negativo (409), `direccion` requerida solo para Ajuste y prohibida para Entrada/Salida, asociación de proveedor solo válida en Entrada, listar/ver/filtrar (tipo/producto/búsqueda), editar metadata persiste y audita, editar nunca toca `cantidad`/`tipo`/`stock_nuevo` aunque se envíen explícitamente en el payload, ausencia de endpoint de eliminar/deshabilitar (405/404), aislamiento multi-tenant, rechazo sin autenticar.
- **Frontend:** `npx tsc --noEmit` → limpio. `npm run build` → build de producción exitoso, sin errores (30 rutas generadas, incluyendo `/movimientos` y `/movimientos/[id]`).
- **Browser Tests (Playwright real contra Microsoft Edge del sistema, sesión headless propia — no `chromium-cli`, no disponible en este entorno Windows):**
  1. Login real (`test@example.com`) → Dashboard.
  2. `/movimientos`: línea de tiempo real agrupada por día, con datos de Demo Data RC1 (miles de movimientos reales, no mock) — sin ningún indicador de "pendiente de implementación".
  3. Búsqueda con término sin resultados → empty state correcto.
  4. Diálogo "Nuevo Movimiento" abre correctamente.
  5. Click en un movimiento real → ficha de detalle: Producto/Cantidad/Stock anterior/Stock nuevo de solo lectura confirmados, **botón "Eliminar" confirmado ausente**, botón "Editar" presente.
  6. Edición de metadata (Observación) → Guardar → persistencia confirmada.
  7. Paginación real: total reportado en el header coincide con `meta.total`; botón "Siguiente" avanza a "Página 2 de N" contra datos reales.
  8. Responsive (390px): listado usable.
  9. Sidebar: Movimientos, Clientes, Usuarios, Roles, Auditoría, Reportes y Perfil, los siete presentes — confirmado tras la restauración.
  10. `console --errors`: sin errores de JavaScript (el único mensaje de consola observado fue un 401 esperado del ciclo normal de refresh de token, no un fallo de la pantalla).

## Estado final del módulo

🟢 **Completo** — cumple el alcance de "Global CRUD Standard" adaptado a la naturaleza append-only de un ledger contable (sin Eliminar/Desactivar, por diseño arquitectónico, no por omisión), con el mismo nivel de calidad y comportamiento (búsqueda, filtros, paginación real, confirmaciones, refresco automático, responsive) que el resto de los módulos ya cerrados. Ningún gap funcional conocido dentro del alcance confirmado.

Con este módulo, la **Fase 3 del roadmap RC1 queda oficialmente completa**. La siguiente fase del roadmap aprobado es Fase 4 (Usuarios), pendiente de aprobación explícita del propietario del proyecto.

## Ampliación 2026-08-03 — Legibilidad del historial (stock antes/después, origen, evidencia)

### Contexto

El propietario del proyecto reportó que la pantalla, aunque técnicamente correcta, no era clara: mostrar solo "Salida -12,03" da la impresión de que el inventario puede quedar negativo, porque el usuario no ve el stock resultante sin calcularlo mentalmente. Pidió mostrar para cada movimiento: tipo, cantidad, stock antes, stock después, unidad de medida, usuario, fecha, origen (Manual/Captura IA/Import) y disponibilidad de evidencia — explícitamente **sin cambiar la lógica de negocio**, solo la presentación. Verificado antes de codificar: el stock antes/después ya se guardaba y se mostraba (por separado); lo que faltaba era unidad de medida, origen y evidencia, y una presentación que conectara ambos valores visualmente.

### Funcionalidades implementadas (ampliación)

- `Movimiento::capturaDetalle()` — relación `HasOne` nueva hacia `CapturaIADetalle`, únicamente para poder derivar evidencia; no es un campo de negocio nuevo.
- `MovimientoResource` expone 3 campos derivados, solo de presentación: `unidad_medida` (abreviatura desde `producto.unidadMedida`), `origen` (`manual`/`captura_ia`, derivado de la convención ya existente `documento === 'captura_ia'`), `tiene_evidencia` (bool, `true` solo si hay un `CapturaIADetalle` vinculado con `archivo_path` no nulo).
- Los 4 call sites de eager loading en `MovimientoController` (`index`/`show`/`store`/`update`) amplían su `with()`/`load()` a `producto.unidadMedida` y `capturaDetalle.captura`.
- Frontend `/movimientos`: cada fila agrega una sub-línea "Stock: X → Y `unidad`" con ícono de flecha, badge de origen, e ícono de evidencia con tooltip.
- Frontend `/movimientos/{id}`: stock antes/después combinados en una sola fila "X → Y"; filas nuevas Origen y Evidencia.

### Correcciones realizadas (ampliación)

- **Bug real de framework, encontrado por verificación directa antes de dar el campo por terminado**: la primera versión de `tiene_evidencia` usaba `whenLoaded('capturaDetalle', fn (...) => ..., false)`. `ConditionallyLoadsAttributes::whenLoaded()` de Laravel corta en corto y devuelve `null` (sin invocar el closure) cuando el valor de la relación cargada es en sí `null` — es decir, para cualquier movimiento SIN evidencia (la mayoría), el campo nunca se computaba y el `default` tampoco se aplicaba correctamente. Corregido comprobando `relationLoaded('capturaDetalle')` explícitamente en vez de depender de `whenLoaded()`, confirmado con test dedicado.

### Cambios en Backend (ampliación)

**Archivos modificados:** `backend/app/Models/Movimiento.php`, `backend/app/Http/Controllers/Api/MovimientoController.php`, `backend/app/Http/Resources/Movimiento/MovimientoResource.php`, `backend/tests/Feature/MovimientoControllerTest.php` (4 casos nuevos).

### Cambios en Frontend (ampliación)

**Archivos modificados:** `frontend/lib/api/types.ts` (`unidad_medida`/`origen`/`tiene_evidencia` en `Movimiento`), `frontend/app/(app)/movimientos/page.tsx`, `frontend/components/movimiento-detail-screen.tsx`.

### Resultado de las pruebas (ampliación)

- **Backend:** `php artisan test` → **380/380 passing** (era 366/366 antes de esta ampliación — 4 tests nuevos en `MovimientoControllerTest`, el resto del delta corresponde a la ampliación paralela de Clientes/Proveedores en la misma unidad de trabajo, ver `CustomersModule.md`).
- **Frontend:** `npx tsc --noEmit` limpio.
- **Browser tests (reales)**: fila de listado muestra "Stock: X → Y" con ícono de flecha y sufijo de unidad; ficha de detalle muestra la fila combinada Stock anterior→nuevo más Origen/Evidencia; cero errores de consola.

## Estado final del módulo (post-ampliación)

🟢 **Completo** — el historial de movimientos ahora se explica solo, sin requerir cálculo mental: cada fila y cada ficha muestran tipo, cantidad, stock antes→después, unidad, usuario, fecha, origen y evidencia. Sin cambios de lógica de negocio — únicamente presentación, tal como se pidió explícitamente.

## Control de versiones

- **Rama:** `main`.
- **Commit original (módulo base, RC1 Fase 3):** `d31eaa7` — `feat(movimientos): implement complete Movimientos module as an append-only ledger (RC1)`.
- **Commits de esta ampliación:**
  1. `b609456` — `fix(clientes,proveedores): capture full audit diff, enforce unique email per company`. **Nota de transparencia:** el mensaje de este commit solo describe el lado Clientes/Proveedores, pero su diff real también incluye completo el trabajo de esta ampliación de Movimientos (`MovimientoController.php`, `MovimientoResource.php`, `Movimiento.php`, `MovimientoControllerTest.php`, y los 3 archivos de frontend) — ambas unidades de trabajo se codificaron en paralelo en la misma sesión y se comitearon juntas por error de alcance del mensaje, no del contenido. Verificado con `git show --stat b609456` antes de escribir esta nota. Se decidió no usar `git commit --amend` (regla permanente del propietario del proyecto: crear commits nuevos, nunca amend) — se documenta aquí en su lugar.
  2. `2c14cec` — `style(backend): apply Pint formatting to previously touched files` (formato únicamente, sin cambio de comportamiento).

## Confirmación de push

✅ Ejecutado correctamente: `795f878..2c14cec  main -> main` contra `origin` (GitHub).

## Estado del informe

☐ Pendiente
☐ Requiere correcciones
**☑ Aprobado — pendiente de confirmación del propietario del proyecto**
