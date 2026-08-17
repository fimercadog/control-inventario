# Fase 1 — Foundation

**Estado: COMPLETA (heredada de sesiones anteriores, verificada, no reconstruida).**

Auditoría (2026-08-17) confirma que los 16 puntos de `spec.md` Fase 1 ya existen y funcionan:

| # | Punto | Estado | Evidencia |
|---|---|---|---|
| 1-3 | Auditoría frontend/backend/manual | Hecha | esta sesión — spec.md, manual.html (1071 líneas), routes/api.php (307 líneas), backend Controllers/Requests/Policies |
| 4 | Dependencias | OK | `package.json`: Next 16, React 19, RHF+Zod, TanStack Table, Redux Toolkit, shadcn/base-ui |
| 5 | Theme | OK | `globals.css`, dark mode vía tokens, ya usado por Login/Dashboard/Usuarios/Roles/Categorías/Proveedores |
| 6-7 | Layout / Sidebar | OK | `components/layout/authenticated-shell.tsx`, `sidebar.tsx`, `sidebar-nav.tsx`, `nav-items.ts` |
| 8 | Header | OK | `components/layout/header.tsx` |
| 9 | API Client | OK | `lib/api/client.ts` (axios, token fuera de cookies) + `lib/api/errors.ts` |
| 10-11 | JWT / Refresh Token | OK | manejado en `client.ts` + `session-bootstrap.tsx` / `use-bootstrap-session.ts` |
| 12 | Logout | OK | ya probado en sesiones anteriores (Playwright `auth.spec.ts`) |
| 13 | Protección de rutas | OK | `authenticated-shell.tsx` |
| 14 | Login | OK | `app/login/` |
| 15 | Recuperación de contraseña | OK | `app/olvide-password/`, `app/restablecer-password/` |
| 16 | Dashboard | OK | `app/dashboard/`, datos reales (no mock, cerrado 2026-08-11) |

**Componentes reutilizables ya disponibles** (Ponytail — REUSE en cada módulo nuevo): `components/ui/` (alert, avatar, badge, button, card, checkbox, dialog, dropdown-menu, input, label, select, separator, sheet, skeleton, table, tabs, textarea), `components/data-table/` (DataTable genérico), hooks (`use-permission`, `use-debounced-search`, `use-bootstrap-session`), `lib/api/errors.ts` (`extractApiErrorMessage`).

**Sin cambios necesarios.** No se modificó ningún archivo de esta fase — spec.md prohíbe tocar lo que ya funciona sin una razón real, y no se encontró ninguna.

**Nota de navegación:** el manual (sección 5) documenta el Sidebar agrupado en 4 grupos (General / Inventario / Terceros / Administración). El `nav-items.ts` actual es una lista plana. Se evaluará agrupar visualmente al añadir los módulos nuevos, como mejora de bajo riesgo — no como reconstrucción del Sidebar (spec.md prohíbe reconstruirlo; agrupar visualmente los mismos items no es una reconstrucción de su arquitectura).
