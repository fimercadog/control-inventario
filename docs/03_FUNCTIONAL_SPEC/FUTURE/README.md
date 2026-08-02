# 03_FUNCTIONAL_SPEC/FUTURE/

Specs de módulos planeados, **no descartados**, aún no construidos — decisión explícita de producto. Todos marcados `Status: Planned — not yet implemented` con el banner "no implementar sin aprobación previa" (`AGENTS.md`, Golden Rule).

| Documento | Módulo | Origen |
|---|---|---|
| [`Purchases.md`](Purchases.md) | Compras | Master spec original |
| [`Sales.md`](Sales.md) | Ventas | Master spec original |
| [`Suppliers.md`](Suppliers.md) | Proveedores — **ya construido**, este archivo quedó mal ubicado desde antes de esa unidad de trabajo, ver `docs/03_FUNCTIONAL_SPEC/RC1_FUNCTIONAL_MODULE_AUDIT.md` | Master spec original |
| [`Kardex.md`](Kardex.md) | Historial de movimientos por producto, exportable | Master spec original + requisito de producto 2026-07-29 (campos, exportación) |
| [`Export.md`](Export.md) | Exportación universal a PDF/Excel/CSV, capacidad compartida entre módulos | Requisito de producto 2026-07-29 |

**Graduados de esta carpeta** (ya construidos como vertical slice completo, spec real movida a `docs/03_FUNCTIONAL_SPEC/`, este archivo eliminado): `Customers.md` → [`../Customers.md`](../Customers.md) (2026-08-02), `Auditoria.md` → [`../Auditoria.md`](../Auditoria.md) (2026-08-02, alcance reducido frente al borrador original — sin exportación ni panel de estadísticas, ver el documento nuevo), `Reports.md` → [`../Reports.md`](../Reports.md) (2026-08-02, alcance reducido a los 5 módulos que sí existen — Productos/Inventario/Movimientos/Clientes/Proveedores; Ventas/Compras siguen bloqueados por depender de módulos inexistentes, ver el documento nuevo).

Ver también: [`../../02_REQUIREMENTS/FunctionalRequirements.md`](../../02_REQUIREMENTS/FunctionalRequirements.md) (RF-011 a RF-023) y [`../../06_TESTS/IntegrationTestPlan.md`](../../06_TESTS/IntegrationTestPlan.md) (checklist de pruebas que aplicará a cada uno de estos módulos una vez construidos).
