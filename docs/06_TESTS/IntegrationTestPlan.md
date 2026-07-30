# Plan de Pruebas de Integración y Checklist Estándar por Módulo

**Status: Planned — no ejecutado**

> Requisito de producto entregado directamente por el product owner (sesión 2026-07-29, "FASE 17 — Validación Integral y Pruebas del Sistema"). No proviene del master spec original.
>
> Este documento define **qué** se debe probar de forma estándar en cada módulo, y **cómo** interactúan los módulos entre sí. No reemplaza `docs/06_TESTS/ManualTestCases.md` (casos ya ejecutados y con resultado real) ni `AcceptanceCriteria.md` (criterio → test que lo respalda) — es el checklist que se usa para producirlos en cada módulo nuevo, siguiendo el formato de `docs/09_TEMPLATES/Template_TestCase.md`.

## Regla de cierre

Consistente con `docs/10_GOVERNANCE/DefinitionOfDone.md`: **ningún módulo se considera terminado hasta completar satisfactoriamente estas pruebas funcionales.**

## Checklist estándar por módulo (mínimo)

Para cada módulo, ejecutar como mínimo:

1. Crear registros
2. Editar registros
3. Consultar registros
4. Buscar registros
5. Filtrar registros
6. Ordenar información
7. Eliminar lógicamente
8. Restaurar registros (si aplica)
9. Validar permisos por rol (ver `docs/06_TESTS/SecurityTests.md`, sección "Pruebas de permisos por rol")
10. Exportar PDF (ver `docs/03_FUNCTIONAL_SPEC/FUTURE/Export.md`)
11. Exportar Excel
12. Exportar CSV
13. Validar auditoría (ver `docs/03_FUNCTIONAL_SPEC/FUTURE/Auditoria.md` — toda acción de este checklist debe generar su registro correspondiente)
14. Validar rendimiento (ver `docs/06_TESTS/PerformanceTests.md`)
15. Validar paginación
16. Validar manejo de errores
17. Validar mensajes al usuario

**Estado real por módulo (verificado contra código, 2026-07-29):** ninguno de los módulos construidos hoy (Productos, Movimientos, Dashboard) tiene este checklist ejecutado de forma completa y formal — `docs/06_TESTS/ManualTestCases.md` cubre un subconjunto (crear/consultar/buscar/filtrar básico, ver MTC-009/MTC-010), pero no exportación (no existe todavía, ver `FUTURE/Export.md`), ni auditoría (no existe todavía, ver `FUTURE/Auditoria.md`), ni permisos por rol (Módulo 3 no construido), ni eliminación lógica/restauración (no verificado si existe soft-delete en `productos`/`movimientos` — a confirmar en Technical Spec antes de asumir que aplica).

## Pruebas de integración entre módulos

Verificar que los módulos interactúan correctamente entre sí:

| Interacción | Descripción | Estado |
|---|---|---|
| Compra → Actualiza Inventario | Al registrar una compra, el stock del producto debe incrementarse consistentemente. | `[PLANNED]` — depende de `FUTURE/Purchases.md`, módulo no construido |
| Venta → Descuenta Inventario | Al registrar una venta, el stock del producto debe decrementarse consistentemente. | `[PLANNED]` — depende de `FUTURE/Sales.md`, módulo no construido |
| Ajuste → Actualiza Kardex | Un ajuste manual de inventario debe reflejarse en el historial de movimientos del producto. | `[PLANNED, parcial]` — `movimientos` ya registra ajustes vía Captura IA; la vista de Kardex por producto no existe (`FUTURE/Kardex.md`) |
| Movimiento → Genera Auditoría | Todo movimiento de inventario debe generar su registro correspondiente en el módulo de Auditoría. | `[PLANNED]` — depende de `FUTURE/Auditoria.md`; hoy solo Captura IA escribe en `AuditLog`, y no vía este flujo genérico |
| Usuario → Respeta permisos | Ninguna acción de un usuario debe ejecutarse fuera de lo que su rol permite. | `[PLANNED]` — depende de Auth Módulo 3 (Authorization), no construido; hoy solo se valida sesión + tenant, no permiso específico |
| Reporte → Usa información correcta | Cualquier reporte generado debe reflejar exactamente los datos reales del sistema al momento de generarse, sin discrepancias con las pantallas fuente. | `[PLANNED]` — depende de `FUTURE/Reports.md`, módulo no construido |

**Ya verificado hoy, fuera de esta tabla (para contexto):** el único flujo de integración real y probado end-to-end es Captura IA → Producto/Movimiento/Dashboard (ver `docs/06_TESTS/AcceptanceCriteria.md`, sección Captura IA, y `ManualTestCases.md` MTC-005/MTC-008).

## Pruebas de permisos (ejemplo de matriz esperada, una vez construido Auth Módulo 3)

| Rol | Expectativa |
|---|---|
| Administrador | Debe acceder a todo. |
| Auxiliar de Inventario | No puede administrar usuarios. |
| Vendedor | No puede modificar configuración. |
| Auditor | Solo lectura del módulo de Auditoría. |

Ver detalle y estado real en `docs/06_TESTS/SecurityTests.md`, sección "Pruebas de permisos por rol".

## Informe de pruebas

Al finalizar la validación de cada módulo, se debe generar un informe siguiendo `docs/09_TEMPLATES/Template_TestReport.md`.

## Criterio de aprobación de módulo

Ver `docs/10_GOVERNANCE/DefinitionOfDone.md`, sección "Estados de aprobación de módulo" — este documento define el checklist funcional que alimenta ese criterio, no lo reemplaza.
