# Informe Final — Módulo Reportes (Vertical Slice Completo, ampliado a Centro de Reportes)

## Resumen del trabajo realizado

Tercer módulo de la secuencia vertical-slice Roles→Auditoría→Reportes→Perfil, construido después de que Auditoría quedara 100% cerrado (implementado, probado, documentado, comiteado y empujado). A diferencia de los tres módulos anteriores, "Reportes" no tiene un modelo Eloquent propio: agrega en vivo sobre 5 modelos ya existentes (Producto, Movimiento, Cliente, Proveedor, ProductoProveedor). El borrador original (`docs/03_FUNCTIONAL_SPEC/FUTURE/Reports.md`) llamaba a este mismo alcance "el único candidato remotamente viable" — Ventas y Compras, los otros reportes que ese borrador imaginaba, siguen bloqueados porque esos módulos de negocio no existen.

## Funcionalidades implementadas

- **Base de Datos**: sin migración nueva — todas las tablas fuente ya existían. Único agregado: el permiso `reportes.ver`.
- **Domain**: `ReporteRepository` (4 métodos de agregación real: `resumenInventario()`, `resumenMovimientos($desde, $hasta)`, `resumenClientes()`, `resumenProveedores()`, todos confiando en el `TenantScope` ya existente de los 5 modelos fuente, sin filtrar `empresa_id` a mano), `ReporteService` (resuelve el rango de fechas por defecto — últimos 30 días — y compone las 4 secciones en un único payload). **Sin Policy propia, a propósito**: sin un modelo natural al que atarla, `ReporteController::index()` llama `$this->authorize('reportes.ver')` directo — verificado contra el código fuente de `spatie/laravel-permission` (`PermissionRegistrar::registerPermissions()`) antes de escribir el Controller, no asumido: Spatie registra un `Gate::before()` global que resuelve cualquier nombre de ability contra los permisos del usuario, el mismo mecanismo que usa `$user->can(...)` dentro de cada Policy existente.
- **API**: `ReporteController` (un único método `index`), ruta `GET /api/v1/reportes` (`desde`/`hasta` opcionales). Sin `POST`/`PATCH`/`DELETE` — "Reportes" es una vista, no un recurso.
- **Tests**: `ReporteControllerTest` — 13 casos: resumen completo con las 4 secciones, inventario refleja datos reales de productos conocidos (total, valor, stock bajo, sin stock), agrupación por categoría, movimientos solo cuentan lo que cae dentro del rango solicitado, ranking de productos más movidos, resumen de clientes, resumen y ranking de proveedores, rango de fechas por defecto (últimos 30 días), rango de fechas personalizado, **ningún dato de la Empresa B aparece jamás en el reporte de la Empresa A** (test dedicado, con datos reales en dos empresas), sin endpoint de escritura (405), 401 sin autenticar, 403 sin permiso.
- **Frontend**: `/reportes` — selector de rango de fechas (con una etiqueta explícita de qué rango está activo, para dejar claro que solo afecta la sección Movimientos), tarjetas KPI reutilizando `StatCard` (el mismo componente que ya usaba el Dashboard), un gráfico de barras de entradas vs. salidas por día en CSS puro (sin agregar ninguna librería de gráficos nueva al proyecto), y listas de "Productos con más movimiento", "Productos por categoría" y "Proveedores principales". Redux (`reportes-slice.ts`) — segundo módulo 100% de solo lectura tras Auditoría, un único thunk de fetch.
- **Sidebar**: `Reportes` pasa de ruta inexistente a entrada real con `permission: "reportes.ver"`, ubicada junto a Dashboard (no bajo "Administración", donde viven Roles/Auditoría) — es una vista de insights de negocio, no un módulo administrativo.

## Correcciones realizadas

- **Bug real de larga data encontrado en `RoleSeeder.php`, sin relación directa con Reportes**: al intentar sincronizar el nuevo permiso `reportes.ver` en la base de datos de desarrollo, se descubrió que `$permisos->only($nombresPermisos)->values()` devolvía siempre una colección vacía. Causa raíz: `$permisos` es un `Illuminate\Database\Eloquent\Collection` (resultado de `Permission::get()->keyBy('name')`), y `Eloquent\Collection::only()` está sobreescrito para filtrar por **primary key**, no por las claves asignadas vía `keyBy()` — un comportamiento distinto del `only()` de la `Support\Collection` base. Esto significa que `RoleSeeder::crear()` nunca sincronizó correctamente los permisos de ningún rol demo desde que ese código se escribió: cada re-ejecución vaciaba silenciosamente `role_has_permissions` en vez de poblarlo con el conjunto correcto. Los roles demo de la base de datos de desarrollo tenían permisos correctos únicamente porque `RoleSeeder` nunca se había vuelto a ejecutar sobre una empresa ya existente hasta este módulo — la primera vez que se ejecutó (para sincronizar `reportes.ver`), el bug se manifestó y vació los permisos de los 10 roles demo (5 roles × 2 empresas) en la base de datos de desarrollo. **Corregido** con `$permisos->toBase()->only($nombresPermisos)->values()` (fuerza la colección a `Support\Collection` antes de filtrar). Sin impacto en la suite de tests — ningún test pasa por `RoleSeeder`, cada uno otorga permisos directamente en su propio `setUp()`. Impacto exclusivo en datos demo de la base de datos de desarrollo local, restaurados re-ejecutando el seeder ya corregido para ambas empresas.
- **Colisión de `key` de React, encontrada en verificación de navegador con datos reales**: dos productos demo distintos ("Suplemento articular 1 kg") compartían exactamente el mismo nombre pero eran registros distintos (`id` diferente) — la lista "Productos con más movimiento" los usaba como key de React vía el nombre, causando una colisión real (`Encountered two children with the same key`) visible en consola. La misma clase de bug existía latente en "Productos por categoría" y "Proveedores principales" (nunca se manifestó porque los datos demo no tenían nombres duplicados ahí, pero el riesgo era idéntico). **Corregido** exponiendo el `id` real de cada fila (`producto_id`/`categoria_id`/`proveedor_id`) desde `ReporteRepository` y usándolo como key en las tres listas del frontend, en vez del nombre — cierra la clase completa del bug, no solo la instancia que se manifestó.

## Relaciones verificadas

- `ReporteRepository` respeta el `TenantScope` ya existente de los 5 modelos fuente sin necesitar filtrar `empresa_id` a mano en ningún punto — verificado con un test que crea datos reales en dos empresas distintas y confirma que el reporte de la Empresa A nunca ve ni cuenta los de la Empresa B.
- `productos_por_categoria` respeta la relación `Producto.categoria_id → Categoria.id` vía join; `top_proveedores` respeta `ProductoProveedor.proveedor_id → Proveedor.id`, filtrado además por `estado = 'activo'` en la asociación (una asociación deshabilitada no cuenta hacia el ranking de un proveedor).
- Ningún test de aislamiento multi-tenant existente se rompió — la fuga cross-company es exactamente el escenario que este módulo prueba explícitamente.

## Cambios en Backend

**Archivos creados:**

- `backend/app/Repositories/ReporteRepository.php`
- `backend/app/Services/ReporteService.php`
- `backend/app/Http/Controllers/Api/ReporteController.php`
- `backend/tests/Feature/ReporteControllerTest.php`

**Archivos modificados:**

- `backend/routes/api.php` (`GET /api/v1/reportes`)
- `backend/database/seeders/PermissionSeeder.php` (permiso nuevo `reportes.ver`)
- `backend/database/seeders/RoleSeeder.php` (Supervisor y Auxiliar Contable ganan `reportes.ver`; corrección del bug `only()` descrito arriba)

## Cambios en Frontend

**Archivos creados:**

- `frontend/lib/api/reportes.ts`
- `frontend/store/slices/reportes-slice.ts`
- `frontend/app/(app)/reportes/page.tsx`

**Archivos modificados:**

- `frontend/lib/api/types.ts` (`ReporteResumen`, `ReporteFiltros`)
- `frontend/store/store.ts` (`reportes` reducer registrado)
- `frontend/components/app-sidebar.tsx` (entrada real de Reportes, junto a Dashboard)

## Cambios en Base de Datos

- Sin migración nueva.
- 1 permiso nuevo (`reportes.ver`) — catálogo total: 45 → 46.
- Sin datos demo nuevos — el módulo agrega sobre datos ya sembrados por los seeders de Productos/Movimientos/Clientes/Proveedores existentes.
- **Efecto colateral corregido**: los permisos de los 10 roles demo (5 roles × 2 empresas) quedaron vacíos temporalmente durante la investigación del bug de `RoleSeeder` descrito arriba, y fueron restaurados re-ejecutando el seeder ya corregido antes de dar el módulo por verificado.

## Documentación actualizada

- `docs/03_FUNCTIONAL_SPEC/Reports.md` (nuevo, `Status: Built`) — reemplaza `docs/03_FUNCTIONAL_SPEC/FUTURE/Reports.md` (eliminado), con el alcance real acotado a los 5 módulos que sí existen.
- `docs/03_FUNCTIONAL_SPEC/FUTURE/README.md` — fila de `Reports.md` removida de la tabla de specs planeadas, nota de "graduado" agregada.
- `docs/04_TECHNICAL_SPEC/API.md` — nueva sección "Reportes".
- `docs/security/ROLES_MATRIX.md` — catálogo de permisos, secciones 2/3/4/5, y resumen de gaps actualizados (Gap 9 nuevo, incluye el hallazgo de `RoleSeeder`).
- `docs/03_FUNCTIONAL_SPEC/RC1_FUNCTIONAL_MODULE_AUDIT.md` — Reportes pasa de 🔴 NOT IMPLEMENTED a 🟢 COMPLETE (fila resumen + sección detallada); totales 🟢13·🟡2·🔴1 (Perfil, único restante).
- `docs/05_IMPLEMENTATION/ReportesModule.md` (este documento — nuevo).
- `CHANGELOG.md` — entrada nueva.

## Resultado de las pruebas

- **Backend:** `php artisan test` → **297/297 passing** (era 284/284 antes de esta unidad de trabajo — 13 tests nuevos, `ReporteControllerTest`).
- **Frontend:** `npx tsc --noEmit` limpio.
- **Browser tests (reales, Playwright + Microsoft Edge del sistema)**: login real, sidebar con Reportes visible junto a Dashboard, estadísticas reales verificadas visualmente (497 productos activos, $16.787.550 de valor de inventario, 3 con stock bajo, 1 sin stock, 701 entradas/368 salidas/236 ajustes en el rango por defecto, gráfico de barras por día renderizando correctamente, listas de productos/categorías/proveedores sin colisiones de key tras la corrección), selector de rango de fechas actualiza la sección Movimientos correctamente, cero errores de consola tras las dos correcciones descritas arriba.

## Ampliación 2026-08-03 — Centro de Reportes Completo

### Contexto

Tras cerrar los 4 módulos de la secuencia vertical-slice (Roles→Auditoría→Reportes→Perfil), el propietario del proyecto pidió expandir el Reportes existente (dashboard de solo lectura, sin exportación por diseño) en el centro de reportes completo del ERP: catálogo de 13 reportes, exportación PDF/Excel/CSV, historial de ejecuciones, infraestructura de reportes programados. Requisito explícito: **un único módulo de Reportes** — no un segundo módulo paralelo. Confirmado con el propietario vía pregunta directa antes de codificar (expandir el existente vs. construir uno nuevo).

### Funcionalidades implementadas (ampliación)

- **Base de Datos**: 2 migraciones nuevas — `reporte_historial` (log inmutable de ejecuciones, mismo patrón que `AuditLog`) y `reportes_programados` (definiciones de reporte programado, infraestructura sin motor de ejecución, mismo patrón que `captura-ia.gestionar`). Permiso nuevo: `reportes.gestionar` (catálogo 46 → 47).
- **Domain — arquitectura de 13 reportes independientes**: `App\Contracts\Reports\Reporte` (interfaz: `clave()`, `nombre()`, `descripcion()`, `filtrosDisponibles()`, `generar()`), `App\DTO\Report\ReporteResultadoDTO` (forma de resultado común `columnas`+`filas`+`resumen`+`total`), 13 clases en `App\Reports\` (una por reporte), `AplicaPaginacion` (trait compartido para el flag preview/export) y `TerceroReporteBase` (base compartida por Proveedores/Clientes, mismo shape de columnas). Reutilización deliberada sobre duplicación: `StockBajoReporte extends StockActualReporte`, `ReporteProveedores`/`ReporteClientes extends TerceroReporteBase`, `InventarioResumenReporte`/`ReporteAuditoria` reutilizan `ReporteRepository`/`AuditLogRepository` existentes.
- **Domain — Repository/Service/Policy**: `ReporteRepository` ampliado (`registrarEjecucion()`, `historial()`, CRUD de programados). `ReporteService` ampliado (`CATALOGO` registry, `resolverReporte()`, `generarReporte()` — resuelve+genera+registra). `ReportePolicy` nueva — primera Policy del proyecto que cubre 2 modelos Eloquent a la vez (`ReporteHistorial`, `ReporteProgramado`), registrada explícitamente vía `Gate::policy()` en `AppServiceProvider::boot()` porque el auto-discovery de Laravel espera una Policy por modelo.
- **API**: `ReporteController` ampliado de 1 a 10 métodos (`catalogo`, `preview`, `exportarPdf/Excel/Csv`, `historial`, `programadosIndex/Store/Destroy`, además del `index` original) — nunca contiene lógica de un reporte específico, todo delega al Service. Rutas estáticas (`catalogo`/`historial`/`programados`) declaradas antes de la wildcard `{clave}` a propósito.
- **Exportación**: `ReporteExportService` (orquestador genérico), `ReporteExcelExport` (maatwebsite/excel, `FromCollection`+`WithHeadings`+`WithTitle`), `resources/views/reports/pdf.blade.php` (dompdf, A4 landscape), CSV vía `fputcsv` con BOM UTF-8. Los tres trabajan exclusivamente sobre `columnas`/`filas` del DTO — agregar un reporte 14 nunca los toca.
- **Frontend**: `/reportes` pasó a 3 pestañas (Resumen sin cambios, Catálogo nueva, Historial nueva). `/reportes/{clave}` — página de preview con formulario de filtros generado dinámicamente desde `filtros_disponibles` (selects de `categoria_id`/`marca_id`/`producto_id` resuelven contra las APIs reales de Categorías/Marcas/Productos), tabla paginada, exportación PDF/Excel/CSV/Imprimir vía descarga de blob real. Sigue el patrón establecido de página-servidor-delgada + componente-cliente (`components/reporte-preview-screen.tsx`) usado por toda otra ficha de detalle del ERP.
- **Dependencias nuevas**: `barryvdh/laravel-dompdf` (^3.1), `maatwebsite/excel` (^3.1, trae `phpoffice/phpspreadsheet`). Requirieron habilitar la extensión `gd` de PHP (estaba deshabilitada en el entorno local).

### Correcciones realizadas (ampliación)

- **Bug de datos en `MovimientoSeeder`, encontrado en verificación de navegador del nuevo reporte Kardex**: el saldo corrido no reconciliaba entre filas consecutivas para un mismo producto. Investigado hasta la causa raíz mediante inspección directa de filas crudas — cada fila era internamente consistente (`stock_nuevo - stock_anterior == cantidad`), pero filas consecutivas no lo eran (`stock_anterior` de una fila no coincidía con `stock_nuevo` de la anterior en orden cronológico). Causa: el seeder calculaba `stock_anterior`/`stock_nuevo` en el orden real de inserción (correcto, vía `InventoryService::registrarMovimiento()`), pero **después** reasignaba `created_at` a una fecha aleatoria independiente de ese orden — cualquier lector que ordenara por `created_at` (como Kardex) veía una secuencia desordenada. `KardexProductoReporte` en sí mismo estaba bien escrito — solo lee lo que el seeder ya calculó, tal como documenta su propio comentario de diseño. **Confirmado con el propietario del proyecto antes de corregir** (implica reseedear toda la base de datos de desarrollo, acción de blast radius amplio). Corregido: las fechas se generan y se ordenan ascendentemente ANTES de crear los movimientos, no después — así inserción y cronología coinciden, igual que en producción. Verificado tras `migrate:fresh --seed`: saldo reconciliando en 17/17 filas consecutivas de un producto muestreado (antes: 0/N).
- **Nombre de tabla de `ReporteProgramado` sin declarar explícitamente**: el default de Eloquent (`reporte_programados`, singular "reporte") no coincidía con el nombre real de la tabla creada por la migración (`reportes_programados`, plural) — encontrado por los tests de la nueva suite fallando con "no such table". Corregido agregando `protected $table = 'reportes_programados'` al modelo.
- **Tipo de retorno incorrecto en `ReporteExportService::excel()`**: `Excel::download()` de maatwebsite/excel devuelve `Symfony\Component\HttpFoundation\BinaryFileResponse`, no `Illuminate\Http\Response` — encontrado por un `TypeError` real al probar el export en `tinker`, no por análisis estático. Corregido el type hint en el Service y en el Controller.

### Cambios en Backend (ampliación)

**Archivos creados:**

- `backend/database/migrations/2026_08_03_023441_create_reporte_historial_table.php`
- `backend/database/migrations/2026_08_03_023441_create_reportes_programados_table.php`
- `backend/app/Models/ReporteHistorial.php`, `backend/app/Models/ReporteProgramado.php`
- `backend/app/Contracts/Reports/Reporte.php`
- `backend/app/DTO/Report/ReporteResultadoDTO.php`
- `backend/app/Reports/` — 13 clases + `Concerns/AplicaPaginacion.php` + `Concerns/TerceroReporteBase.php`
- `backend/app/Policies/ReportePolicy.php`
- `backend/app/Services/Reports/ReporteExportService.php`
- `backend/app/Exports/ReporteExcelExport.php`
- `backend/app/Http/Requests/Reporte/StoreReporteProgramadoRequest.php`
- `backend/resources/views/reports/pdf.blade.php`
- `backend/tests/Feature/ReporteCatalogoPreviewTest.php`, `ReporteExportTest.php`, `ReporteHistorialTest.php`, `ReporteProgramadoControllerTest.php`

**Archivos modificados:**

- `backend/app/Repositories/ReporteRepository.php` (historial + programados)
- `backend/app/Repositories/AuditLogRepository.php` (`paginar()` gana un tercer parámetro opcional `?int $pagina`, backward-compatible, para que `ReporteAuditoria` pueda controlar la página exportada sin mutar el `Request` global)
- `backend/app/Services/ReporteService.php` (catálogo + dispatch + programados)
- `backend/app/Http/Controllers/Api/ReporteController.php` (10 métodos)
- `backend/app/Providers/AppServiceProvider.php` (`Gate::policy()` para `ReportePolicy`)
- `backend/database/seeders/PermissionSeeder.php` (`reportes.gestionar`)
- `backend/database/seeders/RoleSeeder.php` (Supervisor gana `reportes.gestionar`)
- `backend/database/seeders/MovimientoSeeder.php` (fix de orden cronológico, ver arriba)
- `backend/routes/api.php` (10 rutas bajo `/reportes`)
- `backend/composer.json`/`composer.lock` (`barryvdh/laravel-dompdf`, `maatwebsite/excel`)

### Cambios en Frontend (ampliación)

**Archivos creados:**

- `frontend/app/(app)/reportes/[clave]/page.tsx`
- `frontend/components/reporte-preview-screen.tsx`
- `frontend/components/reportes/reporte-filtros-form.tsx`, `reportes-catalogo-tab.tsx`, `reportes-historial-tab.tsx`
- `frontend/lib/download.ts`

**Archivos modificados:**

- `frontend/app/(app)/reportes/page.tsx` (3 pestañas)
- `frontend/lib/api/reportes.ts` (`getCatalogoReportes`, `previewReporte`, `exportarReporte`, `getHistorialReportes`)
- `frontend/lib/api/types.ts` (`ReporteCatalogoItem`, `ReporteFiltroDisponible`, `ReporteColumna`, `ReporteResultado`, `ReporteHistorialItem`, `PaginatedReporteHistorial`)
- `frontend/store/slices/reportes-slice.ts` (estado + thunks de catálogo/preview/historial, `resumen` sin cambios)

### Cambios en Base de Datos (ampliación)

- 2 tablas nuevas: `reporte_historial`, `reportes_programados`.
- 1 permiso nuevo (`reportes.gestionar`) — catálogo total: 46 → 47.
- **Reseed completo de la base de datos de desarrollo** (`migrate:fresh --seed`) para aplicar el fix de `MovimientoSeeder` — acción confirmada explícitamente con el propietario del proyecto antes de ejecutarla, dado su alcance (regenera todos los datos demo de ambas empresas).

### Resultado de las pruebas (ampliación)

- **Backend:** `php artisan test` → **342/342 passing** (era 311/311 antes de esta ampliación — 31 tests nuevos en 4 suites nuevas).
- **Frontend:** `npm run type-check` limpio. `npm run lint`: mismos 19 errores pre-existentes de `react-hooks/set-state-in-effect`/`react-hooks/refs` que ya fallaban en 7 archivos no tocados por esta ampliación (`product-detail-screen.tsx`, `role-detail-screen.tsx`, etc.) — el archivo nuevo (`reporte-preview-screen.tsx`) sigue exactamente el mismo patrón ya establecido en el resto del código, no una regresión nueva.
- **Browser tests (reales, agente de automatización de navegador contra Chrome)**: login real, las 3 pestañas de `/reportes` funcionando (Resumen sin regresión, Catálogo con las 13 tarjetas, Historial reflejando ejecuciones reales de la propia sesión), preview de "Stock Actual" con datos reales (497 filas) y filtro por categoría funcionando (497→28 filas verificadas), Kardex exigiendo `producto_id` correctamente sin crashear, exportación PDF/Excel/CSV verificada a nivel de red (status 200, content-type correcto, tamaño de archivo real coincidente con `Content-Length`). Cero errores de consola en toda la sesión. El bug de reconciliación del saldo de Kardex (ver Correcciones realizadas) se encontró y confirmó corregido en esta misma verificación, con una segunda pasada dedicada tras el reseed.

## Estado final del módulo

🟢 **Completo** — Reportes es ahora el centro de reportes completo del ERP: 13 reportes independientes con arquitectura extensible (agregar un reporte 14 no toca ninguno de los 13 existentes ni los renderizadores de exportación), exportación real a 3 formatos, historial de ejecuciones, infraestructura de reportes programados, 44 tests en verde, y documentación actualizada en los 4 documentos afectados (`Reports.md`, `API.md`, `ROLES_MATRIX.md`, `RC1_FUNCTIONAL_MODULE_AUDIT.md`).

## Control de versiones

- **Rama:** `main`.
- **Commits de esta ampliación** (orden cronológico):
  1. `fa00d77` — `feat(reportes): expand into a 13-report catalog with history and scheduled-report infrastructure`
  2. `9454743` — `feat(reportes): add catalog/preview/export API endpoints with PDF, Excel, and CSV renderers`
  3. `ccdce71` — `test(reportes): validate the expanded reports module end-to-end`
  4. `99fec2b` — `fix(movimientos): generate seeded movements in true chronological order`
  5. `2c23919` — `feat(reportes): build the report catalog, preview, and export UI`
- **Commit original (módulo base, 2026-08-02):** `882b26e` — `feat(reportes): implement Reportes as a complete read-only vertical slice (RC1 Module 3/4)`.

## Confirmación de push

✅ Ver commit de este mismo documento para el hash final y la confirmación de `git push` — reportados en el mensaje de cierre de esta unidad de trabajo.

## Estado del informe

☐ Pendiente
☐ Requiere correcciones
**☑ Aprobado — pendiente de confirmación del propietario del proyecto**
