# Typography

**STATUS: ✅ Verified** — auditado contra `frontend/app/layout.tsx`, `frontend/app/globals.css` y la jerarquía real de clases de texto en toda la aplicación (2026-08-03). Bug real encontrado en la primera pasada (variable de fuente rota) — aprobado y corregido el mismo día, verificado en navegador. Ver "Bug corregido" abajo.

## 🟢 Bug corregido (2026-08-03) — `--font-sans`/`--font-heading` no resolvían a Geist Sans

`frontend/app/layout.tsx` carga `Geist`/`Geist_Mono` correctamente vía `next/font/google` y expone `--font-geist-sans`/`--font-geist-mono` en el `<html>`. `frontend/app/globals.css` (bloque `@theme inline`) tenía:

```css
--font-sans: var(--font-sans);   /* auto-referencia circular — el bug */
--font-mono: var(--font-geist-mono);  /* correcto, sin cambios */
--font-heading: var(--font-sans);     /* heredaba la auto-referencia rota */
```

`--font-sans` se definía como `var(--font-sans)` — una referencia a sí misma, nunca a `--font-geist-sans`. Tailwind v4 inlinea los valores de `@theme inline` como una referencia `var()` literal en las clases utilitarias en vez de resolverlos a un valor concreto, así que `html { @apply font-sans; }` (`globals.css`) compilaba a `font-family: var(--font-sans);` — una variable sin ningún valor real en toda la cascada de CSS en tiempo de ejecución. La aplicación nunca renderizaba Geist Sans pese a cargarla correctamente — caía al font por defecto del navegador.

**Corregido**: `--font-sans: var(--font-geist-sans);` (una sola línea). `--font-heading` no necesitó cambio propio — ya cascadeaba desde `--font-sans`, así que se corrigió automáticamente al arreglar la fuente. Ningún tamaño, peso, ni la jerarquía de la sección "Verified" de abajo cambió — solo qué tipografía real se renderiza.

**Verificado en navegador** (no solo a nivel de mecanismo de CSS): `getComputedStyle` sobre `<body>`, un `<h1>` de página, y el título de un modal (`DialogTitle`) — los 3 resuelven a `Geist, "Geist Fallback"` después del fix, ninguno cae a una pila de fuentes de sistema genérica. Sin errores de consola, sin cambio de layout visible.

## Verified

- **Setup de fuente**: `Geist` (sans) y `Geist_Mono` vía `next/font/google` en `frontend/app/layout.tsx`, expuestas como `--font-geist-sans`/`--font-geist-mono`. Ambas correctamente conectadas tras el fix de arriba.
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
