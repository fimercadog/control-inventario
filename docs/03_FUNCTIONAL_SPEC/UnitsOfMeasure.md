# Unidades de Medida

**Status: Built** (implementado 2026-07-30 — Unidad de Trabajo "Implementación Completa del Módulo Unidades de Medida (RC1)", mismo nivel de funcionalidad que Productos/Proveedores/Categorías/Marcas — cierra la Fase 1 del roadmap de 8 fases aprobado)

> Verificado contra `backend/app/Http/Controllers/Api/UnidadMedidaController.php`, `frontend/app/(app)/unidades-medida/page.tsx`, `frontend/components/unidad-medida-detail-screen.tsx`, `backend/tests/Feature/UnidadMedidaControllerTest.php` (13 casos). Reemplaza la página stub "pendiente de implementación" que existía desde la Unidad de Trabajo "Sidebar RC1".
>
> La tabla `unidades_medida` y el modelo `UnidadMedida` ya existían desde RC1 Fase 1 (Catalog Normalization, `unidad_medida_id` en `productos`), pero nunca tuvieron controller, rutas, ni pantalla propia hasta esta unidad de trabajo.
>
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

- **`/unidades-medida`**: listado (Nombre, Abreviatura, Productos asociados, Estado). Botón "Nueva Unidad de Medida", búsqueda por nombre/abreviatura, filtro de Estado (Activas/Todas). Único punto de entrada del módulo — no existe una ruta `/unidades-medida/{id}` (Global UI Standard "CRUD en Modal", 2026-08-03).
- **Ver/Editar/Deshabilitar** ocurren en modales sobre este mismo listado (`UnidadMedidaViewModal`/`UnidadMedidaFormModal`), nunca navegando a otra página — pestaña "Productos" de solo lectura dentro del modal de vista, listando los productos que usan esta unidad (enlazan a su propia ficha — la edición de un producto nunca ocurre desde aquí).
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

- [x] `UnidadMedidaControllerTest` cubre CRUD, disable/enable, aislamiento multi-tenant, auditoría, integridad referencial con Productos (13 casos).
- [x] Migración de backfill verificada: ningún producto con `unidad_medida` no nula pre-migración queda sin `unidad_medida_id` post-migración (verificado en Fase 1, RC1_GAP_ANALYSIS.md; no re-tocado aquí).
- [x] Verificación real en navegador (agent-browser): crear, editar, buscar, filtrar por estado, eliminar lógico, re-habilitar, relación bidireccional con Productos, responsive.
- [ ] El selector de unidad de medida en "Nuevo Producto"/edición de producto usa un `Select` real con "+ Crear unidad nueva" (como especifica la sección Screens) — **todavía no implementado así**: el formulario de Producto solo tiene un input de texto libre (`unidad_medida_nuevo`, siempre find-or-create por nombre), sin un dropdown que liste las unidades ya existentes en el catálogo. Gap pre-existente (heredado de la migración de Fase 1), no introducido ni cerrado por esta unidad de trabajo — mismo tipo de gap ya documentado en `Categories.md`/`Brands.md`.

## Edge Cases

- Mismos criterios de comparación case-insensitive que Marca, para evitar duplicados de la misma unidad con distinta capitalización.

## Future Improvements

- Conversión entre unidades (ej. cajas ↔ unidades individuales) — no solicitado, fuera de alcance de RC1.
