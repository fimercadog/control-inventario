/**
 * Compartido entre `/perfil` (autoservicio) y `UsuarioFormModal` (edición
 * administrativa, ADR-015, 2026-08-04) — antes duplicado en cada lugar
 * que renderizaba estos selectores.
 */
export const THEME_ITEMS: Record<string, string> = { light: "Claro", dark: "Oscuro", system: "Sistema" };
export const LANGUAGE_ITEMS: Record<string, string> = { es: "Español", en: "English" };
