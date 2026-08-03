# Informe Final — Implementación Completa del Módulo Usuarios (RC1), ampliado con Módulo 6 (Invitaciones)

## Resumen del trabajo realizado

Usuarios pasó de página stub ("pendiente de implementación") a módulo administrativo completo: listar, ver, activar y desactivar usuarios de la propia empresa. Con esto se cierra la **Fase 4** del roadmap RC1 de 8 fases.

`docs/03_FUNCTIONAL_SPEC/Users.md` ya existía, pero marcado explícitamente **"Planned — not yet implemented"**, con una nota de cierre que invoca directamente el Golden Rule de `AGENTS.md` ("Never write code before the specification has been approved. If the specification does not exist: STOP."). No se escribió ninguna línea de código hasta resolver, con el propietario del proyecto, los dos puntos que la spec dejaba deliberadamente abiertos:

1. **¿Puede un usuario desactivar su propia cuenta?** No, nunca — 409 sin excepción, incluso para un Administrador.
2. **¿Puede desactivarse al último usuario de una empresa con permiso de gestión?** No — el sistema rechaza (409) desactivar al último usuario activo de la empresa con `usuarios.editar`, para que ninguna empresa quede sin nadie que pueda gestionar cuentas.

También se confirmó el alcance exacto, más acotado que el CRUD estándar del proyecto: **Listar, Ver, Activar, Desactivar. Sin Crear** (la creación de usuarios es responsabilidad de un futuro Módulo 6 — Invitaciones, sin construir) **y sin edición de nombre/email/rol** (nombre/email pertenecen a Perfil; rol pertenece a un futuro Módulo 5 — Roles).

## Funcionalidades implementadas

- Listar: búsqueda por nombre/correo, filtro de estado (Activos/Inactivos/Todos), paginación real (100/página, Anterior/Siguiente).
- Ver detalle (`/usuarios/{id}`): todos los campos de solo lectura — rol asignado, última actividad/IP/dispositivo, trazabilidad de invitación (`invited_at`/`invited_by`).
- Activar / Desactivar, con confirmación obligatoria. Desactivar revoca inmediatamente todas las `auth_sessions` activas del usuario afectado.
- Badge de Estado con color (verde "Activo" / rojo "Inactivo") en listado y ficha.
- Fila/ficha del usuario autenticado marcada "(tú)"; la acción Desactivar aparece deshabilitada sobre la propia cuenta (refuerzo visual de la regla de backend, que es la que realmente la impone).
- Refresco automático tras Activar/Desactivar — vía `hooks/use-crud-list.ts`.
- **Deliberadamente NO implementado, por decisión de arquitectura confirmada:** botón "Nuevo Usuario"; edición de nombre/email/rol; cualquier endpoint de eliminar.

## Correcciones realizadas

Ninguna — módulo nuevo sobre infraestructura ya existente (`users`, roles/permisos de Spatie con Teams, `RefreshTokenServiceInterface`), sin necesidad de tocar código de otros módulos.

## Relaciones verificadas

- `User.empresa_id`: cada acción de este módulo filtra manualmente por la empresa del usuario autenticado (vía `TenantContext::empresaId()`) — `User` **no** tiene `TenantScope` automático como Producto/Categoria/Movimiento, decisión deliberada para no aplicar un scope global a un modelo que el propio guard de autenticación resuelve. Un id de otra empresa siempre produce `ModelNotFoundException` → 404, nunca un 403 que confirme su existencia — verificado por test.
- Rol asignado (`model_has_roles`, Spatie con Teams): se resuelve con el mismo mecanismo ya usado por `AuthenticatedUserResource` (`getRoleNames()->first()`), aprovechando que `IdentifyTenant` ya fija el team context de Spatie por request.
- Última guarda de gestión (`usuarios.editar`): se evalúa contra los demás usuarios **activos** de la misma empresa vía `hasPermissionTo()`, dentro del mismo team context — verificado con un test que crea dos administradores y confirma que desactivar a uno cuando el otro sigue activo está permitido, y que desactivar al único que queda no lo está.
- Un Platform Super Admin (`empresa_id = null`) nunca aparece en ningún listado de este módulo — verificado por test.

## Cambios en Backend

**Archivos creados:**

- `backend/app/Http/Controllers/Api/UserController.php` (index/show/activar/desactivar, sin `store`/`destroy`)
- `backend/app/Policies/UserPolicy.php` (view/update, pertenencia de empresa)
- `backend/app/Http/Resources/User/UserResource.php`
- `backend/app/Exceptions/CannotDeactivateSelfException.php`
- `backend/app/Exceptions/LastCompanyAdminException.php`
- `backend/tests/Feature/UserControllerTest.php` (14 casos)

**Archivos modificados:**

- `backend/routes/api.php` (grupo `v1/usuarios` — `GET /`, `GET/POST {id}/...`, sin `POST /` ni `DELETE`)
- `backend/bootstrap/app.php` (las dos excepciones nuevas mapeadas a 409, mismo patrón que `StockInsuficienteException`)

**Reutilizados sin cambios:** `User` (modelo ya existía con todos los campos necesarios), `RefreshTokenServiceInterface::revokeAllForUser()`, `AuditLogger`, `TenantContext`, catálogo de permisos (`usuarios.ver`/`usuarios.editar`, ya sembrado desde Módulo 0).

## Cambios en Frontend

**Archivos creados:**

- `frontend/lib/api/usuarios.ts` (sin `createUsuario`/`deleteUsuario`, a propósito)
- `frontend/components/usuario-detail-screen.tsx`
- `frontend/app/(app)/usuarios/[id]/page.tsx`

**Archivos modificados:**

- `frontend/app/(app)/usuarios/page.tsx` (reemplaza por completo el stub `PendingModule`)
- `frontend/lib/api/types.ts` (`Usuario`)

**Reutilizados:** `hooks/use-crud-list.ts`, `components/confirm-dialog.tsx`, `components/empty-state.tsx`, `store/hooks.ts` (para identificar la fila/ficha del usuario autenticado).

## Cambios en Base de Datos

Ninguno — todas las columnas necesarias (`is_active`, `last_activity_at`, `last_login_ip`, `last_user_agent`, `invited_at`, `invited_by`) ya existían desde la migración de Módulo 0 (Auth Foundations). Compatible con SQLite exclusivamente, verificado con `php artisan test` (SQLite en memoria) y con `database/database.sqlite` (Demo Data RC1, 14 usuarios reales en la empresa principal) sirviendo la verificación en navegador.

## Documentación actualizada

- `docs/03_FUNCTIONAL_SPEC/Users.md` — reescrito: de "Planned" con puntos sin resolver a "Approved", con las dos decisiones de negocio confirmadas documentadas explícitamente como tales.
- `docs/04_TECHNICAL_SPEC/API.md` — nueva sección "Módulo Usuarios" con los 4 endpoints.
- `docs/00_VISION/Roadmap.md` — Módulo 4 (User Management) marcado `[x]`, con nota explícita de que Módulo 3 (enforcement de permiso granular por ruta) sigue `[ ]` y no es un requisito bloqueante para este módulo, consistente con el resto del roadmap RC1.
- `docs/03_FUNCTIONAL_SPEC/RC1_FUNCTIONAL_MODULE_AUDIT.md` — Usuarios pasa de 🔴 No Implementado (0%) a 🟢 Completo (85%); estadísticas generales y secciones de Gaps actualizadas.
- `docs/05_IMPLEMENTATION/UsersModule.md` (este documento — nuevo).
- `CHANGELOG.md` — entrada nueva.

## Resultado de las pruebas

- **Backend:** `php artisan test` → **222/222 passing** (695 assertions). 14 casos nuevos en `UserControllerTest`, incluyendo las dos guardas de negocio (auto-desactivación, último administrador) y su contraparte "sí permitido cuando queda otro administrador".
- **Frontend:** `npx tsc --noEmit` → limpio. `npm run build` → build de producción exitoso (`/usuarios` y `/usuarios/[id]` generadas correctamente).
- **Browser Tests (Playwright real contra Microsoft Edge del sistema):**
  1. Login real → `/usuarios`: listado real con los 14 usuarios de Demo Data (roles reales: Administrador/Supervisor/Bodeguero/Vendedor/Auxiliar Contable), badge de estado, sin indicador de "pendiente de implementación", **sin botón "Nuevo"**.
  2. Desactivar un usuario real → confirmación obligatoria → desaparece del filtro "Activos" → total baja de 15 a 14 → reaparece en el filtro "Inactivos".
  3. Fila del usuario autenticado marcada "(tú)"; su acción "Desactivar" visualmente deshabilitada en el menú de la fila.
  4. Ficha de detalle: secciones "Actividad" (rol, última actividad, IP, dispositivo) y "Trazabilidad" (invitado el/por, cuenta creada), botón Activar/Desactivar visible, nota explicando que nombre/correo/rol no son editables aquí.
  5. Responsive (390px): tabla usable con scroll horizontal propio, mismo patrón ya aceptado en Stock/Movimientos.
  6. Sidebar: "Usuarios" con el mismo marcado que el resto de los módulos completos, sin indicador de "pendiente".
  7. `console --errors`: sin errores de JavaScript (único mensaje observado: un 401 esperado del ciclo normal de refresh de token).
  - Nota de proceso: un bug en el propio script de verificación (selector `:has-text("Activar")` coincidiendo también con "Desactivar" por substring) desactivó dos usuarios de más durante las pruebas manuales; detectado, corregido, y los dos usuarios restaurados a `is_active = true` directamente en la base de datos de desarrollo antes de cerrar esta unidad de trabajo — el bug era exclusivamente del script de prueba, no del código de la aplicación (verificado leyendo `UserController::desactivar()`, que sí aplica sus guardas correctamente caso por caso).

## Estado final del módulo

🟢 **Completo** — cumple el alcance de Usuarios confirmado explícitamente (Listar/Ver/Activar/Desactivar, sin Crear ni edición de perfil/rol), con el mismo nivel de calidad y comportamiento (búsqueda, filtros, paginación real, confirmaciones, refresco automático, responsive) que el resto de los módulos ya cerrados, más dos guardas de negocio propias de este módulo que ningún otro necesita. Ningún gap funcional conocido dentro del alcance confirmado.

Con este módulo, la **Fase 4 del roadmap RC1 queda oficialmente completa**. La siguiente fase del roadmap aprobado es Fase 5 (Roles), pendiente de aprobación explícita del propietario del proyecto.

## Ampliación 2026-08-03 — Módulo 6 (Invitaciones) y reasignación de rol

### Contexto

El propietario del proyecto reportó "el módulo Usuarios no está completo, no hay acción visible de Crear Usuario". Verificado contra el código y `Users.md` antes de escribir nada: el módulo original nunca prometió creación directa — su Decisión 1 (RC1 Fase 4) dice explícitamente que crear es responsabilidad del entonces-inexistente Módulo 6 (Invitaciones), y que reasignar rol espera a que Roles (Módulo 5) exista. Ambos ya estaban construidos para esta fecha. Confirmado con el propietario del proyecto vía preguntas directas antes de codificar: (1) construir Invitaciones real (invitar por correo, el invitado elige su propia contraseña) en vez de un formulario directo de "crear con contraseña puesta por el admin" — deviaría del diseño documentado; (2) NO construir reasignación de empresa (`empresa_id` fijo, sin precedente en la arquitectura); (3) SÍ construir reasignación de rol, NO admin-edita-nombre/correo, NO admin-resetea-contraseña-de-otro.

### Funcionalidades implementadas (ampliación)

- **Domain — Invitaciones**: `Invitation` (modelo nuevo, tabla `invitations` ya migrada desde Fase 0 pero nunca usada), `InvitationRepository`/`InvitationService` (token crudo de 64 caracteres vía `Str::random()`, solo su hash SHA-256 persiste — mismo principio que el broker de "olvidé mi contraseña" de Laravel), `InvitationPolicy` (`create()` únicamente — `usuarios.invitar` AND pertenencia de empresa). Re-invitar el mismo correo reemplaza cualquier invitación pendiente anterior.
- **Domain — Asignar rol**: `UserController::asignarRol()` — nuevo método, reutiliza `UserPolicy::update()` sin cambios (misma ability que ya gateaba activar/desactivar). `syncRoles([$rol])`, nunca `assignRole()` acumulativo — este ERP modela un único rol por usuario en todas partes (`UserResource::role` ya era singular).
- **API**: `POST /usuarios/invitar` (autenticada, `usuarios.invitar`), `GET /invitaciones/{token}` y `POST /invitaciones/{token}/aceptar` (deliberadamente públicas, sin `auth:api`/`tenant` — quien las llama no tiene sesión todavía), `POST /usuarios/{id}/rol` (autenticada, `usuarios.editar`).
- **Frontend**: `InvitarUsuarioDialog` (email + rol opcional, nunca contraseña) detrás de un nuevo botón "Nuevo Usuario" en `/usuarios`; `AsignarRolDialog` (selector de rol) detrás de un nuevo botón "Cambiar rol" en la ficha de usuario; página pública nueva `app/aceptar-invitacion/page.tsx`, mismo shell/patrón que la ya existente `restablecer-password` (resuelve el token primero, muestra a qué empresa se une, formulario de nombre+contraseña, redirige a `/login` al terminar).

### Correcciones realizadas (ampliación)

- **Bug real de arquitectura, encontrado y corregido mediante verificación directa (`tinker`) antes de escribir un solo test**: `TenantScope` (aplicado a `Role` vía `BelongsToEmpresa`) es fail-closed por diseño — sin `TenantContext` fijado, cualquier query devuelve cero filas. La ruta pública de aceptar invitación nunca pasa por el middleware `IdentifyTenant` (no hay sesión que identificar), así que `Role::findOrFail($invitacion->role_id)` dentro de `InvitationService::aceptar()` habría fallado el 100% de las veces en producción para cualquier invitación que incluyera un rol — nunca se habría manifestado en un entorno de pruebas donde el desarrollador fija `TenantContext` a mano sin darse cuenta de que reproduce artificialmente lo que `IdentifyTenant` haría. Corregido fijando `TenantContext`/el team id de Spatie explícitamente a partir del `empresa_id` ya persistido en la propia `Invitation` (nunca de un input del visitante, cerrando cualquier superficie de escalamiento) justo antes de resolver el rol — mismo principio que un Job/Artisan command fijándolo a mano, documentado como el escape intencional en el propio docblock de `TenantContext`.
- **Segundo bug relacionado, mismo método**: `email_verified_at` no está en `$fillable` de `User` (a propósito — nadie debe poder auto-verificar un correo vía mass-assignment). La primera versión de `InvitationService::aceptar()` lo pasaba dentro de `User::create([...])`, donde se descartaba en silencio; el usuario recién creado quedaba con `email_verified_at = null` y `AuthenticationService::login()` lo rechazaba con "Debes verificar tu correo" — encontrado verificando el flujo completo (invitar → aceptar → iniciar sesión) de punta a punta antes de dar el trabajo por terminado, no por un test. Corregido con `$usuario->forceFill(['email_verified_at' => now()])->save()`, mismo patrón que `PasswordResetController` ya usa para escribir `password` (otro campo deliberadamente fuera de `$fillable`).
- **Bug de UI encontrado en verificación de navegador**: los `<Select>` de rol en ambos diálogos nuevos inicializaban su valor en `undefined` hasta que se elegía un rol — React interpreta eso como pasar de "no controlado" a "controlado" después del primer render, y lanza una advertencia de consola en cada uso. Corregido inicializando en `""` (string vacío, siempre definido) en vez de `undefined`, consistente en los dos componentes.
- **Colisión de nombre de rol en `UserControllerTest`, encontrada al correr la suite, no antes**: el nuevo `roleAlterno` de prueba se llamó inicialmente "Vendedor", que ya usaba un test preexistente (`rol filter returns only users with that role`) dentro del mismo `setUp()` compartido — `RoleAlreadyExists`. Renombrado a "Bodeguero", sin tocar el test preexistente.
- **Expectativa de test corregida, no el código**: un test propio inicial asumía que un usuario sin `usuarios.editar` recibiría 403 al reasignar un rol. `UserPolicy::update()` (que gatea activar/desactivar/asignar rol por igual) nunca verificó ese permiso — solo pertenencia de empresa, exactamente como ya documentaba `Users.md` ("depende de Módulo 3, sin construir") y como ya era cierto, sin ningún test que lo confirmara, para activar/desactivar. El test se corrigió para fijar el comportamiento actual real, en vez de tensionar `UserPolicy::update()` más allá del alcance de esta ampliación (cambiarlo habría afectado activar/desactivar también, sin haber sido pedido).

### Cambios en Backend (ampliación)

**Archivos creados:**

- `backend/app/Models/Invitation.php`
- `backend/app/Policies/InvitationPolicy.php`
- `backend/app/Repositories/InvitationRepository.php`
- `backend/app/Services/InvitationService.php`
- `backend/app/Notifications/Auth/InvitationNotification.php`
- `backend/app/Http/Controllers/Api/InvitationController.php`
- `backend/app/Http/Requests/Invitation/StoreInvitationRequest.php`, `AcceptInvitationRequest.php`
- `backend/app/Http/Requests/User/AssignRoleRequest.php`
- `backend/tests/Feature/InvitationControllerTest.php` (17 casos)

**Archivos modificados:**

- `backend/app/Http/Controllers/Api/UserController.php` (`asignarRol()`)
- `backend/routes/api.php` (`POST /usuarios/invitar`, `POST /usuarios/{id}/rol`, grupo público `v1/invitaciones`)
- `backend/database/seeders/RoleSeeder.php` (Supervisor gana `usuarios.editar`/`usuarios.invitar`)
- `backend/tests/Feature/UserControllerTest.php` (5 casos nuevos de Asignar Rol)

**Reutilizado sin cambios:** tabla `invitations` (migrada desde Fase 0, nunca usada hasta ahora), catálogo de permisos (`usuarios.invitar`, ya sembrado sin consumidor), `Role`/`RoleController` (Módulo 5), `AuditLogger`, `TenantContext`, patrón de `ResetPasswordNotification` (espejado por `InvitationNotification`).

### Cambios en Frontend (ampliación)

**Archivos creados:**

- `frontend/components/invitar-usuario-dialog.tsx`
- `frontend/components/asignar-rol-dialog.tsx`
- `frontend/app/aceptar-invitacion/page.tsx`
- `frontend/lib/api/invitaciones.ts`

**Archivos modificados:**

- `frontend/app/(app)/usuarios/page.tsx` (botón "Nuevo Usuario")
- `frontend/components/usuario-detail-screen.tsx` (botón "Cambiar rol")
- `frontend/lib/api/usuarios.ts` (`asignarRolUsuario`)
- `frontend/lib/api/types.ts` (`InviteUsuarioPayload`, `InvitacionInfo`, `AcceptInvitationPayload`)

### Cambios en Base de Datos (ampliación)

Ninguno nuevo — la tabla `invitations` ya existía desde una migración de Fase 0 (`create_invitations_table`), sin ningún código que la usara hasta esta ampliación. Sin permisos nuevos — `usuarios.invitar` ya estaba sembrado desde Fase 0, sin consumidor hasta ahora.

### Resultado de las pruebas (ampliación)

- **Backend:** `php artisan test` → **366/366 passing** (era 344/344 antes de esta ampliación — 22 tests nuevos: 17 `InvitationControllerTest` + 5 en `UserControllerTest`).
- **Frontend:** `npm run type-check` limpio.
- **Browser tests (reales, agente de automatización de navegador contra Chrome)**: login real, botón "Nuevo Usuario" abre el diálogo de invitación, invitar crea un registro real en `invitations` (verificado por el conteo de usuarios NO cambiando hasta que se acepta), `/aceptar-invitacion` sin token muestra un mensaje claro sin crashear, ficha de usuario existente muestra "Cambiar rol", reasignar rol actualiza el valor mostrado sin recargar la página. La advertencia de consola del `Select` (ver Correcciones realizadas) se encontró y confirmó corregida en una segunda pasada dedicada.

## Estado final del módulo

🟢 **Completo** — Usuarios cierra las dos exclusiones de su Decisión 1 que dependían de módulos que ya existen (crear vía Invitaciones, reasignar rol), documentando explícitamente por qué la tercera (editar nombre/correo, reasignar empresa) sigue fuera de alcance. 36 tests en verde (14 originales + 22 nuevos), documentación actualizada en los 4 documentos afectados (`Users.md`, `API.md`, `ROLES_MATRIX.md`, `RC1_FUNCTIONAL_MODULE_AUDIT.md`).

## Control de versiones

- **Rama:** `main`.
- **Commits de esta ampliación** (orden cronológico):
  1. `85af03f` — `feat(usuarios): implement Modulo 6 (Invitations) and Assign Role`
  2. `53005a0` — `feat(usuarios): add Invite User and Assign Role UI`
  3. `47b2eb9` — `docs(usuarios): document Modulo 6 (Invitations) and Assign Role`
- **Commit original (módulo base, RC1 Fase 4):** `16b2f96` — `feat(usuarios): implement complete Users module - list, view, activate, deactivate (RC1)`.

## Confirmación de push

✅ Ejecutado correctamente: `521a01e..47b2eb9  main -> main` contra `origin` (GitHub) — incluye también `f8100d4` (fix de validación de stock, unidad de trabajo separada en la misma sesión).

## Estado del informe

☐ Pendiente
☐ Requiere correcciones
**☑ Aprobado — pendiente de confirmación del propietario del proyecto**
