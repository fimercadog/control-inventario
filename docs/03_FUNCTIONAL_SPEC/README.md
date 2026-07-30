# 03_FUNCTIONAL_SPEC/

Comportamiento de cada módulo/pantalla, desde la perspectiva del usuario. Todo documento declara su `Status` en la primera línea (`Built` / `Planned`, con matices honestos como "parcial" o "sin CRUD propio" donde aplica).

## Módulos construidos (`Status: Built`, con matices reales)

| Documento | Estado real |
|---|---|
| [`AI_Capture.md`](AI_Capture.md) | Built — el único flujo end-to-end completo (foto/voz/foto+voz). |
| [`Authentication.md`](Authentication.md) | Built — login/logout/refresh/reset de contraseña, JWT. |
| [`Dashboard.md`](Dashboard.md) | Built, con datos simulados (mock). |
| [`Products.md`](Products.md) | Built — esqueleto delgado, sin CRUD manual propio. |
| [`Inventory.md`](Inventory.md) | Built, solo como servicio interno — sin pantalla propia. |
| [`Movements.md`](Movements.md) | Built en backend; pantalla con datos simulados. |
| [`Roles.md`](Roles.md) | Built — infraestructura y motor de permisos; sin enforcement por ruta ni UI de gestión todavía. |
| [`Settings.md`](Settings.md) | Built parcial — pantalla real, sin persistencia backend propia. |
| [`Users.md`](Users.md) | Planned — gestión de usuarios (Módulo 4), no construida. |

## Módulos planeados, no construidos

Ver [`FUTURE/`](FUTURE/) — Compras, Ventas, Clientes, Proveedores, Kardex, Reportes, Auditoría y Trazabilidad, y Exportación universal. Ninguno descartado; todos con especificación completa a la espera de Technical Spec + Architecture Review antes de implementarse (`AGENTS.md`, Golden Rule).

Ver también: [`../02_REQUIREMENTS/FunctionalRequirements.md`](../02_REQUIREMENTS/FunctionalRequirements.md) (requisitos que estas specs implementan) y [`../05_IMPLEMENTATION/`](../05_IMPLEMENTATION/) (plan técnico de los módulos ya construidos).
