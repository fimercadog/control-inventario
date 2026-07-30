# Categorías

**Status: Approved** (aprobado 2026-07-29 junto con `RC1_GAP_ANALYSIS.md` — Fase 0 de `docs/10_GOVERNANCE/MandatoryDevelopmentWorkflow.md`; implementación en curso, Fase 1 del roadmap de 8 fases aprobado, ver `docs/05_IMPLEMENTATION/CatalogModules.md`)

> La tabla `categorias` y el modelo `Categoria` ya existen desde la Fase 3 original (`categoria_id` en `productos`), pero nunca tuvieron controller, rutas, ni pantalla propia — esta spec formaliza el módulo administrativo completo que faltaba.

## Purpose

Catálogo administrable de categorías de producto, reutilizado por Productos (`categoria_id`) y por Captura IA (que ya asigna `category` extraído por IA, sección 74 del master spec). Reemplaza cualquier uso de categoría como texto libre — no existía tal uso, pero Categorías nunca tuvo su propio módulo de gestión hasta ahora.

## Business Flow

1. Un usuario de empresa abre `/categorias` y ve el listado de categorías activas de su empresa.
2. Crea una categoría nueva (nombre + descripción opcional) desde el botón "Nueva Categoría".
3. Al crear/editar un producto, selecciona una categoría existente del catálogo (ya lo hacía vía `categoria_id`; lo nuevo es que ahora existe una pantalla para gestionar ese catálogo en vez de que solo exista implícitamente).
4. Deshabilitar una categoría la oculta del listado por defecto y de los selectores de creación de producto, sin afectar productos que ya la referencian (`categoria_id` no se toca).

## Actors

- **Usuario de empresa** con permiso `categorias.ver`/`categorias.gestionar` (catálogo sembrado, sin enforcement de ruta todavía — mismo estado que el resto de los módulos de este roadmap).

## Screens

- **`/categorias`**: listado con columnas Nombre, Descripción, Productos asociados (conteo), Estado. Botón "Nueva Categoría".
- **`/categorias/{id}`**: detalle + edición inline (mismo patrón que `supplier-detail-screen.tsx`).

## Fields

| Campo | Origen | Editable |
|---|---|---|
| nombre | input | Sí |
| descripcion | input | Sí |
| estado | toggle Activar/Desactivar | Sí (vía acción dedicada, no en el form de edición) |

## Validation Rules

- `nombre`: requerido, string, max:255.
- `descripcion`: opcional, string.
- Unicidad de `nombre` por empresa: no forzada a nivel de base de datos (mismo criterio ya usado en Proveedores) — un duplicado no rompe nada, simplemente no se deduplica automáticamente.

## Permissions

`categorias.ver`, `categorias.crear`, `categorias.editar` — mismo estado que el resto del catálogo de permisos: sembrado, no enforced a nivel de middleware/ruta todavía.

## Loading States

Spinner + texto ("Cargando categorías..."), mismo componente que Proveedores/Productos.

## Empty States

`EmptyState` reutilizable: "No encontramos categorías" con acción "Crear la primera categoría".

## Error States

Mismo formato estándar de error de `04_TECHNICAL_SPEC/API.md` (envelope `ApiResponse`); errores de validación se muestran inline en el diálogo sin cerrarlo (Global UI Standard, aprobado 2026-07-29).

## Business Rules

- Borrado siempre lógico (`estado = inactivo`) — nunca DELETE físico (GLOBAL RULE, sesión 2026-07-29).
- Deshabilitar una categoría **no** afecta productos ya asociados (`categoria_id` permanece intacto) — solo la oculta de listados/selectores por defecto.
- `Producto.categoria_id` sigue siendo `nullable` — un producto puede no tener categoría asignada.

## Acceptance Criteria

- [ ] `CategoriaControllerTest` cubre CRUD, disable/enable, aislamiento multi-tenant, auditoría.
- [ ] El selector de categoría en "Nuevo Producto"/edición de producto usa este catálogo real (no texto libre — ya era `categoria_id`, ahora tiene UI de gestión detrás).
- [ ] Verificación real en navegador (agent-browser).

## Edge Cases

- Categoría con productos asociados: deshabilitar es seguro (no CASCADE, `categoria_id` queda con `nullOnDelete` ya configurado desde la migración original).

## Future Improvements

- Categorías anidadas/jerárquicas — fuera de alcance de RC1, no solicitado.
