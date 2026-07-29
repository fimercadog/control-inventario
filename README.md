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

Las reglas exactas del proceso (Definition of Ready/Done, workflows de desarrollo/documentación/arquitectura/release) están en `AGENTS.md` (constitución corta) y en los documentos dedicados dentro de `docs/`.

## Flujo

```
Idea → PRD → Functional Specification → Technical Specification →
Architecture Review → Approval → Implementation → Testing → QA →
Acceptance → Release
```

Detalle completo: `docs/10_GOVERNANCE/DevelopmentWorkflow.md`. Este es el mismo flujo que describe `AGENTS.md` — no hay dos versiones distintas del proceso.


# Governance

## Documents

- DefinitionOfReady.md
- DefinitionOfDone.md
- DevelopmentWorkflow.md
- DocumentationWorkflow.md
- ArchitectureWorkflow.md
- ReleaseWorkflow.md
- MilestoneWorkflow.md
- AI_OPERATING_PROCEDURE.md
