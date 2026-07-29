# Frontend — Technical Spec

> Reemplaza `docs/_ARCHIVE/EMPTY_07_FRONTEND_DRAFT.md` (19 líneas, nunca fue desarrollado). Describe la carpeta `frontend/` tal como existe hoy, verificada contra el código. Consistente con `Architecture.md` (sección "Frontend" del Módulo Auth) y `API.md`.

## 1. Stack real (verificado contra `frontend/package.json`)

| Capa | Elegido | Nota |
|---|---|---|
| Framework | Next.js 16 (App Router) | `frontend/app/` |
| Lenguaje | TypeScript (strict, `tsc --noEmit` en `type-check`) | |
| Estilos | Tailwind CSS v4 + `tw-animate-css` | `app/globals.css` |
| Componentes base | shadcn (`components/ui/*`) sobre `@base-ui/react` | Button, Dialog, Table, Sidebar, etc. |
| Estado global | Redux Toolkit (`@reduxjs/toolkit`, `react-redux`) | único slice real: `auth-slice.ts` |
| HTTP | Axios (`lib/api/client.ts`) | `withCredentials: true` para la cookie httpOnly del refresh token |
| Formularios | `react-hook-form` + `@hookform/resolvers` + Zod | dependencias presentes; sin formularios complejos construidos aún (no hay CRUD de Productos) |
| Iconos | `lucide-react` | |
| Notificaciones | `sonner` (Toaster) | |
| Animación | `framer-motion` | |
| Tema | `next-themes` (`theme-provider.tsx`) | light/dark/system |

Esto coincide con el stack oficial declarado en `CLAUDE.md` (Next.js, TypeScript, Tailwind, Redux Toolkit) y con el §44 del master spec, con una diferencia real: el master spec proponía TanStack Table y Recharts; el código no los usa todavía (no hay tablas de datos server-driven ni gráficos reales — el Dashboard usa `StatCard` con datos mock).

## 2. Estructura de carpetas real

```
frontend/
├── app/                          # Next.js App Router
│   ├── (app)/                    # grupo de rutas autenticadas, comparten layout.tsx con sidebar
│   │   ├── layout.tsx             # aplica useRequireAuth + AppSidebar
│   │   ├── dashboard/page.tsx
│   │   ├── productos/page.tsx     # usa MOCK_PRODUCTS — sin API real todavía
│   │   ├── movimientos/page.tsx   # usa datos mock — sin API real todavía
│   │   ├── configuracion/page.tsx
│   │   └── captura/               # Captura IA — único módulo con API real end-to-end
│   │       ├── page.tsx           # selector de modo (foto/voz/foto+voz)
│   │       ├── foto/page.tsx
│   │       ├── voz/page.tsx
│   │       ├── foto-voz/page.tsx
│   │       └── revisar/[uuid]/page.tsx   # cola de revisión de una captura
│   ├── login/page.tsx
│   ├── olvide-password/page.tsx
│   ├── restablecer-password/page.tsx
│   ├── layout.tsx                 # root layout, monta <Providers>
│   ├── providers.tsx              # Redux Provider + bootstrap de sesión + Theme + Toaster
│   └── page.tsx                   # redirect raíz
├── components/
│   ├── ui/                        # primitives shadcn (Button, Table, Dialog, Sidebar, ...)
│   ├── app-sidebar.tsx             # navegación, NAV_ITEMS declarativo
│   ├── review-screen.tsx, review-product-card.tsx, confidence-badge.tsx  # Captura IA
│   ├── ai-processing-state.tsx, voice-wave.tsx  # estados de carga de Captura IA
│   ├── stat-card.tsx               # Dashboard
│   └── empty-state.tsx             # estado vacío reutilizable
├── hooks/
│   ├── use-require-auth.ts         # guard de rutas autenticadas
│   ├── use-audio-recorder.ts       # captura de voz
│   └── use-mobile.ts
├── lib/
│   ├── api/
│   │   ├── client.ts               # instancia Axios + interceptores + unwrap/ApiError
│   │   ├── auth-token.ts           # access token en memoria (nunca localStorage)
│   │   ├── auth.ts                 # login/refresh/logout
│   │   ├── captura-ia.ts           # llamadas reales a /captura-ia/*
│   │   └── types.ts
│   ├── mock/                       # dashboard.ts, data.ts, types.ts — Productos/Movimientos/Dashboard
│   ├── config.ts                   # API_URL desde NEXT_PUBLIC_API_URL
│   ├── format.ts, color-from-string.ts, utils.ts, types.ts
├── store/
│   ├── store.ts                    # configureStore
│   ├── hooks.ts                    # useAppDispatch/useAppSelector tipados
│   └── slices/auth-slice.ts        # único slice real: user, status, error
```

No existe `modules/` (auth/products/inventory/...) como proponía el master spec §44 — la organización real es por **tipo** (`app/`, `components/`, `lib/`, `store/`, `hooks/`), no por módulo de negocio. Esto es una decisión real del código, no un error de esta documentación: a este tamaño de proyecto (un slice de Productos + Captura IA + Auth), la organización modular propuesta habría sido prematura. Si el catálogo de pantallas crece (Compras, Ventas, Usuarios, Roles), reevaluar hacia carpetas por módulo es candidato a un ADR futuro.

## 3. Gestión de estado — Redux Toolkit

Un único slice real hoy: `store/slices/auth-slice.ts`.

- Estado: `{ user: AuthenticatedUser | null, status: 'idle'|'loading'|'authenticated'|'unauthenticated', error: string | null }`.
- Thunks: `bootstrapAuth` (refresh silencioso contra la cookie httpOnly al cargar la app), `loginThunk`, `logoutThunk`.
- El **access token nunca se guarda en el store de Redux serializado ni en `localStorage`** — vive en una variable de módulo en memoria (`lib/api/auth-token.ts`, `getAccessToken`/`setAccessToken`), consistente con `Architecture.md` ("Tokens en cookies httpOnly"). El store solo guarda el usuario y el estado de la sesión.
- `status: 'idle'` existe específicamente para evitar el parpadeo de redirect a `/login` mientras el refresh silencioso todavía no resolvió (ver `use-require-auth.ts`).

Datos que **todavía no están en Redux**: Productos, Movimientos, Captura IA (historial). Las pantallas de Productos/Movimientos leen de `lib/mock/*` con `useState`/`useMemo` locales; Captura IA llama directamente a `lib/api/captura-ia.ts` desde los componentes de página, sin slice propio. Cuando estos módulos tengan API real, la convención a seguir es la misma que `auth-slice.ts`: un slice por dominio, thunks async, nunca lógica de negocio dentro de un componente.

## 4. Routing — Next.js App Router

- `app/(app)/` es un **route group**: agrupa todas las pantallas autenticadas bajo un `layout.tsx` común que aplica `useRequireAuth()` y monta `<AppSidebar>`, sin afectar la URL (no aparece `/(app)/` en la ruta real).
- Rutas públicas (`/login`, `/olvide-password`, `/restablecer-password`) están fuera del grupo, sin sidebar.
- Rutas dinámicas: `captura/revisar/[uuid]` — usa el `uuid` de `CapturaIA` como route key, igual que el backend (nunca el id numérico).
- No hay rutas anidadas de negocio más allá de Captura IA todavía (no hay `/productos/[id]`, por ejemplo — no hay pantalla de detalle/edición de producto).

## 5. Guard de autenticación

`hooks/use-require-auth.ts` lee `state.auth.{user,status}` de Redux. Redirige a `/login` **solo** cuando `status === 'unauthenticated'` (nunca en `'idle'`), para no expulsar a un usuario con sesión válida durante una recarga de página mientras el refresh silencioso todavía está en vuelo. `app/(app)/layout.tsx` es el único punto donde se invoca — no se repite el guard por pantalla.

`PermissionContext`/`usePermission(perm)` y la variante `requiredPermission` de `useRequireAuth` descritas en `Architecture.md` (Módulo 3, Authorization) **no existen todavía en el código** — el guard actual solo verifica autenticación, no permisos, porque RBAC de permisos (Módulo 3) no está implementado. `AppSidebar` tampoco filtra `NAV_ITEMS` por permiso todavía (los 4 items son fijos); el campo `permission?` por item descrito en `Architecture.md` es diseño para cuando Módulo 3 se construya, no código actual.

## 6. Cliente API — convenciones (`lib/api/client.ts`)

- Instancia Axios única (`apiClient`), `withCredentials: true` (obligatorio para que el navegador envíe/reciba la cookie httpOnly del refresh token entre `localhost:3000` y `localhost:8000`).
- Interceptor de request: agrega `Authorization: Bearer <token>` leyendo el access token en memoria.
- Interceptor de response: en un 401 (y la request no es `/auth/login` ni `/auth/refresh`, y no se reintentó antes) dispara **un único** refresh compartido (`refreshPromise` deduplicado — si varias requests fallan a la vez, todas esperan el mismo refresh) y reintenta la request original una vez; si el refresh también falla, notifica `sessionExpired` y el store redirige a `/login`.
- `ApiError` — clase de error normalizada (`message`, `status`, `fieldErrors`) para nunca mostrar JSON crudo del backend en la UI.
- `unwrap<T>()` — desenvuelve el sobre `{success, message, data}` (ver `API.md`, "Formato de Respuesta") y devuelve el payload tipado, o lanza `ApiError`.

Todo módulo nuevo de API (`lib/api/productos.ts`, etc.) debe seguir el mismo patrón que `lib/api/captura-ia.ts`: funciones async delgadas que llaman `apiClient` + `unwrap`, nunca lógica de negocio ni transformación compleja en el componente de página.

## 7. Convenciones de componentes

- `components/ui/*` — primitives shadcn, genéricos, sin conocimiento de dominio (Button, Table, Dialog, Select...). Nunca se edita su lógica interna para un caso de uso puntual; se componen desde afuera.
- `components/*.tsx` (fuera de `ui/`) — componentes de dominio reutilizables entre pantallas: `EmptyState`, `StatCard`, `ConfidenceBadge`, `MovementTypeBadge`. Un componente de dominio nunca hace fetch directo — recibe props ya resueltas por la página o un hook.
- Páginas (`app/**/page.tsx`) — orquestan: leen datos (mock o API), arman el estado local de UI (filtros, búsqueda), y componen componentes de `ui/`+dominio. Sin JSX de lógica de negocio compleja inline.
- Todas las páginas marcadas `"use client"` — no hay Server Components de negocio en este frontend todavía (el consumo es 100% vía API REST con estado en cliente, consistente con "API First" del master spec §73: el frontend nunca toca la base de datos, ni siquiera indirectamente vía Server Components con acceso a Laravel).

## 8. Estados de carga / vacío / error (obligatorios, `AGENTS.md` "Frontend Rules")

Patrones verificados en el código real:

- **Loading**: `components/ui/skeleton.tsx` para listas/tablas; `ai-processing-state.tsx` para el pipeline de Captura IA (que puede tardar varios segundos por la llamada a IA).
- **Empty**: `components/empty-state.tsx` — genérico, recibe ícono/título/descripción/acción; usado en Productos cuando el filtro no matchea nada (`SearchX`) y en Captura IA para historial vacío.
- **Error**: `ApiError` desde `lib/api/client.ts` + `sonner` (`Toaster`) para feedback inmediato; formularios usan mensajes de campo (`fieldErrors`) cuando el backend responde 422.
- **Confidence badge**: patrón específico de Captura IA (`confidence-badge.tsx`) — no es un estado de carga/error genérico, es UI de dominio (visualiza `confidence` del contrato de IA, master spec §74).

## 9. Responsive

Captura IA es explícitamente mobile/tablet-first (cámara/micrófono nativo, sin formularios largos — ver `docs/_ARCHIVE/EMPTY_07_FRONTEND_DRAFT.md` original y `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` §74). El resto de la UI (Dashboard, Productos, Movimientos) usa el sidebar colapsable de shadcn (`collapsible="icon"`, `use-mobile.ts` para breakpoint) — mismo patrón en toda la app, no hay una implementación de responsive distinta por pantalla.

## 10. Brechas conocidas frente a lo documentado en otras fuentes

- Productos/Movimientos/Dashboard corren sobre **datos mock** (`lib/mock/*`) — no hay integración real con un backend de Productos/Movimientos (el backend tampoco expone esos endpoints REST todavía, ver `API.md`).
- No hay tests de frontend (ver `docs/06_TESTS/ManualTestCases.md`, gap conocido).
- No hay TanStack Table ni Recharts pese a estar en la propuesta original del master spec — no se han necesitado aún.
