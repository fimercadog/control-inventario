# Usuarios Objetivo

Fuente: `_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` §7-8 (Stakeholders, Usuarios), reconciliado con lo que existe realmente construido en `04_TECHNICAL_SPEC/Architecture.md` y `PermissionSeeder.php`.

## Perfil de cliente objetivo

Pequeñas y medianas empresas (PyMEs) que actualmente administran su inventario mediante hojas de cálculo o procesos manuales, y que necesitan una plataforma web para controlar productos, existencias y movimientos con trazabilidad real.

## Stakeholders (§7 del master spec)

- **CEO / dueño de negocio** — responsable de la estrategia del producto y de la empresa cliente; consume principalmente el dashboard y los reportes (reportes: planeado, no construido aún).
- **Administrador** — administra la configuración general de la empresa dentro del sistema: usuarios, roles, permisos.
- **Supervisor** — supervisa la operación diaria; revisa y confirma movimientos de inventario.
- **Compras** — gestiona proveedores y órdenes de compra (módulo planeado, no construido).
- **Ventas** — gestiona clientes y ventas (módulo planeado, no construido).
- **Bodega** — controla entradas y salidas de inventario; es quien más directamente se beneficia de Captura IA.
- **Consulta** — puede visualizar información sin modificarla.

## Reconciliación con lo construido

Los roles anteriores estaban descritos en el master spec original como una lista de nombres, escrita antes de que existiera ningún código de autorización. Lo que existe hoy en el sistema real es distinto y más delgado:

- **No hay roles predefinidos sembrados en el sistema.** El motor de RBAC (Spatie + Teams) está construido a nivel de infraestructura (`roles` con `empresa_id`), pero la gestión de roles por empresa (Módulo 5 — Role Management) todavía no está implementada. Hoy, cada empresa **podrá** definir sus propios roles sobre un catálogo fijo de permisos, pero esa UI/API de gestión de roles no existe todavía.
- **El catálogo real de permisos** (`backend/database/seeders/PermissionSeeder.php`) es: `productos.*`, `movimientos.*`, `captura-ia.usar/revisar/confirmar`, `usuarios.*`, `roles.*`, `auditoria.ver`, `plataforma.*`. No existen permisos `compras.*` ni `ventas.*` todavía — se agregarán cuando esos módulos se construyan.
- **Existe un actor adicional no descrito en el master spec original**: el **Platform Super Admin** (`is_platform_admin = true`, `empresa_id = null`) — un usuario interno de Fidel OS para soporte/operaciones, no un rol de cliente.

Ver `01_PRD/UserPersonas.md` para personas concretas construidas a partir de este catálogo real de permisos, no de los nombres de rol aspiracionales del master spec original.
