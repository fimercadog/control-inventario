# 09_TEMPLATES/

Plantillas reutilizables para cada tipo de documento del proyecto, todas extraídas de un documento real ya escrito — nunca inventadas desde cero. Usar la que corresponda al tipo de documento que se va a crear.

> Cierra el gap señalado en `docs/POST_MIGRATION_AUDIT.md` §3.2: hasta esta consolidación, 6 de estas 7 plantillas no eran alcanzables desde ningún enlace o cita de otro documento (solo `Template_ADR.md` lo era). Este índice es la corrección — navegación pura, no duplica el contenido de cada plantilla.

| Plantilla | Para qué tipo de documento | Extraída de |
|---|---|---|
| [`Template_PRD.md`](Template_PRD.md) | Un PRD nuevo | `01_PRD/ProductRequirements.md` |
| [`Template_FunctionalSpec.md`](Template_FunctionalSpec.md) | Una Functional Spec de módulo/pantalla nueva | `03_FUNCTIONAL_SPEC/AI_Capture.md` |
| [`Template_TechnicalSpec.md`](Template_TechnicalSpec.md) | Un área técnica nueva (arquitectura, base de datos, API, etc.) | `04_TECHNICAL_SPEC/Architecture.md` |
| [`Template_Module.md`](Template_Module.md) | Un plan de implementación de módulo (`05_IMPLEMENTATION/`) | Los 4 documentos reales de `05_IMPLEMENTATION/` |
| [`Template_ADR.md`](Template_ADR.md) | Una decisión arquitectónica nueva | Los 13 ADR reales de `08_ADR/` |
| [`Template_TestCase.md`](Template_TestCase.md) | Un caso de prueba manual nuevo | `06_TESTS/ManualTestCases.md` y `SecurityTests.md` |
| [`Template_TestReport.md`](Template_TestReport.md) | El informe de cierre de pruebas de un módulo | Requisito de producto 2026-07-29 (FASE 17) |
| [`Template_Release.md`](Template_Release.md) | Una entrada de release nueva | `07_RELEASE/ReleaseNotes.md` |

Ver también: [`../10_GOVERNANCE/DocumentationWorkflow.md`](../10_GOVERNANCE/DocumentationWorkflow.md) (dónde vive cada tipo de documento una vez escrito con estas plantillas).
