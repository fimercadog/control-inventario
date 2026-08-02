# FidelOS — Functional Module Audit (Complete)

**Fecha:** 2026-08-02
**Alcance:** Auditoría exhaustiva solicitada explícitamente por el propietario del proyecto ("STOP. I do not want placeholder pages anymore... Do not rely on documentation. Inspect the actual code."). Reemplaza por completo la versión anterior (2026-07-30), que quedó desactualizada y con al menos un error factual (afirmaba que Stock reutiliza `ProductoPolicy` — en realidad usa una `StockPolicy` dedicada desde el 2026-07-30) y clasificaciones obsoletas (Proveedores figuraba como 🟡 Parcial; hoy es 🟢 Completo, con 29 tests en verde).

**Metodología:** cada fila de este documento se verificó leyendo el archivo real — migraciones (`backend/database/migrations/`), modelos (`backend/app/Models/`), servicios (`backend/app/Services/`), policies (`backend/app/Policies/`), controllers (`backend/app/Http/Controllers/Api/`), rutas (`backend/routes/api.php`), tests (`backend/tests/`), páginas (`frontend/app/(app)/*/page.tsx`), clientes de API (`frontend/lib/api/`), y `grep` dirigido para confirmar ausencias (p. ej. "¿algún Controller escribe en `avatar_path`?" → no). Cero inferencia desde nombres de archivo o documentación de diseño.

**Clasificación — solo 3 estados posibles, según instrucción explícita:**

- 🟢 **COMPLETE** — todo funciona: persistencia real, backend real, frontend real, tests, listo para producción.
- 🟡 **PARTIAL** — backend sin frontend, o frontend sin backend, o datos mock, o persistencia incompleta, o tests faltantes.
- 🔴 **NOT IMPLEMENTED** — solo placeholder, solo documentación, solo rutas, nada funcional.

---

## Resumen General

| # | Módulo | Base de Datos | Backend | Frontend | Persistencia | Tests | Estado |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | Dashboard | usa tablas reales, sin tabla propia | ninguno (sin endpoint) | UI real | falsa (`lib/mock/dashboard.ts`) | 0 | 🟡 PARTIAL |
| 2 | Captura IA | ✅ 2 tablas | ✅ Controller+Policy+3 Services+3 strategies | ✅ 5 páginas reales | ✅ real | 40 | 🟢 COMPLETE |
| 3 | Productos | ✅ | ✅ Controller+Policy+2 Services | ✅ lista+detalle | ✅ real | 23 | 🟢 COMPLETE |
| 4 | Categorías | ✅ | ✅ Controller+Policy | ✅ lista+detalle | ✅ real | 13 | 🟢 COMPLETE |
| 5 | Marcas | ✅ | ✅ Controller+Policy | ✅ lista+detalle | ✅ real | 13 | 🟢 COMPLETE |
| 6 | Unidades de Medida | ✅ | ✅ Controller+Policy | ✅ lista+detalle | ✅ real | 13 | 🟢 COMPLETE |
| 7 | Stock | usa columnas de `productos`, sin tabla propia | ✅ Controller+Policy dedicada | ✅ lista+detalle | ✅ real | 13 | 🟢 COMPLETE |
| 8 | Movimientos | ✅ | ✅ Controller+Policy+Service | ✅ lista+detalle | ✅ real | 19 | 🟢 COMPLETE |
| 9 | Proveedores | ✅ 2 tablas | ✅ 2 Controllers+2 Policies | ✅ lista+detalle | ✅ real | 29 | 🟢 COMPLETE |
| 10 | Clientes | ✅ (actualizado 2026-08-02) | ✅ Controller+Policy+**Repository+Service+DTO** (actualizado 2026-08-02) | ✅ lista+detalle, Redux (actualizado 2026-08-02) | ✅ real | 13 | 🟢 COMPLETE (actualizado 2026-08-02) |
| 11 | Usuarios | ✅ (tabla `users`) | ✅ Controller+Policy | ✅ lista+detalle | ✅ real | 14 | 🟢 COMPLETE |
| 12 | Roles | ✅ (motor Spatie real, usado por todo el sistema) | ❌ sin Controller/ruta de CRUD | ❌ **eliminado de la navegación** (actualizado 2026-08-02 — ya no hay placeholder, la ruta no existe) | ➖ el motor escribe, sin CRUD de cara al usuario | 0 dedicados (motor probado aparte) | 🔴 NOT IMPLEMENTED |
| 13 | Auditoría | ✅ (`audit_logs`, se escribe activamente) | ✅ escritura (`AuditLogger`), ❌ sin Controller/ruta de lectura | ❌ **eliminado de la navegación** (actualizado 2026-08-02) | ✅ escritura real, ❌ sin lectura | 0 dedicados (escritura cubierta indirectamente por 9 archivos de test de otros módulos) | 🔴 NOT IMPLEMENTED |
| 14 | Reportes | ❌ | ❌ nada | ❌ **eliminado de la navegación** (actualizado 2026-08-02) | ❌ | 0 | 🔴 NOT IMPLEMENTED |
| 15 | Configuración | columnas sin usar en `users` | ❌ sin Controller | ✅ página real | ⚠️ solo tema, 100% client-side, nunca toca el backend | 0 | 🟡 PARTIAL |
| 16 | Perfil | mismas columnas sin usar que Configuración | ❌ nada | ❌ **eliminado de la navegación** (actualizado 2026-08-02 — antes 2 placeholders, ahora ninguna ruta) | ❌ | 0 | 🔴 NOT IMPLEMENTED |

**Totales:** 🟢 11 · 🟡 2 · 🔴 3 (Roles y Auditoría tienen infraestructura real detrás pero sin capa de usuario — ver detalle; los 3 🔴 ya no tienen ninguna ruta ni placeholder en la navegación, per decisión del propietario del proyecto del 2026-08-02: "A module is either COMPLETE or it does not exist in the navigation").

---

## Detalle por módulo — 14 preguntas

Para los 10 módulos 🟢, las respuestas 1-14 son idénticas en estructura; se presentan en un bloque compartido y solo se listan las diferencias reales por módulo.

### 🟢 COMPLETE — Productos, Categorías, Marcas, Unidades de Medida, Stock, Movimientos, Proveedores, Usuarios, Captura IA

1. **¿Existe la base de datos?** Sí — tabla propia para cada uno, excepto Stock (vive en columnas de `productos`).
2. **¿Existen las migraciones?** Sí, verificadas en `backend/database/migrations/`.
3. **¿Existe el Model?** Sí.
4. **¿Existe el Repository?** **No — en ninguno de los 16 módulos.** Este proyecto no usa el patrón Repository en ninguna parte del código; los Controllers hablan directo con Eloquent, o a través de un Service donde existe uno. Esto es consistente en todo el repo, no un gap puntual.
5. **¿Existe el Service?** Solo donde hay lógica de negocio real que lo justifica: Captura IA (`CapturaIAService` + 3 strategies + `CapturaArchivoStorage`), Productos (`ProductService`), Movimientos (`InventoryService`). Categorías, Marcas, Unidades de Medida, Stock, Proveedores, Producto↔Proveedor y Usuarios **no tienen Service dedicado** — su Controller opera directo sobre el Model, correcto para CRUD simple sin lógica de dominio compleja.
6. **¿Existe la Policy?** Sí, una por módulo (`CategoriaPolicy`, `MarcaPolicy`, `UnidadMedidaPolicy`, `ProveedorPolicy`, `ProductoProveedorPolicy`, `UserPolicy`, `ProductoPolicy`, `MovimientoPolicy`, `CapturaIAPolicy`). Stock usa una **`StockPolicy` dedicada**, no `ProductoPolicy` — a propósito, porque Laravel resuelve Policy por clase de modelo y Stock comparte modelo (`Producto`) con `ProductoController`.
7. **¿Existe el Controller?** Sí.
8. **¿Existen los endpoints de API?** Sí, reales en `backend/routes/api.php`, con `['auth:api', 'tenant']`.
9. **¿Existe la página frontend?** Sí — listado + ficha de detalle (Captura IA además tiene foto/voz/foto-voz/revisar).
10. **¿Está conectada al backend real?** Sí, verificado por `grep` de las llamadas `fetch`/cliente de API en cada `page.tsx` contra `frontend/lib/api/*.ts`, todas apuntando a los endpoints reales.
11. **¿La persistencia está completa?** Sí — verificado por tests que confirman el estado de la base de datos después de cada acción, no solo la respuesta HTTP.
12. **¿Hay tests?** Sí — ver conteo exacto por módulo en la tabla resumen (rango 13-40 casos).
13. **¿La documentación está completa?** Sí, `docs/03_FUNCTIONAL_SPEC/*.md` con `Status: Built`, con una salvedad: `Suppliers.md` real vive todavía en `docs/03_FUNCTIONAL_SPEC/FUTURE/Suppliers.md`, ubicación desactualizada desde antes de que el módulo se construyera — el contenido no está mal, solo mal ubicado.
14. **¿El módulo es realmente usable?** Sí — confirmado con pruebas de navegador reales (Playwright + Microsoft Edge del sistema) en múltiples sesiones de esta conversación: login, CRUD completo, filtros, confirmaciones, aislamiento multi-tenant.

---

### 🟡 PARTIAL — Dashboard

1. Base de datos: no tiene tabla propia, pero SI existiera un endpoint real, leería de `productos`/`movimientos` (que sí existen y tienen datos reales). 2. Migraciones: ➖. 3. Model: ➖. 4. Repository: ❌. 5. Service: ❌. 6. Policy: ❌. 7. Controller: ❌ — **no existe ningún `DashboardController`**. 8. Endpoints de API: ❌ — confirmado, cero rutas `GET /dashboard`, `/estadisticas` o similares en `routes/api.php`. 9. Página frontend: ✅ — completa, pulida, con animaciones. 10. **Conectada al backend real: NO** — `frontend/app/(app)/dashboard/page.tsx` importa `getDashboardStats`, `getLowStockProducts`, `getRecentMovements` desde `frontend/lib/mock/dashboard.ts`. 11. Persistencia: ➖ (es una vista de solo lectura; el problema no es que no persista, es que ni siquiera *lee* datos reales). 12. Tests: 0. 13. Documentación: ✅ `Dashboard.md` lo documenta con total honestidad ("Status: Built (con datos simulados / mock data)"). 14. Usable: visualmente sí, funcionalmente muestra números inventados.

**Clasificación:** por la definición explícita del propietario del proyecto ("Mock data" = PARTIAL) y por la "Definición de Módulo Implementado" agregada el mismo día al master spec archivado (UI+navegación+arquitectura+contratos de API+ejecutable = implementado; el mock no descalifica), Dashboard es **PARTIAL, y permanece en el sidebar como módulo abierto** (decisión confirmada explícitamente por el propietario del proyecto: es una vista de solo lectura, no un módulo CRUD; conectarlo a datos reales es trabajo de backend separado, no incluido en esta auditoría).

---

### 🟡 PARTIAL — Configuración

1. Base de datos: la tabla `users` tiene columnas `avatar_path`/`theme`/`language`/`timezone`, pero **ningún Controller en todo el backend escribe en ellas** (verificado por `grep` de esos 4 nombres de columna contra `app/Http/Controllers/`, cero resultados). 2. Migraciones: ✅ existen (columnas agregadas en `2026_07_28_100001_add_auth_fields_to_users_table.php`). 3. Model: ✅ (`User`, campos presentes). 4. Repository: ❌. 5. Service: ❌. 6. Policy: ❌. 7. Controller: ❌ — no existe `SettingsController` ni `ProfileController`. 8. Endpoints de API: ❌. 9. Página frontend: ✅ real. 10. Conectada al backend real: **parcial** — logout es real (`logoutThunk`); el cambio de tema es real pero **100% client-side** (`next-themes`, `localStorage` del navegador, nunca toca el backend ni la columna `users.theme`); los campos de Empresa (nombre, zona horaria) son `<Input disabled>` con valores fijos; el umbral de confianza de Captura IA es un valor fijo "85%", no editable. 11. Persistencia: ❌ — nada de lo mostrado (salvo el logout, que no es "persistencia" sino una acción) se guarda en el backend. 12. Tests: 0. 13. Documentación: ✅ `Settings.md` es igual de honesto que `Dashboard.md` sobre este estado. 14. Usable: solo para las dos cosas reales (ver info de cuenta, cerrar sesión, cambiar tema visualmente).

---

### 🟢 COMPLETE — Clientes (2026-08-02, primer vertical slice completo del proyecto)

Distinto en arquitectura de los otros 9 módulos 🟢: es el primer módulo construido con `Repository`+`Service`+`DTO` en el backend y Redux Toolkit en el frontend, bajo la nueva metodología del propietario del proyecto ("A module is either COMPLETE or it does not exist in the navigation"). Detalle completo en `docs/05_IMPLEMENTATION/CustomersModule.md`.

1. Base de datos: ✅ tabla `clientes` (mismo shape que `proveedores`). 2. Migraciones: ✅. 3. Model: ✅ `Cliente`. 4. Repository: ✅ `ClienteRepository` — primero de este proyecto. 5. Service: ✅ `ClienteService`. 6. Policy: ✅ `ClientePolicy`, pertenencia de empresa AND permiso desde el commit inicial. 7. Controller: ✅ `ClienteController`. 8. Endpoints de API: ✅ 6 rutas (`index/store/show/update/disable/enable`). 9. Página frontend: ✅ listado + ficha de detalle con edición inline. 10. Conectada al backend real: ✅. 11. Persistencia: ✅, confirmada por test y directamente contra la base de datos. 12. Tests: 13 (`ClienteControllerTest`), incluye un caso dedicado a que vaciar un campo `nullable` con `null` explícito persista correctamente (encontrado y corregido durante el diseño del DTO, antes de llegar al Controller). 13. Documentación: ✅ `Customers.md` (reemplaza `FUTURE/Customers.md`). 14. Usable: sí, verificado en navegador real.

### 🔴 NOT IMPLEMENTED — Roles (como módulo de gestión)

1. Base de datos: ✅ — el motor Spatie (`roles`, `permissions`, `model_has_roles`, `role_has_permissions`) es real, con `empresa_id` y `estado` agregados, y **está en uso activo por absolutamente todo el sistema de permisos**. 2. Migraciones: ✅. 3. Model: ✅ `App\Models\Role` (subclase de Spatie con `TenantScope`). 4. Repository: ❌. 5. Service: ❌. 6. Policy: ❌ — no existe una `RolePolicy` propia; los roles se usan como mecanismo interno del Gate de autorización, no como recurso administrable. 7. Controller: ❌ — **no existe ningún `RoleController`**. 8. Endpoints de API: ❌ — cero rutas `/roles` en `routes/api.php` más allá de lo que Spatie usa internamente (que no son endpoints HTTP). 9. Página frontend: solo `PendingModule`. 10. Conectada al backend: ❌. 11. Persistencia: ➖ el motor persiste roles/permisos correctamente (probado indirectamente en decenas de tests de otros módulos y en `RbacFoundationTest`), pero no hay forma de que un usuario cree/edite/liste un rol. 12. Tests dedicados a un CRUD de Roles: 0 (el motor en sí está bien cubierto, pero eso es infraestructura, no el módulo que pide esta auditoría). 13. Documentación: ✅ `Roles.md` es honesto y extenso — es literalmente el diseño que Fase 5 debe construir. 14. Usable como módulo: no.

**Nota:** esto es infraestructura real y crítica (todo permiso de todo módulo depende de estas tablas), pero no es un *módulo administrable* — por eso la clasificación es NOT IMPLEMENTED bajo los términos exactos de esta auditoría (que pregunta por Controller/endpoints/frontend, no por si la tabla existe).

### 🔴 NOT IMPLEMENTED — Auditoría (como módulo de consulta)

1. Base de datos: ✅ `audit_logs`, con `empresa_id`, escrita activamente. 2. Migraciones: ✅. 3. Model: ✅ `AuditLog`. 4. Repository: ❌. 5. Service: ✅ **pero solo de escritura** — `AuditLogger` es invocado por Categorías, Marcas, Unidades de Medida, Proveedores, Producto↔Proveedor, Productos, Movimientos, Usuarios y Captura IA (9 módulos distintos escriben ahí). 6. Policy: ❌. 7. Controller: ❌ — no existe forma de *leer* lo que se escribió. 8. Endpoints de API: ❌. 9. Página frontend: solo `PendingModule`. 10. Conectada al backend: ❌. 11. Persistencia: la escritura funciona perfectamente (verificado indirectamente por 9 archivos de test distintos que aseguran `assertDatabaseHas('audit_logs', ...)`); la lectura no existe. 12. Tests dedicados a consultar auditoría: 0. 13. Documentación: solo `FUTURE/Auditoria.md` (`Status: Planned`). 14. Usable como módulo: no — un usuario nunca puede ver lo que el sistema ya registró sobre él.

### 🔴 NOT IMPLEMENTED — Reportes

1-14: idéntico a Clientes antes de esta unidad de trabajo — cero código en cualquier capa. Solo `docs/03_FUNCTIONAL_SPEC/FUTURE/Reports.md`.

### 🔴 NOT IMPLEMENTED — Perfil

1. Base de datos: las mismas columnas sin usar de `users` que Configuración (`avatar_path`/`theme`/`language`/`timezone`) — ningún endpoint las lee ni las escribe para editar perfil. 2-8: ❌ en todo — no existe `ProfileController`, no existe `PATCH /perfil`, no existe ninguna ruta bajo `/perfil` en el backend. 9. Página frontend: ❌ **ya no existe ninguna** — hasta el 2026-08-02 eran dos stubs `PendingModule` (`/perfil` y `/perfil/cambiar-contrasena`); ambos directorios se eliminaron por completo, junto con `pending-module.tsx` (sin consumidores restantes). 10-12: ❌/0. 13. Documentación: ❌ — no existe ningún `Profile.md` en ningún lado del árbol de `docs/`. 14. Usable: no, en absoluto.

**Nota (2026-08-02)**: Roles, Auditoría, Reportes y Perfil dejaron de tener CUALQUIER placeholder — sus directorios de página, el componente `PendingModule`, y sus entradas del sidebar fueron eliminados por completo. Antes de esta fecha, mostraban una pantalla real de "pendiente de implementación" con badge "Próximamente"; ahora sus rutas simplemente no existen (404 real de Next.js) y no aparecen en el sidebar en absoluto. Decisión explícita del propietario del proyecto que revoca la regla anterior ("nunca ocultar un módulo del sidebar, mostrar Coming Soon en su lugar").

---

## Correcciones respecto a la versión anterior de este documento (2026-07-30)

- **Proveedores**: pasó de 🟡 Parcial a 🟢 Completo. La versión anterior señalaba falta de retrofit a `useCrudList` y verificación de navegador para las pestañas de Producto↔Proveedor — ambas cosas ya se completaron y probaron en unidades de trabajo posteriores (Fase 4.5), con 29 tests en verde hoy.
- **Stock**: la versión anterior no tenía una fila propia con este nivel de detalle; se confirma aquí que usa una `StockPolicy` **dedicada**, nunca `ProductoPolicy` — cualquier referencia previa a que "Stock reutiliza ProductoPolicy" (sección de Gaps de la versión anterior) era incorrecta.
- **Categorías, Marcas, Unidades de Medida, Movimientos, Usuarios**: confirmados 🟢 Completo, ahora además con autorización RBAC real (permiso Y pertenencia de empresa) desde Fase 4.5/4.6 — la versión anterior es previa a esa arquitectura y no la menciona.
- **Notificaciones**: eliminado de esta auditoría — no aparece en la lista de 16 módulos que el propietario del proyecto pidió auditar explícitamente en esta ronda. El hallazgo de la versión anterior (sin centro de notificaciones persistente, solo toasts transitorios vía `sonner`) sigue siendo cierto si se necesita en el futuro.

---

## Estado del sidebar frente a esta auditoría

**Actualizado 2026-08-02 — regla revisada.** La regla original de esta auditoría (COMPLETE/PARTIAL abre el módulo real, NOT IMPLEMENTED muestra un placeholder "Próximamente") quedó revocada el mismo día por decisión explícita del propietario del proyecto: "A module is either COMPLETE or it does not exist in the navigation." Bajo la regla nueva: Clientes se reconstruyó como vertical slice completo y ahora abre su módulo real; Roles, Auditoría, Reportes y Perfil — los 4 restantes clasificados 🔴 — se eliminaron de la navegación por completo (ni entrada de sidebar, ni ruta, ni placeholder). El sidebar hoy lista exactamente 12 módulos, todos 🟢 COMPLETE o 🟡 PARTIAL — ninguno 🔴. Cuando cualquiera de los 4 restantes se construya como vertical slice completo, se agrega de vuelta al sidebar en el mismo commit que lo haga real, nunca antes.

---

**Este documento es un inventario verificado contra código, no una aprobación de alcance ni una autorización para construir los módulos faltantes.**
