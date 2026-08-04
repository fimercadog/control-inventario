# Quality Checklist

**STATUS: ✅ Verified** — cada ítem referencia un mecanismo real y ya construido en `frontend/`/`backend/`, no una aspiración. Checklist obligatoria para aprobar cualquier pantalla o módulo nuevo — ningún módulo se considera terminado (`docs/10_GOVERNANCE/EngineeringManual.md`, `DefinitionOfDone.md`) sin cumplirla. Complementa, no reemplaza, la Definition of Done general del proyecto.

## Cómo usar esta lista

Copiarla al informe final de cualquier módulo nuevo (mismo lugar donde ya va "Resumen del trabajo realizado" en los informes de `docs/05_IMPLEMENTATION/`) y marcar cada ítem con evidencia verificable (archivo, línea, o resultado de test) — no basta con marcar la casilla, tiene que poder auditarse igual que el resto de este Design System.

## UI / Design System

- [ ] **Usa `CrudModal`/`DetailModal` para Crear/Editar/Ver**, no navega a una página completa — salvo que califique para una de las excepciones documentadas en `docs/05_IMPLEMENTATION/ModalCrudStandard.md` (Dashboard, Captura IA, Reportes, Configuración, flujos multi-paso, formularios demasiado grandes para un modal).
- [ ] **Usa `ConfirmDialog`** para toda acción de Eliminar/Deshabilitar/Activar-Desactivar — nunca muta un estado destructivo sin confirmación previa.
- [ ] **Usa `Field` (`crud-modal.tsx`) e `InfoRow` (`detail-modal.tsx`) compartidos** — no declara una versión local. Ver `COMPONENT_INVENTORY.md` antes de escribir un componente de formulario/visualización nuevo.
- [ ] **Usa `MODAL_SIZES`/`MODAL_SCROLL_CLASS` (`components/ui/modal.ts`)** si el módulo abre algún modal — nunca una clase `max-w-*`/`overflow-y` propia (`ADR-014`).
- [ ] **Usa `Badge`/`Button`/`Card`/`Input`/`Select`/`Table` de `components/ui/`** — ver `COMPONENTS.md` antes de crear un primitivo nuevo. Si el módulo introduce un badge de estado, documentar explícitamente qué patrón de color usa (`COLORS.md` §"3 patrones" — no agregar un cuarto sin decisión explícita).
- [ ] **Usa `lucide-react` exclusivamente**, con la convención de tamaño por contexto de `ICONOGRAPHY.md` (`size-4` default en botones/badges, `size-5` dentro de círculos `size-11`/`size-12`, etc.).
- [ ] **Sigue la jerarquía tipográfica de `TYPOGRAPHY.md`** — `text-2xl font-semibold tracking-tight` para el `<h1>` de página, no un tamaño inventado.
- [ ] **Sigue el patrón responsive de `RESPONSIVE.md`** — `sm:` como breakpoint principal, `flex flex-wrap` + `min-w-55 max-w-sm` para barras de filtro, sin introducir `xl:`/`2xl:` sin justificación.
- [ ] **Tiene Empty State** — `EmptyState` con `icon={SearchX}` para "sin resultados de búsqueda", ícono contextual para "sin datos en el rango" (ver `TABLES.md` §EmptyState).
- [ ] **Tiene Loading State** — spinner (`Loader2` animado) mientras la carga real está en curso, nunca un estado vacío que se confunda con "sin resultados".
- [ ] **Tiene Error State** — `toast.error(...)` con el mensaje real del backend cuando existe (`error instanceof Error ? error.message : "..."`), nunca un mensaje genérico que oculte la causa real.

## Accesibilidad

- [ ] Todo ícono usado como único contenido de un botón tiene un `aria-label` (ver `DropdownMenuTrigger` con botón `icon-sm` en cualquier listado como referencia).
- [ ] Todo campo de formulario tiene su `Label` asociado (vía `Field`) — nunca un `Input` suelto sin etiqueta visible.
- [ ] Los estados de error inline (cuando el módulo los tiene, ver `FORMS.md` §2.4) usan `aria-invalid` en el campo correspondiente.

## Backend / Datos (verificar contra `AGENTS.md` y `docs/10_GOVERNANCE/` antes de marcar)

- [ ] **Tiene RBAC real** — Policy con pertenencia de empresa **Y** permiso, nunca solo uno de los dos (regla confirmada, ver memoria del proyecto "RBAC authorization model").
- [ ] **Tiene Auditoría** — toda mutación exitosa escribe una entrada real vía `AuditLogger`/`registrarAccionManual`, con el diff real (`getChanges()`), no una lista de campos fija.
- [ ] **Tiene Tests** — al menos: creación, listado/filtro, aislamiento multi-tenant (una empresa nunca ve/edita datos de otra), 401 sin autenticar, 403 sin permiso. Ejecutar `php artisan test` y citar el conteo real (`X/X passing`), no "los tests pasan".
- [ ] **Borrado siempre lógico** (`estado = inactivo`), nunca un DELETE físico — regla global del proyecto, sin excepción salvo que el propio módulo sea append-only por diseño (ej. Movimientos).

## Antes de marcar esta lista como completa

- [ ] Verificado en navegador (no solo `tsc --noEmit`) — captura o descripción de lo que se vio, igual que el resto de los informes de este proyecto.
- [ ] `npx tsc --noEmit` limpio.
- [ ] Suite de backend relevante corrida y en verde, conteo real citado.
- [ ] Documentación del módulo actualizada (`docs/05_IMPLEMENTATION/`, spec funcional si cambió comportamiento, `CHANGELOG.md` de la raíz).

Ningún módulo se aprueba con ítems sin marcar y sin una razón explícita documentada de por qué no aplica (ej. "Sin Loading State: la data viene de un `Select` ya cargado en memoria, no hay fetch async") — omitir un ítem en silencio no es aceptable.
