# Fidel OS Design System

Fuente oficial única — ver [`README.md`](README.md) para el índice completo y la regla de no duplicación.

## Regla de Oro

Si un desarrollador necesita crear un componente nuevo, primero debe demostrar que:

- No existe uno reutilizable.

o

- El componente existente no puede extenderse razonablemente.

Solo entonces podrá crear uno nuevo. Toda excepción debe quedar documentada como un ADR (`docs/08_ADR/`), no como un comentario suelto en el código.

## 1. Design Principles

### 1.1 Component Reuse (Mandatory)

Every new module must reuse existing components before creating new ones.

Priority:

1. Reuse existing component.
2. Extend existing component.
3. Create a new component only if no reusable solution exists.

Component duplication is prohibited unless there is an approved architectural decision (ADR).

Catálogo de qué reutilizar por categoría: [`COMPONENTS.md`](COMPONENTS.md).

## 2. Historial de esta regla

Esta consolidación (2026-08-03) resolvió una violación real y verificada de esta misma regla: `CrudModal` y `DetailModal`, los dos shells del Global UI Standard "CRUD en Modal" (`docs/05_IMPLEMENTATION/ModalCrudStandard.md`), cada uno declaraba su propio mapa de tamaños de modal en vez de reutilizar uno compartido — el mismo nombre de tamaño (`lg`) producía un ancho distinto según el componente. Auditado, corregido y documentado en [`MODALS.md`](MODALS.md) y [`ADR-014`](../08_ADR/ADR-014-modal-sizing-unification.md). Se cita aquí como el ejemplo de referencia de cómo aplicar la Regla de Oro cuando ya existe una violación en el código, no solo para código nuevo.
