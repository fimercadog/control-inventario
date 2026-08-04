# 11_DESIGN_SYSTEM/

Fuente oficial única del Design System de FidelOS (consolidado 2026-08-03 — antes fragmentado entre `docs/04_TECHNICAL_SPEC/FRONTEND/DESIGN_SYSTEM.md`, una sección "Arquitectura Frontend" dentro de `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md`, y una referencia a una ruta que todavía no existía en `docs/_ARCHIVE/GOVERNANCE_SUPERSEDED.md`). Todo lo relacionado con UI/UX vive aquí — ningún otro documento del repositorio debe describir cómo se ve o se comporta la interfaz; solo puede referenciar esta carpeta.

Regla de esta carpeta, igual que `docs/10_GOVERNANCE/EngineeringManual.md` §"Regla de no duplicación": si un documento fuera de aquí empieza a explicar *cómo* funciona un patrón de UI (en vez de solo enlazar aquí), es una señal de duplicación y debe corregirse.

Historial de cambios de este directorio: [`CHANGELOG.md`](CHANGELOG.md).

## Leyenda de estado

| Símbolo | Significado |
| --- | --- |
| ✅ Verified | Auditado contra el código real, consistente, sin defectos conocidos pendientes de aprobación. |
| 🟡 Partial | Auditado contra el código real, pero con inconsistencias o bugs reales encontrados y documentados explícitamente — no ocultados, y no corregidos sin aprobación previa cuando el fix tiene alcance amplio. |
| ⚪ Planned | Mencionado como candidato pero no existe en el código todavía, o el documento no tiene contenido auditado. |

## Documentos

| Documento | Contenido | Estado |
| --- | --- | --- |
| [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) | Regla de Oro + principio de reutilización de componentes | ✅ Verified |
| [`COMPONENTS.md`](COMPONENTS.md) | Catálogo de componentes compartidos y qué reutilizar por categoría | ✅ Verified |
| [`COMPONENT_INVENTORY.md`](COMPONENT_INVENTORY.md) | Inventario completo con estado, ubicación y consumidores reales de cada componente compartido | ✅ Verified |
| [`MODALS.md`](MODALS.md) | Escala de tamaños de modal (`MODAL_SIZES`) y comportamiento de scroll compartido | ✅ Verified — ver [`ADR-014`](../08_ADR/ADR-014-modal-sizing-unification.md) para el porqué |
| [`TABLES.md`](TABLES.md) | Patrón de tablas de listado | 🟡 Partial — paginación, búsqueda servidor/cliente y color de badges no son uniformes |
| [`FORMS.md`](FORMS.md) | Patrón de formularios y campos | 🟡 Partial — dos familias de diálogo no reconciliadas |
| [`TYPOGRAPHY.md`](TYPOGRAPHY.md) | Escala tipográfica | 🟡 Partial — bug real: `--font-heading`/`--font-sans` nunca resuelven a Geist Sans |
| [`COLORS.md`](COLORS.md) | Paleta y tokens semánticos de color | 🟡 Partial — color de estado activo/inactivo dividido en 3 patrones |
| [`ICONOGRAPHY.md`](ICONOGRAPHY.md) | Convención de íconos | ✅ Verified |
| [`RESPONSIVE.md`](RESPONSIVE.md) | Breakpoints y comportamiento responsive | ✅ Verified |

`examples/` contiene capturas de pantalla reales de la aplicación (`crud-modal.png`, `table.png`, `movement-card.png`, `buttons.png`, `forms.png`) referenciadas desde los documentos de arriba.

Ningún documento queda en ⚪ Planned a partir de la v1.1 (2026-08-03) — los 4 documentos en 🟡 Partial están auditados y documentados, con sus inconsistencias/bugs reales explícitos en vez de ocultados; no se corrigieron porque cada uno requiere una decisión de alcance amplio (reconciliar un vocabulario de color, cambiar el `font-family` de toda la aplicación, unificar dos familias de diálogo) que necesita aprobación explícita antes de tocar código, la misma disciplina que exige `ADR-014`.

## Cómo se agrega una regla nueva aquí

1. Verificar contra el código real (`frontend/`) qué patrón ya existe — nunca declarar una regla que el código no sigue todavía.
2. Si la regla ya se seguía de forma consistente: documentarla como ✅ Verified.
3. Si se encuentran inconsistencias reales: documentarlas explícitamente como 🟡 Partial en vez de ocultarlas o forzar una "regla única" que el código no cumple.
4. Si se está introduciendo una regla nueva que cambia código existente (como la unificación de tamaños de modal): el ADR correspondiente documenta el *por qué* (`docs/08_ADR/`), este directorio documenta el *cómo* — dos responsabilidades distintas, nunca fusionadas en un solo documento.
5. Actualizar la tabla de arriba y agregar una entrada en `CHANGELOG.md`.
