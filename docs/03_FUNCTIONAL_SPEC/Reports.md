# Reportes

**Status: Built (2026-08-02, tercer módulo de la secuencia vertical-slice Roles→Auditoría→Reportes→Perfil; ampliado 2026-08-03 al centro de reportes completo del ERP)**

> Verificado contra `backend/app/Contracts/Reports/Reporte.php`, `backend/app/Reports/*.php` (13 clases), `backend/app/DTO/Report/ReporteResultadoDTO.php`, `backend/app/Repositories/ReporteRepository.php`, `backend/app/Services/ReporteService.php`, `backend/app/Services/Reports/ReporteExportService.php`, `backend/app/Http/Controllers/Api/ReporteController.php`, `backend/app/Policies/ReportePolicy.php`, `backend/routes/api.php`, `backend/tests/Feature/Reporte*Test.php` (4 suites, 31 tests), `frontend/app/(app)/reportes/`. La ampliación 2026-08-03 reemplaza el alcance original ("dashboard de estadísticas, sin exportación, explícitamente fuera de alcance") por un catálogo de 13 reportes con preview, filtros dinámicos, exportación PDF/Excel/CSV, historial de ejecuciones e infraestructura de reportes programados — sigue siendo **un único módulo de Reportes**, nunca un segundo.

## Purpose

Dar visibilidad gerencial real sobre el estado del inventario, movimientos, terceros (clientes/proveedores), actividad de usuarios y auditoría — sin inventar datos, sin depender de módulos que no existen (Ventas/Compras). Cada reporte lee la base de datos real en el momento de la consulta (con Seeders para datos de demostración, nunca JSON estático ni mocks de frontend).

## Business Flow

1. Un usuario con `reportes.ver` abre `/reportes`, con tres pestañas: **Resumen** (dashboard original, sin cambios), **Catálogo** (los 13 reportes) e **Historial** (ejecuciones pasadas).
2. Desde Catálogo, el usuario abre un reporte (`/reportes/{clave}`). El frontend pide `GET /reportes/catalogo` para construir el formulario de filtros dinámicamente (`filtros_disponibles` de cada reporte — nunca hardcodeado por reporte en el frontend) y `GET /reportes/{clave}/preview` para la vista paginada.
3. El usuario puede exportar el reporte completo (sin paginar) en PDF, Excel o CSV (`GET /reportes/{clave}/exportar/{formato}`), o imprimir la vista actual.
4. Cada preview y cada exportación queda registrada en `reporte_historial` (quién, qué reporte, qué formato, cuántas filas, cuándo) — visible en la pestaña Historial.
5. No hay ninguna acción de escritura sobre los datos de negocio en este módulo — los 13 reportes son de solo lectura. La única escritura real es la definición de un reporte programado (`reportes_programados`), infraestructura "future-ready" sin motor de ejecución todavía (mismo patrón que `captura-ia.gestionar`).

## Actors

- **Usuario con `reportes.ver`**: puede ver el resumen, el catálogo completo, generar/exportar cualquiera de los 13 reportes, y ver el historial de ejecuciones de su empresa.
- **Usuario con `reportes.gestionar`**: además, puede crear/eliminar definiciones de reportes programados. No ejecuta nada por sí solo todavía (sin motor de scheduling).

## Screens

- **`/reportes`** (`frontend/app/(app)/reportes/page.tsx`): tres pestañas.
  - **Resumen**: sin cambios respecto al módulo original — selector de rango de fechas, tarjetas KPI, gráfico de barras CSS de entradas/salidas por día, listas de productos más movidos/por categoría/proveedores principales.
  - **Catálogo** (`components/reportes/reportes-catalogo-tab.tsx`): grid de 13 tarjetas (ícono + nombre + descripción), cada una navega a `/reportes/{clave}`.
  - **Historial** (`components/reportes/reportes-historial-tab.tsx`): tabla paginada de `reporte_historial` — fecha, reporte, formato, usuario, filas.
- **`/reportes/{clave}`** (`components/reporte-preview-screen.tsx`, montado desde una página servidor delgada `app/(app)/reportes/[clave]/page.tsx`, mismo patrón que toda otra ficha de detalle del ERP): título/descripción del reporte, formulario de filtros generado dinámicamente (`components/reportes/reporte-filtros-form.tsx` — fecha/texto/select; los selects de entidad conocida como `categoria_id`/`marca_id`/`producto_id`/`estado`/`tipo` resuelven contra las APIs reales de Categorías/Marcas/Productos, nunca datos de ejemplo), tabla de resultados paginada, botones PDF/Excel/CSV/Imprimir.

## Fields

### Los 13 reportes del catálogo

| Clave | Nombre | Clase |
| --- | --- | --- |
| `inventario-resumen` | Resumen de Inventario | `InventarioResumenReporte` |
| `stock-actual` | Stock Actual | `StockActualReporte` |
| `stock-bajo` | Stock Bajo | `StockBajoReporte` (extiende `StockActualReporte`) |
| `inventario-por-categoria` | Inventario por Categoría | `InventarioPorCategoriaReporte` |
| `inventario-por-marca` | Inventario por Marca | `InventarioPorMarcaReporte` |
| `inventario-por-proveedor` | Inventario por Proveedor | `InventarioPorProveedorReporte` |
| `movimientos-inventario` | Movimientos de Inventario | `MovimientosInventarioReporte` |
| `kardex-producto` | Kardex por Producto | `KardexProductoReporte` (requiere `producto_id`) |
| `productos-sin-movimiento` | Productos sin Movimiento | `ProductosSinMovimientoReporte` |
| `proveedores` | Reporte de Proveedores | `ReporteProveedores` (extiende `TerceroReporteBase`) |
| `clientes` | Reporte de Clientes | `ReporteClientes` (extiende `TerceroReporteBase`) |
| `actividad-usuarios` | Actividad de Usuarios | `ActividadUsuariosReporte` |
| `auditoria` | Reporte de Auditoría | `ReporteAuditoria` (reutiliza `AuditLogRepository`) |

### Arquitectura — cómo agregar un reporte 14 sin tocar los 13 existentes

- **`App\Contracts\Reports\Reporte`**: interfaz que implementa cada clase (`clave()`, `nombre()`, `descripcion()`, `filtrosDisponibles()`, `generar(array $filtros, bool $paginado)`).
- **`App\DTO\Report\ReporteResultadoDTO`**: forma de resultado común (`columnas`+`filas`+`resumen`+`filtrosAplicados`+`total`) — suficiente para renderizar preview/PDF/Excel/CSV de cualquier reporte sin que el renderizador conozca cuál es.
- **`ReporteService::CATALOGO`**: registro `clave => clase`. `ReporteController` nunca contiene lógica de un reporte específico — resuelve la clave, delega `generar()`, registra la ejecución en `reporte_historial`.
- Reutilización deliberada en vez de duplicación: `StockBajoReporte extends StockActualReporte` (un solo `whereColumn` distinto); `ReporteProveedores`/`ReporteClientes extends TerceroReporteBase` (mismo shape de columnas); `InventarioResumenReporte`/`ReporteAuditoria` reutilizan `ReporteRepository`/`AuditLogRepository` existentes en vez de reconstruir sus consultas.

### Tablas nuevas

| Tabla | Propósito |
| --- | --- |
| `reporte_historial` | Log inmutable de ejecuciones (`tipo_reporte`, `formato`, `filtros`, `total_filas`, `usuario_id`, `created_at`) — mismo espíritu que `audit_logs`, pero "qué reportes se generaron", nunca "qué acción de negocio ocurrió" (eso lo sigue cubriendo `AuditLog`, sin duplicación). |
| `reportes_programados` | Definiciones de reporte programado (`nombre`, `tipo_reporte`, `filtros`, `formato`, `frecuencia`, `destinatarios`, `estado`) — infraestructura sembrada, **sin motor de ejecución todavía** (ver Future Improvements). |

## Validation Rules

- `kardex-producto` exige `producto_id` — sin él, `422` con mensaje claro (`ValidationException`), tanto en preview como en export.
- Un `clave` fuera del catálogo (`GET /reportes/no-existe/preview`) responde `422`, nunca `500` ni `404` silencioso.
- Al crear un reporte programado, `tipo_reporte` debe existir en el catálogo (`422` si no); `formato` limitado a `pdf|excel|csv`; `frecuencia` a `diaria|semanal|mensual`.

## Permissions

- `reportes.ver` (ya existía) — gatea resumen, catálogo, preview, export (los tres formatos), historial, y listar reportes programados.
- `reportes.gestionar` (**nuevo, 2026-08-03**) — gatea únicamente crear/eliminar una definición de reporte programado. Otorgado a Supervisor (mismos roles que ya tenían `reportes.ver`).

## Loading States

Cada pestaña/vista tiene su propio spinner de carga inicial, independiente — cambiar de pestaña o de reporte nunca bloquea el resto de la página.

## Empty States

Sin datos para los filtros seleccionados: tabla vacía con `EmptyState` dedicado ("Sin datos"), nunca un error. Reporte con filtro requerido sin completar (Kardex sin producto): `EmptyState` explícito pidiendo completar el filtro, sin intentar generar nada.

## Error States

Fetch de preview/catálogo fallido: `EmptyState` de error. Export fallido: `toast.error`, sin romper la página. Sin `reportes.ver`/`reportes.gestionar`: `403` real del backend en cada endpoint.

## Business Rules

- **Ningún dato es simulado o pre-calculado** — cada reporte consulta la base de datos real en el momento del request; los datos de demostración vienen de Seeders, nunca de JSON estático ni de mocks de frontend.
- **Aislamiento por empresa automático** — todos los modelos fuente ya tienen `TenantScope`; ningún Report/Repository filtra `empresa_id` a mano.
- **Preview pagina, export no** — `generar($filtros, paginado: true)` para preview (respeta `pagina`/`por_pagina`); `generar($filtros, paginado: false)` para exportar siempre trae el dataset completo.
- **Regla de privacidad heredada de Auditoría** — `actividad-usuarios` y `auditoria` nunca exponen el nombre real de una persona, solo `email`+roles (la misma regla no negociable de `docs/03_FUNCTIONAL_SPEC/Auditoria.md`, extendida a propósito porque ambos derivan de `audit_logs`). `movimientos-inventario`, en cambio, sí muestra el nombre real del usuario — es dato operativo de negocio, igual que los módulos Movimientos/Usuarios.
- **Reportes programados son infraestructura, no una feature activa** — `reportes_programados` no tiene ningún job/cron que los ejecute; es exactamente el mismo patrón que `captura-ia.gestionar` (permiso y tabla sembrados para una configuración futura, sin consumidor real todavía).

## Acceptance Criteria

- [x] Los 13 reportes generan datos reales, verificados contra la base de datos (no mocks).
- [x] Cada reporte se puede exportar en PDF, Excel y CSV — verificado que el archivo descargado tiene contenido real y no está vacío.
- [x] Agregar los 13 reportes no requirió modificar el Controller, el Service (fuera del registro `CATALOGO`), ni los renderizadores de exportación entre sí.
- [x] `reportes.gestionar` gatea reportes programados; `reportes.ver` sigue gateando todo lo demás.
- [x] Ningún dato de otra empresa aparece jamás en ningún reporte, preview, export o historial (cubierto por tests dedicados en las 4 suites).
- [x] La regla de privacidad de Auditoría se respeta en `actividad-usuarios` y `auditoria`.

## Edge Cases

- **Kardex sin `producto_id`**: `422` limpio, nunca `500`.
- **Rutas estáticas vs. wildcard**: `catalogo`/`historial`/`programados` están declaradas ANTES de la ruta wildcard `{clave}/preview` en `routes/api.php` — de lo contrario Laravel intentaría resolver "catalogo" como si fuera la clave de un reporte.
- **Un solo `ReportePolicy` para dos modelos** (`ReporteHistorial`, `ReporteProgramado`) — registrado explícitamente vía `Gate::policy()` en `AppServiceProvider::boot()`, porque el auto-discovery de Laravel espera una Policy por modelo.

## Future Improvements

- **Motor de ejecución de reportes programados**: hoy `reportes_programados` es solo la definición — falta el job/cron que efectivamente genere y envíe el reporte en la frecuencia configurada.
- **Reportes de Ventas/Compras**: siguen bloqueados por la ausencia de esos módulos en el ERP.
- **Pre-cálculo/caché**: cada request recalcula todo on-demand; si el volumen de datos lo justifica, la siguiente iteración es un job que pre-calcule y cachee, no un rediseño del contrato de API.
