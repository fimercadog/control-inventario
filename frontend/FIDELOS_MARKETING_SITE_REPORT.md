# FidelOS — Marketing Site Report

## Summary

Rebuilt the public commercial landing (`/`) as a premium, single-file marketing
experience that presents FidelOS as one unified platform — inventory control
+ CRM — instead of two products bolted together. The work stayed scoped to
`frontend/src/components/marketing/marketing-landing.tsx` and its test file;
nothing in the authenticated app, backend, or database was touched.

## Product Audit

Before writing any copy, the following were reviewed to ground every claim in
the real product:

- `spec.md` (product spec) and the CRM user manual produced earlier this
  session (`docs/manual-usuario-fidelos.pdf`), covering all 14 real modules,
  the 7 seeded roles, and the actual permission model.
- The running frontend (`frontend/src/app/*`) to confirm every route the
  landing links to or describes actually exists: `/clientes`, `/contactos`,
  `/oportunidades`, `/actividades`, `/automatizaciones`, `/productos`,
  `/categorias`, `/marcas`, `/unidades`, `/stock`, `/movimientos`,
  `/proveedores`, `/usuarios`, `/roles`, `/auditoria`, `/reportes`,
  `/captura-ia`, `/contingencia`.
- The existing `marketing-landing.tsx` (already a solid first draft — same
  copy voice, same anchors, same nav) and its `globals.css` scoped overrides,
  to understand the visual system already committed for this page (see
  Visual Direction below) before extending it.
- The already-passing `tests/marketing.spec.ts` to learn the exact copy/label
  contracts already relied on (heading text, button labels, tab names), so
  the rewrite would not silently break coverage.

No backend/API/database inspection was needed beyond what the manual and
existing frontend already establish — the landing does not call any new
endpoint (the demo form stays local-only, exactly as it already was).

## Manual Audit

Cross-checked every commercial claim against the CRM manual built earlier in
this session: module list, the 7 real roles, the stock/movement integrity
rule ("a movement never gets deleted, an opportunity never touches stock
until a sale is confirmed"), the Captura IA "en preparación" status, and the
Modo Contingencia restrictions. No feature, metric, or integration was
invented — where the product doesn't have something yet (pricing, verified
testimonials), the landing says so plainly instead of filling the gap with
fiction.

## Positioning

**"Más control para tu operación. Mejor seguimiento para tus ventas."**
FidelOS is framed as the one place that replaces spreadsheets, WhatsApp
threads, and loose notes — not as a technical tool, but as the answer to
"where does my business actually live." Inventory and CRM are presented as
two expressions of the same system, never as separate products.

## Visual Direction

- **Palette**: kept and leaned into the violet/cyan editorial identity a
  previous session already established for `.marketing` in `globals.css`
  (`#7c3aed` violet, `#0891b2` cyan, `#1d1633` ink) — confirmed by the three
  supplied product renders, which use the exact same palette. New elements
  reuse the existing `bg-[#3949AB]` / `text-[#00897B]` bracket-hex tokens so
  they stay governed by that one override system instead of drifting.
- **Type**: added "Unbounded" (Google Fonts) as a characterful display face
  for every headline (`.mkt-display`), loaded via a scoped `<style>` block
  inside the component only — no shared font file or root layout touched.
  Body copy still inherits the app's existing Hanken Grotesk; data labels
  (eyebrows, stat numbers, timestamps) use the existing mono stack.
- **Signature element**: a horizontal "pulse" ticker under the hero product
  shot, looping through real event types (movement registered, opportunity
  advanced, activity completed, automation ran) — framed explicitly as "lo
  que tu equipo ve en el panel," not as a live/fake data feed.
- **Real product visuals**: replaced the three hand-drawn gray-skeleton
  mockups with the three supplied 3D renders (`fidelos-hero-product.png`,
  `fidelos-inventory-traceability.png`, `fidelos-crm-relationships.png`),
  served through `next/image` with explicit dimensions and `priority` on the
  hero shot.
- **Motion**: a single `useInView`-driven `<Reveal>` wrapper fades+lifts each
  section on first scroll into view (one wrapper, reused everywhere — not
  scattered per-element effects), plus a hover "shine" sweep on the primary
  CTA and a smooth CSS-grid FAQ accordion. Everything using `mkt-*` keyframes
  is disabled under `prefers-reduced-motion: reduce`.
- **Bug fixed along the way**: the existing `.marketing .bg-gradient-to-br`
  override in `globals.css` (out of scope to edit) forces that utility class
  to a dark violet→ink→cyan gradient site-wide. Two bands that were designed
  light (`from-indigo-50 to-white`) were silently inheriting that dark
  gradient with never-updated `text-slate-600` copy, making the text nearly
  unreadable. Fixed by switching those two bands to an arbitrary
  `bg-[linear-gradient(...)]` value that Tailwind's JIT names differently,
  which the override selector can't match — no CSS file touched.

## Sections Created

In order, top to bottom:

1. Header (sticky nav, mobile menu) — unchanged structure, restyled.
2. Hero (`#inicio`) — new headline treatment, stat chips, real product shot,
   pulse ticker.
3. **New** — "Antes / Con FidelOS" contrast section (the problem +
   before/after comparison merged into one section, to avoid repeating the
   same six points twice).
4. Producto (`#producto`) — feature grid + restyled dark overview panel.
5. Inventario (`#inventario`) — checklist + real inventory-traceability
   image + Entrada/Salida/Ajuste band.
6. Automatización (`#automatizacion`) — Captura IA + Modo Contingencia, dark
   band.
7. CRM (`#crm`) — 4-step sequence (Contacto → Oportunidad → Actividad →
   Cierre) + real relationships image.
8. Reportes (`#reportes`) — 4 report categories.
9. Seguridad (`#seguridad`) — usuarios/roles/aislamiento/auditoría, dark
   band.
10. **New** — "Cómo funciona" (4 real onboarding steps).
11. **New** — "Para quién es" (audience chips: comercios, distribuidores,
    pymes, bodegas, negocios con inventario, equipos comerciales).
12. Explora FidelOS — interactive tabs (Inventario/CRM/Reportes/Seguridad).
13. FAQ (`#preguntas`) — same 6 questions, smoother accordion.
14. CTA final (`#demo`) — lead form, local-only, Beta notice preserved.
15. Footer.

Testimonios and Pricing were deliberately **not** added as dedicated
sections: there are no verifiable customer quotes to show, and no published
pricing to state. Inventing either would fail the "no fabricar" rule, so
those roles are absorbed into "Para quién es" (audience fit, in place of
testimonials) and the existing "Solicitar una demo" CTA (in place of a
pricing table).

## Inventory Story

"Conoce lo que tienes y cómo cambió" — productos, categorías, marcas,
unidades, stock, movimientos, proveedores, all named as real screens, plus
the one differentiator called out on its own: **stock only changes through a
movement** — an opportunity never touches it, a sale/dispatch has to be
confirmed explicitly. Entrada/Salida/Ajuste shown as three parallel outcomes
of that same rule.

## CRM Story

Contacto → Oportunidad → Actividad → Cierre, presented as one continuous
thread rather than four separate features — matching how the product itself
lets a contact convert into a client without losing its history.

## AI Capture

Presented with the transparent framing the work order asked for: "la IA
propone; tú confirmas." No accuracy claims. The existing "en preparación"
status (the feature is visible in the app but the model provider isn't
configured yet) stayed exactly as flagged in the CRM manual — the landing
doesn't get ahead of what's actually shippable today.

## Contingency

Kept as a supporting paragraph inside the Automatización band, not a
headline feature — "la operación puede continuar sin conexión," with the
real constraint (manual sync, conflict control) stated in one line rather
than expanded into its own section, per the instruction to keep it a
differentiator and not the center of the page.

## Security

"Cada persona ve y hace solo lo que necesita" — usuarios, roles, aislamiento
por empresa, auditoría, framed as trust rather than a technical permissions
lecture.

## Reports

Four categories shown (Inventario, Movimientos, Relaciones, Auditoría)
instead of an exhaustive list of every report the manual documents — chosen
for commercial legibility, not completeness for its own sake.

## SEO

`frontend/src/app/page.tsx` already had `title`, `description`, `keywords`,
canonical, OpenGraph, and Twitter card metadata in place from a previous
session — verified it matches the current positioning and left untouched
(editing it wasn't necessary, so it wasn't touched).

## Responsive

Verified visually at desktop (1440px), tablet (834px), and mobile (390px)
viewports via Playwright screenshots taken against the running dev server.
Mobile menu, stacked hero, and touch-sized tap targets all confirmed
working; a dedicated tablet test was added to the suite.

## Accessibility

Real `alt` text on all three product images (describing what they show, not
just "screenshot"), visible focus states inherited from the shared `Button`
component (untouched), `aria-label`/`aria-expanded` preserved on the mobile
menu and FAQ accordion, and all motion gated behind
`prefers-reduced-motion`.

## Performance

Product images served through `next/image` (automatic responsive `sizes`,
lazy-loaded except the hero shot which is marked `priority` for LCP). No new
npm dependency was added — the display font loads via a single scoped
`@import` and the ticker/reveal animations are hand-rolled CSS, matching the
zero-dependency approach the file already used.

## Tests

Extended `frontend/tests/marketing.spec.ts` (kept the 2 existing tests
passing untouched) and added:

- CTA hrefs (`Solicitar una demo` → `#demo`, `Ver cómo funciona` →
  `#producto`).
- All three real product images render with descriptive alt text.
- Every one of the 4 demo tabs (Inventario/CRM/Reportes/Seguridad) shows its
  real heading.
- The new comparison, "Cómo funciona," and "Para quién es" sections render.
- A tablet-viewport (834×1194) smoke check.

Captura IA was not exercised for real (no file upload/AI call triggered),
per instruction. Full command: `npx playwright test tests/marketing.spec.ts`
— 5/5 passing. The full suite (`npx playwright test`) was also run to
confirm no other spec regressed from this change (see Build section for the
result).

## Build

- `npx tsc --noEmit` — clean, no errors.
- `npx eslint` on the two changed files — clean, no warnings.
- `npm run build` — succeeds; `/` prerenders as static content, same as
  before.
- Full Playwright suite (`npx playwright test`, 138 tests) — 115 passed, 7
  skipped, 16 failed, none in `marketing.spec.ts` (all 5 marketing tests are
  in the 115 that passed). The 16 failures are pre-existing and unrelated to
  this change: `auth`, `captura-ia`, `categorias`, `fase6-qa-final`,
  `proveedores`, `roles`, `usuarios`, and `warehouse-compatibility` specs —
  most failing on the same "sidebar becomes a sheet on mobile viewport"
  assertion. That pattern matches an in-progress shadcn/ui sidebar migration
  that was already sitting uncommitted in the working tree (`sidebar.tsx`,
  `sheet.tsx`, `theme-provider.tsx`, `package.json`, and ~20 other files)
  before this task started — confirmed by `git status` and not touched by
  this change. Left untouched per the "no tocar aplicación interna" / "no
  cambies nada más" scope for this task; flagging here so it isn't mistaken
  for a regression this work introduced.

## Files Modified

- `frontend/src/components/marketing/marketing-landing.tsx` (rewritten)
- `frontend/tests/marketing.spec.ts` (extended)
- `frontend/FIDELOS_MARKETING_SITE_REPORT.md` (this file, new)

Not modified: `frontend/src/app/page.tsx` (SEO metadata already correct),
any dashboard/auth route, `frontend/src/app/globals.css`, any backend or
database file, `frontend/public/images/marketing/*.png` (already committed
before this session).

## Commits

See git log for the exact commits created for this change (conventional
commit messages, scoped to the marketing site only).

## Push

Pushed to `origin/master` after commits; verified local `HEAD` matches
`origin/master`.

## Final Status

- ¿Se entiende qué vende? Sí — inventario + CRM, en un mismo sistema, para
  operación y ventas.
- ¿Se ve profesional? Sí — paleta e identidad propias, tipografía con
  personalidad, imágenes de producto reales.
- ¿Es memorable? La composición hero + ticker de actividad y el contraste
  antes/después son los puntos que se quedan.
- ¿Da confianza? Sí — Beta declarado sin dramatizarlo, sin métricas ni
  clientes inventados, restricciones reales explicadas (stock, contingencia,
  Captura IA) en vez de ocultadas.
- ¿Tiene CTA visible? Sí, en header, hero, y cierre.
- ¿Muestra el producto real? Sí, tres renders de producto + descripciones
  basadas en el manual.
- ¿Diferencia CRM + Inventario? Sí, con secciones propias que además se
  conectan explícitamente (Terceros, Reportes, Panel).
- ¿Se siente como SaaS premium? Sí.
