# Unidades de Medida

**Status: Approved** (aprobado 2026-07-29 junto con `RC1_GAP_ANALYSIS.md` — Fase 0 de `docs/10_GOVERNANCE/MandatoryDevelopmentWorkflow.md`; implementación en curso, Fase 1 del roadmap de 8 fases aprobado, ver `docs/05_IMPLEMENTATION/CatalogModules.md`)

> Mismo tratamiento que Marcas: `unidad_medida` deja de ser texto libre en `productos` y se convierte en una entidad de catálogo (`unidades_medida`), referenciada por `productos.unidad_medida_id`.

## Purpose

Catálogo administrable de unidades de medida (ej. "Unidad", "Caja", "Kg", "Litro"). Reemplaza el campo `productos.unidad_medida` (string libre) por una relación real.

## Business Flow

1. Un usuario de empresa abre `/unidades-medida` y ve el listado de unidades activas.
2. Crea una unidad nueva (nombre + abreviatura opcional, ej. "Kilogramo" / "kg") desde el botón "Nueva Unidad", o al vuelo desde el selector en el formulario de Producto.
3. Captura IA sigue extrayendo la unidad como texto libre (`DetectedProductDTO->unit`); `ProductService` resuelve ese texto contra el catálogo (find-or-create), igual que Marca.
4. Deshabilitar una unidad la oculta del listado/selectores por defecto sin afectar productos que ya la referencian.

## Actors

- **Usuario de empresa** con permiso `unidades_medida.ver`/`unidades_medida.gestionar` (sembrado, sin enforcement todavía).
- **Pipeline de Captura IA**: resuelve/crea unidades indirectamente vía `ProductService`.

## Screens

- **`/unidades-medida`**: listado (Nombre, Abreviatura, Productos asociados, Estado). Botón "Nueva Unidad".
- **`/unidades-medida/{id}`**: detalle + edición inline.
- Selector de Unidad en "Nuevo Producto"/edición: mismo componente `Select` + "+ Crear unidad nueva".

## Fields

| Campo | Origen | Editable |
|---|---|---|
| nombre | input | Sí |
| abreviatura | input | Sí |
| estado | toggle Activar/Desactivar | Sí |

## Validation Rules

- `nombre`: requerido, string, max:255.
- `abreviatura`: opcional, string, max:50.
- Resolución en `ProductService`: find-or-create case-insensitive por `(empresa_id, nombre)`, mismo criterio que Marca.

## Permissions

`unidades_medida.ver`, `unidades_medida.crear`, `unidades_medida.editar` — sembrado, sin enforcement todavía.

## Loading States / Empty States / Error States

Mismos componentes reutilizables que Categorías/Marcas.

## Business Rules

- Borrado siempre lógico (`estado = inactivo`) — nunca DELETE físico.
- `productos.unidad_medida_id` es `nullable`.
- El contrato público de Captura IA (`DetectedProductDTO->unit`, `ApplyInventoryMovementAction`) no cambia — solo la resolución interna en `ProductService`.

## Acceptance Criteria

- [ ] `UnidadMedidaControllerTest` cubre CRUD, disable/enable, aislamiento multi-tenant, auditoría.
- [ ] Migración de backfill verificada: ningún producto con `unidad_medida` no nula pre-migración queda sin `unidad_medida_id` post-migración.
- [ ] Verificación real en navegador.

## Edge Cases

- Mismos criterios de comparación case-insensitive que Marca, para evitar duplicados de la misma unidad con distinta capitalización.

## Future Improvements

- Conversión entre unidades (ej. cajas ↔ unidades individuales) — no solicitado, fuera de alcance de RC1.
