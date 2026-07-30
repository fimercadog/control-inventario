# Testing Guide

Guía de navegación por tipo de prueba. **No contiene planes de prueba ni resultados** — eso vive en los documentos enlazados desde cada sección. Este documento responde una sola pregunta: *"quiero probar X, ¿qué tipo de prueba es y a qué documento voy?"*. Para el estado real de qué está automatizado hoy y qué no, ver `docs/06_TESTS/MasterTestPlan.md` (documento distinto, con propósito distinto: estado honesto, no guía metodológica).

## Unit Testing

**Qué verifica:** una unidad de código aislada (un método de un Service, un modelo, una función) sin dependencias externas reales.

**Dónde vive hoy:** `backend/tests/Unit/**` (PHPUnit). Índice completo archivo por archivo: `docs/06_TESTS/AutomatedTests.md`.

**Frontend:** no existe ningún test unitario de frontend hoy (gap real, ver `MasterTestPlan.md`).

## Functional Testing

**Qué verifica:** que una funcionalidad completa (crear, editar, consultar, buscar, filtrar, eliminar, restaurar) se comporta según la Functional Specification del módulo.

**Dónde vive:**
- Checklist estándar de 17 puntos por módulo: `docs/06_TESTS/IntegrationTestPlan.md`.
- Casos ya ejecutados con resultado real: `docs/06_TESTS/ManualTestCases.md`.
- Criterio → test que lo respalda: `docs/06_TESTS/AcceptanceCriteria.md`.

## Integration Testing

**Qué verifica:** que los módulos interactúan correctamente entre sí (por ejemplo, Compra → Actualiza Inventario) y que backend y frontend funcionan juntos.

**Dónde vive:** matriz de integración entre módulos y estado real de cada interacción: `docs/06_TESTS/IntegrationTestPlan.md`, sección "Pruebas de integración entre módulos". El único flujo de integración end-to-end real y probado hoy es Captura IA → Producto/Movimiento/Dashboard (ver `AcceptanceCriteria.md` y `ManualTestCases.md` MTC-005/MTC-008). No existe Playwright/Cypress ni equivalente — la integración backend↔frontend se verifica manualmente.

## Regression Testing

**Qué verifica:** que un cambio nuevo no rompió comportamiento existente ya probado.

**Dónde vive:** `docs/06_TESTS/RegressionPlan.md`. Regla base: la suite completa de `backend/tests/` (94 tests) debe seguir en verde tras cualquier cambio (`composer test` desde `backend/`); para frontend, re-ejecutar manualmente los casos de `ManualTestCases.md` relevantes al área tocada.

## Performance Testing

**Qué verifica:** comportamiento del sistema bajo carga o con volúmenes grandes de datos.

**Dónde vive:** `docs/06_TESTS/PerformanceTests.md`. Estado real: no se ha ejecutado ninguna prueba de performance todavía (gap real, priorizado en `MasterTestPlan.md` — el pipeline de Captura IA, por la llamada a OpenAI, es el candidato de mayor riesgo). Datasets de gran escala (10K-100K registros) para esta capa: sección "Volúmenes objetivo" del mismo documento — distintos de los volúmenes de `DemoDataSeeding.md`, que son para pruebas funcionales/demo, no de carga.

## Security Testing

**Qué verifica:** aislamiento multi-tenant, autenticación, autorización por permiso (no por rol), y resistencia a accesos cruzados entre empresas.

**Dónde vive:** `docs/06_TESTS/SecurityTests.md`. Es la capa mejor cubierta hoy: 25 tests adversariales automatizados sobre aislamiento multi-tenant (Módulo 2), ver `08_ADR/ADR-008` y `ADR-009`. Matriz de permisos por rol: misma fuente, sección "Pruebas de permisos por rol" — pendiente de que Auth Módulo 3 (Authorization) se construya.

## UAT (User Acceptance Testing)

**Qué verifica:** que el sistema resuelve el problema real del usuario final, no solo que cumple la especificación técnica.

**Dónde vive:** no existe un documento UAT dedicado hoy — es un gap real, no solo de ejecución sino de proceso formal. Lo más cercano que existe:
- `docs/06_TESTS/AcceptanceCriteria.md` (criterio de aceptación por funcionalidad, verificado técnicamente, no por el usuario final).
- `DEMO.md` (raíz del repo) — script de demo de 5 minutos, pensado para audiencia de negocio/ventas, no es UAT formal.

Recomendación (no ejecutada, no es parte de esta guía sino una nota abierta): definir un proceso UAT formal antes de exponer cualquier módulo nuevo a usuarios reales fuera de una demo controlada.

## Qué prueba aplica a qué fase del desarrollo

Ver `docs/10_GOVERNANCE/MandatoryDevelopmentWorkflow.md`, Fase 6 (Pruebas) — ahí se define en qué momento del proceso se ejecuta cada tipo de prueba de arriba. Este documento no repite esa secuencia, solo explica qué es cada tipo y dónde está su plan/resultado real.
