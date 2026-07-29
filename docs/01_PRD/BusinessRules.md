# Reglas de Negocio

Fuente: `_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` §12, complementado con las reglas de seguridad/multi-tenant reales de `AGENTS.md` y `04_TECHNICAL_SPEC/Architecture.md`.

## Reglas del master spec original

| ID | Regla | Estado |
|---|---|---|
| RN-001 | No se permitirá vender productos sin existencias suficientes. | Planeado — depende del módulo de Ventas, no construido. |
| RN-002 | Todo movimiento debe quedar registrado. | Construido — todo movimiento de inventario (incluidos los generados por Captura IA) se persiste en `movimientos`. |
| RN-003 | No se podrán eliminar movimientos históricos. | Construido — no existe endpoint de borrado de movimientos. |
| RN-004 | Cada producto pertenece a una categoría. | Construido — relación `productos.categoria_id` obligatoria. |
| RN-005 | Cada compra incrementa el stock. | Planeado — depende del módulo de Compras, no construido. |
| RN-006 | Cada venta disminuye el stock. | Planeado — depende del módulo de Ventas, no construido. |
| RN-007 | Todo usuario pertenece a una empresa. | Construido, con una excepción explícita: el Platform Super Admin (`is_platform_admin = true`) tiene `empresa_id = null` por diseño. |
| RN-008 | Toda tabla de negocio debe incluir `empresa_id`. | Construido — regla dura, forzada por `TenantScope` (fail-closed) en todo modelo scoped a empresa. |
| RN-009 | Los administradores pueden gestionar cualquier módulo de su empresa. | Parcialmente construido — el mecanismo de permisos existe; la asignación real de "todos los permisos" a un rol Administrador depende del Módulo 5 (Role Management), no construido aún. |
| RN-010 | Los usuarios solo podrán acceder a los módulos autorizados según su rol. | Parcialmente construido — el aislamiento por empresa (Módulo 2) está completo; la autorización por permiso específico dentro de una empresa (Módulo 3 — Authorization/RBAC) está pendiente. |

## Reglas adicionales, ya en vigor, no presentes en el master spec original

Estas reglas nacieron durante la implementación de Auth/RBAC y son hoy tan vinculantes como las de arriba (ver `AGENTS.md` y `04_TECHNICAL_SPEC/Architecture.md`):

- **Nunca confiar en `empresa_id` proveniente del request.** El contexto de empresa siempre se deriva del usuario autenticado (`IdentifyTenant` middleware), nunca de un parámetro o body enviado por el cliente.
- **Fail-closed en aislamiento multi-tenant.** Si no hay contexto de empresa resuelto, la consulta debe devolver cero registros — nunca "todos los registros" por omisión.
- **Autorización siempre por permiso, nunca por nombre de rol.** `$user->can('productos.editar')` es correcto; `$user->hasRole('Administrador')` está prohibido en lógica de negocio. Los roles son solo una agrupación administrativa de permisos para la UI de gestión.
- **Resetear contraseña revoca todas las sesiones activas** del usuario (`auth_sessions`).
- **Los permisos son un catálogo fijo, gestionado por seeder**; los roles son 100% gestionables por cada empresa, pero siempre construidos sobre ese catálogo fijo — un cliente nunca puede inventar un permiso nuevo.
- **`security_logs` y `audit_logs` son de solo-inserción** — nunca se editan ni se eliminan, ni siquiera por un administrador.

## Reglas que dependen de módulos no construidos

RN-001, RN-005 y RN-006 dependen de Compras/Ventas, que son módulos planeados pero no construidos (ver `01_PRD/OutOfScope.md`). Se documentan aquí porque siguen siendo reglas de negocio válidas y vigentes para cuando esos módulos se construyan — no deben perderse, pero tampoco deben leerse como si ya estuvieran garantizadas por el sistema hoy.
