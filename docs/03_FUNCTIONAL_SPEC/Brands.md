# Marcas

**Status: Approved** (aprobado 2026-07-29 junto con `RC1_GAP_ANALYSIS.md` — Fase 0 de `docs/10_GOVERNANCE/MandatoryDevelopmentWorkflow.md`; implementación en curso, Fase 1 del roadmap de 8 fases aprobado, ver `docs/05_IMPLEMENTATION/CatalogModules.md`)

> Decisión arquitectónica aprobada explícitamente por el usuario 2026-07-29 ("Catalog Normalization"): `marca` **dejó de ser un campo de texto libre** en `productos` y se convierte en una entidad de catálogo real (`marcas`), referenciada por `productos.marca_id`. Requiere migración de datos (backfill) — ver Risks/Edge Cases abajo.

## Purpose

Catálogo administrable de marcas de producto. Reemplaza el campo `productos.marca` (string libre) por una relación real, cerrando el gap identificado en `RC1_GAP_ANALYSIS.md` ("Marca es texto libre, no una entidad").

## Business Flow

1. Un usuario de empresa abre `/marcas` y ve el listado de marcas activas de su empresa.
2. Crea una marca nueva desde el botón "Nueva Marca", o la crea al vuelo ("+ Crear marca nueva") desde el selector de marca en el formulario de Producto — mismo patrón UX ya usado para Proveedores en "Registrar Ingreso" (FEATURE-003).
3. Captura IA sigue extrayendo una marca como texto libre (`DetectedProductDTO->brand`, contrato sin cambios) — `ProductService` resuelve ese texto contra el catálogo de marcas (encuentra existente por nombre, o la crea) antes de persistir el producto. Captura IA nunca conoce `marca_id` directamente ni contiene esta regla (sección 74 del master spec, "Captura IA nunca contiene reglas de negocio").
4. Deshabilitar una marca la oculta del listado/selectores por defecto sin afectar productos que ya la referencian.

## Actors

- **Usuario de empresa** con permiso `marcas.ver`/`marcas.gestionar` (catálogo sembrado, sin enforcement de ruta todavía).
- **Pipeline de Captura IA** (actor técnico): resuelve/crea marcas indirectamente vía `ProductService`, nunca llama al `MarcaController` directamente.

## Screens

- **`/marcas`**: listado (Nombre, Productos asociados, Estado). Botón "Nueva Marca".
- **`/marcas/{id}`**: detalle + edición inline.
- Selector de Marca en "Nuevo Producto"/edición de producto: mismo componente `Select` + "+ Crear marca nueva" ya usado para Proveedor en `registrar-ingreso-dialog.tsx`.

## Fields

| Campo | Origen | Editable |
|---|---|---|
| nombre | input | Sí |
| estado | toggle Activar/Desactivar | Sí |

## Validation Rules

- `nombre`: requerido, string, max:255.
- Resolución de marca en `ProductService`: `find-or-create` case-insensitive por `(empresa_id, nombre)` — mismo criterio de comparación (`LOWER(nombre)`, trim) que ya usaba `ProductRepository::buscarPorNombreMarcaPresentacion()` antes de esta migración, para no cambiar el comportamiento observable del matching de Captura IA.

## Permissions

`marcas.ver`, `marcas.crear`, `marcas.editar` — sembrado, sin enforcement todavía.

## Loading States / Empty States / Error States

Mismos componentes reutilizables que Categorías/Proveedores.

## Business Rules

- Borrado siempre lógico (`estado = inactivo`) — nunca DELETE físico.
- `productos.marca_id` es `nullable` (un producto puede no tener marca).
- **Regla crítica de no-ruptura**: el matching de identidad de producto de Captura IA (`ProductService::buscarCoincidencia()`, "nombre + marca + presentación") sigue operando con un `?string $marca` en su firma pública — internamente ahora compara contra `marcas.nombre` vía la relación en vez de la columna `productos.marca` directamente. El contrato de `ApplyInventoryMovementAction`/`DetectedProductDTO` no cambia.

## Acceptance Criteria

- [ ] `MarcaControllerTest` cubre CRUD, disable/enable, aislamiento multi-tenant, auditoría.
- [ ] `ProductServiceMatchingTest`, `ApplyInventoryMovementActionTest`, `ArchitectureReviewTest` (Captura IA) siguen pasando sin cambiar su contrato público, solo sus fixtures internos.
- [ ] Migración de backfill verificada: ningún producto con `marca` no nula pre-migración queda sin `marca_id` post-migración.
- [ ] Verificación real en navegador.

## Edge Cases

- Dos productos con el mismo texto de marca pero distinta capitalización ("Purina" vs "purina") deben resolver a la **misma** fila de `Marca` (backfill y `ProductService` ambos usan comparación case-insensitive).
- Producto sin marca (`marca` null pre-migración) → `marca_id` queda `null` post-migración, sin crear una fila de `Marca` vacía.

## Future Improvements

- Asociar marca con proveedor(es) — no solicitado, fuera de alcance.
