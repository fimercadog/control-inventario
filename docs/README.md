# FidelOS — Documentación

> **Bienvenido a la documentación oficial de FidelOS.**
>
> Esta carpeta constituye la **Single Source of Truth (SSOT)** del proyecto.
>
> Toda decisión de producto, arquitectura, desarrollo, pruebas y despliegue debe basarse en la documentación contenida aquí.
>
> **Ningún desarrollo debe comenzar sin consultar previamente la documentación correspondiente.**

---

# Acerca del proyecto

FidelOS es un sistema de control de inventario multiempresa (multi-tenant) con captura inteligente de productos y movimientos mediante Inteligencia Artificial (fotografía, voz y foto + voz).

Está construido con:

- Next.js
- Laravel
- MySQL
- JWT Authentication

con aislamiento estricto por empresa y una arquitectura basada en **Specification-Driven Development (SDD)**.

La visión completa del proyecto se encuentra en:

- [`00_VISION/Vision.md`](00_VISION/Vision.md)

---

# Filosofía del proyecto

FidelOS utiliza **Specification-Driven Development (SDD)**.

Esto significa que ninguna funcionalidad puede implementarse sin haber pasado previamente por el proceso completo de especificación.

La documentación es parte del producto: ninguna implementación empieza sin especificación aprobada, y ninguna especificación se considera vigente si el código diverge de ella sin que se reconcilien.

**Sobre intención vs. hechos verificables (no son lo mismo):** para decisiones de producto, alcance y proceso, la documentación es la autoridad — el código no decide qué se debe construir. Pero para hechos verificables sobre lo ya construido (qué campos tiene una tabla, qué hace una función, qué endpoint existe), **el código es la fuente de verdad** y la documentación se corrige para reflejarlo, nunca al revés (ver `04_TECHNICAL_SPEC/DomainModel.md`, línea 3: "Donde este documento y el código difieran, el código gana"). Documentar código que no existe como si existiera viola directamente el principio `Built` vs. `Planned` de esta misma documentación.

---

# Antes de comenzar

Dependiendo de la tarea que vas a realizar, comienza por aquí:

| Quiero... | Leer primero |
|------------|-------------|
| Comprender el proyecto | `00_VISION/Vision.md` |
| Conocer cómo está organizada la documentación | `docs/README.md` |
| Revisar qué debe construirse (producto) | `01_PRD/ProductRequirements.md` |
| Comprender la arquitectura | `04_TECHNICAL_SPEC/Architecture.md` |
| Desarrollar una funcionalidad | `10_GOVERNANCE/MandatoryDevelopmentWorkflow.md` |
| Revisar reglas de ingeniería | `10_GOVERNANCE/EngineeringManual.md` |
| Implementar un módulo | Functional Specification correspondiente |
| Revisar especificaciones técnicas | Technical Specification correspondiente |
| Revisar decisiones arquitectónicas ya tomadas | `08_ADR/ADR_INDEX.md` |
| Revisar el Design System (UI/UX) | `11_DESIGN_SYSTEM/README.md` |
| Ejecutar pruebas | `06_TESTS/MasterTestPlan.md` |
| Preparar una Release | `10_GOVERNANCE/ReleaseWorkflow.md` |
| Trabajar con IA | `10_GOVERNANCE/AI_OPERATING_PROCEDURE.md` |

Esta tabla es un punto de entrada rápido por tarea. Para el orden secuencial completo de lectura antes de implementar cualquier feature, ver `10_GOVERNANCE/AI_OPERATING_PROCEDURE.md`, sección "Mandatory Reading Order".

---

# Flujo general del proyecto

```text
Idea
    │
    ▼
Vision
    │
    ▼
PRD
    │
    ▼
Requirements
    │
    ▼
Functional Specification
    │
    ▼
Technical Specification
    │
    ▼
Architecture Review
    │
    ▼
Development
    │
    ▼
Testing
    │
    ▼
Documentation
    │
    ▼
Quality Gates
    │
    ▼
Release
```

Ninguna fase puede omitirse.

---

# Rutas de lectura recomendadas

## Arquitectos

1. Vision
2. Architecture
3. ADR
4. Engineering Manual
5. Architecture Workflow

---

## Desarrolladores

1. AGENTS.md
2. Engineering Manual
3. Mandatory Development Workflow
4. Functional Specification
5. Technical Specification
6. Definition of Ready
7. Definition of Done

---

## QA

1. Master Test Plan
2. Testing Guide
3. Integration Test Plan
4. Security Tests
5. Performance Tests

---

## Product Owner

1. Vision
2. PRD
3. Functional Requirements
4. Functional Specifications

---

## Asistentes de IA

Antes de modificar cualquier archivo se debe leer obligatoriamente:

1. AGENTS.md
2. Engineering Manual
3. Mandatory Development Workflow
4. AI Operating Procedure
5. Functional Specification correspondiente
6. Technical Specification correspondiente

No modificar código sin haber completado estos pasos.

---

# Estructura de la documentación

| Carpeta | Propósito | Audiencia |
|---------|-----------|-----------|
| [`00_VISION/`](00_VISION/) | ¿Por qué existe FidelOS? | Todos |
| [`01_PRD/`](01_PRD/) | ¿Qué debe construirse? | Producto, Ingeniería |
| [`02_REQUIREMENTS/`](02_REQUIREMENTS/) | ¿Qué debe hacer el sistema? | Ingeniería |
| [`03_FUNCTIONAL_SPEC/`](03_FUNCTIONAL_SPEC/) | ¿Cómo debe comportarse cada módulo? | Ingeniería, QA |
| [`03_FUNCTIONAL_SPEC/FUTURE/`](03_FUNCTIONAL_SPEC/FUTURE/) | Funcionalidades planificadas aún no implementadas | Producto |
| [`04_TECHNICAL_SPEC/`](04_TECHNICAL_SPEC/) | ¿Cómo se implementa técnicamente? | Ingeniería |
| [`05_IMPLEMENTATION/`](05_IMPLEMENTATION/) | Plan detallado de implementación | Ingeniería |
| [`06_TESTS/`](06_TESTS/) | Estrategia, planes y resultados de pruebas | Ingeniería, QA |
| [`07_RELEASE/`](07_RELEASE/) | Releases, checklists y despliegues | Ingeniería |
| [`08_ADR/`](08_ADR/) | Decisiones arquitectónicas | Ingeniería |
| [`09_TEMPLATES/`](09_TEMPLATES/) | Plantillas reutilizables | Todos |
| [`10_GOVERNANCE/`](10_GOVERNANCE/) | Reglas de ingeniería y desarrollo | Todos |
| [`11_DESIGN_SYSTEM/`](11_DESIGN_SYSTEM/) | Fuente oficial única del Design System (UI/UX) | Frontend, Ingeniería |
| [`_ARCHIVE/`](_ARCHIVE/) | Historial documental | Consulta histórica |

---

# Documentos principales

## Visión

- [`00_VISION/Vision.md`](00_VISION/Vision.md)

---

## Ingeniería

- [`10_GOVERNANCE/EngineeringManual.md`](10_GOVERNANCE/EngineeringManual.md)

- [`10_GOVERNANCE/MandatoryDevelopmentWorkflow.md`](10_GOVERNANCE/MandatoryDevelopmentWorkflow.md)

- [`10_GOVERNANCE/DefinitionOfReady.md`](10_GOVERNANCE/DefinitionOfReady.md)

- [`10_GOVERNANCE/DefinitionOfDone.md`](10_GOVERNANCE/DefinitionOfDone.md)

- [`10_GOVERNANCE/QualityGates.md`](10_GOVERNANCE/QualityGates.md)

- [`10_GOVERNANCE/AI_OPERATING_PROCEDURE.md`](10_GOVERNANCE/AI_OPERATING_PROCEDURE.md)

---

## Arquitectura

- [`04_TECHNICAL_SPEC/Architecture.md`](04_TECHNICAL_SPEC/Architecture.md)

- [`08_ADR/ADR_INDEX.md`](08_ADR/ADR_INDEX.md)

---

## Testing

- [`06_TESTS/MasterTestPlan.md`](06_TESTS/MasterTestPlan.md)

- [`06_TESTS/TestingGuide.md`](06_TESTS/TestingGuide.md)

- [`06_TESTS/IntegrationTestPlan.md`](06_TESTS/IntegrationTestPlan.md)

- [`06_TESTS/PerformanceTests.md`](06_TESTS/PerformanceTests.md)

- [`06_TESTS/SecurityTests.md`](06_TESTS/SecurityTests.md)

---

## Releases

- [`10_GOVERNANCE/ReleaseWorkflow.md`](10_GOVERNANCE/ReleaseWorkflow.md)

- [`07_RELEASE/ReleaseChecklist.md`](07_RELEASE/ReleaseChecklist.md)

- [`07_RELEASE/KnownIssues.md`](07_RELEASE/KnownIssues.md)

---

## Historial

- `../CHANGELOG.md`

---

# Documentos de referencia histórica

Los siguientes documentos describen cómo evolucionó la documentación del proyecto.

No representan necesariamente el estado actual del sistema.

- `MIGRATION_REPORT.md`

- `POST_MIGRATION_AUDIT.md`

- `DOCUMENTATION_BASELINE_REPORT.md` (declara la Documentation Baseline v1.0 — ver también `10_GOVERNANCE/EngineeringManual.md`)

- `SDD_MIGRATION_PLAN.md`

---

# Principios de esta documentación

1. **Single Source of Truth (SSOT).**

Cada tema tiene un único documento oficial.

---

2. **Specification-Driven Development.**

Toda implementación nace de una especificación aprobada.

---

3. **Built vs Planned.**

Nunca documentar como implementado algo que todavía está planificado.

---

4. **Nada se elimina.**

La documentación antigua se archiva.

Nunca se pierde historial.

---

5. **Documentación sincronizada con el código.**

Todo cambio funcional debe actualizar la documentación correspondiente.

---

6. **Trazabilidad completa.**

Cada decisión importante debe poder rastrearse.

---

7. **Calidad antes que velocidad.**

No se permite avanzar si no se cumplen los Quality Gates.

---

# Convenciones

- No crear documentos duplicados.

- No modificar especificaciones aprobadas sin seguir el proceso de gobernanza.

- No mover documentos sin actualizar todas las referencias.

- Toda carpeta principal debe poseer un índice o README.

- Toda nueva documentación debe integrarse con la estructura existente.

- Todo documento archivado debe contener un banner de deprecación.

---

# Estado de la documentación

Esta documentación constituye la **Documentation Baseline v1.0** de FidelOS.

A partir de esta versión:

- Toda modificación deberá mantener esta estructura.

- Toda nueva documentación deberá actualizar los índices correspondientes.

- Toda referencia cruzada deberá permanecer válida.

- Ningún documento podrá crearse fuera de la estructura oficial sin una justificación explícita.

- Todo desarrollo futuro deberá respetar la filosofía **Specification-Driven Development (SDD)** y el principio de **Single Source of Truth (SSOT)**.

Reglas operativas completas de esta baseline (qué justifica un documento nuevo, cómo se documentan cambios futuros a la estructura): `10_GOVERNANCE/EngineeringManual.md`, sección "Documentation Baseline v1.0". Informe de auditoría con checklist y % de cumplimiento: `DOCUMENTATION_BASELINE_REPORT.md`.
