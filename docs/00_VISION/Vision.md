# Visión del Producto

Fuente: `_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` §4-6 (Visión, Problema, Solución), reconciliado con el estado real del sistema en `04_TECHNICAL_SPEC/`.

## Visión

El Sistema Inteligente de Control de Inventario busca convertirse en el núcleo de administración empresarial de Fidel OS.

Debe permitir controlar todas las entradas y salidas de inventario mediante una interfaz moderna y una arquitectura desacoplada (Next.js + Laravel + MySQL) que facilite la integración con otros módulos futuros y con inteligencia artificial.

Está diseñado para ser reutilizable como plantilla para futuros productos de Fidel OS: la misma base de Autenticación, Multi-tenancy (`empresa_id`) y RBAC debe poder sostener no solo inventario sino cualquier producto vertical que Fidel OS construya después.

## Problema

Muchas pequeñas y medianas empresas todavía administran su inventario mediante hojas de cálculo. Esto provoca:

- Errores de digitación.
- Duplicación de información.
- Pérdida de productos.
- Falta de trazabilidad.
- Reportes poco confiables.
- Procesos manuales.
- Dificultad para auditar movimientos.

Registrar cada entrada y salida a mano es lento y propenso a error — y suele quedar sin hacerse, lo que rompe la trazabilidad exactamente cuando más se necesita (auditorías, faltantes, reconciliación de stock).

## Solución

El sistema propone una plataforma web que permite:

- Registrar productos y categorías.
- Controlar existencias en tiempo real.
- Registrar movimientos de inventario (entradas, salidas, ajustes) con trazabilidad completa.
- Capturar movimientos de inventario por foto y voz usando IA (Captura IA), reduciendo la fricción del registro manual.
- Administrar usuarios, roles y permisos por empresa (multi-tenant).
- Consultar historial y, en fases futuras, generar reportes.

De forma evergreen, la solución se apoya en tres pilares que no cambian aunque el alcance de módulos crezca:

1. **Aislamiento por empresa** (`empresa_id`) como regla no negociable en cada tabla y cada consulta.
2. **Autorización por permisos, no por nombre de rol** (`$user->can('productos.editar')`), para que la lógica de negocio nunca dependa de cómo un cliente decida nombrar sus roles.
3. **Captura asistida por IA** como diferenciador frente a un ERP de inventario tradicional: menos fricción para registrar cada movimiento es, en sí mismo, la forma más directa de resolver el problema de trazabilidad descrito arriba.

## Estado actual (a la fecha de este documento)

Esta visión es evergreen a nivel de intención de producto. Lo que existe construido hoy — y por tanto lo que un lector debe asumir como "real" en vez de "aspiracional" — es:

- Autenticación (JWT, login/logout/refresh, recuperación de contraseña).
- Aislamiento multi-tenant (`TenantScope`, fail-closed).
- Un esqueleto de Productos/Categorías/Movimientos (soporte de Captura IA).
- Captura IA (foto, voz, foto+voz) completa de extremo a extremo.
- Dashboard y tablas de Productos/Movimientos en frontend, actualmente con datos de demostración (mock).

Compras, Proveedores, Ventas, Clientes, Kardex y Reportes son parte de la visión de producto a mediano plazo, pero no están construidos todavía (ver `01_PRD/UserStories.md` y `01_PRD/OutOfScope.md` para el detalle de qué está construido vs. planeado).
