# Colors

**STATUS: 🟡 Partial** — auditado contra `frontend/app/globals.css` y el uso real de color de estado en toda la aplicación (2026-08-03). Los tokens de tema están completos y son consistentes (light/dark). **El color de los badges de estado activo/inactivo está dividido en 3 patrones no reconciliados**, más disperso de lo que se sospechaba antes de esta auditoría — documentado en detalle, no corregido.

## Verified — tokens de tema completos

Definidos en `frontend/app/globals.css`, con `:root` (claro) y `.dark` (oscuro, activado vía `@custom-variant dark`):

| Token | Claro | Oscuro |
| --- | --- | --- |
| `background` / `foreground` | `oklch(1 0 0)` / `oklch(0.19 0.02 275)` | `oklch(0.16 0.02 275)` / `oklch(0.95 0.01 275)` |
| `card` / `card-foreground` | `oklch(1 0 0)` / `oklch(0.19 0.02 275)` | `oklch(0.2 0.02 275)` / `oklch(0.95 0.01 275)` |
| `popover` / `popover-foreground` | igual que `card` | igual que `card` |
| `primary` / `primary-foreground` | `oklch(0.53 0.24 274)` / `oklch(0.99 0 0)` | `oklch(0.65 0.22 274)` / `oklch(0.14 0.02 275)` |
| `secondary` / `secondary-foreground` | `oklch(0.96 0.01 275)` / `oklch(0.3 0.03 275)` | `oklch(0.27 0.02 275)` / `oklch(0.95 0.01 275)` |
| `muted` / `muted-foreground` | igual que `secondary` | igual que `secondary` |
| `accent` / `accent-foreground` | `oklch(0.94 0.03 275)` / `oklch(0.35 0.15 274)` | `oklch(0.3 0.06 274)` / `oklch(0.9 0.05 274)` |
| `destructive` | `oklch(0.6 0.22 25)` | `oklch(0.7 0.2 25)` |
| `success` / `success-foreground` | `oklch(0.72 0.17 155)` / `oklch(0.99 0 0)` | `oklch(0.75 0.17 155)` / `oklch(0.14 0.03 155)` |
| `warning` / `warning-foreground` | `oklch(0.8 0.17 80)` / `oklch(0.28 0.06 80)` | `oklch(0.82 0.17 80)` / `oklch(0.22 0.05 80)` |
| `border` / `input` / `ring` | `oklch(0.91 0.01 275)` / igual / `primary` al 50% opacidad | `blanco al 10-15%` / `primary` al 50% opacidad |
| `chart-1..5` | escalados desde `primary`/`success`/`warning`/`chart-4`/`destructive` | ídem, tonos ajustados |
| `sidebar*` (7 tokens) | paleta propia, más oscura que `background` incluso en modo claro | paleta propia, distinta de `background` |
| `radius` | `0.85rem` (sin override en `.dark`) | hereda del claro |

**Nota**: no existe un token `destructive-foreground` — a diferencia de `success`/`warning`, que sí tienen su `-foreground` dedicado, los usos de `destructive` dependen de mezclas de opacidad (`destructive/10`, `destructive/20`) con `text-destructive`, nunca de un color de texto pareado.

## Partial — el color de estado tiene 3 patrones, no 2

Antes de esta auditoría se sabía que existían "dos sistemas de color sin reconciliar" (tokens semánticos vs. clases literales). La auditoría real encontró que son **3**, y que el patrón dominante tiene además usos dispersos fuera de los 9 módulos con concepto activo/inactivo:

1. **Clases literales `bg-emerald-600 text-white dark:bg-emerald-500` / `bg-red-600 text-white dark:bg-red-500`** — patrón dominante, usado en **16 archivos** (listado + modal de vista) de **8 de los 9** módulos con estado activo/inactivo: Categorías, Marcas, Clientes, Productos, Stock, Unidades de Medida, Usuarios, Roles. Además, **6 sitios más** usan la misma paleta literal (sin ningún token) para campos relacionados pero distintos: el resultado "exitoso" de Auditoría, y el color del ícono/cantidad con signo en Movimientos (lista y ficha) — ninguno de estos 6 usa `success`/`destructive`.
2. **Tokens semánticos `success`/`warning`/`destructive`** (ej. `bg-success/15 text-success dark:bg-success/20`) — **10 archivos**, y **nunca se usan para los badges activo/inactivo** de ningún módulo CRUD: `MovementTypeBadge`, `ConfidenceBadge`, las tarjetas de revisión/estado de Captura IA, `StatCard`, la tarjeta de stock bajo del Dashboard, las barras del gráfico de Reportes, y el ícono de éxito en las 3 pantallas públicas de contraseña.
3. **`Badge variant="outline"`/`variant="secondary"` (sin color-coding)** — usado exclusivamente por **Proveedores** (2 archivos: listado y modal de vista), el 9° módulo con concepto activo/inactivo. Ni verde ni rojo — variantes genéricas del componente `Badge` (borde transparente / fondo `secondary`). Es un tercer patrón real, no una variación menor del primero.

El botón/prop `destructive` de `Button`/`ConfirmDialog` (para la acción de desactivar, no el badge de estado en sí) sí se usa consistentemente en los 9 módulos — esa parte está unificada; lo que no lo está es el badge que muestra el estado actual.

**Sin justificación documentada**: no existe ningún comentario en el código (`TODO`/`FIXME`/explicativo) en ninguno de los sitios de los 3 patrones que explique por qué se eligió cada uno. No corregido en esta auditoría — cualquier reconciliación (por ejemplo, migrar todo a `success`/`destructive`) requiere su propio ADR antes de tocar código, igual que `ADR-014`.

## Ejemplo visual

`examples/table.png` y `examples/movement-card.png` muestran ambos patrones de color en contexto (badges de Estado literales en Productos, colores de tipo de movimiento semánticos en Movimientos).
