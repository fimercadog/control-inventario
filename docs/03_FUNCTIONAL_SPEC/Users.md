# Gestión de Usuarios

**Status: Approved — implemented** (aprobado 2026-08-02, RC1 Fase 4; ampliado 2026-08-03 con Módulo 6 — Invitaciones — y reasignación de rol)

> Corresponde al Módulo 4 (User Management) del roadmap Auth & RBAC (`docs/00_VISION/Roadmap.md`). Esta versión reemplaza la anterior ("Planned — not yet implemented"), que dejaba deliberadamente sin resolver las preguntas de negocio marcadas abajo — resueltas explícitamente por el propietario del proyecto antes de escribir código, cerrando el gate del Golden Rule (`AGENTS.md`).
>
> **Nota de dependencia — resuelta 2026-08-04.** Módulo 3 (Authorization/RBAC) se completó 2026-08-02 (`docs/05_IMPLEMENTATION/AuthorizationCompletion.md`), pero `UserPolicy::update()` quedó como la única excepción del ERP al modelo "permiso AND pertenencia de empresa" — brecha documentada explícitamente aquí abajo (Permissions), heredada sin corregir durante la ampliación de Invitaciones del 2026-08-03. Cerrada en la auditoría de campos editables de Clientes/Proveedores/Usuarios (`docs/13_ROLES/`, 2026-08-04): `UserPolicy::update()` ahora exige `ownedBy() && $actor->can('usuarios.editar')`, igual que las otras 9 Policies del ERP. Activar/Desactivar/Asignar rol (los tres pasan por `update()`) ahora devuelven 403 sin ese permiso, no solo por pertenecer a otra empresa.

## Purpose

Permitir que un usuario con permiso de gestión (`usuarios.ver`/`usuarios.editar`) vea el listado de usuarios de su propia empresa, consulte su actividad reciente, invite cuentas nuevas, asigne su rol, y active/desactive una cuenta — sin exponer nunca usuarios de otra empresa, y sin poder dejar a su propia empresa sin nadie que pueda gestionar usuarios.

## Decisiones confirmadas (resuelven los puntos "a definir" de la versión anterior)

1. **Alcance original: Listar, Ver, Activar, Desactivar. Ampliado 2026-08-03 con Invitar y Asignar rol.** La creación de usuarios sigue sin ser un formulario directo — es responsabilidad exclusiva del Módulo 6 (Invitaciones, construido 2026-08-03): un admin invita por correo, el invitado elige su propia contraseña al aceptar. No existe "Editar" de campos de perfil (nombre/email) — esos siguen siendo responsabilidad del propio usuario vía `Perfil` (`Profile.md`), no de este módulo administrativo. La reasignación de rol sí se construyó (2026-08-03, ahora que Módulo 5 — Roles — está completo): reemplaza el rol del usuario, nunca lo agrega a una lista — este ERP modela un único rol por usuario de punta a punta.
2. **Un usuario nunca puede desactivar su propia cuenta.** Intento rechazado con 409, sin excepción, incluso para un Administrador.
3. **Un usuario nunca puede desactivarse si es el último usuario activo de su empresa con el permiso `usuarios.editar`.** Evita que una empresa quede sin nadie capaz de gestionar cuentas. Intento rechazado con 409.
4. **Ningún endpoint de eliminar (física o lógica) existe para Usuarios** — ya establecido, reafirmado aquí. `is_active` es el único estado; no hay una segunda bandera de "borrado".
5. **Reasignar la empresa de un usuario permanece deliberadamente fuera de alcance** (confirmado explícitamente 2026-08-03, no un olvido): `empresa_id` es fijo desde la creación; no existe ningún precedente en esta arquitectura para reasignarlo sin invalidar el resto de las garantías de aislamiento por empresa del propio usuario (sus audit logs, movimientos, etc.).

## Business Flow

1. Un usuario con `usuarios.ver` navega a `/usuarios` y ve la lista de usuarios de su empresa (nunca de otra — filtrado manual por `empresa_id`, `User` no tiene `TenantScope` automático, a diferencia de Producto/Movimiento/Categoria).
2. Puede buscar por nombre/email, filtrar por estado (Activos/Inactivos/Todos) y por rol.
3. Puede ver el detalle de un usuario: actividad (`last_activity_at`, `last_login_ip`, `last_user_agent`), rol asignado, estado, y trazabilidad de invitación (`invited_at`, quién lo invitó).
4. Un usuario con `usuarios.invitar` puede invitar una cuenta nueva desde `/usuarios` (botón "Nuevo Usuario") — el invitado recibe un correo con un enlace de un solo uso (`/aceptar-invitacion?token=...`), válido 7 días, donde elige su propio nombre y contraseña. Aceptar la invitación crea el `User` ya con `email_verified_at` fijado (el correo recibido y usado como prueba de titularidad ya cumple ese propósito — un segundo correo de verificación sería fricción redundante) y, si la invitación incluía un rol, se lo asigna.
5. Un usuario con `usuarios.editar` puede activar o desactivar una cuenta ajena — nunca la propia (Decisión 2), y nunca si deja a la empresa sin nadie con `usuarios.editar` (Decisión 3) — y puede reasignar el rol de cualquier usuario de su empresa (reemplaza el anterior, no lo acumula).
6. Desactivar una cuenta revoca inmediatamente todas sus `auth_sessions` activas (mismo mecanismo ya usado por reset de contraseña — `RefreshTokenService::revokeAllForUser()`), forzando el próximo request autenticado a fallar.

## Actors

- **Usuario con `usuarios.ver`**: puede listar y ver detalle.
- **Usuario con `usuarios.editar`**: además puede activar/desactivar cuentas ajenas y reasignar su rol.
- **Usuario con `usuarios.invitar`**: puede invitar cuentas nuevas a su empresa.
- **Platform Super Admin**: fuera del alcance de esta pantalla — no tiene `empresa_id`, así que nunca aparece en ningún listado de este módulo. Su superficie equivalente (`GET /plataforma/empresas/{id}/usuarios`) sigue sin construir.

## Screens

- **`/usuarios`**: tabla de usuarios de la empresa actual — nombre, email, rol, badge de estado, última actividad. Búsqueda por nombre/email, filtro de estado, filtro de rol, paginación real (100/página, Anterior/Siguiente). Botón "Nuevo Usuario" (2026-08-03) abre un diálogo de invitación (email + rol opcional) — no un formulario de creación directo. Acción de fila para Activar/Desactivar con confirmación obligatoria. Único punto de entrada del módulo — no existe una ruta `/usuarios/{id}` (Global UI Standard "CRUD en Modal", 2026-08-03).
- **Ver** ocurre en un modal de solo lectura sobre este mismo listado (`UsuarioViewModal`), nunca navegando a otra página — nombre/correo siguen de solo lectura; el campo Rol gana una acción "Cambiar rol" (diálogo con selector, sin cambios); botón Activar/Desactivar. Este módulo nunca tuvo Crear/Editar genérico, así que no hay `UsuarioFormModal` — "crear" es Invitar (arriba), "editar" es únicamente reasignar rol.
- **`/aceptar-invitacion`** (2026-08-03, pública, fuera del grupo de rutas autenticadas): resuelve el token primero para mostrar a qué empresa se une el invitado y detectar un enlace inválido/expirado antes de mostrar el formulario; formulario de nombre + contraseña; redirige a `/login` al aceptar.

## Fields

| Campo | Fuente | Editable desde este módulo |
| --- | --- | --- |
| name, email | `users` | No (pertenece a Perfil; se fijan una sola vez al aceptar la invitación) |
| empresa_id | `users` | No (fijo desde la creación, ver Decisión 5) |
| is_active | `users` | Sí, únicamente vía Activar/Desactivar |
| last_activity_at, last_login_ip, last_user_agent | `users` | No (se actualizan desde el Módulo 1 — login/refresh) |
| rol asignado | `model_has_roles` (Spatie, vía `getRoleNames()`) | Sí (2026-08-03) — vía "Cambiar rol", reemplaza el rol anterior |
| invited_at, invited_by | `users` | No (trazabilidad de cómo se creó la cuenta — fijados al aceptar la invitación) |

**Clasificación (auditoría de campos editables, 2026-08-04):** `name`/`email`/`empresa_id` son de identidad y **read-only** desde cualquier ruta después de crearse la cuenta (`email` en particular es la credencial de login — nunca cambia, ni siquiera desde `Perfil`, ver `Profile.md`). `is_active` y el rol asignado son condicionalmente editables — requieren `usuarios.editar` y, en el caso de `is_active`, además no dejar a la empresa sin nadie con ese permiso (Decisión 3; ver el riesgo documentado arriba sobre `asignarRol()`, que no replica esa segunda guarda). Los campos de `Perfil` (`theme`/`language`/`timezone`/`avatar_path`/`password`) son editables solo por el propio usuario — ver `Profile.md`.

## Validation Rules

- **Invitar** (`StoreInvitationRequest`): `email` requerido, formato válido, único contra `users` (no se puede invitar un correo ya registrado); `role_id` opcional, debe existir dentro de la propia empresa del invitador.
- **Aceptar invitación** (`AcceptInvitationRequest`): `name` requerido; `password` requerido, mínimo 8 caracteres, `confirmed`.
- **Asignar rol** (`AssignRoleRequest`): `role_id` requerido, debe existir dentro de la propia empresa del usuario destino.
- Las dos acciones de estado (`activar`/`desactivar`) siguen sin body.

## Permissions

Catálogo sembrado (`PermissionSeeder`): `usuarios.ver`, `usuarios.editar`, `usuarios.invitar`. Enforcement real vía `UserPolicy` (pertenencia de empresa **Y** `usuarios.editar`, cerrado 2026-08-04 — ver nota de dependencia arriba; antes solo pertenencia) e `InvitationPolicy` (`usuarios.invitar`, para `store()` únicamente — `show()`/`aceptar()` son públicas, la posesión del token es la prueba de identidad).

**Riesgo documentado, no corregido en esta auditoría** (invención de regla de negocio nueva, no una corrección de una ya decidida — fuera del mandato del rol Developer, `docs/13_ROLES/DEVELOPER.md`): a diferencia de `desactivar()` (que además exige no ser la última cuenta con `usuarios.editar` de la empresa, Decisión 3), `asignarRol()` no tiene guarda equivalente — un usuario con `usuarios.editar` podría reasignarse su propio rol a uno sin ese permiso, o quitárselo al último usuario que lo tiene, dejando a la empresa sin nadie que pueda gestionar cuentas por esta vía. Requiere decisión explícita del propietario del producto antes de implementarse.

## Loading States

Spinner mientras se resuelve la llamada real a la API (listado y ficha) — mismo patrón que el resto de los módulos ya construidos.

## Empty States

- Filtro/búsqueda sin resultados: mismo `EmptyState` reutilizable que el resto de los módulos.
- Empresa nueva con un solo usuario (el actual, sin nadie invitado todavía): la lista simplemente muestra ese único usuario — el botón "Nuevo Usuario" ya es un CTA real hacia el flujo de invitación.

## Error States

- 409 al intentar desactivarse a sí mismo, o al último usuario con `usuarios.editar` — mensaje claro vía `toast`, sin romper la pantalla.
- 404 si el usuario no existe o pertenece a otra empresa (`findOrFail` sobre una query ya acotada por `empresa_id` — nunca un 403 que confirme existencia cross-tenant).
- 422 al invitar un correo ya registrado, al asignar un rol que no pertenece a la propia empresa, o al abrir `/aceptar-invitacion` con un token inválido/expirado/ya aceptado — la página de aceptar resuelve el token ANTES de mostrar el formulario, para no hacer llenar datos a alguien cuyo enlace ya no sirve.

## Business Rules

- `User` **no** tiene `TenantScope` automático (a diferencia de Producto/Categoria/Movimiento/CapturaIA/AuditLog/Role) — aplicar automáticamente un scope global a un modelo usado también por el propio guard de autenticación es riesgo fuera de alcance de este módulo. El aislamiento se garantiza manualmente: toda query de este módulo filtra explícitamente por `empresa_id` (vía `TenantContext::empresaId()`), y `UserPolicy` es una segunda capa de defensa, no la única.
- `Invitation` **tampoco** tiene `TenantScope` — mismo motivo que `User`, agravado: la mitad pública del flujo (`show()`/`aceptar()`) no tiene sesión en absoluto, así que no hay `TenantContext` que leer. `InvitationService::aceptar()` fija `TenantContext`/el team id de Spatie explícitamente a partir del `empresa_id` ya persistido en la propia invitación (nunca de un input del visitante) justo antes de resolver el rol a asignar — sin esto, `Role::findOrFail()` queda fail-closed siempre por diseño de `TenantScope`, y la asignación de rol fallaría en el 100% de los casos reales (bug real encontrado y corregido antes de escribir tests, ver `docs/05_IMPLEMENTATION/UsersModule.md`).
- Un usuario nunca puede desactivar su propia cuenta (Decisión 2) — 409, sin excepción.
- Un usuario nunca puede desactivarse si es el último activo de su empresa con `usuarios.editar` (Decisión 3) — 409. Se evalúa con `hasPermissionTo('usuarios.editar')` sobre los demás usuarios activos de la misma empresa (contexto de Teams de Spatie ya fijado por `IdentifyTenant`).
- Desactivar revoca todas las `auth_sessions` activas del usuario afectado (`RefreshTokenService::revokeAllForUser()`).
- Un Platform Super Admin nunca aparece en ningún listado de este módulo (su `empresa_id` es siempre `null`, y la query siempre filtra por la empresa del usuario autenticado).
- Reactivar (`activar`) no tiene ninguna de las dos restricciones anteriores — solo requiere `usuarios.editar` y pertenencia a la misma empresa.
- **Aceptar una invitación verifica el correo automáticamente** (`email_verified_at` se fija al aceptar) — recibir y usar un enlace enviado únicamente a esa dirección ya es prueba de titularidad; sin esto, `AuthenticationService::login()` rechazaría al usuario recién creado con "Debes verificar tu correo".
- **Re-invitar el mismo correo reemplaza cualquier invitación pendiente anterior** en la misma empresa, en vez de acumular tokens válidos duplicados para la misma persona.
- **Asignar rol reemplaza, nunca acumula** (`syncRoles([$rol])`, no `assignRole()`) — este ERP modela un único rol por usuario en todas partes (`UserResource` expone `role` singular, no una lista).

## Acceptance Criteria

- [x] Listado muestra únicamente usuarios de la empresa del usuario autenticado.
- [x] Activar/desactivar requiere pertenencia a la misma empresa (`UserPolicy`); un usuario de otra empresa recibe 404, no 403.
- [x] Desactivar un usuario revoca sus `auth_sessions` activas.
- [x] Un Platform Super Admin nunca aparece en este listado.
- [x] Un usuario no puede desactivarse a sí mismo (409).
- [x] Un usuario no puede desactivar al último usuario con `usuarios.editar` de su empresa (409).
- [x] No existe ningún endpoint de eliminar (405/404).
- [x] Invitar un correo ya registrado falla con 422, sin crear una invitación duplicada.
- [x] Invitar con un rol de otra empresa falla con 422.
- [x] Aceptar una invitación crea un usuario con `email_verified_at` fijado, capaz de iniciar sesión de inmediato.
- [x] Aceptar una invitación expirada o ya aceptada falla con 422, sin crear ningún usuario.
- [x] Asignar un rol de otra empresa falla con 422; asignar un rol reemplaza el anterior, nunca lo agrega.

## Edge Cases

- Único usuario de una empresa (el fundador, recién creada la empresa): es simultáneamente "el único" y "el último con `usuarios.editar`" — ambas reglas (2 y 3) lo protegen igual, redundante pero correcto.
- Usuario invitado que nunca completó la invitación: la invitación queda `accepted_at = null` indefinidamente hasta expirar (7 días) — no bloquea nada, un admin puede simplemente volver a invitar el mismo correo (reemplaza la pendiente).
- Invitar dos veces el mismo correo antes de que acepte la primera: la segunda invitación reemplaza a la primera (mismo email+empresa, `accepted_at` nulo) — el primer enlace enviado deja de ser válido.

## Future Improvements

- Integración con Módulo 7 (Active Sessions): ver/revocar sesiones de otro usuario de la misma empresa desde su ficha de detalle.
- Integración con Módulo 8 (Security Logs): ver intentos de login de un usuario específico desde su ficha.
- Exportar listado de usuarios.
- Motor de reenvío de invitación (hoy, re-invitar el mismo correo ya reemplaza la pendiente y reenvía el correo — falta un botón dedicado "Reenviar" en vez de tener que repetir el flujo completo de invitar).
- Edición de nombre/correo por un administrador (hoy exclusivo del propio usuario en Perfil) y reset de contraseña disparado por un administrador — ambos evaluados y explícitamente diferidos en esta ampliación, no construidos.
- Reasignar la empresa de un usuario (Decisión 5) — permanece fuera de alcance a propósito.
- Reasignación de rol desde la ficha de usuario, una vez exista Módulo 5 (Roles).
