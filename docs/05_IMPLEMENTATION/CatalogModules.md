# Implementación — Catálogos (Categorías, Marcas, Unidades de Medida)

> Fase 1 del roadmap RC1 de 8 fases aprobado 2026-07-29 (ver `docs/03_FUNCTIONAL_SPEC/RC1_GAP_ANALYSIS.md`). Los tres módulos comparten exactamente el mismo shape de CRUD (mismo patrón que `Proveedor`, ya construido y probado) por lo que se documentan juntos.
>
> **Nota (2026-08-04, auditoría de integridad documental):** este plan quedó desactualizado — los tres módulos se completaron el 2026-07-30, cada uno con su propio informe final: [`CategoriasModule.md`](CategoriasModule.md), [`MarcasModule.md`](MarcasModule.md), [`UnidadesMedidaModule.md`](UnidadesMedidaModule.md) (confirmado 🟢 COMPLETE en `docs/03_FUNCTIONAL_SPEC/RC1_FUNCTIONAL_MODULE_AUDIT.md`). El `## Estado` y `## Checklist` de abajo se conservan sin editar como registro histórico del plan original (Historical Integrity, `docs/10_GOVERNANCE/AI_OPERATING_PROCEDURE.md`) — para el estado real, usar los tres informes finales.

## Estado

En desarrollo (Fase 4 del flujo de `docs/10_GOVERNANCE/MandatoryDevelopmentWorkflow.md`). **Histórico — ver nota arriba: los tres módulos están completos desde 2026-07-30.**

## Goal

Cerrar el gap identificado en `RC1_GAP_ANALYSIS.md`: Categorías (sin controller/UI), Marcas y Unidades de Medida (ni siquiera existen como entidades, son texto libre en `productos`). Normalizar las tres como catálogos administrables con FK real desde `Producto`.

## Scope

- CRUD completo (List/View/Create/Edit/Status/Logical Delete) para Categoria, Marca, UnidadMedida — mismo patrón exacto que `ProveedorController`/`ProveedorPolicy`/`ProveedorResource`.
- Migración de datos: `productos.marca` (string) → `productos.marca_id` (FK), `productos.unidad_medida` (string) → `productos.unidad_medida_id` (FK). Backfill case-insensitive, luego se eliminan las columnas string.
- `Producto.categoria_id` ya existía — solo se le construye el módulo de gestión que le faltaba (Categoria).
- Actualización de `ProductService`/`ProductRepository` para resolver marca/unidad de medida por texto (Captura IA) o por id (creación manual) sin romper el contrato público de Captura IA.
- Selectores con "+ Crear nuevo" (mismo patrón UX que Proveedor en Registrar Ingreso) en los formularios de Producto.
- Hook reutilizable `useCrudList` (frontend) como base del Global UI Standard (refresh automático tras Crear/Editar/Deshabilitar) — infraestructura compartida por este y todos los módulos siguientes del roadmap.

## Out of Scope

- Categorías jerárquicas/anidadas.
- Conversión entre unidades de medida.
- Asociar marca con proveedor.
- Enforcement de permisos a nivel de ruta (mismo estado que el resto del sistema hoy).

## Dependencies

- Ninguna migración/módulo pendiente de otra fase del roadmap — Fase 1 es la primera.

## Database Changes

- `2026_07_29_XXXXXX_create_marcas_table` — `id, empresa_id (FK), nombre, estado (default activo), timestamps`, index `empresa_id`.
- `2026_07_29_XXXXXX_create_unidades_medida_table` — `id, empresa_id (FK), nombre, abreviatura (nullable), estado (default activo), timestamps`, index `empresa_id`.
- `2026_07_29_XXXXXX_add_marca_id_and_unidad_medida_id_to_productos_and_backfill` — agrega `marca_id`/`unidad_medida_id` (nullable FK, `nullOnDelete`) a `productos`; backfill case-insensitive desde las columnas string existentes (crea filas de catálogo por cada valor distinto por empresa); elimina las columnas `marca`/`unidad_medida` (string) al final del mismo archivo, de forma atómica.
- `categorias` — tabla ya existente, sin cambios de esquema.

## API Changes

Ver `docs/04_TECHNICAL_SPEC/API.md`, sección "Módulo Catálogos" — mismo shape que `/proveedores` para los tres recursos:

- `GET/POST /api/v1/categorias`, `GET/PATCH /api/v1/categorias/{id}`, `POST /api/v1/categorias/{id}/deshabilitar`, `POST /api/v1/categorias/{id}/habilitar`.
- Mismos 5 endpoints bajo `/api/v1/marcas` y `/api/v1/unidades-medida`.
- `StoreProductoRequest`/`UpdateProductoRequest`: `marca` (string) → `marca_id` (nullable, exists:marcas,id) + `marca_nuevo` (nullable string, quick-create); mismo tratamiento para `unidad_medida_id`/`unidad_medida_nuevo`.

## Frontend Changes

- `hooks/use-crud-list.ts` (nuevo) — hook compartido, ver Global UI Standard.
- `app/(app)/categorias/page.tsx`, `app/(app)/categorias/[id]/page.tsx` (+ equivalentes `marcas`, `unidades-medida`) — mismo patrón que `proveedores/page.tsx`/`[id]/page.tsx`.
- `components/new-categoria-dialog.tsx`, `new-marca-dialog.tsx`, `new-unidad-medida-dialog.tsx` — mismo patrón que `new-supplier-dialog.tsx`.
- `components/app-sidebar.tsx` — nuevas entradas Categorías/Marcas/Unidades de Medida.
- `components/new-product-dialog.tsx` + `product-detail-screen.tsx` (modo edición) — reemplazan los inputs de texto libre de Marca/Unidad de medida (y agregan Categoría, ausente hoy en el diálogo de creación) por `Select` + "+ Crear nuevo", igual que el selector de Proveedor.
- Retrofit: `proveedores/page.tsx` migra de parcheo manual de estado local a `useCrudList` + `refetch()`, para no dejar un patrón viejo junto al nuevo (Global UI Standard, aprobado 2026-07-29).

## Security

Mismo patrón de Policy (`ownedBy` por `empresa_id`) + `TenantScope` automático que `ProveedorPolicy`. Sin superficie nueva de riesgo — son catálogos simples sin datos sensibles.

## Permissions

`categorias.ver/crear/editar`, `marcas.ver/crear/editar`, `unidades_medida.ver/crear/editar` — se agregan al catálogo sembrado de permisos, sin enforcement de ruta (mismo estado que el resto del sistema).

## Events

Ninguno nuevo — estas entidades no disparan eventos de dominio (a diferencia de `Producto`/`Movimiento`).

## Tests

- `tests/Feature/CategoriaControllerTest.php`, `MarcaControllerTest.php`, `UnidadMedidaControllerTest.php` (nuevos) — CRUD, disable/enable, aislamiento multi-tenant, auditoría (mismo shape que `ProveedorControllerTest.php`).
- `tests/Feature/ProductoControllerTest.php` — fixtures actualizados a `marca_id`/`unidad_medida_id`.
- `tests/Unit/CapturaIA/ProductServiceMatchingTest.php`, `ApplyInventoryMovementActionTest.php`, `ArchitectureReviewTest.php` — fixtures actualizados, contrato público sin cambios.
- `tests/Unit/Security/TenantScopeTest.php` — fixture `crearProductoParaEmpresaB()` actualizado.

## Risks

- **Migración de datos irreversible en `down()`**: eliminar las columnas string `marca`/`unidad_medida` no es reversible sin pérdida de formato original (el `down()` las re-crea vacías). Aceptable: sistema en fase RC1 con datos de demostración, no datos de producción reales.
- **Matching de Captura IA**: el mayor riesgo técnico de esta fase. Mitigado manteniendo el contrato público de `ProductService::buscarCoincidencia()`/`crear()` sin cambios (siguen aceptando `?string $marca`), y verificando explícitamente que los tests de Captura IA seguían pasando tras el cambio.

## Checklist

- [x] Functional Spec aprobada (Categories.md, Brands.md, UnitsOfMeasure.md).
- [x] Technical Spec actualizada (API.md, Database.md — ver más abajo).
- [ ] Migraciones escritas y corridas.
- [ ] Modelos, Policies, Requests, Resources, Controllers, Rutas.
- [ ] `ProductService`/`ProductRepository` actualizados.
- [ ] Tests backend nuevos + existentes actualizados, suite completa en verde.
- [ ] Frontend: hook compartido, 3 módulos completos, sidebar, selectores de Producto actualizados.
- [ ] Verificación real en navegador.
- [ ] `CHANGELOG.md` actualizado.
- [ ] `docs/06_TESTS/TestExecutionReport.md` actualizado con evidencia.

## Definition of Done

Pendiente hasta completar el checklist de arriba en su totalidad — no se marca este módulo como `Released` hasta entonces (ver `docs/10_GOVERNANCE/DefinitionOfDone.md`).
