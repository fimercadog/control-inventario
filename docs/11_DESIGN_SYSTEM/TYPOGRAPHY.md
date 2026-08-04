# Typography

**STATUS: 🟡 Partial** — auditado contra `frontend/app/layout.tsx`, `frontend/app/globals.css` y la jerarquía real de clases de texto en toda la aplicación (2026-08-03). La jerarquía de tamaños está bien establecida y es consistente. **Se encontró un bug real y verificado a nivel de mecanismo de CSS, no solo una inconsistencia de documentación** — ver "Bug encontrado" abajo. No corregido en esta auditoría, pendiente de tu aprobación.

## 🔴 Bug encontrado — `--font-heading` y `--font-sans` nunca resuelven a Geist Sans

`frontend/app/layout.tsx` carga `Geist`/`Geist_Mono` correctamente vía `next/font/google` y expone `--font-geist-sans`/`--font-geist-mono` en el `<html>`. Pero `frontend/app/globals.css` (bloque `@theme inline`) declara:

```css
--font-sans: var(--font-sans);   /* auto-referencia circular */
--font-mono: var(--font-geist-mono);  /* correcto */
--font-heading: var(--font-sans);     /* hereda la auto-referencia rota */
```

`--font-sans` se define como `var(--font-sans)` — una referencia a sí misma, nunca a `--font-geist-sans`. Tailwind v4 inlinea los valores de `@theme inline` como una referencia `var()` literal en las clases utilitarias en vez de resolverlos a un valor concreto, así que `html { @apply font-sans; }` (`globals.css`) termina compilando a `font-family: var(--font-sans);` — una variable sin ningún valor real en toda la cascada de CSS en tiempo de ejecución. Para `font-family` (propiedad heredable) sin nada de qué heredar en la raíz, el navegador cae a su propia fuente por defecto del sistema — **ni Geist Sans, ni siquiera la pila sans-serif por defecto de Tailwind.**

Verificado a nivel de mecanismo (rastreado hasta `node_modules/tailwindcss/theme.css`/`preflight.css`), no por inspección visual — no se corrió el servidor de desarrollo para esta auditoría específica. `--font-heading` (usado por `DialogTitle`, `CardTitle`, `SheetTitle` vía la clase `font-heading`) hereda el mismo problema — **no es una fuente decorativa distinta del cuerpo del texto; es la misma variable rota**, así que los títulos de modal/card no tienen ninguna diferenciación tipográfica real de fuente respecto al cuerpo, solo de tamaño/peso.

**No corregido aquí.** El fix probable es de una sola línea (`--font-sans: var(--font-geist-sans);`), pero cambia el `font-family` renderizado de **toda** la aplicación — fuera del alcance de una auditoría de documentación, requiere tu aprobación explícita antes de tocarlo.

## Verified

- **Setup de fuente**: `Geist` (sans) y `Geist_Mono` vía `next/font/google` en `frontend/app/layout.tsx`, expuestas como `--font-geist-sans`/`--font-geist-mono`. `--font-mono` sí está correctamente conectada a Geist Mono — solo `--font-sans`/`--font-heading` están rotas (ver bug arriba).
- **Jerarquía de tamaño/peso, de mayor a menor** (conteos reales por grep, no estimados):
  1. `text-3xl font-semibold tracking-tight sm:text-4xl` — 1 uso (título hero de la landing de Captura).
  2. `text-2xl font-bold` / `text-xl font-bold` — valor de cantidad con signo en Movimientos (2 usos, coloreados esmeralda/rojo).
  3. **`text-2xl font-semibold [tracking-tight]` — el estándar de facto para `<h1>` de página**, 23 archivos (toda pantalla de listado + fichas de detalle + flujo de Captura), más 2 usos para números grandes de estadística (`StatCard`, tarjeta de uso de almacenamiento en Configuración).
  4. `text-base font-medium` + `font-heading` — título de `DialogTitle`/`CardTitle`/`SheetTitle` (estándar compartido de los 3 componentes).
  5. `text-sm font-medium` — 18 usos: labels de navegación del sidebar, enlaces en modales de vista, y la clase base compartida de `Button` y `TabsTrigger` (por lo que en la práctica respalda casi todo botón y pestaña de la aplicación).
  6. **`text-sm text-muted-foreground` — 81 usos, el estilo secundario/caption dominante**: subtítulos de página, estados de carga/vacío, y la clase por defecto de `DialogDescription`/`SheetDescription`/`CardDescription`/`TableCaption`.
  7. **`text-xs text-muted-foreground` — 65 usos, el nivel más pequeño/tenue**: labels de campo (`Label` dentro de `Field`), metadata (correos bajo nombres, timestamps).
- **Inconsistencia de peso conocida, documentada aquí, no corregida**: los `<h1>` de página usan `font-semibold`, pero `DialogTitle`/`CardTitle`/`SheetTitle` usan solo `font-medium` — no existe un escalón `text-xl`/`text-lg` entre ambos, la jerarquía salta directo de `text-2xl font-semibold` (página) a `text-base font-medium` (modal/card).

## Ejemplo visual

`examples/crud-modal.png` (título de modal) y las capturas de listado ya incluidas en otros documentos muestran la jerarquía de `<h1>` de página en contexto.
