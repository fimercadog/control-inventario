# ADR-014: Modal sizing centralizado en `components/ui/modal.ts`, sin escalas locales por componente

## Estado
Accepted (Verified) — decisión tomada y su código implementado en la misma unidad de trabajo que este ADR documenta.

## Fecha
2026-08-03.

## Contexto
`CrudModal` (`frontend/components/crud-modal.tsx`) y `DetailModal` (`frontend/components/detail-modal.tsx`), los dos shells compartidos del Global UI Standard "CRUD en Modal" (`docs/05_IMPLEMENTATION/ModalCrudStandard.md`), cada uno declaraba su propio mapa `SIZES` local, con nombres de tamaño que no significaban lo mismo entre sí: `CrudModal.lg` resolvía a `sm:max-w-lg` (512px), mientras que `DetailModal.lg` resolvía a `sm:max-w-2xl` (672px). Detectado en una auditoría explícita de reutilización de componentes contra `docs/04_TECHNICAL_SPEC/FRONTEND/DESIGN_SYSTEM.md` §1.1 ("Component Reuse (Mandatory)"), pedida por el propietario del proyecto. Seis diálogos independientes fuera de estos dos shells (`ConfirmDialog`, `AsignarRolDialog`, `InvitarUsuarioDialog`, `NewMovimientoDialog`, `ProductSupplierDialog`, `RegistrarIngresoDialog`) también declaraban su ancho como una clase `sm:max-w-*` literal en su propio archivo, sin relación con ninguno de los dos shells.

## Problema
¿Cómo garantizar que el mismo nombre de tamaño (`sm`/`md`/`lg`/`xl`) produzca siempre el mismo ancho visual en cualquier modal de la aplicación, presente o futuro, sin que cada componente de modal declare su propia escala?

## Alternativas consideradas
1. **Dejar las dos escalas divergentes tal cual, documentando la diferencia.** Descartada explícitamente por el propietario del proyecto — rompe el principio de menor sorpresa (`size="lg"` con un comportamiento distinto según qué componente lo reciba).
2. **Colapsar a una escala de 4 tamaños (`sm`/`md`/`lg`/`xl`), aceptando que algún modal cambie de ancho.** Descartada. El objetivo explícito era no cambiar la apariencia visual intencionalmente (consistencia arquitectónica, no rediseño); reducir a 4 tamaños habría forzado a `ConfirmDialog`/`AsignarRolDialog` (384px reales) a compartir tamaño con los diálogos de 448px, cambiando su ancho sin que se hubiera pedido.
3. **Escala de 5 tamaños (`xs`/`sm`/`md`/`lg`/`xl`) — elegida.** Se auditaron los 21 usos reales de ancho de modal en el código (15 en `CrudModal`/`DetailModal` a través de los 8 módulos CRUD, 6 en diálogos independientes) y se encontraron exactamente 5 valores de píxel distintos ya en uso: 384, 448, 512, 672, 896. Se diseñó la escala para que cada uno de esos 5 valores tuviera un nombre propio, permitiendo que los 21 usos existentes migraran sin cambiar un solo píxel.

## Decisión
`frontend/components/ui/modal.ts` exporta `MODAL_SIZES` y `MODAL_SCROLL_CLASS` como única fuente de verdad:

| Nombre | Clase Tailwind | Ancho |
| --- | --- | --- |
| `xs` | `sm:max-w-sm` | 384px |
| `sm` | `sm:max-w-md` | 448px |
| `md` | `sm:max-w-lg` | 512px |
| `lg` | `sm:max-w-2xl` | 672px |
| `xl` | `sm:max-w-4xl` | 896px |

`MODAL_SCROLL_CLASS = "max-h-[85vh] overflow-y-auto"`.

`CrudModal` y `DetailModal` importan ambas constantes y eliminaron sus mapas `SIZES` locales. Los 6 diálogos independientes migraron el `className` de su `DialogContent` de una cadena literal a `MODAL_SIZES.xs`/`MODAL_SIZES.sm`. Tres formularios (`ProveedorFormModal`, `ClienteFormModal`, `RoleFormModal`) que pasaban `size="lg"` bajo la escala antigua de `CrudModal` (512px) se remapearon a `size="md"` para preservar exactamente ese ancho bajo la escala nueva, donde `lg` ahora significa 672px. `CrudModal` cambió su tamaño por defecto de `"md"` a `"sm"` — ambos resuelven a 448px bajo sus escalas respectivas — para preservar el ancho de los 4 formularios que no pasan `size` explícito (`CategoriaFormModal`, `MarcaFormModal`, `UnidadMedidaFormModal`, `ProductoFormModal`). `DetailModal` mantuvo su default en `"md"` (512px en ambas escalas). Resultado: los 21 usos existentes migraron sin ningún cambio de ancho, verificado en navegador.

Regla hacia adelante (`docs/04_TECHNICAL_SPEC/FRONTEND/DESIGN_SYSTEM.md`, sección "Modal Sizes"): ningún componente de modal nuevo puede declarar su propio mapa de tamaños ni su propio tratamiento de scroll — debe importar `MODAL_SIZES`/`MODAL_SCROLL_CLASS`. Una definición local de tamaño de modal sin un ADR que la justifique explícitamente no está permitida.

## Consecuencias

**Positivas:**
- `size="lg"` (o cualquier otro nombre) produce el mismo ancho en cualquier modal de la aplicación, sin excepción — cierra el riesgo señalado explícitamente por el propietario del proyecto de que esto se convirtiera en una fuente de inconsistencia silenciosa dentro de unos meses.
- Agregar o cambiar un tamaño es un cambio de una sola línea en `modal.ts`, no una búsqueda por todo el árbol de componentes.
- El comportamiento de scroll (`max-h-[85vh] overflow-y-auto`) también queda centralizado — antes se repetía como cadena literal, por separado, en `CrudModal` y `DetailModal`.

**Negativas / trade-offs aceptados:**
- La escala terminó en 5 tamaños, no en los 4 (`sm`/`md`/`lg`/`xl`) sugeridos originalmente como ejemplo por el propietario del proyecto — fue la única forma de lograr cero cambios de ancho reales sobre los 21 usos existentes. Se documenta la razón explícitamente en vez de forzar el ejemplo de 4 tamaños y aceptar un cambio visual no pedido.
- El padding (`p-4`, vía `DialogContent` en `frontend/components/ui/dialog.tsx`), las animaciones de apertura/cierre, y el ancho responsivo por debajo del breakpoint `sm` (`max-w-[calc(100%-2rem)]`) ya estaban centralizados en el primitivo compartido antes de este ADR — no se tocaron porque ya cumplían la regla, no se re-implementaron ni se duplicaron.

## Impacto
Medio — afecta la capa de presentación de los 8 módulos CRUD y 6 diálogos independientes; no toca lógica de negocio, API, ni modelo de datos.

## Referencias
- `docs/04_TECHNICAL_SPEC/FRONTEND/DESIGN_SYSTEM.md` §1.1 (Component Reuse) y sección "Modal Sizes"
- `docs/05_IMPLEMENTATION/ModalCrudStandard.md`
- `frontend/components/ui/modal.ts`, `frontend/components/crud-modal.tsx`, `frontend/components/detail-modal.tsx`

## Estado de implementación
Implementado. `npx tsc --noEmit` limpio. Verificación de ancho real en navegador documentada en el informe de esta unidad de trabajo (2026-08-03).

## Información Faltante
Ninguna — decisión tomada y documentada en la misma sesión donde se implementó, con acceso directo al código antes y después del cambio (no es una reconstrucción por inferencia, a diferencia de la mayoría de los ADR-001 a ADR-013 de este mismo índice).
