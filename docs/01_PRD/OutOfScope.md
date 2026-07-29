# Fuera de Alcance

Fuente: `_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` §3 ("No incluye (MVP)"), más reconciliación explícita pedida por decisión de producto (ver `docs/SDD_MIGRATION_PLAN.md` §8).

## Distinción importante

Este documento distingue dos categorías que es fácil confundir:

1. **Planeado, no construido todavía** — módulos que siguen formando parte de la visión de producto (`00_VISION/Vision.md`, `00_VISION/BusinessGoals.md`) pero que aún no tienen código. **Esto NO es "fuera de alcance."** Su detalle vive en `01_PRD/UserStories.md` (historias marcadas `[PLANNED]`) y, cuando se prioricen, en specs forward-looking dentro de `03_FUNCTIONAL_SPEC/`.
2. **Genuinamente fuera de alcance** — funcionalidades que el master spec excluye explícitamente del producto, sin importar cuánto avance el resto del roadmap. Es la lista de abajo.

## Genuinamente fuera de alcance (MVP y versiones cercanas)

Definido explícitamente en el master spec (§3, "No incluye"):

- **Facturación electrónica.**
- **Integración con DIAN** (autoridad tributaria colombiana).
- **Contabilidad.**
- **Nómina.**
- **CRM** (como sistema separado de gestión de relación con clientes; la gestión básica de Clientes ligada a Ventas sí está en la categoría "planeado", no aquí).

Estas funcionalidades podrán desarrollarse en versiones futuras de Fidel OS como productos o módulos separados, pero no forman parte del núcleo del Sistema de Control de Inventario.

## Explícitamente NO fuera de alcance (aclaración de decisión de producto)

Compras, Proveedores, Ventas, Clientes, Kardex y Reportes **no están construidos hoy**, pero por decisión de producto explícita **no se tratan como descartados**. Son módulos planeados, en la categoría (1) de arriba. Ver:

- `01_PRD/UserStories.md` — historias de usuario `[PLANNED]` para estos módulos.
- `01_PRD/FunctionalRequirements` correspondiente en `02_REQUIREMENTS/FunctionalRequirements.md`, marcado `[PLANNED]`.
- `03_FUNCTIONAL_SPEC/` (propiedad de otro documento/agente) — donde eventualmente se escribirán specs forward-looking para estos módulos, antes de que se construyan, siguiendo el flujo de `AGENTS.md`.

## Regla de proceso derivada

No se debe escribir spec detallado (`03_FUNCTIONAL_SPEC/`, `05_IMPLEMENTATION/`) para un módulo planeado hasta que ese módulo esté efectivamente programado para construirse. Escribir specs de features que no están por construirse es el problema inverso que Specification-Driven Development busca evitar (ver `docs/SDD_MIGRATION_PLAN.md`, recomendación 3).
