# Perfil

**Status: Built (2026-08-02, cuarto y último módulo de la secuencia vertical-slice Roles→Auditoría→Reportes→Perfil)**

> Verificado contra `backend/app/Services/ProfileService.php`, `backend/app/Http/Controllers/Api/ProfileController.php`, `backend/app/Http/Requests/Profile/*.php`, `backend/app/Http/Resources/Auth/AuthenticatedUserResource.php`, `backend/routes/api.php`, `backend/tests/Feature/ProfileControllerTest.php`, `frontend/app/(app)/perfil/`. No existía ningún borrador en `docs/03_FUNCTIONAL_SPEC/FUTURE/` para este módulo (a diferencia de Auditoría/Reportes) — el diseño real se fundamenta en las columnas ya existentes de `users` (`avatar_path`/`theme`/`language`/`timezone`, sembradas desde Fase 0/1 sin ningún endpoint que las leyera o escribiera hasta hoy) y en la relación explícita que pidió el propietario del proyecto: Perfil→User/Company/Roles/Permissions.

## Purpose

Que cada usuario pueda ver y editar su propia ficha — datos personales, avatar, apariencia, idioma, zona horaria — y cambiar su propia contraseña, sin depender de un administrador. Es el único módulo de los cuatro cuyo alcance es exclusivamente "yo mismo": ninguna ruta acepta el id de otro usuario.

## Business Flow

1. `GET /auth/me` (ya existente, Módulo 1) es la fuente de verdad de la ficha propia — devuelve `avatar_path`/`avatar_url`/`theme`/`language`/`timezone`/`empresa`/`role`/`roles`/`permissions`, todos ya cargados al arrancar la app vía `bootstrapAuth`. Este módulo **no agrega un `GET /perfil` redundante**.
2. `PATCH /perfil` actualiza `name`/`theme`/`language`/`timezone` — solo los campos enviados, el resto queda intacto.
3. `POST /perfil/avatar` sube un archivo nuevo, reemplazando el anterior (el archivo viejo se borra del disco, no queda huérfano). `DELETE /perfil/avatar` lo quita sin subir uno nuevo.
4. `POST /perfil/password` cambia la contraseña propia — exige la contraseña actual (para que una sesión desatendida no pueda cambiarla sin conocerla) y, al tener éxito, revoca todas las sesiones del usuario (mismo mecanismo que "olvidé mi contraseña", `AuthenticationService::forcePasswordReset()`) — el frontend redirige a `/login` inmediatamente después.
5. El tema (`theme`) se aplica en vivo vía `next-themes` **y** se persiste al backend en la misma acción — antes de este módulo, Configuración cambiaba el tema solo en `localStorage`, nunca en `users.theme`; esa pieza fue removida de Configuración para no tener dos fuentes de verdad del mismo estado (ver Edge Cases).

## Actors

- **Cualquier usuario autenticado**: puede editar exclusivamente su propia ficha. No hay una variante "administrador edita el perfil de otro" — eso es responsabilidad de `UserController` (Módulo 4), que ya existe y gestiona activar/desactivar, no datos personales.

## Screens

- **`/perfil`** (`frontend/app/(app)/perfil/page.tsx`): tarjeta de avatar (subir/quitar) + nombre/email/empresa/badges de rol; tarjeta "Datos personales" (nombre editable, correo de solo lectura — cambiar el correo de inicio de sesión queda fuera de alcance, ver Edge Cases —, idioma, zona horaria); tarjeta "Apariencia" (selector de tema, único lugar de la app donde se cambia); tarjeta "Seguridad" (cambiar contraseña, con aviso explícito de que cierra todas las sesiones).
- El dropdown del bloque de usuario en el sidebar gana la entrada "Mi Perfil" (antes ausente — apuntaba solo a Configuración, ver Correcciones en el informe de implementación).
- **Configuración** (`/configuracion`, ya existente, Módulo previo) pierde su selector de tema duplicado — ahora enlaza a `/perfil` para eso, con una tarjeta "Cuenta" que muestra el avatar real (antes solo iniciales) y lleva a la ficha completa.

## Fields

Sin migración nueva — las 4 columnas ya existían en `users` desde Fase 0/1, sin ningún endpoint que las tocara hasta este módulo:

| Campo | Notas |
|---|---|
| `name` | editable desde este módulo |
| `email` | de solo lectura aquí — cambiar el email de login implica un flujo de re-verificación propio, fuera de alcance (ver Edge Cases) |
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

## Acceptance Criteria

- [x] Un usuario puede editar su nombre, idioma y zona horaria, y los cambios persisten.
- [x] Un usuario puede subir, reemplazar y quitar su propio avatar; el archivo anterior nunca queda huérfano.
- [x] El tema se aplica en vivo y persiste al backend — un solo lugar en la app lo controla.
- [x] Un usuario puede cambiar su propia contraseña dando la contraseña actual correcta; con la incorrecta, la operación se rechaza con un mensaje específico y accionable.
- [x] Cambiar la contraseña cierra todas las sesiones activas — confirmado con un usuario real: la contraseña vieja deja de servir, la nueva funciona, verificado en navegador real de punta a punta.
- [x] Ningún usuario puede editar el perfil de otro — estructuralmente imposible, no solo rechazado.

## Edge Cases

- **Dos productos/empresas/etc. compartiendo nombre** no aplica aquí (Perfil no lista una colección de otros registros) — a diferencia de Reportes, no hay riesgo de colisión de `key` de este tipo.
- **Cambiar el email de login**: fuera de alcance a propósito. Permitirlo implicaría un flujo de re-verificación (confirmar el nuevo correo antes de que tome efecto) que ningún otro módulo de este proyecto tiene todavía — se prefirió no construir una pieza de infraestructura nueva y aislada solo para este campo. Documentado aquí como decisión, no como olvido.
- **`language` sin traducción real todavía**: ver nota de alcance en Fields — el campo se persiste honestamente, la interfaz no cambia de idioma todavía.
- **Un usuario con múltiples roles**: `roles` (plural) los muestra todos como badges; `role` (singular, ya existente, usado en el sidebar) sigue mostrando solo el primero — sin cambios ahí, para no romper ningún consumidor existente de ese campo.

## Future Improvements

- **Cambio de email con re-verificación**: si se vuelve un requisito real, necesita su propio flujo (token de confirmación al nuevo correo, no editable hasta confirmarse) — no construido aquí a propósito.
- **Traducción real de la interfaz según `language`**: hoy es una preferencia persistida sin efecto visible — implementar i18n real es un esfuerzo transversal a todo el frontend, fuera de alcance de un solo módulo.
- **Autenticación de dos factores**: `users.two_factor_enabled`/`two_factor_secret`/`two_factor_confirmed_at` ya existen en el esquema (Fase 0) sin ningún flujo que los use — candidato natural para vivir dentro de la tarjeta "Seguridad" de este módulo el día que se construya.
