# Reportes

**Status: Built (2026-08-02, tercer módulo de la secuencia vertical-slice Roles→Auditoría→Reportes→Perfil)**

> Verificado contra `backend/app/Repositories/ReporteRepository.php`, `backend/app/Services/ReporteService.php`, `backend/app/Http/Controllers/Api/ReporteController.php`, `backend/routes/api.php`, `backend/tests/Feature/ReporteControllerTest.php`, `frontend/app/(app)/reportes/`. Reemplaza `docs/03_FUNCTIONAL_SPEC/FUTURE/Reports.md` (Status: Planned, "el más especulativo de los seis borradores" — la mayoría de sus reportes propuestos, Ventas/Compras, dependen de módulos que no existen). El alcance real construido aquí es exactamente el que el propio borrador identificó como "el único candidato remotamente viable": estadísticas reales sobre Productos/Inventario/Movimientos/Clientes/Proveedores — los cinco módulos que sí existen.

## Purpose

Dar visibilidad gerencial real sobre el estado del inventario y la actividad reciente de la empresa — sin inventar datos, sin depender de módulos que no existen (Ventas/Compras). Cada número mostrado es una agregación en vivo sobre las tablas reales (`productos`, `movimientos`, `clientes`, `proveedores`, `producto_proveedor`), no una simulación ni un valor pre-calculado.

## Business Flow

1. Un usuario con `reportes.ver` abre `/reportes`.
2. El frontend pide `GET /reportes` (con `desde`/`hasta` opcionales) y recibe un único payload compuesto con 4 secciones: `inventario`, `movimientos`, `clientes`, `proveedores`.
3. **`inventario`, `clientes` y `proveedores` son estado actual** — no dependen del rango de fechas, siempre reflejan la foto de ahora mismo (ej. "3 productos con stock bajo" es verdad hoy, sin importar qué rango se seleccionó).
4. **`movimientos` sí depende del rango** — entradas/salidas/ajustes, su evolución día a día, y los productos con más movimiento, todos acotados a `desde`/`hasta` (por defecto, los últimos 30 días).
5. No hay ninguna acción de escritura en este módulo — "Reportes" es una vista computada, no un recurso persistido.

## Actors

- **Usuario con `reportes.ver`**: puede ver el resumen completo de su propia empresa. Un único permiso — no hay una acción distinta que "gestionar" en un módulo 100% de solo lectura.

## Screens

- **`/reportes`** (`frontend/app/(app)/reportes/page.tsx`): selector de rango de fechas (afecta solo la sección Movimientos, con una etiqueta explícita del rango activo para evitar confundir "estado actual" con "período seleccionado"); tarjetas KPI (`StatCard`, componente ya existente, reutilizado del Dashboard) para Inventario (productos activos, valor total, stock bajo, sin stock) y Movimientos (entradas/salidas/ajustes); un gráfico de barras simple en CSS puro (sin librería externa) de entradas vs. salidas por día; listas de "Productos con más movimiento", "Productos por categoría" y "Proveedores principales"; tarjetas KPI de Clientes/Proveedores al final.

## Fields

Sin tabla ni modelo propio — "Reportes" agrega sobre 5 tablas ya existentes (`productos`, `movimientos`, `clientes`, `proveedores`, `producto_proveedor`, más `categorias` para el desglose por categoría). Forma completa del payload:

| Sección | Campos |
|---|---|
| `rango` | `desde`, `hasta` (rango efectivamente aplicado — el resuelto por defecto si no se pasó ninguno) |
| `inventario` | `total_productos`, `valor_total_inventario` (`SUM(stock_actual * costo)`), `productos_stock_bajo`, `productos_sin_stock`, `productos_por_categoria` (top 10, con `categoria_id`) |
| `movimientos` | `entradas`/`salidas`/`ajustes` (cada uno `{total, cantidad}`), `por_dia` (array de `{fecha, entradas, salidas, ajustes}`), `productos_mas_movidos` (top 10, con `producto_id`) |
| `clientes` | `total_activos`, `total_inactivos`, `nuevos_ultimos_30_dias` |
| `proveedores` | `total_activos`, `total_inactivos`, `top_proveedores` (top 10 por productos asociados activos, con `proveedor_id`) |

## Validation Rules

`desde`/`hasta` son opcionales; si se omiten, el rango por defecto es "hoy y los 29 días anteriores" (30 días). No hay validación de formulario — no hay ningún formulario, es una vista de solo lectura con filtros de consulta.

## Permissions

`reportes.ver` — permiso nuevo, sembrado en esta unidad de trabajo. Otorgado a Administrador (automático, vía `Permission::all()`), Supervisor y Auxiliar Contable en los datos demo — los mismos roles que ya tenían `auditoria.ver`, coherente con el enfoque "gerencial" del módulo.

## Loading States

Estado de carga inicial (`loading && !resumen`) muestra un spinner de página completa; recargas subsecuentes (cambio de rango de fechas) mantienen el contenido anterior visible mientras se resuelve el nuevo fetch, sin parpadeo de pantalla en blanco.

## Empty States

Cada lista (productos con más movimiento, productos por categoría, proveedores principales, entradas/salidas por día) tiene su propio `EmptyState` independiente — una empresa nueva sin movimientos en el rango seleccionado ve "Sin movimientos" en esas dos secciones específicas, mientras Inventario/Clientes/Proveedores (estado actual) siguen mostrando sus números reales normalmente.

## Error States

Fetch fallido muestra un `EmptyState` de error de página completa ("No pudimos cargar los reportes"). Sin `reportes.ver`: 403 real del backend.

## Business Rules

- **Ningún dato es simulado o pre-calculado** — cada sección se calcula on-demand contra las tablas reales en el momento del request. No hay job programado ni caché de reportes (ver Future Improvements).
- **Aislamiento por empresa automático** — los 5 modelos fuente ya tienen `TenantScope` (`BelongsToEmpresa`) desde antes de este módulo; `ReporteRepository` nunca filtra `empresa_id` a mano, confía en el scope global. Cubierto por un test dedicado a que los datos de una empresa nunca aparezcan en el reporte de otra.
- **Solo lectura de punta a punta** — sin `POST`/`PATCH`/`DELETE` en `/reportes` (verificado por test: 405, no 404, porque la ruta existe con otro verbo).
- **`valor_total_inventario` solo cuenta productos activos** — un producto deshabilitado no contribuye al valor de inventario reportado, coherente con que ya no cuenta para ningún otro propósito operativo del ERP.

## Acceptance Criteria

- [x] Un usuario con `reportes.ver` ve estadísticas reales de Inventario/Movimientos/Clientes/Proveedores, calculadas contra datos reales de su empresa.
- [x] El rango de fechas afecta únicamente la sección Movimientos — Inventario/Clientes/Proveedores siempre reflejan el estado actual.
- [x] Ningún dato de otra empresa aparece jamás en el reporte (test dedicado, con datos reales en dos empresas distintas).
- [x] No existe ninguna ruta de creación/edición/eliminación en este módulo.

## Edge Cases

- **Dos productos/categorías/proveedores distintos pueden compartir el mismo nombre** — encontrado en verificación de navegador con datos demo reales (dos productos distintos llamados igual causaban una colisión de `key` de React en la lista "Productos con más movimiento"). Corregido exponiendo el `id` real de cada fila (`producto_id`/`categoria_id`/`proveedor_id`) desde el backend y usándolo como key en el frontend, en vez del nombre — cierra esta clase de bug para las tres listas del módulo, no solo la que se manifestó.
- **Empresa sin datos suficientes** (recién creada, sin productos/movimientos): cada sección responde con ceros/listas vacías, nunca un error — verificado que `COALESCE(SUM(...), 0)` evita `NULL` en los agregados cuando no hay filas que sumar.
- **Rango de fechas invertido o inválido** (`hasta` antes de `desde`): no validado explícitamente — `whereBetween` simplemente no encuentra filas, listas/contadores vuelven vacíos/en cero, sin error. Comportamiento aceptable para un filtro de solo lectura.

## Future Improvements

- **Exportación (PDF/Excel/CSV)**: explícitamente fuera de alcance de esta unidad de trabajo, mismo criterio que Auditoría — no pedido por el checklist vertical-slice de este módulo.
- **Reportes de Ventas/Compras**: bloqueados por la ausencia de esos módulos en el ERP — cuando existan, este módulo es el lugar natural para sumarlos, sin rediseñar la arquitectura (un nuevo método en `ReporteRepository` + una nueva sección en el payload).
- **Pre-cálculo/caché**: hoy cada request recalcula todo on-demand; si el volumen de datos crece lo suficiente para que esto sea lento, la siguiente iteración natural es un job programado que pre-calcule y cachee el resumen, no un rediseño del contrato de API.
- **Panel de estadísticas históricas** (tendencias mes a mes, comparativas año contra año): fuera de alcance — este módulo muestra el rango solicitado, no series históricas largas.
