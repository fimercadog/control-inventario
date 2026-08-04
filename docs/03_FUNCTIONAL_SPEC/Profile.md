# Perfil

**Status: Built (2026-08-02, cuarto y último módulo de la secuencia vertical-slice Roles→Auditoría→Reportes→Perfil)**

> Verificado contra `backend/app/Services/ProfileService.php`, `backend/app/Http/Controllers/Api/ProfileController.php`, `backend/app/Http/Requests/Profile/*.php`, `backend/app/Http/Resources/Auth/AuthenticatedUserResource.php`, `backend/routes/api.php`, `backend/tests/Feature/ProfileControllerTest.php`, `frontend/app/(app)/perfil/`. No existía ningún borrador en `docs/03_FUNCTIONAL_SPEC/FUTURE/` para este módulo (a diferencia de Auditoría/Reportes) — el diseño real se fundamenta en las columnas ya existentes de `users` (`avatar_path`/`theme`/`language`/`timezone`, sembradas desde Fase 0/1 sin ningún endpoint que las leyera o escribiera hasta hoy) y en la relación explícita que pidió el propietario del proyecto: Perfil→User/Company/Roles/Permissions.

## Purpose

Que cada usuario pueda ver y editar su propia ficha — avatar, apariencia, idioma, zona horaria — y cambiar su propia contraseña, sin depender de un administrador. Sigue siendo el único módulo de los cuatro cuyo alcance es exclusivamente "yo mismo": ninguna ruta de `ProfileController` acepta el id de otro usuario, sin cambios en esta unidad de trabajo. **Nota (2026-08-04, `ADR-015`)**: avatar/idioma/zona horaria/tema dejaron de ser autoservicio *exclusivo* — un administrador con `usuarios.editar` ahora también puede editarlos para otro usuario, vía `UserController` (un controller distinto, con su propia autorización), no vía este módulo. Ver "Actors" y `Users.md`.

## Business Flow

1. `GET /auth/me` (ya existente, Módulo 1) es la fuente de verdad de la ficha propia — devuelve `avatar_path`/`avatar_url`/`theme`/`language`/`timezone`/`empresa`/`role`/`roles`/`permissions`, todos ya cargados al arrancar la app vía `bootstrapAuth`. Este módulo **no agrega un `GET /perfil` redundante**.
2. `PATCH /perfil` actualiza `theme`/`language`/`timezone` — solo los campos enviados, el resto queda intacto. `name` dejó de aceptarse aquí desde el 2026-08-04 (`ADR-015`, modelo de identidad ERP) — era editable hasta esa fecha.
3. `POST /perfil/avatar` sube un archivo nuevo, reemplazando el anterior (el archivo viejo se borra del disco, no queda huérfano). `DELETE /perfil/avatar` lo quita sin subir uno nuevo.
4. `POST /perfil/password` cambia la contraseña propia — exige la contraseña actual (para que una sesión desatendida no pueda cambiarla sin conocerla) y, al tener éxito, revoca todas las sesiones del usuario (mismo mecanismo que "olvidé mi contraseña", `AuthenticationService::forcePasswordReset()`) — el frontend redirige a `/login` inmediatamente después.
5. El tema (`theme`) se aplica en vivo vía `next-themes` **y** se persiste al backend en la misma acción — antes de este módulo, Configuración cambiaba el tema solo en `localStorage`, nunca en `users.theme`; esa pieza fue removida de Configuración para no tener dos fuentes de verdad del mismo estado (ver Edge Cases).

## Actors

- **Cualquier usuario autenticado**: puede editar su propia ficha (avatar/idioma/zona horaria/tema/contraseña) vía este módulo, siempre — nadie más puede tocar su contraseña, ni siquiera un administrador.
- **Administrador con `usuarios.editar`** (2026-08-04, `ADR-015`): puede editar el avatar/idioma/zona horaria/tema de OTRO usuario de su empresa — no vía este módulo, sino vía `UserController` (Módulo 4, `UsuarioFormModal`). Reversión deliberada del invariante anterior ("no hay una variante 'administrador edita el perfil de otro'"), documentada aquí para que no se asuma vigente sin revisar `Users.md`.

## Screens

- **`/perfil`** (`frontend/app/(app)/perfil/page.tsx`): tarjeta de avatar (subir/quitar) + nombre/email/empresa/badges de rol; tarjeta "Datos personales" (nombre e email ambos de solo lectura desde 2026-08-04 — `nombre` era editable hasta esa fecha, ver Edge Cases —, idioma y zona horaria editables); tarjeta "Apariencia" (selector de tema, único lugar de la app donde se cambia); tarjeta "Seguridad" (cambiar contraseña, con aviso explícito de que cierra todas las sesiones).
- El dropdown del bloque de usuario en el sidebar gana la entrada "Mi Perfil" (antes ausente — apuntaba solo a Configuración, ver Correcciones en el informe de implementación).
- **Configuración** (`/configuracion`, ya existente, Módulo previo) pierde su selector de tema duplicado — ahora enlaza a `/perfil` para eso, con una tarjeta "Cuenta" que muestra el avatar real (antes solo iniciales) y lleva a la ficha completa.

## Fields

Sin migración nueva — las 4 columnas ya existían en `users` desde Fase 0/1, sin ningún endpoint que las tocara hasta este módulo:

| Campo | Notas |
|---|---|
| `name` | Identity (`ADR-015`) — de solo lectura desde 2026-08-04; era editable desde este módulo antes de esa fecha |
| `email` | Identity — de solo lectura aquí, siempre lo fue; cambiar el email de login implica además un flujo de re-verificación propio, fuera de alcance (ver Edge Cases) |
| `avatar_path` | ruta relativa en el disco `public` (`avatares/{empresa_id}/...`) — nunca se expone directo, ver `avatar_url` |
| `avatar_url` | **campo nuevo, computado** en `AuthenticatedUserResource` a partir de `avatar_path` — URL lista para un `<img>`, sin que el frontend necesite conocer la convención de rutas del backend |
| `theme` | `light`/`dark`/`system` |
| `language` | `es`/`en` — ver nota de alcance abajo |
| `timezone` | validado contra identificadores IANA reales (regla `timezone:all` de Laravel) |
| `empresa` | **campo nuevo, computado** en `AuthenticatedUserResource` — `{id, nombre}` de la empresa del usuario, `null` solo para Platform Super Admin |
| `roles` | **campo nuevo, computado** — todos los roles del usuario (`role`, ya existente, solo trae el primero) |

**Nota de alcance — `language`**: la app es 100% texto en español hardcodeado hoy, sin ninguna infraestructura de traducción real. Este campo se persiste honestamente como preferencia (y ofrece `en` como segunda opción visible), pero **ningún texto de la interfaz cambia todavía según su valor** — no es una promesa incumplida silenciosa, queda documentado aquí y en Future Improvements.

## Validation Rules

- `theme` ∈ {`light`, `dark`, `system`}; `language` ∈ {`es`, `en`}; `timezone` debe ser un identificador IANA real.
- `avatar`: debe ser una imagen real (`image`, detectado por tipo MIME, no por extensión), máximo 2MB.
- Cambio de contraseña: `password_actual` debe coincidir con el hash real del usuario (`Hash::check`, verificado en el propio `FormRequest` vía `withValidator()`, no en el Service — mismo patrón que la unicidad de nombre de Rol usa `Rule::unique`); `password` nueva, mínimo 8 caracteres, con confirmación (`password_confirmation`) — mismas reglas que `ResetPasswordRequest` (Módulo 1), reutilizadas por consistencia.

## Permissions

**Sin permiso propio, a propósito.** Cada acción ya está intrínsecamente acotada a "el usuario autenticado sobre sí mismo" — no hay ningún id de otro usuario en ninguna ruta de este módulo, así que no hay superficie de escalamiento de privilegios que un permiso `perfil.*` necesite cerrar. Mismo razonamiento que ya protege `GET /auth/me`, que tampoco exige un permiso.

## Loading States

Mientras `state.auth.user` es `null` (la app todavía no resolvió `bootstrapAuth`), `/perfil` muestra un spinner de página completa — esto en la práctica solo ocurre en el primer instante de carga, ya que llegar a `/perfil` implica pasar por el layout autenticado, que ya espera a `bootstrapAuth`.

## Empty States

Sin avatar (`avatar_url` es `null`): el `Avatar` cae a las iniciales del nombre — mismo componente y mismo comportamiento que ya usaban el sidebar y Configuración antes de este módulo, sin cambios.

## Error States

- Fetch de mutación fallido: `toast.error(...)` con el mensaje específico del backend (ej. "La contraseña actual no es correcta"), no un genérico — **corregido durante la verificación**: la primera versión mostraba el título genérico de Laravel ("Error de validación") en vez del mensaje de campo real; ver Correcciones en el informe de implementación.
- Avatar inválido (no es imagen, o pesa más de 2MB): 422, mensaje específico del campo `avatar`.
- Contraseña actual incorrecta: 422 en el campo `password_actual`, sin revelar más información que esa.

## Business Rules

- **Ninguna ruta de este módulo acepta un id de otro usuario** — `$request->user()` es la única fuente del registro a modificar en los 4 endpoints, por diseño, no por una verificación adicional que podría fallar.
- **Cambiar la contraseña siempre revoca todas las sesiones** — reutiliza `AuthenticationService::forcePasswordReset()`, el mismo mecanismo que "olvidé mi contraseña" ya usaba; no se duplicó la lógica de revocación.
- **Subir un avatar nuevo borra el archivo anterior** — nunca quedan archivos huérfanos en el disco acumulándose.
- **`email` nunca es editable desde aquí** — decisión de alcance explícita, no un descuido (ver Edge Cases).
- **Toda automodificación de perfil escribe una entrada real en `AuditLog`** (`perfil.editar`/`perfil.avatar_actualizado`/`perfil.avatar_eliminado`/`perfil.password_cambiado`, añadido 2026-08-04 en la auditoría de campos editables de Clientes/Proveedores/Usuarios). Antes de esta fecha ningún endpoint de este módulo auditaba — inconsistencia real frente a `UserController` (que sí auditaba activar/desactivar/asignar rol) y frente a `docs/10_GOVERNANCE/DefinitionOfDone.md` ("toda mutación exitosa escribe una entrada real vía AuditLogger"). El diff capturado es el real (`getChanges()`), igual que Clientes/Proveedores — nunca el valor de `password`, solo la marca `(cambiado)`.

## Acceptance Criteria

- [x] Un usuario puede editar su idioma y zona horaria, y los cambios persisten. Su nombre ya **no** es editable desde 2026-08-04 (`ADR-015`) — es un campo de identidad, igual que el correo.
- [x] Un usuario puede subir, reemplazar y quitar su propio avatar; el archivo anterior nunca queda huérfano.
- [x] El tema se aplica en vivo y persiste al backend — un solo lugar en la app lo controla.
- [x] Un usuario puede cambiar su propia contraseña dando la contraseña actual correcta; con la incorrecta, la operación se rechaza con un mensaje específico y accionable.
- [x] Cambiar la contraseña cierra todas las sesiones activas — confirmado con un usuario real: la contraseña vieja deja de servir, la nueva funciona, verificado en navegador real de punta a punta.
- [x] Un usuario no puede editar el perfil de otro usuario.

  Los administradores con el permiso `usuarios.editar` sí pueden administrar otros usuarios desde el módulo **Usuarios**, respetando el modelo de identidad definido en `ADR-015`.

  Los administradores únicamente pueden modificar los campos operativos autorizados:

  - Avatar
  - Idioma
  - Zona horaria
  - Tema

  Los campos de identidad permanecen protegidos y son de solo lectura:

  - Nombre
  - Correo
  - Empresa
  - Administrador de plataforma

  Los campos controlados mantienen su flujo específico y nunca forman parte del formulario de edición:

  - Contraseña → Cambiar Contraseña
  - Rol → Asignar Rol
  - Estado → Activar / Desactivar

  El propio usuario sí puede administrar su propia cuenta desde el módulo **Perfil**, respetando las mismas restricciones del modelo de identidad (`ADR-015`):

  - Puede modificar sus preferencias personales (avatar, idioma, zona horaria y tema).
  - Puede cambiar su propia contraseña mediante el flujo **Cambiar Contraseña**.
  - No puede modificar sus propios campos de identidad (nombre, correo, empresa y administrador de plataforma).
  - No puede modificar usuarios distintos de sí mismo.

  En consecuencia:

  - Un usuario administra únicamente su propia cuenta.
  - Un administrador con el permiso `usuarios.editar` administra las cuentas de otros usuarios, respetando las restricciones del modelo de identidad.

## Edge Cases

- **Dos productos/empresas/etc. compartiendo nombre** no aplica aquí (Perfil no lista una colección de otros registros) — a diferencia de Reportes, no hay riesgo de colisión de `key` de este tipo.
- **Cambiar el email de login**: fuera de alcance a propósito. Permitirlo implicaría un flujo de re-verificación (confirmar el nuevo correo antes de que tome efecto) que ningún otro módulo de este proyecto tiene todavía — se prefirió no construir una pieza de infraestructura nueva y aislada solo para este campo. Documentado aquí como decisión, no como olvido.
- **Cambiar el nombre propio**: fuera de alcance desde 2026-08-04 (`ADR-015`) — era editable antes de esa fecha. Sin flujo de corrección para un typo real en el propio nombre (ni siquiera con permiso elevado); riesgo documentado explícitamente en el ADR, no descubierto después.
- **`language` sin traducción real todavía**: ver nota de alcance en Fields — el campo se persiste honestamente, la interfaz no cambia de idioma todavía.
- **Un usuario con múltiples roles**: `roles` (plural) los muestra todos como badges; `role` (singular, ya existente, usado en el sidebar) sigue mostrando solo el primero — sin cambios ahí, para no romper ningún consumidor existente de ese campo.

## Future Improvements

- **Cambio de email con re-verificación**: si se vuelve un requisito real, necesita su propio flujo (token de confirmación al nuevo correo, no editable hasta confirmarse) — no construido aquí a propósito.
- **Traducción real de la interfaz según `language`**: hoy es una preferencia persistida sin efecto visible — implementar i18n real es un esfuerzo transversal a todo el frontend, fuera de alcance de un solo módulo.
- **Autenticación de dos factores**: `users.two_factor_enabled`/`two_factor_secret`/`two_factor_confirmed_at` ya existen en el esquema (Fase 0) sin ningún flujo que los use — candidato natural para vivir dentro de la tarjeta "Seguridad" de este módulo el día que se construya.
