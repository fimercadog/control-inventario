# Documentation Workflow

## Regla general

La documentación es parte del producto, no un anexo. Ningún PR/cambio se considera terminado sin la documentación correspondiente actualizada (ver `DefinitionOfDone.md`).

## Dónde escribir qué

| Tipo de contenido | Carpeta |
|---|---|
| Visión, estrategia, roadmap | `00_VISION/` |
| Qué se construye y para quién | `01_PRD/` |
| Requisitos funcionales/no funcionales | `02_REQUIREMENTS/` |
| Cómo se comporta cada pantalla/módulo | `03_FUNCTIONAL_SPEC/` |
| Cómo está construido técnicamente | `04_TECHNICAL_SPEC/` |
| Plan de implementación de un módulo concreto | `05_IMPLEMENTATION/` |
| Casos de prueba y estrategia de testing | `06_TESTS/` |
| Checklist y notas de cada release | `07_RELEASE/` |
| Decisiones arquitectónicas irreversibles o de alto impacto | `08_ADR/` |
| Plantillas reutilizables | `09_TEMPLATES/` |
| Contenido histórico/superado | `_ARCHIVE/` |

## Reglas

1. **Un documento, una fuente de verdad.** Si dos documentos describen lo mismo y entran en conflicto, se reconcilia inmediatamente — nunca se dejan ambos "por si acaso". Esta migración encontró exactamente ese problema (el master spec vs. `04_ARCHITECTURE.md`/`05_DATABASE.md`/`06_API.md`) y lo resolvió consolidando en una sola versión por tema.
2. **Marcar honestamente qué está construido vs. planeado.** Usar `Status: Built` / `Status: Planned` en cada Functional Spec. No describir código que no existe como si existiera.
3. **Nunca dejar un documento "a medias" sin decirlo.** Si una sección no se pudo completar (falta de información, requiere decisión del producto), se anota explícitamente como brecha (`Gap`), no se rellena con contenido inventado.
4. **Archivar, no borrar.** Contenido superado va a `_ARCHIVE/` con una nota explicando por qué se superó y qué lo reemplaza — no se elimina silenciosamente (pérdida de contexto histórico).
5. **Todo documento en Markdown plano**, encabezados claros, sin relleno de marketing.
6. **Actualizar en el mismo cambio que el código**, no como tarea separada "para después" (esa deuda es exactamente lo que esta migración tuvo que pagar retroactivamente).

## Idioma

Español para todo el contenido de dominio/producto (coherente con el resto del repositorio). Los nombres de carpetas y archivos siguen la convención en inglés ya establecida por la estructura SDD (`00_VISION`, `FunctionalRequirements.md`, etc.).
