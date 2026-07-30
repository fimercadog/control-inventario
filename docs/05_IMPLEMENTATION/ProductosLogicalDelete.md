# Informe Final — Corrección del Módulo Productos (Logical Delete + Badge de Estado)

## Resumen

Productos era el único módulo construido sin Logical Delete ni columna Estado visible (detectado en `docs/03_FUNCTIONAL_SPEC/RC1_FUNCTIONAL_MODULE_AUDIT.md`). Se corrigió replicando exactamente el patrón ya usado en Proveedores: `disable()`/`enable()` en backend, badge de color + filtro + confirmación en frontend, refresco automático sin recargar el navegador.

Durante la corrección se encontraron y corrigieron dos bugs adicionales, en el mismo archivo que ya se estaba modificando:
1. Los formularios de Crear/Editar Producto enviaban `marca`/`unidad_medida` como texto libre — claves que el backend dejó de aceptar desde la normalización de catálogos (RC1 Fase 1) y descartaba en silencio, sin error visible. Corregidas a `marca_nuevo`/`unidad_medida_nuevo`.
2. El campo Stock no era visible como campo deshabilitado en los formularios (solo texto descriptivo) — ahora es un campo real, deshabilitado, mostrando 0 (Crear) o el valor real (Editar).

## Archivos creados

- `frontend/components/confirm-dialog.tsx` — diálogo de confirmación reutilizable (Global UI Standard: "1. Ask for confirmation" antes de cualquier Logical Delete/Activar-Desactivar), controlado por el padre para poder abrirse desde un ítem de menú sin conflictos de foco/portal.

## Archivos modificados

**Backend:**
- `backend/app/Http/Controllers/Api/ProductoController.php` — `disable()`, `enable()`, filtro `estado` en `index()`.
- `backend/routes/api.php` — `POST /productos/{producto}/deshabilitar`, `/habilitar`.
- `backend/tests/Feature/ProductoControllerTest.php` — 5 tests nuevos (22 casos totales, antes 17).

**Frontend:**
- `frontend/app/(app)/productos/page.tsx` — columna Estado (badge), filtro de Estado, acción Eliminar/Habilitar, retrofit a `hooks/use-crud-list.ts` (primer consumidor real de ese hook, preparado desde la Unidad de Trabajo "Sidebar RC1" pero sin usar hasta ahora).
- `frontend/components/product-detail-screen.tsx` — botón Eliminar/Habilitar junto a Editar, badge de color en el header, campo "Stock actual" deshabilitado en modo edición, corrección de `marca`/`unidad_medida` → `marca_nuevo`/`unidad_medida_nuevo`.
- `frontend/components/new-product-dialog.tsx` — campo "Stock inicial" deshabilitado mostrando 0, corrección de `marca`/`unidad_medida` → `marca_nuevo`/`unidad_medida_nuevo`, prop `onCreated` nueva.
- `frontend/lib/api/productos.ts` — `disableProducto()`, `enableProducto()`, `listProductos()` acepta filtro de estado.
- `frontend/lib/api/types.ts` — `Producto.marca_id`/`unidad_medida_id` agregados (existían en el backend desde RC1 Fase 1, nunca se habían reflejado aquí); `StoreProductoPayload`/`UpdateProductoPayload` corregidos a `marca_id`/`marca_nuevo`/`unidad_medida_id`/`unidad_medida_nuevo`.

**Documentación:**
- `docs/03_FUNCTIONAL_SPEC/Products.md` — actualizado de "sin CRUD propio" (desactualizado desde antes de FEATURE-001) a reflejar el estado real; Adenda 3 nueva documentando esta corrección.
- `docs/03_FUNCTIONAL_SPEC/RC1_FUNCTIONAL_MODULE_AUDIT.md` — Productos pasa de 🟡 Parcial (55%) a 🟢 Completo (85%); estadísticas generales actualizadas.
- `CHANGELOG.md` — entrada nueva.

## Archivos eliminados

Ninguno.

## Evidencia de que la eliminación es lógica

- Test `test_disabling_a_product_is_logical_never_physical`: verifica que la fila sigue existiendo en la base de datos (`assertDatabaseHas`, no `assertDatabaseMissing`) con `estado = inactivo`.
- Test `test_disabling_a_product_never_touches_its_stock`: verifica que `stock_actual` y el conteo de `movimientos` no cambian al deshabilitar — la eliminación lógica nunca reversa inventario (mismo principio ya establecido para Stock/Movimientos en unidades de trabajo anteriores).
- Verificación real en navegador: tras "Eliminar", el producto sigue existiendo y reaparece correctamente al cambiar el filtro a "Todos (incluye inactivos)".

## Pruebas ejecutadas y resultados

- **Backend — Feature Tests:** suite completa `php artisan test` → **143/143 passing** (435 assertions). 22 casos en `ProductoControllerTest` (5 nuevos: disable lógico, oculto/visible por filtro, re-habilitación, stock intacto, aislamiento multi-tenant).
- **Frontend — Typecheck:** `npx tsc --noEmit` → limpio, sin errores.
- **Browser Tests (agent-browser, real, no simulado):**
  - Badge de Estado (verde/rojo) visible en el listado — confirmado.
  - Filtro de Estado (Activos/Todos) — confirmado.
  - Menú de fila → "Eliminar (deshabilitar)" → diálogo de confirmación → confirmar → toast de éxito → producto desaparece de la tabla sin recargar el navegador — confirmado.
  - Cambiar filtro a "Todos" → producto reaparece con badge rojo "Inactivo" — confirmado.
  - "Habilitar" desde el menú → confirmación → producto vuelve a verde "Activo", tabla se actualiza sola — confirmado.
  - Ficha de producto: mismo botón Eliminar/Habilitar con la misma confirmación — confirmado.
  - Formulario de edición: campo "Stock actual" visible y deshabilitado con el valor real — confirmado.
  - Formulario de creación: campo "Stock inicial" visible y deshabilitado en 0; producto creado con Marca real (antes se descartaba silenciosamente) y `stock_actual = 0` — confirmado.

## Problemas encontrados y corregidos

Ver "Resumen" arriba — los 2 bugs de `marca`/`unidad_medida` y el campo Stock ausente-como-input, ambos encontrados al tocar los mismos archivos por esta corrección, ambos corregidos y verificados en el mismo paso.

## Control de versiones

- **Rama:** `main`.
- **Commit:** `4af9fad` — `feat(products): implement logical delete and status badge`.

## Confirmación de push

✅ Ejecutado correctamente: `169b4bf..4af9fad  main -> main` contra `origin` (GitHub).

## Estado

☐ Pendiente
☐ Requiere correcciones
**☑ Aprobado — pendiente de confirmación del propietario del proyecto** (143/143 tests, verificación real en navegador de los 8 puntos del alcance, 2 bugs adicionales encontrados y corregidos en el mismo paso, documentación actualizada)
