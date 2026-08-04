# Changelog — Design System

Registro de cada cambio al Design System, no del código de la aplicación (para eso, ver `/CHANGELOG.md` en la raíz del repositorio). Formato libre, orden cronológico inverso.

## v1.2 (2026-08-03)

Decisión explícita del propietario del proyecto: aprobar y corregir de inmediato el bug de tipografía encontrado en v1.1 (prioridad alta, es un error, no una preferencia visual), pero **no** tocar los otros 3 hallazgos 🟡 Partial (Colores, Tablas, Formularios) — quedan como mejoras planificadas en sprints separados (RC4/RC5/RC6) para mantener el riesgo bajo.

- **`TYPOGRAPHY.md`** → ✅ Verified. `--font-sans: var(--font-sans)` (auto-referencia circular) corregido a `--font-sans: var(--font-geist-sans);` en `frontend/app/globals.css` — una sola línea, `--font-heading` se corrigió automáticamente al cascadear desde `--font-sans`. Verificado en navegador con `getComputedStyle`: `<body>`, un `<h1>` de página, y un `DialogTitle` resuelven a `Geist, "Geist Fallback"` después del fix — ninguno cae a una pila de fuentes de sistema genérica. Sin cambio de tamaños, pesos, ni jerarquía tipográfica — solo qué fuente real se renderiza.
- **`QUALITY_CHECKLIST.md`** (nuevo) → ✅ Verified. Checklist obligatoria para aprobar cualquier módulo/pantalla nueva — UI/Design System, Accesibilidad, Backend/Datos (RBAC, Auditoría, Tests, borrado lógico), y verificación final. Cada ítem referencia un mecanismo real ya construido, no una aspiración.
- **`COLORS.md`, `TABLES.md`, `FORMS.md`** → sin cambios, permanecen 🟡 Partial, explícitamente diferidos a RC4/RC5/RC6.

## v1.1 (2026-08-03)

Completada la auditoría de las 6 secciones que faltaban, hasta que todas alcanzaran un estado real (✅ Verified o 🟡 Partial documentado — ninguna quedó en ⚪ Planned/sin auditar).

- **`TABLES.md`** → 🟡 Partial. Primitivos, `EmptyState` e íconos, y estructura de búsqueda: uniformes. Paginación (6 módulos sin ella pese a recibir `meta.last_page`), búsqueda servidor-vs-cliente (Productos es la única excepción), debounce (solo Proveedores), y vocabulario de color de badges: inconsistentes, documentado sin corregir.
- **`FORMS.md`** → 🟡 Partial. Los 7 `<X>FormModal` (familia `CrudModal`+`Field`) son consistentes. Los 5 diálogos independientes son una segunda familia consistente consigo misma pero distinta (footer de 1 botón, sin bloqueo de cierre durante guardado) — decisión de reconciliación pendiente. `ProveedorFormModal` vs. `ClienteFormModal`: mismo conjunto de campos, dos implementaciones de grilla distintas.
- **`TYPOGRAPHY.md`** → 🟡 Partial. **Bug real encontrado**: `--font-sans`/`--font-heading` en `globals.css` son referencias circulares rotas — la aplicación nunca renderiza Geist Sans pese a cargarla correctamente vía `next/font/google`. Verificado a nivel de mecanismo de CSS (Tailwind v4 `@theme inline`), no por inspección visual. No corregido — cambia el `font-family` renderizado de toda la aplicación, requiere aprobación explícita antes de tocarlo. Jerarquía de tamaños documentada y consistente aparte de este bug.
- **`COLORS.md`** → 🟡 Partial. Tokens de tema completos y consistentes (light/dark). El color de estado activo/inactivo resultó estar dividido en **3** patrones, no 2 como se sospechaba: clases literales emerald/red (16 archivos + 6 sitios adicionales fuera del alcance CRUD), tokens semánticos `success`/`destructive` (10 archivos, nunca para activo/inactivo), y `Badge variant="outline"/"secondary"` sin color (exclusivo de Proveedores, un tercer patrón real). Sin justificación documentada en el código para ninguno de los tres.
- **`ICONOGRAPHY.md`** → ✅ Verified. `lucide-react` como única librería (confirmado, cero excepciones), convención de tamaño por contexto documentada con conteos reales, mecanismo `data-icon="inline-start"`/`"inline-end"` explicado (el segundo sin consumidores todavía).
- **`RESPONSIVE.md`** → ✅ Verified. `sm:` es el breakpoint dominante (28 usos vs. 14 de `md:` y 10 de `lg:`; `xl:`/`2xl:` sin uso alguno). Sidebar cambia a `Sheet` por debajo de 768px vía hook de JS, no solo CSS. Ancho de página de Movimientos (`max-w-3xl`) documentado como un patrón distinto de `MODAL_SIZES`, para no confundirlos.
- **`COMPONENT_INVENTORY.md`** (nuevo) → ✅ Verified. Catálogo completo de componentes compartidos con conteo real de consumidores por `grep`, no estimado.
- **Corregido durante la auditoría** (no solo documentado): `NewMovimientoDialog`, `RegistrarIngresoDialog` y `ProductSupplierDialog` declaraban cada uno su propia función local `Field`, idéntica a la ya compartida en `crud-modal.tsx`, en vez de importarla — mismo tipo de violación que el fix de `InfoRow` en `usuario-view-modal.tsx` de la v1.0. Corregido: los 3 archivos ahora importan `Field` desde `@/components/crud-modal`.
- **`examples/`** (nuevo) — 5 capturas reales de pantalla: `crud-modal.png`, `table.png`, `movement-card.png`, `buttons.png`, `forms.png`.
- Adoptado el sistema de estados ✅ Verified / 🟡 Partial / ⚪ Planned en todos los documentos y en `README.md`, reemplazando la etiqueta genérica "Pendiente de auditar" de v1.0.

## v1.0 (2026-08-03)

Consolidación arquitectónica inicial — de tres fragmentos de Design System en paralelo (un `docs/04_TECHNICAL_SPEC/FRONTEND/DESIGN_SYSTEM.md` nunca trackeado en git, una sección "Arquitectura Frontend" agregada a `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md`, y una referencia a una ruta que todavía no existía en `docs/_ARCHIVE/GOVERNANCE_SUPERSEDED.md`) a una única fuente oficial en `docs/11_DESIGN_SYSTEM/`.

- **`DESIGN_SYSTEM.md`** — Regla de Oro + principio de reutilización de componentes (Component Reuse Mandatory).
- **`MODALS.md`** — escala unificada de tamaños de modal (`MODAL_SIZES`, 5 niveles) y comportamiento de scroll compartido (`MODAL_SCROLL_CLASS`), ambos en `frontend/components/ui/modal.ts`. Ver `docs/08_ADR/ADR-014-modal-sizing-unification.md` para el razonamiento completo — auditados los 21 usos reales de ancho de modal existentes, migrados sin cambiar un solo píxel.
- **`COMPONENTS.md`** — catálogo de qué reutilizar por categoría, con dos correcciones al borrador original (`DataTable` y `ToastProvider` no existen; el componente real de toasts se llama `Toaster`).
- **Corregido durante la auditoría**: `usuario-view-modal.tsx` declaraba su propio `InfoRow` local en vez de importar el ya compartido en `detail-modal.tsx` — corregido.
- **6 stubs creados** (`TABLES.md`, `FORMS.md`, `TYPOGRAPHY.md`, `COLORS.md`, `ICONOGRAPHY.md`, `RESPONSIVE.md`) marcados "Pendiente de auditar" — completados en v1.1.
- Registrado en `docs/README.md` (tabla de estructura), `docs/10_GOVERNANCE/EngineeringManual.md` ("Design System (Frontend Governance)"), y como referencia única desde `00_MASTER_SPECIFICATION_ORIGINAL.md` y `GOVERNANCE_SUPERSEDED.md`.
