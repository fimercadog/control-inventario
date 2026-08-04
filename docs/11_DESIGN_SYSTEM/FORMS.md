# Forms

**STATUS: 🟡 Partial** — auditados los 7 `<X>FormModal` de los módulos CRUD, los 5 diálogos independientes con formulario, y la página de login (2026-08-03) contra `frontend/`. La familia `CrudModal` es genuinamente consistente. La familia de diálogos independientes es una segunda familia, consistente consigo misma pero distinta de la primera — documentado como decisión pendiente, no como error.

## Verified

- **Los 7 `<X>FormModal`** (Categoría, Marca, Unidad de Medida, Proveedor, Cliente, Producto, Rol) usan `CrudModal` + el `Field` compartido (`frontend/components/crud-modal.tsx`) — adopción 100%, confirmado en `COMPONENT_INVENTORY.md`.
- **Marcado de campo requerido**: sufijo literal `" *"` en el texto de la etiqueta (`"Nombre *"`, `"Razón Social *"`, etc.) — nunca un prop `required` ni un asterisco separado. Sin excepciones encontradas, incluidos los diálogos independientes.
- **Bloqueo de cierre durante guardado**: `CrudModal` impide cerrar el modal (clic fuera / Escape) mientras `saving === true` (`crud-modal.tsx:53`) — los 7 formularios CRUD heredan esto automáticamente.
- **Footer de `CrudModal`**: siempre dos botones, `Cancelar` (`variant="outline"`) + el de envío (ícono `Loader2` animado + `savingLabel` mientras guarda, `Save` + `submitLabel` en reposo) — idéntico en los 7.
- **Errores de validación/API**: `toast.error(...)` (sonner) en el `catch`, mensaje real del backend cuando existe (`error instanceof Error ? error.message : "..."`) — patrón uniforme en los 7 formularios CRUD y en los 5 diálogos independientes.

## Partial — dos familias de formulario, no reconciliadas

Los 5 diálogos independientes (`InvitarUsuarioDialog`, `NewMovimientoDialog`, `RegistrarIngresoDialog`, `ProductSupplierDialog`, `AsignarRolDialog`) construyen `Dialog`/`DialogContent`/`DialogHeader`/`DialogFooter` a mano en vez de usar `CrudModal`, y difieren de la familia CRUD en dos puntos estructurales:

1. **Un solo botón en el footer** (el de envío) — ninguno de los 5 renderiza un botón "Cancelar" explícito, a diferencia de `CrudModal`, que siempre renderiza dos.
2. **Sin bloqueo de cierre durante guardado** — los 5 usan `<Dialog open={open} onOpenChange={setOpen}>` directo, sin el guard `(next) => !saving && onOpenChange(next)` que sí tiene `CrudModal`. Un usuario puede cerrar cualquiera de estos 5 diálogos a mitad de un guardado en curso.

Esto es una decisión de diseño pendiente, no un bug: ¿deberían estos 5 diálogos migrar a `CrudModal` (ganando el segundo botón y el bloqueo de cierre), o es intencional que se comporten distinto por ser de una sola acción? No se decidió como parte de esta auditoría — documentado para que la decisión se tome explícitamente, con su propio ADR si se aprueba la migración.

- **Grillas de campos no son uniformes ni dentro de la misma familia**: `ProveedorFormModal` usa tres `<div className="grid grid-cols-2 gap-3">` fijos (no responsive) para agrupar sus 8 campos; `ClienteFormModal`, con un conjunto de campos casi idéntico, usa un solo `<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">` responsive con `sm:col-span-2` para el campo que ocupa ancho completo. Mismo problema (mismos campos, misma intención), dos implementaciones distintas — el ejemplo más claro encontrado de "mismo caso, código diferente" en toda la auditoría. Ningún cambio aplicado — decisión pendiente de cuál de los dos patrones adoptar como el único.
- **Mensajes de error inline vs. solo toast**: el patrón dominante es toast-only, sin mensaje inline por campo. `app/login/page.tsx` es la única excepción — usa `react-hook-form` + `zodResolver`, con `aria-invalid` y un `<p>` de error bajo cada campo. `NewMovimientoDialog` tiene un caso híbrido: el campo Cantidad muestra tanto un toast como un mensaje inline cuando la cantidad excede el stock disponible, el único campo de toda la aplicación con ambos a la vez.

## Corregido en esta auditoría

**Duplicación real de `Field` encontrada y corregida** — `NewMovimientoDialog`, `RegistrarIngresoDialog` y `ProductSupplierDialog` declaraban cada uno su propia función local `Field`, copiada literal (mismas clases, mismo `Label`) del `Field` ya compartido en `crud-modal.tsx`, en vez de importarlo. Sin justificación documentada — un descuido, mismo patrón que la duplicación de `InfoRow` encontrada y corregida antes en `usuario-view-modal.tsx`. Corregido: los 3 archivos ahora importan `Field` desde `@/components/crud-modal`; las 3 declaraciones locales y el import ahora-innecesario de `Label` se eliminaron. Mismo JSX exacto, sin cambio visual — no ameritó verificación en navegador por la misma razón que el fix de `InfoRow`.

## No corregido en esta auditoría

La reconciliación de las dos familias de diálogo (footer de 1 vs. 2 botones, bloqueo de cierre) y la unificación de la grilla Proveedor/Cliente quedan documentadas como decisiones pendientes, no aplicadas — requieren aprobación explícita antes de tocar código, siguiendo la misma disciplina que `ADR-014`.

## Ejemplo visual

`examples/forms.png` — modal "Nuevo Proveedor" (grilla de 2 columnas, footer Cancelar/Crear proveedor).
