# 11_DESIGN_SYSTEM/

Fuente oficial única del Design System de FidelOS (consolidado 2026-08-03 — antes fragmentado entre `docs/04_TECHNICAL_SPEC/FRONTEND/DESIGN_SYSTEM.md`, una sección "Arquitectura Frontend" dentro de `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md`, y una referencia a una ruta que todavía no existía en `docs/_ARCHIVE/GOVERNANCE_SUPERSEDED.md`). Todo lo relacionado con UI/UX vive aquí — ningún otro documento del repositorio debe describir cómo se ve o se comporta la interfaz; solo puede referenciar esta carpeta.

Regla de esta carpeta, igual que `docs/10_GOVERNANCE/EngineeringManual.md` §"Regla de no duplicación": si un documento fuera de aquí empieza a explicar *cómo* funciona un patrón de UI (en vez de solo enlazar aquí), es una señal de duplicación y debe corregirse.

| Documento | Contenido | Estado |
| --- | --- | --- |
| [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) | Regla de Oro + principio de reutilización de componentes | Verified |
| [`COMPONENTS.md`](COMPONENTS.md) | Catálogo de componentes compartidos y qué reutilizar por categoría | Verified |
| [`MODALS.md`](MODALS.md) | Escala de tamaños de modal (`MODAL_SIZES`) y comportamiento de scroll compartido | Verified — ver [`ADR-014`](../08_ADR/ADR-014-modal-sizing-unification.md) para el porqué |
| [`TABLES.md`](TABLES.md) | Patrón de tablas de listado | Pendiente de auditar |
| [`FORMS.md`](FORMS.md) | Patrón de formularios y campos | Pendiente de auditar |
| [`TYPOGRAPHY.md`](TYPOGRAPHY.md) | Escala tipográfica | Pendiente de auditar |
| [`COLORS.md`](COLORS.md) | Paleta y tokens semánticos de color | Pendiente de auditar |
| [`ICONOGRAPHY.md`](ICONOGRAPHY.md) | Convención de íconos | Pendiente de auditar |
| [`RESPONSIVE.md`](RESPONSIVE.md) | Breakpoints y comportamiento responsive | Pendiente de auditar |

Los documentos marcados **Pendiente de auditar** existen como estructura (creados 2026-08-03 para fijar el árbol completo pedido por el propietario del proyecto) pero todavía no tienen contenido verificado contra el código — se llenan de la misma forma que `DESIGN_SYSTEM.md`/`COMPONENTS.md`/`MODALS.md`: auditando el código real antes de escribir la regla, nunca al revés. No usar como referencia activa hasta que su estado cambie a **Verified**.

## Cómo se agrega una regla nueva aquí

1. Verificar contra el código real (`frontend/`) qué patrón ya existe — nunca declarar una regla que el código no sigue todavía.
2. Si la regla ya se seguía de forma consistente: documentarla tal cual.
3. Si se está introduciendo una regla nueva que cambia código existente (como la unificación de tamaños de modal): el ADR correspondiente documenta el *por qué* (`docs/08_ADR/`), este directorio documenta el *cómo* — dos responsabilidades distintas, nunca fusionadas en un solo documento.
4. Actualizar esta tabla.
