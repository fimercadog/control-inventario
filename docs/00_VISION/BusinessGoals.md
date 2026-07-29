# Objetivos de Negocio

Fuente: `_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` §2-3 (Objetivos, Alcance), a nivel de objetivo — no de feature individual.

## Objetivo general

Construir un sistema escalable, desacoplado y reutilizable para controlar el inventario de pequeñas y medianas empresas.

## Objetivos específicos

- Reducir pérdidas por errores de inventario.
- Mantener el stock actualizado en tiempo real.
- Registrar todos los movimientos de inventario, sin excepción.
- Gestionar compras y ventas (planeado — ver estado más abajo).
- Obtener indicadores de negocio (dashboard, KPIs).
- Facilitar auditorías (trazabilidad completa, logs inmutables).
- Servir como plantilla arquitectónica reutilizable para futuros productos de Fidel OS.

## Alcance a nivel de objetivo

El alcance original del producto (§3 del master spec) incluye, a nivel de meta de negocio:

- Login y control de acceso.
- Dashboard con indicadores.
- Gestión de usuarios, roles y permisos.
- Gestión de productos y categorías.
- Control de inventario y movimientos.
- Compras y gestión de proveedores.
- Ventas y gestión de clientes.
- Reportes.
- Configuración general.

Estos objetivos siguen vigentes como dirección de producto. Que un módulo no esté construido todavía no significa que se haya descartado — significa que está **planeado, no priorizado aún** (ver `01_PRD/UserStories.md` para el desglose [BUILT] vs. [PLANNED] y `01_PRD/OutOfScope.md` para lo que sí queda genuinamente fuera de alcance).

## Explícitamente fuera del MVP

Definido en el master spec como no incluido en el MVP (sigue vigente):

- Facturación electrónica.
- Integración con DIAN (autoridad tributaria).
- Contabilidad.
- Nómina.
- CRM.

Estas funcionalidades podrían desarrollarse en versiones futuras, pero no forman parte del núcleo del producto de inventario. Ver `01_PRD/OutOfScope.md` para el detalle completo.
