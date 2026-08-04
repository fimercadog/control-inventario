# Iconography

**STATUS: ✅ Verified** — auditado contra `frontend/` el 2026-08-03 (59 archivos con `import ... from "lucide-react"`, ~69 nombres de ícono distintos). A diferencia de Tables/Forms, esta auditoría no encontró una división real en dos sistemas — la convención es consistente.

## Verified

- **`lucide-react` es la única librería de íconos**, sin excepción — confirmado en `package.json` (única dependencia de íconos) y por grep de las librerías alternativas más comunes (`@heroicons/*`, `react-icons`, `@radix-ui/react-icons`, `@tabler/icons*`, `@phosphor-icons/*`, `react-feather`, `@fortawesome/*`): cero coincidencias. Tampoco hay ningún `<svg>` crudo escrito a mano en `app/` o `components/`.
- **`size-4` es el tamaño por defecto de facto** — forzado como fallback CSS (`[&_svg:not([class*='size-'])]:size-4`) en `components/ui/button.tsx`, `dropdown-menu.tsx` y `select.tsx`: cualquier ícono dentro de un `Button`, `DropdownMenuItem` o `Select` sin clase explícita se renderiza en `size-4` automáticamente.
- **Convención de tamaño por contexto** (verificada, no una regla escrita antes de esta auditoría, pero consistente en la práctica):
  - `size-3` — forzado de forma incondicional en todo ícono dentro de un `Badge` (`badge.tsx`: `[&>svg]:size-3!`), y el tamaño explícito de las variantes `xs`/`icon-xs` de `Button`.
  - `size-3.5` — variantes `sm`/`icon-sm` de `Button`; ícono pequeño de metadata en línea junto a texto (fichas de detalle, filas de listado, enlaces "Volver").
  - `size-4` — default general: botones, íconos prefijo de campo (buscar/candado/correo), spinners de carga, acciones de fila en tablas.
  - `size-5` — siempre dentro de un contenedor circular `size-11`/`size-12` (avatar de header de `DetailModal`, ícono de `StatCard`, ilustración de `EmptyState`) — nunca usado suelto.
  - `size-7` — o bien la marca de logo independiente en las páginas de autenticación, o anidado dentro de un círculo `size-16` en las fichas de detalle (`*-detail-screen.tsx`).
  - De `size-8` en adelante (hasta `size-28`), lo que no es un override explícito de ícono es el tamaño del **contenedor** (círculo/cuadro/Avatar), no del ícono en sí — por ejemplo `size-9` es el cuadro "líder" de fila usado idéntico en 8+ listados, no un tamaño de ícono.
- **Patrón de prop de ícono**: `EmptyState`, `StatCard` y `DetailModal` reciben el ícono como referencia de componente (`icon: React.ElementType`, o el tipo más estricto `React.ComponentType<{ className?: string }>` en `DetailModal`) — nunca como nombre de string ni JSX pre-renderizado.
- **`MovementTypeBadge`** guarda el ícono en un mapa de configuración por tipo (`icon: React.ElementType`, `movement-type-badge.tsx`) y lo renderiza como `<Icon data-icon="inline-start" />`, sin clase de tamaño explícita — el tamaño lo decide `Badge` (`size-3` forzado).
- **`data-icon="inline-start"`/`"inline-end"`**: atributo HTML plano usado como hook de CSS, no una API de lucide. Solo 2 usos reales de `"inline-start"` en toda la aplicación (`movement-type-badge.tsx`, `confidence-badge.tsx`), pero el mecanismo está definido en `badge.tsx` y `button.tsx` (agregan padding asimétrico según qué lado tiene ícono). `"inline-end"` está cableado en el CSS de ambos primitivos pero **sin ningún consumidor real todavía** — existe para un ícono final futuro (ej. un chevron después del texto) que no se ha construido.

## Ejemplo visual

`examples/buttons.png` — íconos dentro de botones primarios, íconos ghost de acción de fila, menú de acciones abierto.
