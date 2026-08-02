# Gestión de Usuarios

**Status: Approved — ready for implementation** (aprobado 2026-08-02, RC1 Fase 4 del roadmap de 8 fases)

> Corresponde al Módulo 4 (User Management) del roadmap Auth & RBAC (`docs/00_VISION/Roadmap.md`). Esta versión reemplaza la anterior ("Planned — not yet implemented"), que dejaba deliberadamente sin resolver las preguntas de negocio marcadas abajo — resueltas explícitamente por el propietario del proyecto antes de escribir código, cerrando el gate del Golden Rule (`AGENTS.md`).
>
> **Nota de dependencia, heredada sin cambios**: Módulo 3 (Authorization/RBAC — `PermissionCheckerInterface`, middleware de permisos, `PermissionContext`, rutas protegidas por permiso) sigue `[ ]` sin construir. Este módulo se implementa, como todos los anteriores del roadmap RC1, con el mismo nivel de enforcement ya usado en Categorías/Marcas/Stock/Movimientos: aislamiento por empresa real (`UserPolicy`, defensa en profundidad), catálogo de permisos sembrado (`usuarios.ver`/`usuarios.editar`) pero **sin middleware de permiso granular todavía** — no es una regresión de este módulo, es el mismo estado incremental de todo el roadmap.

## Purpose

Permitir que un usuario con permiso de gestión (`usuarios.ver`/`usuarios.editar`) vea el listado de usuarios de su propia empresa, consulte su actividad reciente, y pueda activar/desactivar una cuenta — sin exponer nunca usuarios de otra empresa, y sin poder dejar a su propia empresa sin nadie que pueda gestionar usuarios.

## Decisiones confirmadas (resuelven los puntos "a definir" de la versión anterior)

1. **Alcance de este módulo: Listar, Ver, Activar, Desactivar. Nada más.** No existe "Crear" — la creación de usuarios es responsabilidad exclusiva del Módulo 6 (Invitaciones), todavía sin construir, y queda fuera de alcance de esta unidad de trabajo. No existe "Editar" de campos de perfil (nombre/email) — esos siguen siendo responsabilidad del propio usuario vía `Perfil` (`Settings.md`), no de este módulo administrativo. No existe reasignación de rol desde esta pantalla — eso es Módulo 5 (Roles), todavía sin construir.
2. **Un usuario nunca puede desactivar su propia cuenta.** Intento rechazado con 409, sin excepción, incluso para un Administrador.
3. **Un usuario nunca puede desactivarse si es el último usuario activo de su empresa con el permiso `usuarios.editar`.** Evita que una empresa quede sin nadie capaz de gestionar cuentas. Intento rechazado con 409.
4. **Ningún endpoint de eliminar (física o lógica) existe para Usuarios** — ya establecido, reafirmado aquí. `is_active` es el único estado; no hay una segunda bandera de "borrado".
5. Usuarios invitados sin invitación completada no pueden existir todavía (Módulo 6 no construido) — el edge case queda documentado pero no aplicable hasta entonces.

## Business Flow

1. Un usuario con `usuarios.ver` navega a `/usuarios` y ve la lista de usuarios de su empresa (nunca de otra — filtrado manual por `empresa_id`, `User` no tiene `TenantScope` automático, a diferencia de Producto/Movimiento/Categoria).
2. Puede buscar por nombre/email, filtrar por estado (Activos/Inactivos/Todos) y por rol.
3. Puede ver el detalle de un usuario: actividad (`last_activity_at`, `last_login_ip`, `last_user_agent`), rol asignado, estado, y trazabilidad de invitación (`invited_at`, quién lo invitó).
4. Un usuario con `usuarios.editar` puede activar o desactivar una cuenta ajena — nunca la propia (Decisión 2), y nunca si deja a la empresa sin nadie con `usuarios.editar` (Decisión 3).
5. Desactivar una cuenta revoca inmediatamente todas sus `auth_sessions` activas (mismo mecanismo ya usado por reset de contraseña — `RefreshTokenService::revokeAllForUser()`), forzando el próximo request autenticado a fallar.

## Actors

- **Usuario con `usuarios.ver`**: puede listar y ver detalle.
- **Usuario con `usuarios.editar`**: además puede activar/desactivar cuentas ajenas.
- **Platform Super Admin**: fuera del alcance de esta pantalla — no tiene `empresa_id`, así que nunca aparece en ningún listado de este módulo. Su superficie equivalente (`GET /plataforma/empresas/{id}/usuarios`) sigue sin construir.

## Screens

- **`/usuarios`**: tabla de usuarios de la empresa actual — nombre, email, rol, badge de estado, última actividad. Búsqueda por nombre/email, filtro de estado, filtro de rol, paginación real (100/página, Anterior/Siguiente). Sin botón "Nuevo" (Decisión 1). Acción de fila para Activar/Desactivar con confirmación obligatoria.
- **`/usuarios/{id}`**: ficha de un usuario — todos los campos de solo lectura (no hay formulario de edición en este módulo), botón Activar/Desactivar.

## Fields

| Campo | Fuente | Editable desde este módulo |
| --- | --- | --- |
| name, email | `users` | No (pertenece a Perfil) |
| empresa_id | `users` | No (siempre el de la empresa del usuario que consulta) |
| is_active | `users` | Sí, únicamente vía Activar/Desactivar |
| last_activity_at, last_login_ip, last_user_agent | `users` | No (se actualizan desde el Módulo 1 — login/refresh) |
| rol asignado | `model_has_roles` (Spatie, vía `getRoleNames()`) | No (pertenece a Módulo 5 — Roles) |
| invited_at, invited_by | `users` | No (trazabilidad de cómo se creó la cuenta) |

## Validation Rules

No hay `FormRequest` de creación/edición de campos — este módulo no acepta ningún payload de datos, solo las dos acciones de estado (`activar`/`desactivar`), sin body.

## Permissions

Catálogo ya sembrado (`PermissionSeeder`): `usuarios.ver`, `usuarios.editar`. Enforcement real vía `UserPolicy` (pertenencia de empresa — un usuario de la Empresa B nunca puede ver/activar/desactivar un usuario de la Empresa A); enforcement granular por nombre de permiso todavía no implementado (depende de Módulo 3, ver nota de dependencia arriba) — mismo estado que el resto del roadmap RC1.

## Loading States

Spinner mientras se resuelve la llamada real a la API (listado y ficha) — mismo patrón que el resto de los módulos ya construidos.

## Empty States

- Filtro/búsqueda sin resultados: mismo `EmptyState` reutilizable que el resto de los módulos.
- Empresa nueva con un solo usuario (el actual, sin nadie invitado todavía): la lista simplemente muestra ese único usuario — no hay CTA hacia un flujo de invitación porque ese módulo no existe todavía.

## Error States

- 409 al intentar desactivarse a sí mismo, o al último usuario con `usuarios.editar` — mensaje claro vía `toast`, sin romper la pantalla.
- 404 si el usuario no existe o pertenece a otra empresa (`findOrFail` sobre una query ya acotada por `empresa_id` — nunca un 403 que confirme existencia cross-tenant).

## Business Rules

- `User` **no** tiene `TenantScope` automático (a diferencia de Producto/Categoria/Movimiento/CapturaIA/AuditLog/Role) — aplicar automáticamente un scope global a un modelo usado también por el propio guard de autenticación es riesgo fuera de alcance de este módulo. El aislamiento se garantiza manualmente: toda query de este módulo filtra explícitamente por `empresa_id` (vía `TenantContext::empresaId()`), y `UserPolicy` es una segunda capa de defensa, no la única.
- Un usuario nunca puede desactivar su propia cuenta (Decisión 2) — 409, sin excepción.
- Un usuario nunca puede desactivarse si es el último activo de su empresa con `usuarios.editar` (Decisión 3) — 409. Se evalúa con `hasPermissionTo('usuarios.editar')` sobre los demás usuarios activos de la misma empresa (contexto de Teams de Spatie ya fijado por `IdentifyTenant`).
- Desactivar revoca todas las `auth_sessions` activas del usuario afectado (`RefreshTokenService::revokeAllForUser()`).
- Un Platform Super Admin nunca aparece en ningún listado de este módulo (su `empresa_id` es siempre `null`, y la query siempre filtra por la empresa del usuario autenticado).
- Reactivar (`activar`) no tiene ninguna de las dos restricciones anteriores — solo requiere `usuarios.editar` y pertenencia a la misma empresa.

## Acceptance Criteria

- [x] Listado muestra únicamente usuarios de la empresa del usuario autenticado.
- [x] Activar/desactivar requiere pertenencia a la misma empresa (`UserPolicy`); un usuario de otra empresa recibe 404, no 403.
- [x] Desactivar un usuario revoca sus `auth_sessions` activas.
- [x] Un Platform Super Admin nunca aparece en este listado.
- [x] Un usuario no puede desactivarse a sí mismo (409).
- [x] Un usuario no puede desactivar al último usuario con `usuarios.editar` de su empresa (409).
- [x] No existe ningún endpoint de eliminar (405/404).

## Edge Cases

- Único usuario de una empresa (el fundador, recién creada la empresa): es simultáneamente "el único" y "el último con `usuarios.editar`" — ambas reglas (2 y 3) lo protegen igual, redundante pero correcto.
- Usuario invitado que nunca completó la invitación: no aplicable todavía — no existe ningún flujo en el sistema que produzca ese estado (Módulo 6 sin construir). Documentado, no implementado.

## Future Improvements

- Integración con Módulo 7 (Active Sessions): ver/revocar sesiones de otro usuario de la misma empresa desde su ficha de detalle.
- Integración con Módulo 8 (Security Logs): ver intentos de login de un usuario específico desde su ficha.
- Exportar listado de usuarios.
- Módulo 6 (Invitaciones): único camino real para agregar usuarios a una empresa; hasta que exista, el único mecanismo de alta es el seeder de demo data o acceso directo a base de datos.
- Reasignación de rol desde la ficha de usuario, una vez exista Módulo 5 (Roles).
