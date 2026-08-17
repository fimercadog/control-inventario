/**
 * spec.md, "CORRECCIÓN GLOBAL — SELECTS DE RELACIONES": a Select's `value` must stay the raw
 * id the backend expects, but its trigger must display the related entity's readable name, not
 * the id itself. base-ui's `Select.Value` renders the raw value string when given no children.
 *
 * Once a children *function* is provided (required to show a label instead of the raw id),
 * base-ui calls it unconditionally — it does NOT fall back to the `placeholder` prop on its
 * own even when `value` is empty (confirmed live: passing `placeholder="Sin marca"` alongside
 * a children function rendered nothing at all for an empty value, not the placeholder text).
 * So this helper takes the intended placeholder as `fallback` and returns it itself whenever
 * there's no value or no matching item (including the case where the related record still
 * exists but isn't in the currently-fetched options list, e.g. a disabled Marca/UnidadMedida
 * that was active when assigned but is filtered out of the picker's own active-only fetch).
 */
export function findLabel<T>(
  value: string | undefined,
  items: T[],
  getId: (item: T) => string | number,
  getLabel: (item: T) => string,
  fallback = ""
): string {
  if (!value) return fallback;
  const match = items.find((item) => String(getId(item)) === value);
  return match ? getLabel(match) : fallback;
}
