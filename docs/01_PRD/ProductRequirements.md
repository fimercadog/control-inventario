# PRD — Sistema Inteligente de Control de Inventario

Documento de nivel superior, sintetizado a partir de `00_VISION/Vision.md`, `00_VISION/BusinessGoals.md`, `01_PRD/BusinessRules.md` y lo verificado como realmente construido en `04_TECHNICAL_SPEC/Architecture.md`, `Database.md` y `API.md`.

## Resumen

El Sistema Inteligente de Control de Inventario es el producto núcleo de Fidel OS: una plataforma web desacoplada (Next.js + Laravel + MySQL) para que PyMEs controlen inventario con trazabilidad real, reduciendo la fricción del registro manual mediante captura asistida por IA.

Ver `01_PRD/ProblemStatement.md` para el problema que resuelve y `00_VISION/ProductStrategy.md` para la estrategia de secuenciación (base segura primero, amplitud de módulos después).

## Usuarios

Ver `01_PRD/TargetUsers.md` y `01_PRD/UserPersonas.md`. En resumen: PyMEs multi-usuario, con roles internos (operario de bodega, supervisor, administrador) más un actor interno de Fidel OS (Platform Super Admin) para soporte/operaciones.

## Alcance funcional actual (verificado contra código)

### Construido y en producción

- **Autenticación** (JWT: login, logout, refresh, recuperación de contraseña). Endpoints: `/auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/me`, `/auth/password/olvide`, `/auth/password/restablecer`.
- **Aislamiento multi-tenant** (`TenantScope` fail-closed, `IdentifyTenant`), con 25 tests adversariales pasando.
- **Captura IA** — foto, voz, foto+voz — de extremo a extremo (backend + frontend), incluyendo revisión y confirmación de capturas antes de aplicar el movimiento al stock.
- **Esqueleto de Productos, Categorías, Movimientos** — suficiente para sostener Captura IA; sin CRUD manual completo todavía.
- **Dashboard** — construido, pero con datos de demostración (mock), no datos reales de la empresa.

### En curso / próximo (Auth & RBAC, Módulos 3-9)

- Autorización real por permisos (Módulo 3).
- Gestión de usuarios (Módulo 4) y roles (Módulo 5) por empresa.
- Invitaciones (Módulo 6), sesiones activas (Módulo 7), logs de seguridad (Módulo 8), perfil de usuario (Módulo 9).

### Planeado, no construido (ver `01_PRD/OutOfScope.md`)

Compras, Proveedores, Ventas, Clientes, Kardex, Reportes. Siguen siendo parte de la visión de producto, no descartados — solo no priorizados.

### Planeado, entregado directamente por el product owner (sesión 2026-07-29)

Tres requisitos nuevos, transversales al resto del roadmap, sin código todavía (ver `02_REQUIREMENTS/FunctionalRequirements.md` RF-021 a RF-023 para el detalle reconciliado contra el código real):

- **Exportación universal a PDF/Excel/CSV** (`03_FUNCTIONAL_SPEC/FUTURE/Export.md`) — capacidad compartida por los 14 módulos mínimos listados en RF-021.
- **Auditoría y Trazabilidad** (`03_FUNCTIONAL_SPEC/FUTURE/Auditoria.md`) — módulo centralizado de registro de acciones; regla de producto no negociable: nunca se registra ni se muestra el nombre real de una persona, solo usuario autenticado + rol asignado.
- **Extensión del historial de movimientos/Kardex** (`03_FUNCTIONAL_SPEC/FUTURE/Kardex.md`, `03_FUNCTIONAL_SPEC/Movements.md`) — campo `rol` nuevo por movimiento, más exportación por producto a PDF/Excel/CSV.

## Requisitos

El detalle de requisitos funcionales vive en `02_REQUIREMENTS/FunctionalRequirements.md` (con cada RF marcado `[BUILT]` o `[PLANNED]`). Los requisitos no funcionales, de seguridad, rendimiento y accesibilidad viven en sus respectivos documentos dentro de `02_REQUIREMENTS/`.

## Reglas de negocio

Ver `01_PRD/BusinessRules.md` para el detalle completo, incluidas las reglas de seguridad multi-tenant que no estaban en el master spec original pero que hoy son vinculantes.

## Métricas de éxito

Ver `01_PRD/SuccessMetrics.md`. Ninguna métrica tiene todavía instrumentación activa de reporte — el documento define qué se debería medir, no resultados ya alcanzados.

## Fuera de alcance

Ver `01_PRD/OutOfScope.md` para la distinción entre "genuinamente fuera de alcance" (facturación electrónica, DIAN, contabilidad, nómina, CRM) y "planeado pero no construido" (Compras, Ventas, etc.).

## Gaps conocidos de este PRD

- No existe hoy instrumentación de producto/analítica para medir adopción real (ver `SuccessMetrics.md`).
- El dashboard usa datos mock; no refleja aún operación real de una empresa cliente.
- La gestión de usuarios/roles por autoservicio (Módulos 4-6) no existe — alta de usuarios adicionales requiere intervención manual hoy.
