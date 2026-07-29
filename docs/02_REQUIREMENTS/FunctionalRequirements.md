# Requisitos Funcionales

Fuente: `_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` §10 (RF-001…020), escrito antes de la implementación. Reconciliado contra el código real (`backend/app/Http/Controllers`, `backend/database/migrations`) — cada RF se marca `[BUILT]` o `[PLANNED]`, no se asume que todos estén implementados uniformemente.

Verificación usada: existen controladores para `Auth` y `CapturaIA` únicamente (`backend/app/Http/Controllers/Api/Auth/*`, `backend/app/Http/Controllers/Api/CapturaIAController.php`). No existen controladores de Compras, Ventas, Proveedores, Clientes, Kardex ni Reportes. Las migraciones reales cubren `empresas`, `categorias`, `productos`, `movimientos`, `capturas_ia`, `capturas_ia_detalle`, `audit_logs`, más el bloque completo de Auth/RBAC (`users` extendido, `permission_tables`, `auth_sessions`, `security_logs`, `invitations`). No existen tablas de `compras`, `ventas`, `proveedores`, `clientes` ni `kardex`.

| ID | Requisito | Estado |
|---|---|---|
| RF-001 | El sistema permitirá autenticación mediante JWT. | **[BUILT]** — `POST /auth/login`, `tymon/jwt-auth`, access + refresh token. |
| RF-002 | El sistema permitirá recuperar contraseña. | **[BUILT]** — `POST /auth/password/olvide`, `POST /auth/password/restablecer`. |
| RF-003 | El sistema permitirá administrar usuarios. | **[PLANNED]** — infraestructura de datos existe (`users` extendido); CRUD/gestión (Módulo 4 — User Management) no construido. |
| RF-004 | El sistema permitirá administrar roles. | **[PLANNED]** — motor Spatie+Teams existe a nivel de infraestructura; gestión de roles por empresa (Módulo 5) no construida. |
| RF-005 | El sistema permitirá administrar permisos. | **[PLANNED, parcial]** — el catálogo de permisos existe y está sembrado (`PermissionSeeder`), pero es fijo por diseño (no editable por el cliente) y la asignación de permisos a roles vía UI (Módulo 5) no está construida. |
| RF-006 | El sistema permitirá crear categorías. | **[BUILT]** — tabla `categorias`, usada por Captura IA; sin formulario CRUD manual dedicado. |
| RF-007 | El sistema permitirá crear productos. | **[BUILT, parcial]** — productos se crean vía Captura IA; no existe formulario manual de creación directa. |
| RF-008 | El sistema permitirá editar productos. | **[PLANNED]** — no existe endpoint/formulario de edición manual de productos. |
| RF-009 | El sistema permitirá eliminar productos. | **[PLANNED]** — no existe endpoint de eliminación de productos. |
| RF-010 | El sistema permitirá consultar productos. | **[BUILT, parcial]** — la tabla de productos existe en frontend, hoy con datos mock en algunas vistas; el listado real depende de lo creado vía Captura IA. |
| RF-011 | El sistema permitirá registrar compras. | **[PLANNED]** — módulo no construido, sin tabla ni controlador. |
| RF-012 | El sistema actualizará automáticamente el inventario después de una compra. | **[PLANNED]** — depende de RF-011. |
| RF-013 | El sistema permitirá registrar ventas. | **[PLANNED]** — módulo no construido. |
| RF-014 | El sistema actualizará automáticamente el inventario después de una venta. | **[PLANNED]** — depende de RF-013. |
| RF-015 | El sistema registrará cada movimiento de inventario. | **[BUILT]** — tabla `movimientos`, generada automáticamente por Captura IA al confirmar. |
| RF-016 | El sistema conservará un historial completo de movimientos (Kardex). | **[PLANNED]** — los movimientos se registran (RF-015) pero no existe una vista/reporte de Kardex por producto. |
| RF-017 | El sistema permitirá generar reportes por rango de fechas. | **[PLANNED]** — módulo de Reportes no construido. |
| RF-018 | El sistema permitirá consultar productos con bajo stock. | **[PLANNED]** — no existe esta consulta/alerta todavía. |
| RF-019 | El sistema permitirá registrar proveedores. | **[PLANNED]** — módulo no construido, sin tabla ni controlador. |
| RF-020 | El sistema permitirá registrar clientes. | **[PLANNED]** — módulo no construido, sin tabla ni controlador. |

## Requisitos funcionales adicionales, entregados directamente por el product owner (sesión 2026-07-29)

No provienen del master spec original ni del RF-001…020. Ninguno tiene código en `backend/` ni `frontend/` a la fecha de este registro.

| ID | Requisito | Estado |
|---|---|---|
| RF-021 | El sistema permitirá exportar la información principal de cada módulo a PDF, con formato profesional listo para impresión (título, fecha de generación, usuario generador, tablas, totales, logo, pie de página). Mínimo 14 módulos: Inventario, Productos, Compras, Ventas, Clientes, Proveedores, Kardex, Movimientos, Reportes, Configuración, Usuarios, Roles, Auditoría, Dashboard. | **[PLANNED]** — ver `docs/03_FUNCTIONAL_SPEC/FUTURE/Export.md`. |
| RF-022 | El sistema registrará toda acción relevante realizada por los usuarios en un módulo centralizado de Auditoría y Trazabilidad, identificando siempre al usuario por cuenta y rol — nunca por nombre propio. | **[PLANNED, parcial]** — infraestructura de datos (`AuditLog`) y permiso (`auditoria.ver`) ya existen; solo Captura IA escribe hoy. Ver `docs/03_FUNCTIONAL_SPEC/FUTURE/Auditoria.md`. |
| RF-023 | El sistema conservará un historial de movimientos de inventario append-only (sin sobrescritura), exportable a PDF/Excel/CSV por producto, incluyendo el rol del usuario que ejecutó cada movimiento. | **[PLANNED, parcial]** — el registro append-only de movimientos ya existe (RF-015); el campo `rol` y la exportación son nuevos. Ver `docs/03_FUNCTIONAL_SPEC/FUTURE/Kardex.md` y `docs/03_FUNCTIONAL_SPEC/Movements.md`. |

## Requisitos funcionales adicionales, no numerados en el master spec original, ya construidos

Surgidos durante la implementación de Auth/RBAC y Captura IA, ausentes del RF-001…020 original pero reales y en producción:

- El sistema aísla completamente los datos entre empresas (multi-tenant, fail-closed) — `TenantScope`, `IdentifyTenant`.
- El sistema permite capturar movimientos de inventario por foto, voz, o foto+voz usando IA (`POST /captura-ia/foto`, `/voz`, `/foto-voz`), con flujo de revisión y confirmación antes de aplicar el movimiento.
- El sistema soporta un actor de plataforma (`is_platform_admin`) que opera fuera del aislamiento de una empresa específica, siempre sujeto a permisos explícitos del namespace `plataforma.*`.
- El sistema permite "Remember Me" en login, extendiendo la sesión a 30 días vía `auth_sessions`.
