# FidelOS Template

Plantilla oficial para todos los proyectos de Fidel OS.

## Stack

- Frontend: Next.js
- Backend: Laravel
- Base de datos: MySQL
- API REST
- JWT

## Estructura

```
backend/
frontend/
docs/
CLAUDE.md
AGENTS.md
CHANGELOG.md
```

Este repositorio sigue **Specification-Driven Development (SDD)**. La documentación vive en `docs/`, organizada por audiencia:

- `docs/00_VISION/` — visión, objetivos, estrategia, roadmap
- `docs/01_PRD/` — qué se construye y para quién
- `docs/02_REQUIREMENTS/` — requisitos funcionales y no funcionales
- `docs/03_FUNCTIONAL_SPEC/` — comportamiento de cada módulo/pantalla (marcado `Built` o `Planned`)
- `docs/04_TECHNICAL_SPEC/` — arquitectura, base de datos, API, frontend, backend, seguridad
- `docs/05_IMPLEMENTATION/` — plan de implementación por módulo
- `docs/06_TESTS/` — estrategia y casos de prueba
- `docs/07_RELEASE/` — checklist y notas de cada release
- `docs/08_ADR/` — decisiones arquitectónicas
- `docs/09_TEMPLATES/` — plantillas reutilizables
- `docs/_ARCHIVE/` — documentación histórica, ya no es fuente de verdad

Las reglas exactas del proceso (Definition of Ready/Done, workflows de desarrollo/documentación/arquitectura/release) están en `AGENTS.md` (constitución corta) y en los documentos dedicados dentro de `docs/`. **Índice completo de la documentación: [`docs/README.md`](docs/README.md).**

## Flujo

```
Idea → PRD → Functional Specification → Technical Specification →
Architecture Review → Approval → Implementation → Testing → QA →
Acceptance → Release
```

Detalle completo (12 fases): `docs/10_GOVERNANCE/MandatoryDevelopmentWorkflow.md`. Este es el mismo flujo que describe `AGENTS.md` — no hay dos versiones distintas del proceso.

## Governance

Punto de entrada: [`docs/10_GOVERNANCE/EngineeringManual.md`](docs/10_GOVERNANCE/EngineeringManual.md) — explica cuándo usar cada uno de los siguientes documentos:

- `docs/10_GOVERNANCE/MandatoryDevelopmentWorkflow.md`
- `docs/10_GOVERNANCE/DefinitionOfReady.md`
- `docs/10_GOVERNANCE/DefinitionOfDone.md`
- `docs/10_GOVERNANCE/QualityGates.md`
- `docs/10_GOVERNANCE/DocumentationWorkflow.md`
- `docs/10_GOVERNANCE/AI_OPERATING_PROCEDURE.md`
- `docs/10_GOVERNANCE/ArchitectureWorkflow.md`
- `docs/10_GOVERNANCE/ReleaseWorkflow.md`
- `docs/10_GOVERNANCE/SessionWorkflow.md`

Los 10 documentos de gobernanza de proceso viven todos en `docs/10_GOVERNANCE/` desde la auditoría final de consolidación (antes, estos tres vivían en `docs/` raíz — ver `docs/DOCUMENTATION_BASELINE_REPORT.md`).

> Nota: la mención previa a `MilestoneWorkflow.md` en esta sección se retiró — ese archivo no existe (fue eliminado por estar vacío durante la migración, ver `docs/POST_MIGRATION_AUDIT.md` §3.2). `docs/10_GOVERNANCE/AI_OPERATING_PROCEDURE.md` sigue teniendo una "Milestone Policy" que lo referencia por nombre; queda como gap abierto documentado, no resuelto en esta consolidación — ver `docs/10_GOVERNANCE/EngineeringManual.md` y el informe de esta sesión.
