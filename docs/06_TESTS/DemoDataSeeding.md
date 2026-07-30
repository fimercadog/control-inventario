# Datos de Demostración (Seeding)

**Status: Planned — no implementado**

> Requisito de producto entregado directamente por el product owner (sesión 2026-07-29, "FASE 17 — Validación Integral y Pruebas del Sistema"). No proviene del master spec original.
>
> **Verificado contra código real:** hoy solo existe `PermissionSeeder` (catálogo de permisos, ver `docs/03_FUNCTIONAL_SPEC/Roles.md`) y el seeder mínimo que crea la empresa demo `Fidel OS Demo` (id 1) mencionado en `docs/06_TESTS/ManualTestCases.md` MTC-001. **No existe ningún seeder de datos de demostración a escala** para Productos, Clientes, Compras, Ventas ni Auditoría.

## Propósito

Que cada módulo pueda poblarse automáticamente con datos realistas, suficientes para ejercitar de forma creíble sus casos de prueba funcionales (ver `IntegrationTestPlan.md`) — un volumen manejable para pruebas funcionales y de demo, distinto y menor al volumen usado en `PerformanceTests.md` (que evalúa comportamiento bajo carga, no realismo funcional).

## Volúmenes por módulo (escala funcional/demo)

| Módulo | Volumen | Nota de estado |
|---|---|---|
| Productos | 300 | `[PLANNED]` — hoy los productos se crean únicamente vía Captura IA (RF-007); un seeder masivo es trabajo nuevo |
| Categorías | 20 | `[PLANNED]` |
| Proveedores | 15 | Depende de `03_FUNCTIONAL_SPEC/FUTURE/Suppliers.md` — módulo no construido |
| Bodegas | 2 (si aplica) | El sistema no modela bodegas/almacenes múltiples hoy — ver nota abajo |
| Movimientos (entrada/salida/ajustes) | Sin volumen fijo — derivado de Productos/Compras/Ventas | `[PLANNED]`, ya existe el modelo `Movimiento` (ver `03_FUNCTIONAL_SPEC/Movements.md`) |
| Clientes | 200 | Depende de `03_FUNCTIONAL_SPEC/FUTURE/Customers.md` — módulo no construido |
| Compras | 150 | Depende de `03_FUNCTIONAL_SPEC/FUTURE/Purchases.md` — módulo no construido |
| Ventas | 250 | Depende de `03_FUNCTIONAL_SPEC/FUTURE/Sales.md` — módulo no construido |
| Usuarios | 5 (uno por rol: Administrador, Auxiliar de Inventario, Vendedor, Supervisor, Auditor) | Los roles "Supervisor" y "Auditor" no existen todavía en `PermissionSeeder` — ver nota abajo |
| Auditoría | "Miles" de eventos simulados | Depende de `03_FUNCTIONAL_SPEC/FUTURE/Auditoria.md` — módulo no construido |

## Notas de reconciliación con el sistema real

- **Bodegas:** el dominio actual (`docs/04_TECHNICAL_SPEC/DomainModel.md`) no tiene el concepto de bodega/almacén — el stock es una propiedad única por producto y empresa (`Producto.stock_actual`). Modelar bodegas múltiples es un cambio de modelo de dominio, no solo de datos de prueba, y está fuera del alcance de esta spec de seeding. Se documenta aquí como dependencia, no se decide unilateralmente.
- **Roles "Supervisor" y "Auditor":** el catálogo de permisos ya sembrado (`PermissionSeeder`, ver `Roles.md` línea 48) no incluye estos dos roles como tales — el catálogo define permisos (`productos.ver`, `auditoria.ver`, etc.), no roles fijos; los roles se crean por empresa (Módulo 5, Role Management, no construido). "Auditor" mapea naturalmente al permiso ya existente `auditoria.ver` como su único permiso; "Supervisor" no tiene un mapeo obvio a un subconjunto de permisos todavía — a definir cuando el Módulo 5 se construya.
- Este seeder de datos de demostración **no reemplaza** los 94 tests reales de `backend/tests/` (que usan sus propios fixtures mínimos y deliberadamente pequeños) — es un dataset aparte, pensado para demos y para los casos de prueba funcional de `IntegrationTestPlan.md`, nunca para pipelines de CI.

## Cuándo se construye

Este seeder solo tiene sentido módulo por módulo, a medida que cada módulo (Clientes, Compras, Ventas, Auditoría, etc.) se construya — no se debe crear un seeder de "Compras" antes de que exista una tabla `compras`.
