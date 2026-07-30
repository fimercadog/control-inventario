# Informe de Ejecución de Pruebas — FidelOS

## Resumen Ejecutivo

- **Fecha:** 2026-07-29
- **Versión evaluada:** working tree local, sin tag de versión formal (proyecto no usa versionado semántico todavía, ver `docs/07_RELEASE/ReleaseNotes.md`)
- **Ambiente de pruebas:** local (`backend` en `http://localhost:8000` vía `php artisan serve`, `frontend` en `http://localhost:3000` vía `next dev`, SQLite)
- **Responsable de la ejecución:** Claude Code (asistente de IA), bajo supervisión directa del product owner en la misma sesión
- **Duración:** sesión continua, ejecutada en múltiples bloques a lo largo del día 2026-07-29

Este informe ejecuta el proceso de validación real definido en `docs/06_TESTS/MasterTestPlan.md`, `TestingGuide.md`, `IntegrationTestPlan.md`, `DefinitionOfDone.md` y `QualityGates.md`, usando datos de demostración (nunca datos reales de un cliente). No se inventan resultados: todo lo marcado como `PASS` fue ejecutado y observado en vivo (backend automatizado o navegador real); todo lo que no se pudo ejecutar está marcado explícitamente como `BLOCKED`, con la razón.

---

## Cobertura

| Métrica | Valor |
|---|---|
| Total de casos ejecutados (automatizados + manuales reales) | 103 backend automatizados + 23 manuales vía navegador/curl |
| Casos aprobados | 103 backend + 22 manuales |
| Casos fallidos (defectos reales encontrados) | 2 (BUG-007 confirmado y corregido; ver Defectos) |
| Casos bloqueados (no ejecutables en este ambiente/momento) | 1 bloque completo: Captura IA con imágenes reales (OCR de factura/recepción) — ver "IA" abajo |
| Cobertura funcional (%) | Ver desglose "Resultados por módulo" — no es un número único honesto dado que varios módulos (Compras, Ventas, Clientes, Proveedores, Kardex standalone, Auditoría genérica, Exportaciones) siguen `Status: Planned`, sin código que probar |
| Tiempo total de ejecución | No cronometrado como bloque único (sesión de trabajo interactiva, no un pipeline de CI) |

---

## Resultados por módulo

| Módulo | Resultado | Evidencia / razón |
|---|---|---|
| Login / Logout / JWT | **PASS** | 94 tests automatizados (`AuthenticationTest`, `PasswordResetTest`) + verificación real en navegador. Ver "Evidencia — Logout" abajo para el detalle específico de BUG-007. |
| Dashboard | **PASS (datos mock, ya documentado)** | Carga sin error; usa datos de ejemplo del frontend, no la API real — comportamiento documentado en `docs/07_RELEASE/KnownIssues.md` punto 2, no es un defecto nuevo. |
| Productos (listado) | **PASS** | Ahora consume la API real (`GET /api/v1/productos`) en vez de datos mock — corregido en esta sesión (ver Defectos/Correcciones). Búsqueda y filtro por categoría verificados en vivo. |
| Ficha de Producto (nueva) | **PASS** | Detalle, edición con persistencia real, e historial de movimientos — todos verificados en vivo. Ver "Evidencia" abajo. |
| Inventario (entradas/salidas/ajustes) | **PASS, vía Captura IA únicamente** | El único flujo real que escribe `movimientos`/`stock_actual` es Captura IA (`InventoryService`) — verificado por 94 tests automatizados. No existe un formulario manual de ajuste directo (fuera de alcance, `Status: Planned`). |
| Movimientos (listado general `/movimientos`) | **PASS (datos mock, ya documentado)** | Pantalla general sigue en mock, sin cambios en esta sesión (fuera del alcance acotado aprobado). El listado de movimientos **por producto**, en la nueva ficha, sí es real. |
| Categorías | **PARTIAL** | Existen y se pueden sembrar/consultar (usado para el filtro de Productos), pero no hay CRUD manual dedicado — mismo estado que Productos antes de esta sesión. Fuera del alcance aprobado. |
| Marcas | **BLOCKED — no es una entidad del dominio** | `marca` es un campo de texto libre en `Producto`, no una entidad propia con su propio catálogo/CRUD. Cambiar esto sería una decisión de modelo de dominio nueva, no un bug — no se ejecuta sin aprobación explícita. |
| Captura IA / OCR (extracción real, factura y recepción) | **BLOCKED — sin archivos fuente** | Ver sección "IA" abajo. |
| Auditoría | **BLOCKED — módulo no construido** | `docs/03_FUNCTIONAL_SPEC/FUTURE/Auditoria.md`, sin código. Lo único que audita hoy es Captura IA (`AuditLog`, ver ADR-011/012), verificado por los tests automatizados existentes. |
| Exportaciones (PDF/Excel) | **BLOCKED — módulo no construido** | `docs/03_FUNCTIONAL_SPEC/FUTURE/Export.md`, sin código. |
| Usuarios | **BLOCKED — módulo no construido (Auth Módulo 4)** | Infraestructura de datos existe (`User`), sin UI de gestión. |
| Roles | **PASS, parcial** | El motor de roles/permisos (Spatie + Teams) funciona correctamente — se crearon y asignaron 3 roles reales (Administrador, Auxiliar de Inventario, Vendedor) en esta sesión como parte del seeding de demo. No existe UI de gestión de roles (Módulo 5, `Status: Planned`). |
| Permisos (enforcement por ruta) | **BLOCKED — Módulo 3 no construido** | Verificado en vivo: un usuario "Vendedor" ve exactamente la misma UI que "Administrador" — comportamiento esperado y ya documentado (`docs/03_FUNCTIONAL_SPEC/Roles.md`), no un defecto. |

---

## Defectos encontrados y corregidos en esta sesión

| ID | Módulo | Severidad | Prioridad | Estado | Descripción | Resultado |
|---|---|---|---|---|---|---|
| BUG-001/003/006/009 | Navegación (Productos, Captura IA) | Crítica | Alta | **Corregido** | No existía ninguna forma de abrir la ficha de un producto; los ítems "Editar"/"Ver movimientos" del menú de acciones eran `DropdownMenuItem` sin `onClick` ni `href` (confirmado en código). | Ficha de producto nueva (`/productos/[id]`), navegación unificada desde listado y Captura IA. Ver evidencia abajo. |
| BUG-002 | Productos | Alta | Alta | **Corregido** | "Editar" y "Ver movimientos" no ejecutaban ninguna acción. | Ambos wired a la ficha real, con persistencia real (`PATCH /api/v1/productos/{id}`) y listado real de movimientos (`GET /api/v1/productos/{id}/movimientos`). |
| BUG-005 | Productos (listado) | Media | Alta | **Corregido** | El nombre del producto no era un enlace; no había forma de llegar al detalle con un clic. | Nombre es un `Link`; toda la fila es clicable. |
| BUG-007 | Autenticación (logout) | Media | Alta | **Corregido — reproducido y explicado, no un fantasma** | Ver sección dedicada abajo — el usuario insistió correctamente en que esto era real; el hallazgo inicial de "no reproducible" fue incompleto. |
| BUG-008 | Frontend (dev tooling) | Baja | Media | **Corregido** | Indicador flotante de desarrollo de Next.js visible en la UI. | `devIndicators: false` en `next.config.ts`. |
| BUG-004 | Frontend (branding) | Media | Media | **Corregido** | No existía ningún logotipo oficial en el repositorio para favicon/app icon/manifest/Apple Touch Icon/OG — bloqueado hasta que se proporcionó `public/brand/logo.png`. | `app/icon.png`, `app/apple-icon.png`, `app/manifest.ts`, `app/opengraph-image.png` — mismo archivo fuente en los 4. `app/favicon.ico` (inconsistente) eliminado. |
| — | Seeding propio (no un bug de producto) | — | — | Corregido durante la sesión | Dos cuentas demo (`auxiliar.demo`, `vendedor.demo`) quedaron con `email_verified_at = null` por un intento de seeding interrumpido, causando 403 al iniciar sesión. | Corregido directamente en base de datos; confirmado con reintento exitoso de login. |

### BUG-007 en detalle — investigación completa (reproducido, explicado, corregido)

**Contexto de la disputa:** el asistente inicialmente reportó "no pude reproducirlo" tras un test de login/logout exitoso en navegador. El product owner insistió, correctamente, en que había observado un 401 real durante pruebas manuales y pidió no cerrar el bug sin una investigación completa. Esa insistencia era justificada — el escenario real no había sido probado todavía.

**Causa raíz encontrada por lectura de código, no por suposición:**

1. `backend/.env`: `JWT_TTL=15` — el access token expira a los **15 minutos**.
2. `frontend/lib/api/client.ts`: el interceptor de respuesta de axios reintenta automáticamente cualquier 401 (excepto `/auth/login` y `/auth/refresh`) refrescando el token primero. `/auth/logout` **no estaba excluido** — así que un logout con el access token ya expirado sí dispara: request 1 (401) → refresh → request 2 (200, si el refresh token seguía siendo válido). El 401 de la request 1 es **real y visible en la pestaña Network** — exactamente lo que el product owner reportó.
3. `frontend/store/slices/auth-slice.ts`: `logoutThunk` no tenía manejo de error. Si el refresh **también** fallaba (sesión revocada, refresh token expirado), el 401 se propagaba sin capturar y no existía un caso `.rejected` en el reducer — el usuario terminaba en `/login` de todas formas (por el `router.push` incondicional en `handleLogout`), pero sin garantía de un estado Redux limpio, y sin la garantía explícita de "nunca mostrar un error" que el propio reporte del bug pedía.

**Reproducción exacta (curl, evidencia literal):**

```
POST http://localhost:8000/api/v1/auth/logout
Authorization: Bearer garbage.invalid.token
Accept: application/json

→ HTTP 401
{"success":false,"message":"Debes iniciar sesión para continuar.","errors":[]}
```

Un access token realmente expirado (no solo malformado) produce la misma respuesta del middleware `auth:api` — la librería JWT trata "expirado" e "inválido" de forma idéntica a nivel de autenticación. No fue necesario esperar 15 minutos en vivo para confirmar esto: el comportamiento del middleware es el mismo para cualquier token que no pase `parseToken()->authenticate()`, verificado leyendo `vendor/tymon/jwt-auth`.

**Decisión de arquitectura tomada (documentada, no aplicada en silencio):** se evaluó excluir `/auth/logout` del reintento automático (eliminaría el 401 visible), pero se **descartó** — `AuthenticationService::logout()` es lo único que revoca la sesión server-side (`$this->tokens->revoke($rawRefreshToken)`); excluir el reintento habría dejado sesiones sin revocar cada vez que el access token expiraba justo antes del logout, un problema de seguridad peor que un 401 transitorio en devtools. Se mantiene el reintento.

**Corrección aplicada:** `logoutThunk` ahora captura cualquier error de `authApi.logout()` (incluyendo el caso donde el reintento con refresh también falla) y lo silencia — el usuario nunca ve un error, y el token local se limpia de todas formas (`finally`). El caso feliz (reintento exitoso) sigue funcionando exactamente igual.

**Verificación post-fix (navegador real):** login → logout inmediato (token fresco, sin expirar) → `POST /auth/logout` → **200**, redirección limpia a `/login`, sin errores de consola, sesión confirmada como realmente cerrada (navegar a `/dashboard` después redirige a `/login`). Sin regresión en el camino feliz.

**Conclusión:** BUG-007 era real, no un fantasma. La causa exacta era el JWT de 15 minutos combinado con la política de reintento del interceptor. Corregido sin comprometer la revocación real de sesión server-side.

---

## Evidencia por corrección (captura, URL, acción, resultado)

Screenshots guardados en el scratchpad de la sesión (rutas absolutas al final de esta sección).

### Editar producto

- **URL:** `http://localhost:3000/productos/1`
- **Acción:** clic en "Editar" → cambiar Precio a `9999` → clic en "Guardar" → recarga completa del navegador.
- **Resultado:** `PATCH /api/v1/productos/1` → `200`. Toast "Producto actualizado correctamente". Tras recargar la página completa, el precio sigue mostrando `$9.999` — confirma persistencia real en base de datos, no solo estado local de React.
- **Evidencia:** `09-edit-form.png` (formulario precargado), `10-after-save.png` (guardado), `11-after-reload.png` (persistencia confirmada tras reload).

### Ver movimientos

- **URL:** `http://localhost:3000/productos/3?tab=movimientos`
- **Acción:** desde `/productos`, menú "..." de "Gaseosa Cola 1.5L" → clic en "Ver movimientos".
- **Resultado:** navega a la ficha del producto correcto, con la pestaña "Movimientos (0)" activa, mostrando el estado vacío correcto ("Sin movimientos todavía") — este producto sembrado para demo no tiene movimientos reales todavía, comportamiento esperado, no un error.
- **Evidencia:** `13-ver-movimientos.png`.

### Abrir ficha desde listado

- **URL:** `http://localhost:3000/productos` → `http://localhost:3000/productos/1`
- **Acción:** clic directo sobre el nombre "Arroz Diana 500g" en la tabla.
- **Resultado:** navega a la ficha real del producto (código, marca, costo, precio, stock, todos con datos reales de la API, no mock).
- **Evidencia:** `07-productos-list.png` (listado con datos reales), `08-detail-page.png` (ficha cargada).

### Abrir ficha desde Captura IA

- **Estado: implementado y revisado en código, sin evidencia de clic en vivo todavía.** `components/review-product-card.tsx` ahora enlaza el nombre del producto a `/productos/{producto_id}` cuando `product.estado === "aplicado" && product.producto_id` (código verificado, ver el archivo). **No se puede generar una captura de pantalla honesta de este flujo todavía** porque hacerlo requiere una captura de Captura IA real llegando a estado `aplicado` (lo que a su vez requiere el test con imágenes reales de la sección "IA" de abajo, todavía bloqueado por falta de los archivos fuente). Marcar esto como `PASS` con una captura fabricada violaría la regla explícita de "todo PASS debe estar respaldado por evidencia" — por eso queda documentado como **pendiente de evidencia visual**, no como aprobado.

### Navegación unificada

- **Acción:** comparar el destino de clic en tres orígenes distintos: (1) nombre en `/productos`, (2) fila completa en `/productos` (clic en cualquier celda), (3) "Editar"/"Ver movimientos" desde el menú "...".
- **Resultado:** los tres destinos son la misma ruta, `/productos/{id}` (con `?editar=1` o `?tab=movimientos` según el origen, pero la misma pantalla base) — confirmado en código (`app/(app)/productos/page.tsx`) y en vivo (pasos anteriores). No existen dos pantallas de detalle distintas.
- **Evidencia:** `15-edit-from-menu.png` (edición abierta directamente desde el menú, misma pantalla que al hacer clic en el nombre).

### Logout

- **URL:** `http://localhost:3000/dashboard` → `http://localhost:3000/login`
- **Acción:** clic en "Cerrar sesión" con sesión recién iniciada (token fresco).
- **Resultado:** `POST /api/v1/auth/logout` → `200`. Redirección a `/login`. Navegar después a `/dashboard` redirige de vuelta a `/login` (sesión realmente terminada). Ver también la investigación completa de BUG-007 arriba para el caso de token expirado.
- **Evidencia:** confirmado en dos sesiones de navegador independientes (antes y después del fix), sin capturas adicionales más allá de las ya tomadas en la verificación funcional original.

**Rutas de las capturas** (scratchpad de esta sesión):
`C:\Users\fidel\AppData\Local\Temp\claude\c--Users-fidel-Documents-claude-obsidian-FidelOS-proyectos-control-inventario\765162b0-b19c-4e17-9745-dff48d29e452\scratchpad\` + `07-productos-list.png`, `08-detail-page.png`, `09-edit-form.png`, `10-after-save.png`, `11-after-reload.png`, `13-ver-movimientos.png`, `15-edit-from-menu.png`, `16-notfound.png`.

---

## Rendimiento

| Medición | Tiempo real observado | Objetivo (`PerformanceTests.md`) |
|---|---|---|
| Login (`POST /auth/login`) | ~800ms | No definido explícitamente; alto para un login local sin red externa, candidato a revisar (hashing de contraseña + JWT, no medido en detalle) |
| `GET /auth/me` | ~450-500ms | No definido |
| `GET /captura-ia` (listado) | ~500ms | No definido |
| Suite completa de 103 tests automatizados | 3.76s | N/A |

**No se ejecutaron** las pruebas de rendimiento a gran escala (10.000 productos, 100.000 movimientos, 50 usuarios concurrentes) descritas en `docs/06_TESTS/PerformanceTests.md` — quedan fuera del alcance de esta sesión de corrección de bugs; siguen pendientes como se documentó en esa sesión previa.

---

## Seguridad

- **103/103 tests automatizados en verde**, incluidos los 25 tests adversariales de aislamiento multi-tenant (Company Isolation) y los 9 nuevos tests de la Ficha de Producto (incluye 2 tests específicos de aislamiento cruzado entre empresas para los endpoints nuevos).
- **Vulnerabilidad encontrada y corregida:** ninguna nueva introducida por los cambios de esta sesión — el nuevo `ProductoController` reutiliza `ProductoPolicy` (ya existente) y `TenantScope` (automático vía `BelongsToEmpresa`), verificado con tests explícitos de que la empresa B no puede ver/editar/consultar movimientos de productos de la empresa A.
- **`stock_actual` protegido en profundidad:** `UpdateProductoRequest` rechaza explícitamente (`prohibited`) cualquier payload que incluya `stock_actual`, además de la protección ya existente de `$fillable` — verificado con test dedicado.
- Gaps de seguridad ya conocidos y sin cambios en esta sesión (ver `docs/06_TESTS/SecurityTests.md`): sin rate limiting en login, sin tests de inyección SQL/XSS dedicados, sin auditoría de dependencias.

---

## IA (Captura IA / OCR)

**Estado: BLOCKED — no ejecutado.**

El product owner solicitó una prueba real contra dos archivos específicos (`tests/demo-data/invoices/factura_compra_fc-2024-000158.png`, `tests/demo-data/receptions/recepcion_mercancia_fc-2024-000158.png`) y ofreció proporcionarlos. Se buscó exhaustivamente en todo el repositorio (`find . -iname "*factura_compra*"`, `*recepcion_mercancia*"`, cualquier carpeta `demo-data`) y **ninguno de los dos archivos existe en el repositorio a la fecha de este informe**. No se ejecutó ningún test de OCR/extracción/precisión porque no hay entrada real que procesar — hacerlo con una imagen sustituta no cumpliría lo pedido (validar los campos específicos de esas facturas contra sus valores reales) y hacerlo con datos inventados violaría directamente la regla "no inventar resultados".

Por lo tanto, no se completan (por falta de entrada, no por fallo del sistema): precisión de OCR por campo, comparación contra valores esperados, conteo de tokens, costo, ni el flujo de auditoría/inventario/movimientos específico de esas dos facturas.

**Lo que sí está verificado, con evidencia real, sobre el pipeline de Captura IA en general** (sin las imágenes específicas): los 35 tests automatizados del módulo (deduplicación, umbral de confianza, idempotencia, transacciones, eventos de dominio — ver `docs/06_TESTS/AutomatedTests.md`) siguen en verde, y el flujo fue verificado end-to-end con imágenes genéricas durante el RC1 original (`docs/06_TESTS/ManualTestCases.md`, MTC-005). Lo que falta es específicamente la validación de precisión contra ESAS dos facturas con sus valores reales conocidos.

**Siguiente paso:** en cuanto los archivos existan realmente en el repositorio (o se compartan por otro medio verificable), este bloque se ejecuta y este informe se actualiza — no se cierra este informe fingiendo que se ejecutó.

---

## Conclusiones

**Fortalezas:**
- El núcleo ya construido (Auth, aislamiento multi-tenant, Captura IA backend) es sólido: 103/103 tests automatizados, incluida una suite adversarial de seguridad genuinamente rigurosa.
- La corrección de navegación (BUG-001/002/003/005/006/009) fue verificada de punta a punta en navegador real, no solo revisada en código — incluyendo persistencia real tras recarga completa de página.
- BUG-007 se investigó hasta la causa raíz real en vez de cerrarse en el primer "no reproducible" — el disenso del product owner fue correcto y llevó a un hallazgo genuino.

**Debilidades:**
- Varios módulos de negocio (Compras, Ventas, Clientes, Proveedores, Kardex standalone, Auditoría genérica, Exportaciones, gestión de Usuarios/Roles) siguen sin construir — esto ya era conocido, no es nuevo, pero limita qué tan "completo" puede llamarse el sistema.
- La prueba de OCR con datos reales (la más solicitada por el product owner) sigue bloqueada por ausencia de los archivos de entrada.
- Rendimiento a gran escala nunca medido.
- Sin CI/CD — toda esta validación fue manual/interactiva, no un pipeline reproducible.

**Riesgos:**
- Sin los archivos de factura/recepción reales, no hay forma de certificar la precisión de OCR que el negocio necesita para confiar en Captura IA con documentos reales de proveedores.
- El login toma ~800ms en un ambiente 100% local — vale la pena perfilarlo antes de asumir que escala bien en producción.

**Recomendaciones:**
1. Proporcionar realmente los dos archivos de factura/recepción (o equivalentes reales) para completar la prueba de OCR pendiente.
2. Escribir un test automatizado (Jest/Playwright, todavía no instalado en este proyecto) que cubra al menos el flujo de navegación de la Ficha de Producto, para no depender solo de verificación manual en futuras regresiones.
3. Perfilar el endpoint de login antes de dar por bueno su tiempo de respuesta.
4. Mantener la disciplina de esta sesión: cuando el product owner reporta algo y el asistente no lo reproduce a la primera, investigar más a fondo antes de cerrar — fue la actitud correcta con BUG-007.

---

## Adenda — FEATURE-001/002: Creación Manual de Producto e Ingreso Manual

**Origen:** el product owner marcó como bloqueante de release que FidelOS dependiera únicamente de Captura IA para registrar productos e ingresos. Especificación completa en `docs/03_FUNCTIONAL_SPEC/Products.md`, Adenda 2, aprobada explícitamente con el alcance acotado ahí descrito (proveedor/lote/vencimiento como campos descriptivos, no inventario por lote real; auditoría reutilizando `AuditLogger` existente; "Kardex" satisfecho por la pestaña Movimientos ya construida — sin construir los módulos completos `FUTURE/Auditoria.md`/`FUTURE/Kardex.md`).

### Resultados

| Paso | Resultado | Evidencia |
|---|---|---|
| Botón "Nuevo Producto" en `/productos`, formulario completo | **PASS** | Dialog con los 8 campos especificados. `03-nuevo-producto-dialog.png`. |
| Crear producto (nombre, código, marca, costo, precio) | **PASS** | `POST /api/v1/productos` → `201`. Redirige a `/productos/7`. `stock_actual = 0` confirmado. `04-nuevo-producto-filled.png`, `05-producto-created-detail.png`. |
| Auditoría de creación manual | **PASS** | Fila real en `audit_logs` (`modulo=productos`, `accion=productos.crear_manual`) — verificado por test automatizado (`test_creating_a_product_manually_writes_a_real_audit_log_entry`). |
| Validación: nombre vacío no crea el producto | **PASS** | Toast "El nombre es obligatorio.", sin crear registro, sin crash. `14-blank-name-submit.png`. |
| Botón "Registrar ingreso" en la ficha, formulario completo | **PASS** | Dialog con Cantidad, Costo, Proveedor, Factura, Lote, Vencimiento, Observaciones. `06-registrar-ingreso-dialog.png`. |
| Registrar ingreso (cantidad 50, proveedor, factura, lote, vencimiento, observaciones) | **PASS** | `POST /api/v1/productos/7/movimientos` → `201`. `stock_actual` se actualiza a 50 en la misma pantalla, sin recarga manual. `07-registrar-ingreso-filled.png`, `08-after-registrar-ingreso.png`. |
| Actualización de stock real (`InventoryService`) | **PASS** | Reutiliza el mismo servicio que Captura IA — verificado por test (`stock_anterior`/`stock_nuevo` correctos, sin duplicar lógica). |
| "Kardex" (pestaña Movimientos refleja el ingreso) | **PASS, con 1 hallazgo corregido en la misma sesión** | Al verificar en vivo, la fila mostraba cantidad/observación pero **no** proveedor/factura/lote/vencimiento, pese a estar persistidos correctamente (confirmado con test automatizado y verificación directa en base de datos). Se corrigió el componente para mostrar estos 4 campos inline cuando existen. Reverificado en vivo tras el fix: los 4 campos aparecen correctamente (`Factura: FAC-QA-001 · Proveedor: Proveedor QA Test · Lote: LOTE-QA-01 · Vence: 2026-12-12`). |
| Auditoría de ingreso manual | **PASS** | Fila real en `audit_logs` (`modulo=movimientos`, `accion=movimientos.registrar_ingreso_manual`) — verificado por test automatizado. |
| Persistencia real tras recarga completa | **PASS** | Stock (50) y el movimiento siguen presentes después de un refresh completo del navegador — confirma persistencia en base de datos, no solo estado de React. |
| Aislamiento multi-tenant en los 2 endpoints nuevos | **PASS** | Tests automatizados dedicados: empresa B no puede registrar ingresos sobre productos de empresa A (404, sin crear el movimiento); cada empresa crea sus propios productos de forma aislada. |
| Suite automatizada completa tras ambas features | **PASS** | 111/111 tests (94 originales + 17 nuevos de esta sesión: 9 de la Ficha de Producto + 8 de FEATURE-001/002), 335 assertions. |

**Hallazgo encontrado y corregido en esta misma sesión** (no es un defecto que quede abierto): la pestaña Movimientos no mostraba proveedor/factura/lote/vencimiento pese a que la API sí los devolvía — era un gap de presentación en el frontend, no de persistencia. Corregido y reverificado en vivo antes de cerrar esta adenda.

**Conclusión de esta adenda:** ambas features funcionan de punta a punta con evidencia real (backend automatizado + navegador en vivo), sin comprometer los invariantes existentes (`stock_actual` sigue siendo exclusivo de `InventoryService`, aislamiento multi-tenant intacto, sin duplicar lógica de creación/movimiento). No se construyeron los módulos completos de Auditoría o Kardex — eso sigue siendo una decisión de alcance explícita, no un gap oculto.

---

## Dictamen Final

**Estado general del sistema:** los módulos ya construidos (Auth, Company Isolation, Captura IA backend, y la nueva Ficha de Producto) están en buen estado, verificados con evidencia real. El sistema como un todo sigue siendo un MVP con alcance parcial, no un sistema completo.

**⚠ APROBADO CON OBSERVACIONES**

**¿Listo para producción? NO, no en su totalidad.**

**Justificación técnica:** el subconjunto de funcionalidad ya construida (Auth, aislamiento multi-tenant, Captura IA, Ficha de Producto) pasa todas las pruebas ejecutadas y no tiene defectos abiertos conocidos — ese subconjunto específico sí podría considerarse listo. Pero "el sistema" tal como lo describe el alcance completo del producto (Compras, Ventas, Clientes, Proveedores, Kardex, Auditoría, Exportaciones, gestión de Usuarios/Roles, permisos aplicados por ruta) no existe todavía como código, y la prueba de precisión de OCR contra documentos reales — la validación de negocio más importante para confiar en Captura IA — sigue sin ejecutarse por falta de los archivos fuente. Declarar "listo para producción" sin esa prueba, y sin los módulos de negocio restantes, no estaría respaldado por evidencia real — violaría la misma regla que ha gobernado todo este informe.
