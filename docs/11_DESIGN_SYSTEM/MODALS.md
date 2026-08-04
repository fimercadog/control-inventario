# Modal Sizes

Única fuente de verdad: `frontend/components/ui/modal.ts` (`MODAL_SIZES`, `MODAL_SCROLL_CLASS`). Consolidado 2026-08-03 después de que una auditoría de reutilización de componentes (`DESIGN_SYSTEM.md` §1.1) encontrara que `CrudModal` y `DetailModal` cada uno definía su propia escala de tamaños, inconsistente entre sí — el mismo nombre de tamaño (`lg`) resolvía a un ancho distinto según el componente.

| Tamaño | Clase Tailwind | Ancho | Uso típico |
| --- | --- | --- | --- |
| `xs` | `sm:max-w-sm` | 384px | Confirmaciones, selectores de una sola acción |
| `sm` | `sm:max-w-md` | 448px | Formularios simples (1-2 campos), diálogos de una sola acción |
| `md` | `sm:max-w-lg` | 512px | Formularios/vistas de tamaño medio (tamaño por defecto) |
| `lg` | `sm:max-w-2xl` | 672px | Formularios con más campos, vistas con pestañas |
| `xl` | `sm:max-w-4xl` | 896px | Vistas con más contenido (varias pestañas + listas largas) |

Todos los modales reutilizan exactamente esta escala. El mismo nombre de tamaño produce siempre el mismo ancho, sin excepción — en cualquier modal de la aplicación, presente o futuro.

`MODAL_SCROLL_CLASS` (`max-h-[85vh] overflow-y-auto`) es el comportamiento de scroll compartido — tampoco se redefine localmente.

**No se permite redefinir tamaños locales.** Ningún componente de modal declara su propio mapa de tamaños ni su propio `max-h`/`overflow-y` — importa `MODAL_SIZES`/`MODAL_SCROLL_CLASS` de `components/ui/modal.ts`. Una definición local de tamaño de modal sin un ADR que la justifique explícitamente no está permitida.

## Componentes que ya siguen esta regla

Los dos shells compartidos (`CrudModal`, `DetailModal`, usados por los 8 módulos CRUD vía sus `<X>FormModal`/`<X>ViewModal`) y los 6 diálogos independientes de la aplicación (`ConfirmDialog`, `AsignarRolDialog`, `InvitarUsuarioDialog`, `NewMovimientoDialog`, `ProductSupplierDialog`, `RegistrarIngresoDialog`) — los 21 usos reales de ancho de modal existentes al momento de esta consolidación.

## Decisión completa y razonamiento

`docs/08_ADR/ADR-014-modal-sizing-unification.md` — incluye las 3 alternativas comparadas, por qué la escala terminó en 5 tamaños en vez de 4, y la verificación de que los 21 usos existentes migraron sin cambiar un solo píxel.
