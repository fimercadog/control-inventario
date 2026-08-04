/**
 * Design System (2026-08-03) — única fuente de verdad para el ancho y
 * el comportamiento de scroll de todo modal de la aplicación. Ningún
 * componente de modal declara su propio mapa de tamaños ni su propio
 * `max-h`/`overflow-y` local — quien necesite un tamaño nuevo lo agrega
 * aquí. Ver docs/11_DESIGN_SYSTEM/DESIGN_SYSTEM.md, sección "Modal
 * Sizes", para la regla completa (incluye que no se permite un tamaño
 * local sin un ADR).
 *
 * Los 5 valores son exactamente los 5 anchos que ya estaban en uso en
 * el código antes de esta unificación (`ConfirmDialog`/
 * `AsignarRolDialog` en 384px; la mayoría de formularios simples y
 * diálogos de una sola acción en 448px; `CrudModal`/`DetailModal` en
 * 512px por defecto; los formularios/vistas más grandes en 672px;
 * la Ficha de Producto, la más grande de las 8, en 896px) — elegidos
 * así a propósito para que ningún modal existente cambiara de tamaño
 * al migrar a esta escala compartida. `xs` existe porque `sm:max-w-sm`
 * (384px) ya estaba en uso real (confirmaciones) y forzarlo dentro de
 * la escala de 4 tamaños originalmente propuesta habría significado
 * agrandar `ConfirmDialog` sin necesidad.
 */
export const MODAL_SIZES = {
  xs: "sm:max-w-sm", // 384px — confirmaciones, selectores de una sola acción
  sm: "sm:max-w-md", // 448px — formularios simples (1-2 campos), diálogos de una sola acción
  md: "sm:max-w-lg", // 512px — formularios/vistas de tamaño medio (tamaño por defecto)
  lg: "sm:max-w-2xl", // 672px — formularios con más campos, vistas con pestañas
  xl: "sm:max-w-4xl", // 896px — vistas con más contenido (varias pestañas + listas largas)
} as const;

export type ModalSize = keyof typeof MODAL_SIZES;

/**
 * Comportamiento de scroll compartido. `max-h-[85vh]` es un valor
 * arbitrario a propósito (no existe una utilidad nombrada de Tailwind
 * para "85% del alto del viewport") — vive en un solo lugar en vez de
 * repetirse en cada componente de modal.
 */
export const MODAL_SCROLL_CLASS = "max-h-[85vh] overflow-y-auto";
