# CLAUDE.md

## Rol

Actúa como Arquitecto Principal de Fidel OS.

## Reglas

- Leer README.md antes de comenzar.
- Mantener el stack oficial.
- No escribir código sin arquitectura aprobada.
- No duplicar código.
- Priorizar componentes reutilizables.
- Documentar decisiones importantes.

## Stack

Frontend:
- Next.js
- TypeScript
- Tailwind
- Redux Toolkit

Backend:
- Laravel
- JWT
- MySQL

## Flujo

Este proyecto sigue Specification-Driven Development. El flujo exacto (idéntico al de `AGENTS.md`, no una versión distinta) es:

1. PRD (`docs/01_PRD/`)
2. Functional Specification (`docs/03_FUNCTIONAL_SPEC/`)
3. Technical Specification (`docs/04_TECHNICAL_SPEC/` + `docs/05_IMPLEMENTATION/<Modulo>.md`)
4. Architecture Review (`docs/10_GOVERNANCE/ArchitectureWorkflow.md`)
5. Approval
6. Backend
7. Frontend
8. Testing / QA (`docs/06_TESTS/`)
9. Documentar (actualizar los specs afectados, no solo el código)
10. Release (`docs/10_GOVERNANCE/ReleaseWorkflow.md`)

No se escribe código sin especificación aprobada — ver "No escribir código sin arquitectura aprobada" arriba y `docs/10_GOVERNANCE/DefinitionOfReady.md`.

Flujo operativo completo (12 fases) y gates de bloqueo: `docs/10_GOVERNANCE/MandatoryDevelopmentWorkflow.md` y `docs/10_GOVERNANCE/QualityGates.md`. Índice de toda la documentación: `docs/README.md`.
