# FidelOS Engineering Manual

Este es el documento maestro de gobernanza de ingeniería de FidelOS. **No duplica contenido** — es un índice razonado que explica qué documento consultar según lo que se necesite hacer, y en qué orden se relacionan entre sí. Reemplaza a `GOVERNANCE.md` (archivado en `docs/_ARCHIVE/GOVERNANCE_SUPERSEDED.md`), que era un stub sin contenido navegable.

Autoridad última sobre las reglas no negociables: `AGENTS.md` (raíz del repositorio) — este manual organiza y enlaza los documentos que desarrollan cada regla en detalle, no las reemplaza ni las reescribe.

---

## Cómo usar este manual

Busca tu situación en la tabla y sigue el enlace. No necesitas leer los 7 documentos de gobernanza para hacer un cambio — necesitas leer el que corresponde a la pregunta que tienes.

| Tu pregunta | Documento | Cuándo usarlo |
|---|---|---|
| "¿Qué proceso completo debo seguir para desarrollar algo?" | [`MandatoryDevelopmentWorkflow.md`](MandatoryDevelopmentWorkflow.md) | Siempre, antes de empezar cualquier desarrollo. Es el flujo de las 12 fases (Especificación → Comprensión → ... → Aprobación Final), obligatorio sin excepción. |
| "¿Puedo empezar a escribir código ya?" | [`DefinitionOfReady.md`](DefinitionOfReady.md) | Antes de la Fase 1 del workflow. Si algo de esta lista falta: STOP. |
| "¿Cuándo puedo dar esto por terminado?" | [`DefinitionOfDone.md`](DefinitionOfDone.md) | Al cerrar cualquier desarrollo. Checklist objetivo de "terminado", no de proceso. |
| "¿Qué me bloquea específicamente en este punto?" | [`QualityGates.md`](QualityGates.md) | Cuando algo parece incompleto y necesitas saber si es un bloqueo real o no. Reglas de "si falta X, no avanza Y". |
| "¿Dónde va este documento nuevo que estoy escribiendo?" | [`DocumentationWorkflow.md`](DocumentationWorkflow.md) | Antes de crear o mover cualquier archivo `.md`. Mapa de carpeta → tipo de contenido. |
| "¿Cómo debo escribir este código (estilo, patrones)?" | [`04_TECHNICAL_SPEC/CodingStandards.md`](../04_TECHNICAL_SPEC/CodingStandards.md) | Durante la Fase 4 (Implementación) del workflow. |
| "¿Este cambio afecta la arquitectura? ¿Necesito un ADR?" | [`ArchitectureWorkflow.md`](ArchitectureWorkflow.md) + [`08_ADR/ADR_INDEX.md`](../08_ADR/ADR_INDEX.md) | Cuando el cambio introduce un patrón nuevo, una dependencia externa nueva, o afecta a más de un módulo. |
| "¿Cómo se libera una versión?" | [`ReleaseWorkflow.md`](ReleaseWorkflow.md) + [`07_RELEASE/ReleaseChecklist.md`](../07_RELEASE/ReleaseChecklist.md) | Al preparar cualquier release, sin importar el tamaño. |
| "¿Puede la IA hacer commit/push por mí?" | [`AI_OPERATING_PROCEDURE.md`](AI_OPERATING_PROCEDURE.md), sección "Git Policy" | Cualquier interacción de un asistente de IA con Git. Regla corta: la IA propone, nunca ejecuta `commit`/`push`/reescritura de historial, salvo instrucción explícita. No existe un "Git Workflow" separado — esta sección es la única fuente sobre el tema. |
| "Soy un asistente de IA (Claude Code, Codex, Cursor, Gemini CLI, u otro): ¿qué reglas me aplican?" | [`AI_OPERATING_PROCEDURE.md`](AI_OPERATING_PROCEDURE.md) | Al inicio de cualquier sesión de un asistente de IA sobre este repositorio, antes de modificar cualquier archivo. |
| "¿Qué y cómo debo probar?" | [`06_TESTS/TestingGuide.md`](../06_TESTS/TestingGuide.md) → [`06_TESTS/MasterTestPlan.md`](../06_TESTS/MasterTestPlan.md) | `TestingGuide.md` explica los tipos de prueba (Unit/Functional/Integration/Regression/Performance/Security/UAT) y a qué documento acudir para cada uno; `MasterTestPlan.md` es el estado real y honesto de qué está automatizado hoy y qué no. |
| "Terminé una sesión de trabajo, ¿qué falta antes de cerrar?" | [`SessionWorkflow.md`](SessionWorkflow.md) | Al final de cualquier sesión de desarrollo (humano o IA) que haya modificado el proyecto. |

---

## Los 10 documentos de gobernanza y su relación

```
Engineering Manual (este documento)
        │
        ├── MandatoryDevelopmentWorkflow.md   ── EL PROCESO (las 12 fases)
        │         │
        │         ├── DefinitionOfReady.md    ── gate de entrada (Fase 0)
        │         ├── QualityGates.md         ── gates a lo largo de todo el proceso
        │         └── DefinitionOfDone.md     ── gate de salida (Fase 12)
        │
        ├── DocumentationWorkflow.md          ── DÓNDE VIVE cada documento
        ├── AI_OPERATING_PROCEDURE.md         ── REGLAS PARA ASISTENTES DE IA (incluye Git Policy)
        │
        ├── ArchitectureWorkflow.md            ── cuándo se requiere Architecture Review + ADR
        ├── ReleaseWorkflow.md                 ── cómo se libera una versión
        └── SessionWorkflow.md                 ── checklist de cierre de sesión
```

`MandatoryDevelopmentWorkflow.md` es el proceso. Los otros nueve son las reglas que ese proceso invoca en distintos puntos — ninguno reemplaza al proceso, y el proceso no duplica el detalle de ninguno de ellos.

**Nota de ubicación (resuelta):** `ArchitectureWorkflow.md`, `ReleaseWorkflow.md` y `SessionWorkflow.md` vivían en `docs/` raíz (no en `docs/10_GOVERNANCE/`), a diferencia de los otros siete — inconsistencia heredada de la migración original (ver `docs/POST_MIGRATION_AUDIT.md` y `MIGRATION_REPORT.md` §6, riesgo de actividad concurrente), señalada dos veces como mejora futura sin ejecutar (`docs/DOCUMENTATION_BASELINE_REPORT.md`, "Mejoras futuras recomendadas" #2). Se movieron los tres a `docs/10_GOVERNANCE/` en la auditoría final de consolidación (ver `docs/DOCUMENTATION_BASELINE_REPORT.md`, sección "Auditoría final — segunda pasada"), actualizando todas las referencias activas en el mismo cambio. Los 10 documentos de gobernanza de proceso viven ahora en una única carpeta.

---

## Fuera de la gobernanza de proceso (pero referenciados desde aquí)

- **Coding Standards** — `docs/04_TECHNICAL_SPEC/CodingStandards.md`. Vive en Technical Spec, no en Governance, porque describe *cómo se escribe* código, no *cuándo/con qué proceso*.
- **Security Rules** — `AGENTS.md` (reglas no negociables) + `docs/04_TECHNICAL_SPEC/Security.md` (detalle técnico) + `docs/02_REQUIREMENTS/SecurityRequirements.md` (requisitos).
- **Master Test Plan** — `docs/06_TESTS/MasterTestPlan.md`. Vive en Tests, no en Governance, porque describe *estado real de cobertura*, no proceso.
- **Design System (Frontend Governance)** — `docs/11_DESIGN_SYSTEM/`, fuente oficial única para UI/UX (consolidada 2026-08-03, ver `docs/11_DESIGN_SYSTEM/README.md`). El cumplimiento del Design System es obligatorio. Vive fuera de Governance porque describe *cómo se ve y se comporta* la interfaz, no *cuándo/con qué proceso* — misma razón que separa Coding Standards de este manual.

---

## Documentation Baseline v1.0

Misma declaración que `docs/README.md`, sección "Estado de la documentación" — no una segunda baseline independiente. Este manual desarrolla en detalle las reglas operativas que esa declaración implica; `docs/README.md` es la declaración canónica y de cara al lector general. Informe completo con checklist y % de cumplimiento: `docs/DOCUMENTATION_BASELINE_REPORT.md` (sesión 2026-07-29).

A partir de este momento, la estructura de `docs/` descrita en `AGENTS.md` ("Repository Structure") y en `docs/README.md` constituye la **Documentation Baseline v1.0** — la versión base y estable de la documentación de FidelOS. Reglas operativas que rigen a partir de aquí:

1. **Ningún documento nuevo se crea sin justificar por qué el contenido existente no basta.** Antes de escribir un `.md` nuevo, verificar en `docs/README.md` y en el índice de la carpeta correspondiente (`00_VISION/README.md`, `01_PRD/README.md`, etc., o el documento equivalente donde ya existe uno — `08_ADR/ADR_INDEX.md`, `06_TESTS/MasterTestPlan.md`/`TestingGuide.md`, este mismo manual) si el tema ya tiene una fuente de verdad.
2. **Ningún tema se duplica.** Si un documento nuevo describe algo que otro ya cubre, se reconcilia en el documento existente — no coexisten dos versiones "por si acaso" (regla ya establecida en `docs/10_GOVERNANCE/DocumentationWorkflow.md`).
3. **Toda documentación nueva actualiza el índice de su carpeta.** Un documento nuevo sin entrada en el índice correspondiente no cumple la Definition of Done (`DefinitionOfDone.md`).
4. **La filosofía Single Source of Truth se mantiene indefinidamente**, no solo durante esta consolidación — es la razón por la que este manual, `QualityGates.md` y `MandatoryDevelopmentWorkflow.md` existen como documentos separados de intención única, en vez de un solo archivo que mezcle proceso, bloqueos y navegación.
5. **Modificaciones futuras a esta baseline se documentan, no se aplican en silencio** — vía `CHANGELOG.md` como mínimo; si el cambio es estructural (mover una carpeta, fusionar un documento de gobernanza), vía una nueva sección de auditoría equivalente a `docs/DOCUMENTATION_BASELINE_REPORT.md`, nunca sobrescribiendo el informe anterior.

Esta baseline no congela el contenido — los documentos `Status: Planned` seguirán actualizándose a `Built` a medida que se construyan los módulos correspondientes, y `Status: Built` seguirá corrigiéndose si el código diverge. Lo que se congela es la **estructura y el principio de una única autoridad por tema**, no el contenido en sí.

## Regla de no duplicación de este manual

Si en algún momento este manual empieza a explicar *el contenido* de uno de los documentos que enlaza (en vez de *cuándo consultarlo*), es una señal de que se está duplicando información y debe corregirse — mover el contenido de vuelta al documento fuente y dejar aquí solo el enlace y el criterio de "cuándo usarlo". Esta regla es la aplicación directa de `docs/10_GOVERNANCE/DocumentationWorkflow.md`, regla 1: "Un documento, una fuente de verdad."
