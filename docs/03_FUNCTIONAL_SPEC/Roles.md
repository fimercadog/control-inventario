# Roles y Permisos (RBAC)

**Status: Built (Módulo 5 — Role Management completo, 2026-08-02) — solo Módulo 3 (Authorization middleware por ruta) sigue pendiente**

> Verificado contra `backend/app/Models/Role.php`, `backend/config/permission.php`, `backend/database/seeders/PermissionSeeder.php`, `backend/app/Repositories/RoleRepository.php`, `backend/app/Services/RoleService.php`, `backend/app/Policies/RolePolicy.php`, `backend/app/Http/Controllers/Api/RoleController.php`, `backend/app/Http/Controllers/Api/PermissionController.php`, `backend/routes/api.php`, `backend/tests/Feature/RoleControllerTest.php`, `frontend/app/(app)/roles/`. Corresponde a los Módulos 0, 1, 2, 4, 5 (Fundamentos, Authentication, Company Isolation, User Management, Role Management) del roadmap Auth & RBAC — todos completos. Toda ruta de negocio de todo módulo existente valida un permiso específico desde Fase 4.5/4.6 (docs/security/ROLES_MATRIX.md) — la afirmación anterior de este documento ("ningún endpoint valida un permiso") quedó obsoleta antes incluso de este módulo. Lo único que **no** está construido es el middleware genérico de permisos por ruta y el `PermissionContext`/sidebar dinámico (Módulo 3) — hoy cada Policy verifica el permiso explícitamente, sin ese middleware, exactamente como el resto del ERP.

## Purpose

Permitir que cada empresa administre sus propios roles (ej. "Bodeguero", "Supervisor"), construidos a partir de un catálogo global y fijo de permisos que el cliente no puede editar — y que toda decisión de autorización en el sistema se base en el permiso concreto que una acción requiere, nunca en el nombre de un rol.

## Business Flow

1. El catálogo de permisos es global y fijo: se siembra vía `PermissionSeeder` (`productos.*`, `movimientos.*`, `captura-ia.*`, `usuarios.*`, `roles.*`, `auditoria.ver`, `plataforma.*`) y solo crece cuando se construye una feature nueva — nunca lo edita un cliente.
2. Cada empresa gestiona sus propios roles (`roles.empresa_id` como `team_foreign_key` de Spatie) — un rol nunca es visible ni aplicable fuera de su empresa.
3. Un usuario recibe uno o más roles (`model_has_roles`, con el `empresa_id` fijado por `TenantScope`); cada rol trae consigo un subconjunto de permisos del catálogo global (`role_has_permissions`).
4. En cada request autenticada, `GET /auth/me` devuelve `permissions: string[]` — los permisos efectivos del usuario, ya resueltos, consumidos hoy por `puedeVerModulo()` en `app-sidebar.tsx` para decidir qué mostrar.
5. **Desde Fase 4.5/4.6**: todo endpoint de negocio de todo módulo (Productos, Movimientos, Captura IA, Categorías, Marcas, Unidades de Medida, Stock, Proveedores, Producto↔Proveedor, Clientes) valida el permiso específico que su acción requiere, vía su Policy — `$user->can('recurso.accion')` AND-eado con pertenencia de empresa. Ver `docs/security/ROLES_MATRIX.md`.
6. **Desde 2026-08-02 (este módulo)**: un usuario con `roles.gestionar` administra los roles de su empresa — crearlos, renombrarlos, asignarles/quitarles permisos del catálogo global, activarlos/desactivarlos. `roles.ver` solo permite lectura.

## Actors

- **Usuario de empresa**: tiene uno o más roles de su empresa, cada uno con un subconjunto del catálogo de permisos.
- **Platform Super Admin** (`is_platform_admin = true`, sin `empresa_id`): nunca tiene un rol de empresa; sus permisos son del namespace reservado `plataforma.*`, y **nunca** se le otorgan vía un `Gate::before()` que apruebe todo — cada acción suya también pasa por el mismo chequeo de permiso que cualquier otro usuario.

## Screens

- **`/roles`** (`frontend/app/(app)/roles/page.tsx`): lista de roles de la empresa — búsqueda por nombre, filtro por estado, columnas Rol/Permisos/Usuarios/Estado, paginación real, acciones Editar/Desactivar-Activar. Botón "Nuevo Rol" abre `new-role-dialog.tsx`.
- **`/roles/{id}`** (`frontend/app/(app)/roles/[id]/page.tsx` → `role-detail-screen.tsx`): dos tabs — "Detalle" (ver/editar nombre y permisos vía `PermissionPicker`, chips de permisos cuando no está en edición) y "Usuarios" (lista de solo lectura de los usuarios asignados a ese rol, con email y estado activo/inactivo — existe explícitamente para que el mensaje 409 de "rol con usuarios asignados" sea accionable: el operador puede ver a quién tiene que reasignar).
- **`permission-picker.tsx`** (componente reutilizable, no una pantalla): agrupa el catálogo plano de permisos por prefijo de recurso en grupos colapsables con checkbox de "seleccionar todo el grupo" (estado indeterminado cuando hay selección parcial). Reutilizable por cualquier futura UI de asignación de permisos.

## Fields

Modelo de datos ya construido:

| Tabla | Campos clave | Notas |
|---|---|---|
| `permissions` (Spatie) | `name` (`recurso.accion`), `guard_name` | catálogo global, `guard_name = 'api'` |
| `roles` (Spatie + `App\Models\Role`) | `name`, `guard_name`, `empresa_id` | único por `(empresa_id, name, guard_name)` |
| `model_has_roles` | `role_id`, `model_id`, `model_type`, `empresa_id` (team) | FK a `empresa_id` agregada explícitamente (migración `2026_07_28_190001`) |
| `model_has_permissions` | ídem | permisos directos a un usuario, sin pasar por un rol (soportado por Spatie) — **no usado en este diseño**: `RoleRepository`/`RoleService` solo llaman `syncPermissions()` sobre `Role`, nunca `givePermissionTo()` sobre `User`; no existe endpoint para asignar un permiso directo a un usuario. Confirmado por grep, no solo por convención — "los roles son el único empaquetado de permisos" es una regla real, no solo documentada |
| `role_has_permissions` | `permission_id`, `role_id` | conecta un rol de una empresa con permisos del catálogo global |

## Validation Rules

- Un rol es único por `(empresa_id, name, guard_name)` — dos empresas pueden tener ambas un rol llamado "Supervisor" sin colisión.
- Un usuario normal (`empresa_id` no nulo) nunca puede tener `is_platform_admin = true` — validado a nivel de aplicación (`UserPolicy`/`RoleService` según el diseño; no una constraint de base de datos).
- Los permisos `plataforma.*` nunca son asignables a un rol de empresa — son namespace reservado, exclusivo de usuarios `is_platform_admin = true`.

## Permissions

Catálogo completo ya sembrado (`PermissionSeeder`, 45 permisos): `productos.ver/crear/editar/gestionar`, `categorias.ver/crear/editar/gestionar`, `marcas.ver/crear/editar/gestionar`, `unidades-medida.ver/crear/editar/gestionar`, `stock.ver/editar/gestionar`, `proveedores.ver/crear/editar/gestionar`, `clientes.ver/crear/editar/gestionar`, `producto-proveedor.ver/crear/editar/gestionar`, `movimientos.ver/crear`, `captura-ia.usar/revisar/confirmar/gestionar`, `usuarios.ver/editar/invitar`, `roles.ver/gestionar`, `auditoria.ver`, `plataforma.empresas.ver`, `plataforma.usuarios.ver`. Este mismo documento es, en cierto sentido, autorreferencial: `roles.ver`/`roles.gestionar` son los permisos que gatean la pantalla de gestión de roles (`/roles`), ya construida.

## Loading States

- Lista (`/roles`): mientras `loading` (Redux) es `true`, la fila de conteo muestra "Cargando..." y la tabla muestra una fila "Cargando roles...".
- Detalle (`/roles/{id}`): "Cargando rol..." mientras se resuelve el fetch inicial.
- Diálogo de creación/edición: `PermissionPicker` muestra su propio estado de carga (`catalogoLoading`) mientras trae el catálogo de permisos, independiente de la carga de la lista.

## Empty States

- Lista sin resultados (búsqueda/filtro sin coincidencias): `EmptyState` con ícono `SearchX`, título "No encontramos roles", descripción "Prueba con otro nombre, o crea el primero."

## Error States

- **Backend**: cualquier intento de bypass de `TenantScope` (ej. `withoutGlobalScope`) queda cubierto por la segunda capa de defensa — verificación explícita en cada Policy (`$model->empresa_id === $user->empresa_id`).
- **Frontend, genérico**: toda mutación fallida (crear, actualizar, cambiar estado) muestra `toast.error(...)` con el mensaje real del backend cuando es un string (422/409), o un fallback genérico ("No pudimos guardar los cambios.", "No pudimos actualizar el estado.") cuando no lo es.
- **409 — rol con usuarios asignados**: al intentar desactivar, el toast muestra el mensaje real de `RoleHasAssignedUsersException` ("Este rol tiene usuarios asignados. Reasígnalos a otro rol antes de desactivarlo."), y el tab "Usuarios" del detalle deja ver exactamente a quién hay que reasignar — verificado en navegador, no solo por test.
- **422 — nombre duplicado / permiso inválido**: `StoreRoleRequest`/`UpdateRoleRequest` devuelven un error de validación limpio (nunca la excepción cruda de Spatie `RoleAlreadyExists`) — ver bug corregido en el informe de implementación.

## Business Rules

- **Regla dura**: todo Policy/Middleware/Controller verifica **permisos** (`$user->can('productos.editar')`), nunca `hasRole(...)`. Los roles son solo un empaquetado administrativo para la UI de gestión; el motor de autorización real no sabe que existen roles como concepto de negocio.
- **Defensa en profundidad, dos capas**: (1) `TenantScope` automático sobre todo modelo `empresa_id`-scoped, incluido `Role`; (2) verificación explícita en cada Policy, por si un scope se bypasea intencionalmente en el futuro.
- Los permisos son fijos (solo se agregan vía seeder al construir features nuevas); los roles son 100% gestionables por cada empresa — nunca al revés.
- `Role` (subclase de `Spatie\Permission\Models\Role`) existe únicamente para heredar `TenantScope`: el scoping por equipo de Spatie (`setPermissionsTeamId`) protege su propia lógica interna (`hasRole()`, `can()`), pero **no** protege consultas Eloquent directas como `Role::all()` — sin esta subclase, esas consultas quedarían sin aislar por empresa.

## Acceptance Criteria

- [x] Un rol creado en la Empresa A nunca es visible ni aplicable a un usuario de la Empresa B (probado: 25 tests adversariales de Company Isolation).
- [x] `GET /auth/me` devuelve los permisos efectivos del usuario ya resueltos.
- [x] Un usuario normal nunca puede auto-asignarse `is_platform_admin = true`.
- [x] Todo endpoint de negocio de todo módulo existente rechaza con 403 a un usuario autenticado sin el permiso específico requerido, vía Policy (Fase 4.5/4.6) — cubre el caso concreto de Captura IA.
- [x] Un usuario con `roles.gestionar` puede crear un rol, asignarle permisos del catálogo (`POST /v1/roles`), editarlo (`PATCH /v1/roles/{id}`), y ver los usuarios que lo tienen asignado (`GET /v1/roles/{id}/usuarios`) — no existe una acción de "asignar rol a usuario" en este módulo: eso ya lo cubre `UserController` (Módulo 4).
- [x] Un rol no puede desactivarse mientras tenga usuarios asignados (409 + mensaje accionable) — probado en backend (`RoleControllerTest`) y verificado en navegador.
- [ ] **Pendiente (Módulo 3)**: middleware genérico `EnsurePermission` aplicado uniformemente por ruta (hoy cada Policy lo hace explícitamente, sin ese middleware — funciona igual pero sin la capa centralizada).
- [ ] **Pendiente (Módulo 3, frontend)**: `PermissionContext` + hook `usePermission(perm)` genérico; hoy el sidebar ya oculta ítems sin permiso vía `puedeVerModulo()`, pero sin ese hook reutilizable para el resto de la UI.

## Edge Cases

- Usuario con múltiples roles cuyos permisos se solapan — el modelo de Spatie resuelve esto de forma nativa (unión de permisos de todos los roles); sin un caso de prueba específico documentado todavía en este repo.
- Rol sin ningún permiso asignado — válido a nivel de esquema y de UI: `PermissionPicker` permite guardar sin ninguna casilla marcada, sin error; el rol queda creado con 0 permisos efectivos.
- Platform Super Admin intentando una acción `productos.*` (no tiene empresa) — rechazado, porque no tiene ese permiso namespaced a ninguna empresa; su alcance real son exclusivamente los permisos `plataforma.*`.

## Future Improvements

- **Módulo 3 (Authorization/RBAC), único pendiente real**: middleware genérico `EnsurePermission` centralizado por ruta (hoy cada Policy repite la verificación explícitamente — funciona, pero sin ese punto único), y `PermissionContext` + hook `usePermission(perm)` reutilizable en el frontend (hoy `puedeVerModulo()` en `app-sidebar.tsx` cubre solo la navegación, no componentes internos como botones de acción).
- ~~Módulo 5 (Role Management)~~ — completo desde 2026-08-02: `GET/POST/PATCH /roles`, `POST /roles/{id}/activar|desactivar`, `GET /roles/{id}/usuarios`, `GET /permisos`, y la pantalla `/roles` + `/roles/{id}` completas.
- `model_has_permissions` queda explícitamente sin usar por diseño (ver tabla de Fields) — no es un futuro a resolver, es una decisión ya tomada: todo permiso llega a un usuario a través de un rol.
