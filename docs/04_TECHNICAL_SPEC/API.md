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

`{uuid}` identifica la captura externamente (no el id numérico interno). Desde el **Módulo 1 (Authentication)** estos endpoints ya exigen `Authorization: Bearer <access_token>` — sin excepción, sin ventana de acceso anónimo. El permiso específico (`captura-ia.usar`, `captura-ia.revisar`, `captura-ia.confirmar`) se agrega en el **Módulo 3 (Authorization/RBAC)**.

## Módulo Catálogos — Categorías, Marcas, Unidades de Medida (RC1 Fase 1, docs/05_IMPLEMENTATION/CatalogModules.md)

Mismo shape para los tres recursos, mismo patrón que `/proveedores` (route-model-binding + `TenantScope` automático + Policy como segunda capa). Borrado siempre lógico — `deshabilitar`/`habilitar`, nunca DELETE físico.

- GET/POST `/api/v1/categorias`, GET/PATCH `/api/v1/categorias/{id}`, POST `/api/v1/categorias/{id}/deshabilitar`, POST `/api/v1/categorias/{id}/habilitar`, GET `/api/v1/categorias/{id}/productos` (Built 2026-07-30 — `CategoriaController`, ver `docs/05_IMPLEMENTATION/CategoriasModule.md`).
- GET/POST `/api/v1/marcas`, GET/PATCH `/api/v1/marcas/{id}`, POST `/api/v1/marcas/{id}/deshabilitar`, POST `/api/v1/marcas/{id}/habilitar`, GET `/api/v1/marcas/{id}/productos` (Built 2026-07-30 — `MarcaController`, ver `docs/05_IMPLEMENTATION/MarcasModule.md`).
- GET/POST `/api/v1/unidades-medida`, GET/PATCH `/api/v1/unidades-medida/{id}`, POST `/api/v1/unidades-medida/{id}/deshabilitar`, POST `/api/v1/unidades-medida/{id}/habilitar`, GET `/api/v1/unidades-medida/{id}/productos` (Built 2026-07-30 — `UnidadMedidaController`, ver `docs/05_IMPLEMENTATION/UnidadesMedidaModule.md`. Con esto se cierra la Fase 1 completa del roadmap RC1 — Categorías/Marcas/Unidades de Medida, los tres catálogos ya tienen controller/rutas/frontend/tests).

`POST/PATCH /api/v1/productos`: `marca`/`unidad_medida` (string libre) reemplazados por `marca_id`/`marca_nuevo` y `unidad_medida_id`/`unidad_medida_nuevo` (mismo patrón mutuamente excluyente ya usado para `proveedor_id`/`proveedor_nuevo`).

## Módulo Stock (RC1 Fase 2, docs/03_FUNCTIONAL_SPEC/Stock.md)

Stock NO es una entidad independiente — opera directamente sobre `Producto` (route-model-binding sobre `{producto}`, mismo `ProductoPolicy` que ya protegía el modelo). Sin `POST /` a propósito: no existe "crear un Stock".

- GET `/api/v1/stock` (con `busqueda`, `estado`, `bajo_minimo`), GET `/api/v1/stock/{id}`, PATCH `/api/v1/stock/{id}` (solo `stock_minimo`/`stock_maximo`), POST `/api/v1/stock/{id}/deshabilitar`, POST `/api/v1/stock/{id}/habilitar` (Built 2026-07-30 — `StockController`, ver `docs/05_IMPLEMENTATION/StockModule.md`). `deshabilitar`/`habilitar` tocan únicamente `productos.stock_estado` — nunca `stock_actual` ni `productos.estado` (catálogo).

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

- GET `/usuarios` — lista usuarios de la empresa actual, requiere `usuarios.ver`.
- GET `/usuarios/{id}` — requiere `usuarios.ver`.
- PATCH `/usuarios/{id}` — requiere `usuarios.editar`.
- PATCH `/usuarios/{id}/desactivar` / `/activar` — requiere `usuarios.editar`.

### Roles y permisos (Módulo 5 — Role Management)

- GET `/roles` / POST `/roles` / PATCH `/roles/{id}` / DELETE `/roles/{id}` — requiere `roles.gestionar`; siempre acotado a la empresa del usuario (Teams de Spatie).
- GET `/permisos` — catálogo global de solo lectura (para la UI de asignación de permisos a un rol).

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
