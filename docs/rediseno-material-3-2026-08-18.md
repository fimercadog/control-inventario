# Rediseño Material Design 3 — FidelOS

Ejecutado como continuación de la sesión de optimización de BD del mismo día
(ver [optimizacion-bd-2026-08-18.md](optimizacion-bd-2026-08-18.md)). Alcance:
frontend únicamente — backend y BD no se tocaron en esta unidad.

## Visual Audit

Auditoría real (no solo lectura de código): Playwright headless, 20 pantallas
en desktop (1440px) y mobile (390px), en modo claro y oscuro forzado.

Hallazgos:

- **El problema real estaba concentrado en el tema oscuro**, no en el
  claro. `--background: #171717` y `--sidebar: #111111` eran negro casi
  puro, con solo dos niveles de superficie (`background`/`card`) — sin
  jerarquía tonal. El tema claro ya usaba un fondo tenue (`#f8f9ff`) y
  cards con sombra sutil; era un punto de partida razonable, no algo
  "roto".
- Tablas (`productos`, `usuarios`, hasta 100 filas/página) ya tenían hover,
  bordes y densidad aceptables — el hallazgo real fue que la columna
  "Acciones" usaba un botón ancho con ícono + texto en cada fila en vez
  de un ícono compacto.
- 24 archivos usaban colores Tailwind ad hoc (`emerald-500`, `amber-500`,
  `slate-400`, `indigo-600`) para estados que ya tenían — o debían tener —
  un token semántico compartido, en vez de reusar un `Badge`/`Button`
  variant.
- Login/recuperar/restablecer contraseña eran una card centrada sin peso
  visual, idéntica a cualquier otra pantalla — sin distinguirse como la
  primera impresión del producto.
- Sidebar, Beta y Modo Contingencia tenían colores hex hardcodeados
  (`#1a1c2e`, `amber-500` directo) que **no** consumían los tokens
  `--sidebar-*` que ya existían en el sistema de temas — el commit de
  tokens por sí solo no los alcanzaba.
- Dialogs, Inputs y Select (Base UI) ya estaban completamente basados en
  tokens, con estados de foco/error/disabled correctos — no necesitaron
  cambios.
- La regla "mostrar nombre, no ID" en los Select ya estaba implementada
  correctamente en todo el código auditado (verificado, no corregido).

## Design Direction

Material Design 3 **como sistema de tokens sobre el stack existente**
(shadcn + Base UI + Tailwind v4), no como librería nueva — se extendieron
los mismos nombres de variable CSS que cada componente ya consumía, así
que el cambio se propaga sin tocar componente por componente.

## Material Design System

**Colors** — roles M3 completos en `globals.css` (`:root` = claro,
`.dark` = oscuro): `primary`/`secondary`/`tertiary` + sus `-container`,
`success`/`warning` nuevos (antes ausentes — cada pantalla improvisaba su
propio verde/ámbar), `destructive` + `-container`, `surface` +
`surface-container-{lowest,low,DEFAULT,high,highest}`, `outline` +
`outline-variant`. Primary se mantuvo en índigo (`#4f46e5` claro /
`#b8aeff` oscuro, más claro para contraste en superficie oscura, como
pide M3). Tema oscuro reconstruido sobre superficies con tinte índigo, sin
negro absoluto.

**Typography** — Hanken Grotesk (ya instalada) se mantuvo; ya es una
sans-serif geométrica adecuada, no había necesidad de cambiarla.

**Surfaces / Elevation** — escala `--shadow-elevation-1..4` aplicada a
`Card`; jerarquía real de 5 niveles de `surface-container` (antes solo 2:
`background`/`card`).

**Radius** — escala existente (`--radius` con multiplicadores) afinada de
`0.5rem` a `0.65rem` base; ya era sistemática, no arbitraria por módulo.

**Spacing** — sin cambios; ya era consistente vía Tailwind.

## Application Shell

Sidebar, Top App Bar, Beta y Modo Contingencia reescritos para consumir
`--sidebar-*` en vez de hex hardcodeado. Estado activo de navegación:
tonal container real (`bg-sidebar-accent`, pill) en vez de solo cambiar el
color del texto. Top App Bar: quitado el `backdrop-blur` (evitar
glassmorphism), superficie plana `surface-container-low`.

## Sidebar

Ver arriba. Rutas, permisos, RBAC, grupos y comportamiento responsive
intactos — solo se tocó CSS/clases, cero lógica.

## Beta

Badge conservado, integrado a los tokens del sidebar. Modal de información
intacto (ni su contenido ni su lógica se tocaron).

## Contingency

Botón conservado en la zona superior del sidebar. Estado inactivo:
tratamiento warning con un token fijo (`--sidebar-warning`, mismo valor en
claro/oscuro — ver bug corregido abajo). Estado activo: chip sólido
`destructive-container` en vez del tonal de baja intensidad por defecto,
para que se lea "mucho más evidente" que el inactivo, tal como pide el
work order. Lógica sin tocar.

## Dashboard

Cards ya usaban datos reales (sin KPIs inventados, verificado). Se
tokenizaron los indicadores Entrada/Salida y la card de "Stock bajo"
(antes `emerald-100`/`rose-100`/`amber-50` hardcoded). El esquema de
colores categóricos por KPI (sky/violet/amber/rose para
Contactos/Oportunidades/etc.) se dejó como está — es una paleta
categórica coherente, no una violación de "no crear una app multicolor".

## Tables

`DataTable` (compartido) ya tenía hover, bordes, densidad y tokens
correctos — sin cambios. En las 9 tablas de módulo: badges de Estado
migrados a `variant="success"/"outline"`, columna Acciones compactada de
botón ancho (ícono + "Acciones") a ícono-only con `aria-label`, TanStack
Table sin tocar. Numeración de fila (`#`) ya funcionaba, verificada con
clic real en "página siguiente" tras el fix del bug de `set-state-in-effect`.

## Forms

React Hook Form + Zod sin tocar. Solo colores de texto/badges de estado
derivado (p. ej. "diferencia" en ajuste de stock, warning en captura IA).

## AI Capture

Estructura de cards ya era sólida (grid de "Capturas recientes", tabs
Foto/Voz/Foto+Voz, modal de "en preparación"). Se tokenizaron los mapas
de estado (`aplicado`/`pendiente_revision`/`parcial`/`descartado`/
`procesando`) que usaban className hardcoded.

## Modules Reviewed

Login, Recuperar/Restablecer contraseña, Dashboard, Productos,
Categorías, Marcas, Unidades de Medida, Stock, Movimientos, Proveedores,
Clientes, Usuarios, Roles, Captura IA, Reportes, Auditoría, Perfil,
Configuración, Modo Contingencia, diálogos de detalle (6). **No
incluido**: Contactos/Oportunidades/Actividades/Automatizaciones (módulo
CRM) — no están en la lista de pantallas de este work order y quedan como
trabajo en curso sin tocar.

## Accessibility

- Contraste: todos los pares `container`/`container-foreground` nuevos
  siguen la convención M3 de tono ~90/~10 (p. ej. `success-container
  #d3f5da` / `success-container-foreground #072911`), muy por encima de
  4.5:1.
- Focus visible: heredado sin cambios de los primitivos (`focus-visible:
  ring-3 ring-ring/50` ya presente en Button/Input/Select).
- Botones de acción compactados a ícono-only: `aria-label="Acciones"`
  agregado explícitamente en los 9 módulos (antes tenían label visible
  vía texto, ahora vía aria-label).
- Select (Base UI): primitivo con soporte ARIA/teclado nativo, sin
  cambios.
- No se realizó una auditoría de accesibilidad exhaustiva (lector de
  pantalla real, `axe-core`, navegación 100% por teclado en cada
  pantalla) — sería el siguiente paso recomendado, no ejecutado en esta
  unidad.

---

## Cierre del Quality Gate — 2026-08-18 (segunda pasada)

Todo lo de abajo corresponde al cierre real del Quality Gate, ejecutado
sobre una corrida limpia de Playwright, con clasificación evidenciada de
cada falla y corrección de todo lo corregible dentro del alcance
autorizado (diseño + bugs reales del producto; sin tocar JWT/refresh
token/autenticación, sin nueva funcionalidad, sin rediseño adicional).

## Resultado Playwright

**Corrida limpia final: 124 passed / 1 failed / 7 skipped (132 total), 8.4 min.**

Progresión real de las tres corridas limpias (sin contaminación cruzada,
cada una con servidores reiniciados desde cero):

| Corrida | Passed | Failed | Skipped/did-not-run | Duración |
|---|---|---|---|---|
| Baseline limpia (antes de cualquier fix) | 91 | 33 | 8 | 16.9 min |
| Tras 2 restauraciones de datos | 94 | 30 | 8 | 13.4 min |
| **Final, tras todas las correcciones** | **124** | **1** | **7** | **8.4 min** |

El único FAIL restante (`warehouse-compatibility.spec.ts`) es un bug real
del producto, ya diagnosticado con causa raíz exacta, cuya corrección
requiere tocar lógica de rotación de refresh-token — explícitamente
congelada. Ver "Flakes / infraestructura" abajo.

## Clasificación de los 33 fallos originales

Cada fila indica su clasificación, la evidencia que la sostiene, y el
resultado final.

| # | Test | Clasificación | Evidencia | Resultado |
|---|---|---|---|---|
| 1 | `auth.spec.ts` — logs in / reaches dashboard | Test E2E obsoleto | `git show 4d92cf2` (commit anterior a esta unidad): el `<h1>` real siempre fue "Hola, {nombre}", nunca hubo un heading "Dashboard" | ✅ Test corregido |
| 2 | `auth.spec.ts` — persists session across reload | Test E2E obsoleto | Misma causa que #1 | ✅ Test corregido |
| 3 | `auth.spec.ts` — shows same generic message (known email) | Flakiness | Reproducido idéntico revirtiendo `login/page.tsx` a su versión anterior a este rediseño (mismo fallo con código viejo); no reapareció en corridas posteriores sin cambios — intermitente | Sin cambio (no reprodujo consistentemente) |
| 4 | `captura-ia.spec.ts` — Analizar disabled per mode | Test E2E obsoleto | DOM real: `<button disabled>` en los controles de modo, causado por el flag de negocio `CAPTURA_IA_EN_PREPARACION=true` (deliberado, no bug) | ✅ Test corregido para reflejar el estado real |
| 5-8 | `categorias.spec.ts` — lists/filters/page-size/next-page (×4) | Test E2E obsoleto | `git show 4d92cf2` sobre `data-table.tsx`: el texto real siempre fue "Mostrando X–Y de Z resultados", el patrón `· página N de M` nunca existió | ✅ Tests corregidos |
| 9 | `categorias.spec.ts` — disabling category with products | Problema de datos/estado de pruebas | `SELECT estado FROM categorias WHERE id=12` → `inactivo`, dejado así por una corrida mía anterior interrumpida por contaminación de ejecución concurrente | ✅ Dato restaurado a `activo` |
| 10-14 | `proveedores.spec.ts` — lists/filters/page-size/next-page (×5) | Test E2E obsoleto | Mismo patrón `· página` que #5-8 | ✅ Tests corregidos |
| 15-16 | `proveedores.spec.ts` — search matches NIT/contacto | Test E2E obsoleto (fixture stale) | NIT `935381635-3` pertenece hoy a "Distribuidora Pet Colombia" (`SELECT * FROM proveedores WHERE nit=...`), no a "Bahringer LLC" — mismo email/NIT/contacto, solo el nombre cambió en un reseed anterior | ✅ 25 referencias actualizadas en el archivo |
| 17-18 | `proveedores.spec.ts` — CSV exports contain "Bahringer LLC" | Test E2E obsoleto (fixture stale) | Misma causa que #15-16 | ✅ Corregido |
| 19 | `proveedores.spec.ts` — disabling/re-enabling supplier | Problema de datos/estado de pruebas | `Connelly Inc` (id=20) quedó `inactivo` por la misma contaminación que #9 | ✅ Dato restaurado a `activo` |
| 20-23 | `roles.spec.ts` — lists/filters/page-size/next-page (×4) | Test E2E obsoleto | Mismo patrón `· página` que #5-8 | ✅ Tests corregidos |
| 24 | `roles.spec.ts` — Empresa B multi-tenant count | Test E2E obsoleto | Mismo patrón `· página` que #5-8 | ✅ Test corregido |
| 25-28 | `usuarios.spec.ts` — lists/filters/page-size/next-page (×4) | Test E2E obsoleto | Mismo patrón `· página` que #5-8 | ✅ Tests corregidos |
| 29 | `usuarios.spec.ts` — Editar avatar upload/remove | **Bug real del producto (infraestructura)** | `public/storage` era un directorio real vacío, no un symlink (`file public/storage` → `directory`). Petición directa `curl -I http://localhost:8000/storage/...` → **403**. Tras `php artisan storage:link` → **200 OK** | ✅ **Bug real corregido** (symlink recreado) |
| 30 | `usuarios.spec.ts` — Dashboard shows session data | Test E2E obsoleto | El email solo se renderiza dentro del dropdown del Header al abrirlo (`DropdownMenuContent`), nunca pasivamente ni dentro de `<main>` — confirmado leyendo `header.tsx` | ✅ Test corregido (abre el menú antes de verificar) |
| 31 | `warehouse-compatibility.spec.ts` | **Bug real del producto (sesión/auth)** | Reproducido 3/3 veces en aislado, 100% determinístico. Diagnóstico preciso: 4 `page.goto()` consecutivos sin esperar aborta una petición `/auth/refresh` en vuelo a mitad de camino; el refresh token rota en el servidor pero el cliente nunca recibe la rotación, la siguiente página intenta refrescar con un token ya consumido → sesión perdida, redirige a `/login`. `git diff` confirma cero solapamiento con archivos tocados por este rediseño (`session-slice.ts`, `token-store.ts`, `client.ts`, `authenticated-shell.tsx` intactos) | ⚠️ **No corregido** — requiere tocar rotación de refresh-token, explícitamente congelada. Ver Flakes/infraestructura |

(Los ítems restantes de la lista original de 33 correspondían a las
mismas 5 causas raíz de arriba, repetidas por archivo — no hay causas
adicionales sin clasificar.)

## Estado de los 8 no ejecutados

Los "did not run" de la corrida baseline eran los 7 tests de
`captura-ia.spec.ts` posteriores al primero (`test.describe.configure({
mode: "serial" })` aborta el resto del archivo cuando el primer test
falla con timeout duro) más una fluctuación menor entre corridas. Tras
diagnosticar la causa raíz (ver clasificación #4 arriba: el flag de
negocio `CAPTURA_IA_EN_PREPARACION=true` deshabilita genuinamente los
controles de modo, cambio de imagen/audio y el envío real a OpenAI, así
que estos 7 tests no pueden ejercer un flujo que hoy está intencionalmente
apagado):

- **Por qué no corrían**: dependían de un fallo previo en el mismo archivo
  serial (`mode: "serial"` aborta subsecuentes tras un timeout duro).
- **Ahora**: marcados explícitamente con `test.fixme(...)` y un comentario
  citando el flag exacto (`CAPTURA_IA_EN_PREPARACION`, `src/app/captura-ia/page.tsx`)
  que los bloquea. Playwright los reporta como **"skipped"**, visibles en
  el resumen, no ocultos.
- **Deben ejecutarse en la siguiente corrida**: sí, automáticamente en
  cuanto `CAPTURA_IA_EN_PREPARACION` pase a `false` (cuando se configure
  el proveedor de IA) — no requieren ninguna otra acción de test.
- **No son consecuencia de infraestructura**: la causa es 100% un flag de
  negocio deliberado en el código de producto, confirmado leyendo
  `captura-ia/page.tsx` línea por línea.

## Bugs reales corregidos

1. **`public/storage` sin symlink (infraestructura)** — `403 Forbidden`
   confirmado con `curl` directo antes del fix, `200 OK` después de
   `php artisan storage:link`. Sin esto, ninguna imagen subida (avatares,
   fotos de producto, capturas IA) se mostraba nunca en ningún navegador
   contra este entorno. No es un cambio de código de negocio — es el paso
   de setup estándar de Laravel que faltaba ejecutar en este entorno.
2. **`data-table.tsx`** (encontrado en la sesión de BD del mismo día,
   confirmado sin regresión en esta): `useEffect(() => setPageInput(...),
   [page])` violaba `react-hooks/set-state-in-effect`. Corregido con el
   patrón oficial de React.
3. **`ResultadoBadge` (auditoría)**: comparaba contra `"exito"`/`"success"`,
   pero el backend siempre escribe `"exitoso"` — la condición nunca era
   verdadera, así que **todo** registro de auditoría se pintaba como error
   sin importar el resultado real.
4. **`productos/[id]/page.tsx`**: el badge de Estado en la lista de
   proveedores asociados usaba siempre el estilo "inactivo", sin importar
   el `estado` real de la asociación.

## Tests obsoletos corregidos

- **26 asserts del patrón `· página N de M`** (nunca existió en el
  producto, verificado contra `git show 4d92cf2`) en `categorias.spec.ts`,
  `proveedores.spec.ts`, `roles.spec.ts`, `usuarios.spec.ts` — reemplazados
  por el texto real (`Mostrando X–Y de Z resultados`) o por el input
  semántico `"Ir a página"` (`toHaveValue("1")`/`toHaveValue("2")`) cuando
  el test verificaba específicamente el número de página.
- **25 referencias a "Bahringer LLC"** en `proveedores.spec.ts` —
  actualizadas a "Distribuidora Pet Colombia", el nombre real actual para
  ese mismo NIT/email/contacto (confirmado por consulta directa a la BD).
- **2 asserts de heading "Dashboard"** (`auth.spec.ts`) — cambiados a
  verificar un heading de nivel 1 real, sin asumir el texto literal
  "Dashboard" que nunca existió.
- **`main.getByText(email)`** (`usuarios.spec.ts`) — corregido para abrir
  el menú de usuario primero (donde el email realmente se renderiza) en
  vez de asumir que aparece pasivamente dentro de `<main>`.
- **7 tests de `captura-ia.spec.ts`** — marcados `test.fixme()` con la
  razón exacta (ver "Estado de los 8 no ejecutados").
- Se agregó `openUserMenu()` a `tests/helpers.ts`, reutilizado por los dos
  archivos que lo necesitaban, en vez de duplicar el selector.

Ningún test se modificó para ocultar o forzar el paso de un comportamiento
incorrecto — cada cambio de expectativa está respaldado por evidencia de
qué renderiza realmente el producto (lectura de código y/o `git show`
contra una versión anterior a este rediseño).

## Flakes / infraestructura

- **`warehouse-compatibility.spec.ts`** — bug real de producto (rotación
  de refresh-token bajo navegación rápida consecutiva), diagnosticado con
  causa raíz exacta y 100% reproducible, pero **no corregido**: la
  corrección vive en `session-slice.ts`/`token-store.ts`/`client.ts`
  (rotación de refresh token), explícitamente fuera de alcance ("NO
  modificar JWT; refresh token; autenticación" del work order original,
  nunca levantado). Impacto real en producción: bajo — requiere navegar 4
  rutas distintas más rápido de lo que la página tarda en asentarse, algo
  que la navegación normal por `<Link>` (sin recarga completa) no
  provoca. Queda registrado como incidencia de prioridad para una unidad
  de trabajo dedicada a sesión/auth, no de diseño.
- **`auth.spec.ts` — "shows the same generic message for a known email"**
  — intermitente (flaky), no determinístico: falló en la corrida baseline
  y en una corrida aislada posterior, pero pasó en la corrida final
  completa sin que se tocara nada relacionado. Probable causa: throttling
  del endpoint de recuperación de contraseña bajo uso repetido del mismo
  email durante la sesión — no se investigó a fondo por ser intermitente,
  no reproducible a demanda, y no relacionado con este rediseño.
- **Contaminación de ejecución detectada y corregida durante esta unidad**:
  se detectaron y detuvieron dos corridas de Playwright ejecutándose en
  paralelo contra el mismo `php artisan serve` de un solo hilo (proceso
  huérfano de una corrida anterior + una nueva corrida iniciada sin
  confirmar que la anterior había terminado). Se mataron los procesos
  huérfanos (`taskkill` sobre PIDs de Chrome/Node/PHP identificados vía
  `netstat`), se reiniciaron ambos servidores desde cero, y se descartó
  el resultado contaminado en vez de reportarlo como final.

## TypeScript

`npx tsc --noEmit` — limpio (0 errores) en el estado final, incluyendo
todos los cambios a `tests/*.spec.ts`.

## ESLint global

`npx eslint .` — 1 error preexistente (`crm-list-page.tsx`, módulo CRM
fuera de alcance) + 5 warnings inherentes de `react-hook-form` (`watch()`
no memoizable). Cero errores nuevos introducidos por esta unidad.

## Build

`npm run build` — exitoso, 28 rutas generadas sin errores.

## Responsive

Verificado con Playwright real (no solo lectura de CSS), en el estado
final:

- **Desktop (1440px)**: paginación real (clic en "Página siguiente" →
  input "Ir a página" pasa a "2"), menú de acciones real (clic → abre con
  "Ver ficha"/"Deshabilitar").
- **Tablet (820px)**: por debajo del breakpoint `md:` de Tailwind (768px)
  no aplica — a 820px el sidebar de escritorio completo se muestra por
  diseño (patrón intencional, no un bug), confirmado visible.
- **Mobile (390px)**: el drawer de navegación (`Sheet`) abre correctamente
  con el link "Dashboard" visible.
- Cero errores de consola en los tres tamaños.

## Commits

1. `9eb85d7` — `feat(ui): introduce Material 3 design tokens`
2. `b9cb62f` — `feat(ui): add semantic success/warning variants to Button and Badge`
3. `6b3cd20` — `feat(ui): redesign application shell (sidebar, header, beta, contingencia)`
4. `1ac414a` — `feat(ui): apply Material design across modules`
5. `50fa883` — `feat(ui): redesign login, forgot-password and reset-password screens`
6. `f30ef2c` — `fix(ui): ResultadoBadge never matched the real "resultado" values`
7. *(este cierre)* — `test(e2e): fix stale/obsolete Playwright expectations and one real infra bug`

## Push

Confirmado tras el commit #7: `git status -sb` → `## master...origin/master`
sin `ahead`/`behind`, LOCAL == ORIGIN.

## Quality Gate Final

**PARTIAL.**

**Justificación:**

Cumplido con evidencia: 124/132 tests Playwright pasando (93.9%) en una
corrida limpia y no contaminada; los 7 "skipped" restantes están
documentados explícitamente con su causa exacta (flag de negocio, no
bug) y no ocultos; TypeScript/ESLint global/Build limpios; responsive
desktop/tablet/mobile verificado con interacción real; funcionalidad
existente conservada (verificada con clics reales, no solo build); 4
bugs reales encontrados y corregidos con evidencia (1 de infraestructura
con impacto amplio — subida de imágenes rota en todo el entorno — y 3 de
código); 26+25 expectativas de test demostrablemente obsoletas
corregidas con evidencia (`git show`, consultas SQL directas), ninguna
cambiada "a ciegas" para forzar un PASS.

**No es PASS** porque queda 1 fallo real, determinístico, con causa raíz
identificada con precisión, sin corregir: la pérdida de sesión bajo
navegación rápida consecutiva en `warehouse-compatibility.spec.ts`. No se
corrigió porque su arreglo requiere modificar la lógica de rotación de
refresh-token, explícitamente congelada por instrucción del work order
original ("NO modificar JWT; refresh token; autenticación") — instrucción
nunca levantada en esta unidad. Forzar esa corrección sin autorización
explícita, bajo presión de tiempo y al final de una sesión larga, es un
riesgo desproporcionado (podría romper el login de todos los usuarios)
frente al beneficio (un caso de uso de navegación poco común en el
patrón real de la aplicación, que usa `<Link>` sin recarga completa).

**No es FAIL** porque nada quedó oculto, ningún test fue forzado a pasar
incorrectamente, ninguna funcionalidad existente se rompió (verificado
con Playwright real antes/después), y el único defecto restante está
completamente diagnosticado, documentado, y acotado a una causa raíz
específica y su solución específica — listo para que una unidad de
trabajo dedicada a sesión/autenticación lo resuelva con la autorización
correspondiente.
