# Informe Final — Módulo Perfil (Vertical Slice Completo)

## Resumen del trabajo realizado

Cuarto y último módulo de la secuencia vertical-slice Roles→Auditoría→Reportes→Perfil, construido después de que Reportes quedara 100% cerrado. A diferencia de los otros tres, no existía ningún borrador previo en `docs/03_FUNCTIONAL_SPEC/FUTURE/` para este módulo — el diseño se fundamentó directamente en las columnas ya existentes de `users` (`avatar_path`/`theme`/`language`/`timezone`, sembradas desde Fase 0/1 sin que ningún endpoint las tocara hasta hoy) y en la relación explícita que pidió el propietario del proyecto: Perfil→User/Company/Roles/Permissions.

Con este módulo se cierra la secuencia completa de 4 módulos — el propio `RC1_FUNCTIONAL_MODULE_AUDIT.md` queda sin ningún módulo 🔴 por primera vez desde que existe ese documento.

## Funcionalidades implementadas

- **Domain**: `ProfileService` (`actualizar`/`actualizarAvatar`/`eliminarAvatar`/`cambiarPassword`) — **sin Repository**, a propósito: cada método muta un único registro ya cargado (`$request->user()`), no hay ninguna consulta que encapsular. **Sin Policy ni permiso propio**, también a propósito: ninguna ruta acepta el id de otro usuario, así que la acotación a "uno mismo" ya cierra cualquier superficie de escalamiento de privilegios — no hay nada que un permiso `perfil.*` necesite proteger que la estructura de la ruta no proteja ya. Subir un avatar nuevo borra el archivo anterior del disco (`Storage::disk('public')`), nunca quedan huérfanos. Cambiar la contraseña propia reutiliza `AuthenticationService::forcePasswordReset()` (revoca todas las sesiones) en vez de duplicar esa lógica — es, en los hechos, el mismo evento de seguridad que "olvidé mi contraseña".
- **API**: `ProfileController` (`update`/`subirAvatar`/`eliminarAvatar`/`cambiarPassword`, sin `index`/`show` — `GET /auth/me`, ya existente, es la fuente de verdad de la ficha propia). `AuthenticatedUserResource` (el Resource detrás de `/auth/me`, login y refresh) gana tres campos computados: `avatar_url` (URL lista para `<img>`, calculada desde `avatar_path`), `empresa` (`{id, nombre}`, vía la relación `User::empresa()` ya existente), `roles` (todos, no solo el primero como el campo `role` ya existente). Rutas: `PATCH /perfil`, `POST /perfil/avatar`, `DELETE /perfil/avatar`, `POST /perfil/password`.
- **Tests**: `ProfileControllerTest` — 14 casos: actualizar datos personales, actualización parcial (solo los campos enviados), validación de `theme`/`language`/`timezone`, subir avatar, **subir un avatar nuevo borra el anterior**, avatar debe ser una imagen real, quitar avatar, cambiar contraseña con la actual correcta, **rechazar con la actual incorrecta** (422 en el campo específico), **cambiar la contraseña revoca todas las sesiones** (verificado contra `AuthSession.revoked_at`), nueva contraseña exige confirmación y longitud mínima, 401 sin autenticar en los 4 endpoints.
- **Frontend**: `/perfil` — tarjeta de avatar (subir/quitar) con nombre/email/empresa/badges de todos los roles; "Datos personales" (nombre editable, correo de solo lectura, idioma, zona horaria); "Apariencia" (único selector de tema de toda la app); "Seguridad" (cambiar contraseña, con aviso de que cierra todas las sesiones, y redirección real a `/login` tras el éxito). Los 4 thunks de mutación viven dentro de `auth-slice.ts` (no en un `perfil-slice.ts` propio) — decisión de arquitectura explícita: todos actualizan exactamente el mismo `state.user` que `auth-slice` ya es dueño; un slice separado habría necesitado un mecanismo cross-slice solo para actualizar el mismo objeto, sin ningún beneficio real.
- **Sidebar**: nueva entrada "Mi Perfil" en el dropdown de cuenta (antes ausente — el dropdown solo enlazaba a Configuración). Perfil vive exclusivamente en ese dropdown, no en los grupos temáticos del sidebar (Inventario/Terceros/Administración) — coherente con ser el único módulo cuyo alcance es "el propio usuario", no un recurso de negocio de la empresa.
- **Configuración** (página ya existente, no parte de los 4 módulos, pero directamente afectada): perdió su selector de tema — antes 100% client-side (`localStorage`, nunca tocaba `users.theme`), ahora duplicaría el que sí es real en Perfil. La tarjeta "Cuenta" ahora muestra el avatar real (antes solo iniciales) y enlaza a `/perfil` para la edición completa.

## Correcciones realizadas

- **Bug real de infraestructura encontrado durante la verificación de este módulo, ajeno a Perfil en sí**: `APP_URL` en `backend/.env` y en `backend/.env.example` estaba configurado sin puerto (`http://localhost`), pero el backend de desarrollo corre en `:8000`. Esto nunca se había manifestado porque ningún módulo anterior generaba una URL pública absoluta — Captura IA guarda sus archivos en el disco `local` (privado, nunca se sirve como URL). La primera subida de avatar de este módulo lo expuso de inmediato: `Storage::disk('public')->url($ruta)` producía `http://localhost/storage/...` (puerto 80, donde nada escucha), y el navegador fallaba con `net::ERR_CONNECTION_REFUSED` al intentar cargar la imagen — el avatar se guardaba correctamente en la base de datos y en disco, pero nunca se veía. Corregido en ambos archivos (`APP_URL=http://localhost:8000`); `php artisan config:clear` confirmó que no había config cacheada de por medio.
- **Mensaje de error genérico en vez del específico del backend**: la primera versión de los thunks de Perfil mostraba `error.message` (el título genérico "Error de validación" que devuelve el manejador de excepciones de Laravel) en vez del mensaje de campo real y accionable que el backend ya arma (ej. "La contraseña actual no es correcta"). El `ApiError` del cliente HTTP ya traía ese detalle en `fieldErrors`, sin usarse. Corregido con un helper `mensajeError()` compartido entre los 4 thunks que prefiere el primer error de campo sobre el mensaje genérico — encontrado y corregido en la misma verificación de navegador que probó el flujo de cambio de contraseña con una contraseña actual incorrecta.
- **Infraestructura de almacenamiento público, nunca antes necesaria**: `php artisan storage:link` no se había ejecutado nunca en este proyecto (todo archivo previo, Captura IA, usa el disco privado `local`). Ejecutado como parte de este módulo — comando estándar e idempotente de Laravel, no un cambio de código.

## Relaciones verificadas

- `User belongsTo Empresa` (relación ya existente, `User::empresa()`) — reutilizada para el campo `empresa` de `AuthenticatedUserResource`, sin necesitar un nuevo endpoint de consulta.
- `roles` (plural) reutiliza `getRoleNames()` de Spatie, ya usado por el campo `role` (singular) existente — sin nueva lógica de resolución de roles.
- Verificado en navegador, de punta a punta, con un round-trip completo real: cambiar la contraseña con la actual correcta → redirección a `/login` → la contraseña vieja queda rechazada → la nueva funciona → se restauró la contraseña original del usuario demo antes de terminar, para no dejar el entorno de desarrollo en un estado distinto al que tenía.

## Cambios en Backend

**Archivos creados:**

- `backend/app/Services/ProfileService.php`
- `backend/app/Http/Controllers/Api/ProfileController.php`
- `backend/app/Http/Requests/Profile/UpdateProfileRequest.php`, `UploadAvatarRequest.php`, `ChangePasswordRequest.php`
- `backend/tests/Feature/ProfileControllerTest.php`

**Archivos modificados:**

- `backend/app/Http/Resources/Auth/AuthenticatedUserResource.php` (`avatar_url`, `empresa`, `roles`)
- `backend/routes/api.php` (grupo `/api/v1/perfil`)
- `backend/.env`, `backend/.env.example` (`APP_URL` corregido — ver Correcciones)

## Cambios en Frontend

**Archivos creados:**

- `frontend/lib/api/perfil.ts`
- `frontend/app/(app)/perfil/page.tsx`

**Archivos modificados:**

- `frontend/lib/api/types.ts` (`AuthenticatedUser` gana `avatar_url`/`empresa`/`roles`; `UpdateProfilePayload`, `ChangePasswordPayload` nuevos)
- `frontend/store/slices/auth-slice.ts` (4 thunks nuevos: `updateProfileThunk`, `uploadAvatarThunk`, `removeAvatarThunk`, `changePasswordThunk`, más el helper `mensajeError`)
- `frontend/components/app-sidebar.tsx` (entrada "Mi Perfil" en el dropdown de cuenta)
- `frontend/app/(app)/configuracion/page.tsx` (selector de tema removido — ver Resumen; tarjeta "Cuenta" ahora muestra el avatar real y enlaza a Perfil)

## Cambios en Base de Datos

- Sin migración nueva — las 4 columnas de `users` ya existían.
- Sin permisos nuevos — este módulo no tiene permiso propio, por diseño.
- Infraestructura nueva: symlink `public/storage` (vía `php artisan storage:link`, comando estándar de Laravel, no versionado — cada entorno debe ejecutarlo una vez).

## Documentación actualizada

- `docs/03_FUNCTIONAL_SPEC/Profile.md` (nuevo, `Status: Built`) — sin borrador previo que reemplazar.
- `docs/04_TECHNICAL_SPEC/API.md` — sección "Perfil" actualizada de un draft de 2 líneas a la forma real construida; nota agregada a `GET /auth/me` sobre los 3 campos nuevos.
- `docs/00_VISION/Roadmap.md` — Módulo 9 marcado `[x]` con detalle (a diferencia de Auditoría/Módulo 8, este sí correspondía exactamente al mismo concepto).
- `docs/03_FUNCTIONAL_SPEC/RC1_FUNCTIONAL_MODULE_AUDIT.md` — Perfil pasa de 🔴 NOT IMPLEMENTED a 🟢 COMPLETE; Configuración actualizada para reflejar que ya no duplica el tema; totales finales 🟢14·🟡2·🔴0.
- `docs/05_IMPLEMENTATION/ProfileModule.md` (este documento — nuevo).
- `CHANGELOG.md` — entrada nueva.

## Resultado de las pruebas

- **Backend:** `php artisan test` → **311/311 passing** (era 297/297 antes de esta unidad de trabajo — 14 tests nuevos, `ProfileControllerTest`).
- **Frontend:** `npx tsc --noEmit` limpio.
- **Browser tests (reales, Playwright + Microsoft Edge del sistema)**: login real, "Mi Perfil" visible en el dropdown de cuenta, ficha con empresa/rol reales, edición de nombre persistida, **subida de avatar con imagen real** (confirmado el bug de `APP_URL` y corregido en la misma corrida), avatar visible tras la corrección, tema cambiado a "Oscuro" aplicado en vivo (`class="dark"` en `<html>`) y persistido, avatar removido correctamente, contraseña incorrecta rechazada con mensaje específico ("La contraseña actual no es correcta" — corregido de un genérico "Error de validación"), **round-trip completo de cambio de contraseña exitoso**: contraseña actual → nueva → redirección a `/login` → contraseña vieja rechazada → contraseña nueva funciona → restaurada la original, Configuración confirmada sin el selector de tema duplicado y con enlace real a Perfil.

## Estado final del módulo

🟢 **Completo** — Perfil es ahora un vertical slice real: sin base de datos nueva (columnas ya existían), dominio con Service (sin Repository ni Policy, ambos justificados por diseño), API con tests, frontend integrado a `auth-slice` existente, persistencia real verificada con un round-trip completo en navegador, y documentación. **Cuarto y último módulo de la secuencia Roles→Auditoría→Reportes→Perfil — los 4 completos.**

## Control de versiones

- **Rama:** `main`.
- **Commit:** `944781b` — `feat(perfil): implement Profile as a complete vertical slice, closing the Roles->Audit->Reports->Profile sequence (RC1 Module 4/4)`.

## Confirmación de push

✅ Ejecutado correctamente: `079819b..944781b  main -> main` contra `origin` (GitHub).

## Estado del informe

☐ Pendiente
☐ Requiere correcciones
**☑ Aprobado — pendiente de confirmación del propietario del proyecto**
