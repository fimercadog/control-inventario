# 10_GOVERNANCE/

Reglas de proceso, ingeniería y desarrollo de FidelOS. Todo documento que gobierna *cómo* se trabaja (no *qué* se construye — eso vive en `01_PRD/`, `02_REQUIREMENTS/`, `03_FUNCTIONAL_SPEC/`) vive en esta carpeta.

**Este README es un índice de navegación puro** (qué archivo hay y para qué sirve, en una línea). Para saber *cuál de estos documentos consultar según la situación en la que estás* — la pregunta más común — usa [`EngineeringManual.md`](EngineeringManual.md), que es el índice razonado y la puerta de entrada real de esta carpeta. Este `README.md` existe únicamente por consistencia de convención con el resto de `docs/` (toda carpeta principal tiene un `README.md` de navegación); no reemplaza ni duplica a `EngineeringManual.md`.

| Documento | Qué es |
|---|---|
| [`EngineeringManual.md`](EngineeringManual.md) | Índice maestro razonado — empieza aquí para saber qué documento usar |
| [`MandatoryDevelopmentWorkflow.md`](MandatoryDevelopmentWorkflow.md) | El proceso obligatorio de desarrollo, 12 fases |
| [`DefinitionOfReady.md`](DefinitionOfReady.md) | Cuándo se puede empezar a implementar |
| [`DefinitionOfDone.md`](DefinitionOfDone.md) | Cuándo un desarrollo se considera terminado |
| [`QualityGates.md`](QualityGates.md) | Reglas de bloqueo puras a lo largo de todo el proceso |
| [`DocumentationWorkflow.md`](DocumentationWorkflow.md) | Dónde vive cada tipo de documento nuevo |
| [`AI_OPERATING_PROCEDURE.md`](AI_OPERATING_PROCEDURE.md) | Reglas para asistentes de IA (incluye Git Policy) |
| [`ArchitectureWorkflow.md`](ArchitectureWorkflow.md) | Cuándo se requiere Architecture Review + ADR |
| [`ReleaseWorkflow.md`](ReleaseWorkflow.md) | Proceso para liberar una versión |
| [`SessionWorkflow.md`](SessionWorkflow.md) | Checklist de cierre de sesión de desarrollo |

## Flujo recomendado de lectura

1. `EngineeringManual.md` (siempre primero)
2. `MandatoryDevelopmentWorkflow.md`
3. `DefinitionOfReady.md` / `DefinitionOfDone.md` / `QualityGates.md` según en qué punto del proceso estés
4. El resto, según lo que indique la tabla de `EngineeringManual.md`

Ver también: [`../README.md`](../README.md) (índice de toda la documentación) y [`AGENTS.md`](../../AGENTS.md) (raíz del repositorio — constitución corta, autoridad última sobre las reglas no negociables).
