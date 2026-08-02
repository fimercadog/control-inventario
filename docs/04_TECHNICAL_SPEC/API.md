# 06 API

## Autenticación

POST /login

## Recursos

- Productos
- Inventario
- Compras
- Ventas
- Usuarios
- Captura IA

Para cada endpoint documentar:

- Método
- URL
- Request
- Response
- Errores

## Módulo Captura IA

Ver sección 74 de _ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md. Backend (Fase 3) completado e implementado en `backend/`; frontend pendiente.

- POST /api/v1/captura-ia/foto
- POST /api/v1/captura-ia/voz
- POST /api/v1/captura-ia/foto-voz
- GET /api/v1/captura-ia
- GET /api/v1/captura-ia/{uuid}
- PATCH /api/v1/captura-ia/{uuid}/detalle/{detalleId}
- POST /api/v1/captura-ia/{uuid}/confirmar
- POST /api/v1/captura-ia/{uuid}/descartar

`{uuid}` identifica la captura externamente (no el id numérico interno). Desde el **Módulo 1 (Authentication)** estos endpoints ya exigen `Authorization: Bearer <access_token>` — sin excepción, sin ventana de acceso anónimo. **Fase 4.6 (Authorization Completion, 2026-08-02, docs/security/ROLES_MATRIX.md)**: `CapturaIAPolicy` exige además el permiso correspondiente, separado por responsabilidad — `foto`/`voz`/`foto-voz`/`GET` (listar y ver) exigen `captura-ia.usar`; `PATCH .../detalle/{detalleId}` (corregir un detalle de baja confianza) exige `captura-ia.revisar`, ability propia (`review`) separada de `confirmar`/`descartar`, que exigen `captura-ia.confirmar`.

## Módulo Catálogos — Categorías, Marcas, Unidades de Medida (RC1 Fase 1, docs/05_IMPLEMENTATION/CatalogModules.md)

Mismo shape para los tres recursos, mismo patrón que `/proveedores` (route-model-binding + `TenantScope` automático + Policy como segunda capa). Borrado siempre lógico — `deshabilitar`/`habilitar`, nunca DELETE físico. **Fase 4.5 (2026-08-02, docs/security/ROLES_MATRIX.md)**: cada Policy ahora exige además el permiso correspondiente (`categorias.*`/`marcas.*`/`unidades-medida.*`) — pertenencia de empresa **Y** permiso, nunca uno solo.

- GET/POST `/api/v1/categorias`, GET/PATCH `/api/v1/categorias/{id}`, POST `/api/v1/categorias/{id}/deshabilitar`, POST `/api/v1/categorias/{id}/habilitar`, GET `/api/v1/categorias/{id}/productos` (Built 2026-07-30 — `CategoriaController`, ver `docs/05_IMPLEMENTATION/CategoriasModule.md`).
- GET/POST `/api/v1/marcas`, GET/PATCH `/api/v1/marcas/{id}`, POST `/api/v1/marcas/{id}/deshabilitar`, POST `/api/v1/marcas/{id}/habilitar`, GET `/api/v1/marcas/{id}/productos` (Built 2026-07-30 — `MarcaController`, ver `docs/05_IMPLEMENTATION/MarcasModule.md`).
- GET/POST `/api/v1/unidades-medida`, GET/PATCH `/api/v1/unidades-medida/{id}`, POST `/api/v1/unidades-medida/{id}/deshabilitar`, POST `/api/v1/unidades-medida/{id}/habilitar`, GET `/api/v1/unidades-medida/{id}/productos` (Built 2026-07-30 — `UnidadMedidaController`, ver `docs/05_IMPLEMENTATION/UnidadesMedidaModule.md`. Con esto se cierra la Fase 1 completa del roadmap RC1 — Categorías/Marcas/Unidades de Medida, los tres catálogos ya tienen controller/rutas/frontend/tests).

`POST/PATCH /api/v1/productos`: `marca`/`unidad_medida` (string libre) reemplazados por `marca_id`/`marca_nuevo` y `unidad_medida_id`/`unidad_medida_nuevo` (mismo patrón mutuamente excluyente ya usado para `proveedor_id`/`proveedor_nuevo`).

**Fase 4.6 (Authorization Completion, 2026-08-02, docs/security/ROLES_MATRIX.md)**: `ProductoPolicy` exige además el permiso correspondiente — `GET` (listar/ver, incluye `/movimientos`) exige `productos.ver`; `POST`/`PATCH`/`registrarIngreso`/`habilitar` exigen `productos.editar` (o `.crear` para el alta); `deshabilitar` exige `productos.gestionar` (renombrado desde `productos.eliminar` — nunca hay un DELETE físico).

## Módulo Proveedores (FEATURE-003, docs/03_FUNCTIONAL_SPEC/Suppliers.md) y Producto↔Proveedor (FEATURE-005)

Borrado siempre lógico — nunca DELETE físico. **Fase 4.5**: `ProveedorPolicy` exige `proveedores.*`; la asociación Producto↔Proveedor tiene su propio namespace `producto-proveedor.*` (distinto de `proveedores.*` — es la relación, no el proveedor en sí), verificado además de (no en lugar de) la pertenencia sobre el Producto padre.

- GET/POST `/api/v1/proveedores`, GET/PATCH `/api/v1/proveedores/{id}`, POST `/api/v1/proveedores/{id}/deshabilitar`, POST `/api/v1/proveedores/{id}/habilitar`, GET `/api/v1/proveedores/{id}/productos` — `ProveedorController`.
- GET/POST `/api/v1/productos/{producto}/proveedores`, PATCH `/api/v1/productos/{producto}/proveedores/{asociacion}`, POST `/api/v1/productos/{producto}/proveedores/{asociacion}/deshabilitar` — `ProductoProveedorController`. Sin `habilitar` — esa ruta nunca se construyó.

## Módulo Clientes (2026-08-02, docs/03_FUNCTIONAL_SPEC/Customers.md)

Borrado siempre lógico — nunca DELETE físico. Primer módulo construido como vertical slice completo (`ClienteRepository`+`ClienteService`+`ClienteDTO`+`ClientePolicy`, sin la etapa de "solo pertenencia" que tuvieron los módulos anteriores a Fase 4.5 — `ClientePolicy` ya nace exigiendo `clientes.*` desde el primer commit).

- GET/POST `/api/v1/clientes`, GET/PATCH `/api/v1/clientes/{id}`, POST `/api/v1/clientes/{id}/deshabilitar`, POST `/api/v1/clientes/{id}/habilitar` — `ClienteController`. Mismo shape que `/proveedores`, sin la pestaña "Productos" (Clientes no tiene una relación equivalente todavía).

## Módulo Stock (RC1 Fase 2, docs/03_FUNCTIONAL_SPEC/Stock.md)

Stock NO es una entidad independiente — opera directamente sobre `Producto` (route-model-binding sobre `{producto}`). **Fase 4.5**: gateado por `StockPolicy`, una Policy **dedicada** — no `ProductoPolicy`, a propósito: Laravel resuelve Policy por clase de modelo, y Stock comparte modelo (`Producto`) con `ProductoController`, así que reutilizar `ProductoPolicy` habría gateado ambos módulos con el mismo permiso. `StockController` invoca `StockPolicy` directamente (inyectada), no vía el helper `$this->authorize()`. Sin `POST /` a propósito: no existe "crear un Stock". Sin `stock.crear` en el catálogo de permisos por la misma razón.

- GET `/api/v1/stock` (con `busqueda`, `estado`, `bajo_minimo`), GET `/api/v1/stock/{id}`, PATCH `/api/v1/stock/{id}` (solo `stock_minimo`/`stock_maximo`), POST `/api/v1/stock/{id}/deshabilitar`, POST `/api/v1/stock/{id}/habilitar` (Built 2026-07-30 — `StockController`, ver `docs/05_IMPLEMENTATION/StockModule.md`). `deshabilitar`/`habilitar` tocan únicamente `productos.stock_estado` — nunca `stock_actual` ni `productos.estado` (catálogo).

## Módulo Movimientos (RC1 Fase 3, docs/03_FUNCTIONAL_SPEC/Movements.md)

Ledger append-only — sin `PUT`/`DELETE`/`deshabilitar`/`habilitar` a propósito. Distinto de `GET /productos/{producto}/movimientos` (historial acotado a un solo producto, sin cambios). **Fase 4.6**: `MovimientoPolicy` exige `movimientos.ver` para `GET` y `movimientos.crear` para `POST`. `PATCH` (metadata) **deliberadamente sin permiso propio** — no existe `movimientos.editar` en el catálogo; cualquier usuario autenticado de la empresa puede corregir `documento`/`observacion`/`lote`/`vencimiento` (decisión de negocio: los permisos solo controlan quién crea o ve movimientos, nunca quién edita metadata).

- GET `/api/v1/movimientos` (con `producto_id`, `tipo`, `busqueda`, `desde`, `hasta`, `page`; `paginate(100)`), GET `/api/v1/movimientos/{id}`, POST `/api/v1/movimientos` (Entrada/Salida/Ajuste, vía `InventoryService::registrarMovimiento()`), PATCH `/api/v1/movimientos/{id}` (Built 2026-08-02 — `MovimientoController`, ver `docs/05_IMPLEMENTATION/MovimientosModule.md`). `PATCH` solo acepta `documento`/`observacion`/`lote`/`vencimiento` — `UpdateMovimientoRequest` no declara `cantidad`/`tipo`/`producto_id`/`proveedor_id`/`stock_anterior`/`stock_nuevo`, así que un payload que los incluya los ignora siempre.

## Módulo Usuarios (RC1 Fase 4, docs/03_FUNCTIONAL_SPEC/Users.md)

Listar/Ver/Activar/Desactivar únicamente — sin `POST /` (creación es Módulo 6, Invitaciones, sin construir) y sin ningún endpoint de eliminar. `{id}` en vez de route-model-binding implícito: `User` no tiene `TenantScope` automático, así que cada acción resuelve el usuario ya acotado por `empresa_id` a mano (404, no 403, para un id de otra empresa).

- GET `/api/v1/usuarios` (con `busqueda`, `estado`, `rol`, `page`; `paginate(100)`), GET `/api/v1/usuarios/{id}`, POST `/api/v1/usuarios/{id}/activar`, POST `/api/v1/usuarios/{id}/desactivar` (Built 2026-08-02 — `UserController`, ver `docs/05_IMPLEMENTATION/UsersModule.md`). `desactivar` responde 409 si el objetivo es la propia cuenta del actor, o si es el último usuario activo de la empresa con el permiso `usuarios.editar`; en ambos casos ningún cambio se aplica. Un `desactivar` exitoso revoca todas las `auth_sessions` activas del usuario afectado.

## Módulo Auth & RBAC (Fase 5)

Todos bajo `/api/v1/`. Todo endpoint (excepto login, refresh, y los de invitación/reset/verificación con token firmado) exige `Authorization: Bearer <access_token>`; toda acción de negocio valida un permiso específico, nunca un nombre de rol. Entre paréntesis, el módulo donde se construye.

### Sesión (Módulo 1 — Authentication)

- POST `/auth/login` — `{email, password, remember_me?}` → access token (body) + refresh token (cookie httpOnly). Registra intento en `security_logs` sea éxito o fallo. Actualiza `last_login_ip`, `last_user_agent`, `last_activity_at`.
- POST `/auth/logout` — revoca la sesión actual y hace blacklist del JWT.
- POST `/auth/refresh` — sin body (cookie httpOnly); rota el refresh token, emite nuevo access token; actualiza `last_activity_at`.
- GET `/auth/me` — usuario actual + permisos efectivos (para hidratar `PermissionContext`).
- POST `/auth/password/olvide` — `{email}` → siempre responde genérico (sin enumeración de usuarios).
- POST `/auth/password/restablecer` — `{token, email, password}` → revoca todas las `auth_sessions` del usuario.

### Usuarios (Módulo 4 — User Management)

Ver "Módulo Usuarios" arriba — construido, endpoints reales confirmados contra `routes/api.php`. Esta subsección solía duplicar (y contradecir en el verbo HTTP) esa sección; retirada en Fase 4.5 para no mantener dos fuentes de verdad sobre el mismo módulo ya construido.

### Roles y permisos (Módulo 5 — Role Management, Built 2026-08-02 — `RoleController`, `PermissionController`, ver `docs/05_IMPLEMENTATION/RolesModule.md`)

- GET `/roles` (Listar, paginado/buscable/filtrable por estado) / GET `/roles/{id}` (Ver) / POST `/roles` (Crear) / PATCH `/roles/{id}` (Editar) / POST `/roles/{id}/activar` / POST `/roles/{id}/desactivar` — requiere `roles.gestionar` (o `roles.ver` para las de solo lectura); siempre acotado a la empresa del usuario (Teams de Spatie). **Sin `DELETE`, a propósito** — Roles nunca se elimina, solo se activa/desactiva, mismo patrón que el resto del ERP (corregido en Fase 4.5; este documento antes listaba un `DELETE /roles/{id}` que contradecía esa decisión).
- GET `/roles/{id}/usuarios` — requiere `roles.ver`; lista los usuarios de la empresa que tienen ese rol asignado (id/name/email/is_active). No estaba en el diseño original de este documento — se agregó durante la construcción para que el bloqueo de desactivación (línea siguiente) sea accionable desde la UI.
- Un rol con usuarios asignados no puede desactivarse hasta reasignarlos (409, `RoleHasAssignedUsersException`).
- `name` único por `(empresa_id, guard_name)` — validado en `StoreRoleRequest`/`UpdateRoleRequest` (422 con mensaje limpio); descubierto durante la construcción que sin esta regla, Spatie lanza `RoleAlreadyExists` sin capturar en un duplicado.
- `permisos.*` rechaza namespace `plataforma.*` (422) y cualquier nombre fuera del catálogo (422).
- GET `/permisos` — catálogo global de solo lectura (excluye `plataforma.*`), requiere `roles.ver`, para la UI de asignación de permisos a un rol.

### Invitaciones (Módulo 6)

- POST `/usuarios/invitar` — requiere `usuarios.invitar`. `{email, role_id}` (el rol ya debe existir — depende de Módulo 5).
- GET `/invitaciones/{token}` — valida el token firmado, devuelve email/empresa para el formulario de aceptación.
- POST `/invitaciones/{token}/aceptar` — `{name, password}` → crea el usuario, marca la invitación aceptada, dispara verificación de email.
- GET `/auth/email/verificar/{id}/{hash}` — URL firmada, marca `email_verified_at`.
- POST `/auth/email/reenviar` — reenvía el correo de verificación.

### Sesiones activas (Módulo 7)

- GET `/auth/sesiones` — sesiones no revocadas del usuario actual (o de otro usuario de la misma empresa con `usuarios.editar`).
- DELETE `/auth/sesiones/{id}` — revoca esa sesión puntual (cierra esa sesión de forma remota).

### Seguridad y auditoría (Módulo 8)

- GET `/auditoria` — requiere `auditoria.ver`; lista `audit_logs` de la empresa.
- GET `/seguridad/intentos-login` — requiere `auditoria.ver`; lista `security_logs` de la empresa.

### Perfil (Módulo 9)

- GET `/perfil` / PATCH `/perfil` — `{name, theme, language, timezone}`.
- POST `/perfil/avatar` — sube y reemplaza el avatar.

### Plataforma (Platform Super Admin, sin empresa_id)

- GET `/plataforma/empresas` — requiere `plataforma.empresas.ver`. Única superficie que cruza el límite de tenant, y solo para `is_platform_admin = true`.
- GET `/plataforma/empresas/{id}/usuarios` — requiere `plataforma.usuarios.ver`.
