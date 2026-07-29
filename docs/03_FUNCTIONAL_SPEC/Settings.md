# Configuración

**Status: Built (parcial — pantalla real, sin persistencia backend propia)**

> Verificado contra `frontend/app/(app)/configuracion/page.tsx`. Existe una pantalla real y funcional en `/configuracion`, pero: (1) no hay `ProfileController` ni endpoints `GET/PATCH /perfil`, `POST /perfil/avatar` construidos todavía (documentados como diseño del Módulo 9 en `04_TECHNICAL_SPEC/API.md`, sin Controller real); (2) los campos de "Empresa" (nombre, zona horaria) están renderizados como `<Input disabled>` con valores fijos ("Fidel OS Demo", "America/Bogota"), no editables ni leídos de una API; (3) el umbral de confianza de Captura IA se muestra como un valor fijo (85%), no como un control editable conectado a backend. Lo único realmente funcional end-to-end en esta pantalla es: mostrar nombre/email del usuario autenticado (desde Redux), cerrar sesión (`logoutThunk`, real), y cambiar el tema claro/oscuro/sistema (`next-themes`, real, persistido en el navegador).

## Purpose

Centralizar la información de cuenta del usuario, datos generales de su empresa, y preferencias de apariencia — hoy principalmente cuenta y tema; empresa y ajustes de Captura IA son de solo lectura visual.

## Business Flow

1. Usuario navega a `/configuracion` desde el sidebar.
2. Ve su nombre, email e iniciales (avatar) — leídos del estado de Redux (`state.auth.user`), poblado en el login.
3. Puede cerrar sesión (`handleLogout` → `dispatch(logoutThunk())` → redirect a `/login`) — flujo real, comparte lógica con `Authentication.md`.
4. Puede cambiar el tema (claro/oscuro/sistema) — aplicado inmediatamente vía `next-themes`, persistido en `localStorage` del navegador (no en el backend, no por usuario en base de datos).
5. Ve datos de empresa y el umbral de Captura IA, pero no puede editarlos — son valores estáticos en el componente, no vienen de una API ni se pueden guardar.

## Actors

- **Usuario autenticado** de cualquier rol — no hay gating por permiso en esta pantalla.

## Screens

- **`/configuracion`** (`frontend/app/(app)/configuracion/page.tsx`), cuatro tarjetas:
  - **Cuenta**: avatar (iniciales), nombre, email, botón "Cerrar sesión".
  - **Empresa**: nombre y zona horaria — campos deshabilitados con valores fijos.
  - **Apariencia**: selector de tema (Claro/Oscuro/Sistema) — funcional.
  - **Captura IA**: "Aplicar automáticamente desde 85%" — valor mostrado, no editable.

## Fields

| Campo | Editable hoy | Persistido | Notas |
|---|---|---|---|
| name, email | No | N/A (solo lectura) | vienen de `state.auth.user`, poblado en login |
| tema (theme) | Sí | `localStorage` (cliente), no en `users.theme` del backend | `next-themes` |
| nombre de empresa | No | N/A | valor hardcodeado `"Fidel OS Demo"` |
| zona horaria de empresa | No | N/A | valor hardcodeado `"America/Bogota"` |
| umbral de confianza Captura IA | No | N/A | valor hardcodeado `85%`, aunque el backend sí soporta un umbral por empresa según la sección 74 del master spec (`tabla configuraciones`) — desconectados entre sí hoy |

## Validation Rules

No aplica — no hay formularios editables con validación en esta pantalla hoy (los únicos controles interactivos son botones/toggles, no inputs de texto libres).

## Permissions

Ninguno declarado — cualquier usuario autenticado ve esta pantalla igual.

## Loading States

- Selector de tema: usa un flag `mounted` para evitar mismatch de hidratación SSR/cliente (patrón recomendado de `next-themes`) — antes de montar, no se marca ningún tema como activo visualmente.
- El resto de la pantalla no tiene estado de carga porque no depende de ninguna llamada de red.

## Empty States

No aplica.

## Error States

No aplica — no hay ninguna llamada de red que pueda fallar en esta pantalla hoy (cerrar sesión sí llama al backend, pero su manejo de error pertenece a `Authentication.md`).

## Business Rules

- El campo `theme` sí existe en `users` (`light`/`dark`/`system`, según `04_TECHNICAL_SPEC/Database.md`), preparado para persistirse por usuario — pero esta pantalla no lo lee ni lo escribe todavía; usa el mecanismo de `next-themes` basado en el navegador, independiente del backend.
- El umbral de confianza real de Captura IA (0.85) vive hardcodeado en `CapturaIAService` (ver `AI_Capture.md`) — la sección 74 del master spec deja abierta la posibilidad de que sea configurable por empresa vía una tabla `configuraciones`, pero esta pantalla no es esa implementación: solo muestra el número, no lo edita ni lo lee de una fuente real.

## Acceptance Criteria

- [x] Cambiar el tema actualiza la apariencia de toda la aplicación inmediatamente.
- [x] Cerrar sesión desde esta pantalla revoca la sesión y redirige a `/login`.
- [ ] **A validar en implementación**: guardar el tema en `users.theme` vía `PATCH /perfil`, para que persista entre dispositivos (no solo en el navegador actual).
- [ ] **A validar en implementación**: editar nombre/zona horaria de la empresa desde esta pantalla (requiere permiso — probablemente algo como `empresa.editar`, que no existe todavía en el catálogo).
- [ ] **A validar en implementación**: editar el umbral de confianza de Captura IA desde aquí, conectado a la tabla `configuraciones` real (si se construye).

## Edge Cases

- Usuario sin `name` (`user?.name ?? "Invitado"`) — cubierto con fallback visual.
- Cambiar tema mientras `mounted === false` (antes de la hidratación) — el botón existe pero no muestra estado "activo" hasta que el componente termina de montar en cliente.

## Future Improvements

- Construir `ProfileController` (`GET/PATCH /perfil`, `POST /perfil/avatar` — Módulo 9, ya documentado en `04_TECHNICAL_SPEC/API.md`) y conectar esta pantalla a datos reales de usuario (nombre editable, avatar, idioma, zona horaria personal).
- Decidir si "datos de empresa" pertenece a esta pantalla o a un módulo de Empresa separado (hoy no existe ningún `EmpresaController` — la única empresa hoy es el registro demo sembrado por `DatabaseSeeder`).
- Conectar el umbral de confianza de Captura IA a una fuente real y editable, si el negocio decide que debe ser configurable por empresa (ver `AI_Capture.md`, "Future Improvements").
