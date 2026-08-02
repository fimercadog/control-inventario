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
| 12 | Roles | ✅ (motor Spatie real + `estado`, actualizado 2026-08-02) | ✅ Controller+Policy+**Repository+Service+DTO** (actualizado 2026-08-02) | ✅ lista+detalle (tabs Detalle/Usuarios), Redux (actualizado 2026-08-02) | ✅ real | 24 | 🟢 COMPLETE (actualizado 2026-08-02) |
| 13 | Auditoría | ✅ (`audit_logs`, sin cambios de esquema, actualizado 2026-08-02) | ✅ Controller+Policy+**Repository+Service** (actualizado 2026-08-02, solo lectura a propósito — sin store/update/destroy) | ✅ lista+detalle+filtros, Redux (actualizado 2026-08-02) | ✅ real | 15 | 🟢 COMPLETE (actualizado 2026-08-02) |
| 14 | Reportes | usa tablas reales, sin tabla propia (agrega sobre Producto/Movimiento/Cliente/Proveedor) | ✅ Controller+**Repository+Service** (actualizado 2026-08-02, solo lectura, sin Policy propia por diseño) | ✅ estadísticas+filtro de fechas, Redux (actualizado 2026-08-02) | ✅ real | 13 | 🟢 COMPLETE (actualizado 2026-08-02) |
| 15 | Configuración | columnas de `users` ahora reales vía Perfil, no propias de esta página | ❌ sin Controller propio | ✅ página real (actualizado 2026-08-02 — perdió el selector de tema duplicado, ahora enlaza a Perfil) | ⚠️ Empresa/Captura IA siguen hardcodeados; avatar/tema ya son reales, pero vía `/perfil`, no aquí | 0 | 🟡 PARTIAL |
| 16 | Perfil | ✅ (mismas columnas de `users` que Configuración, ahora sí leídas/escritas — `avatar_path`/`theme`/`language`/`timezone`) | ✅ Controller+**Service** (actualizado 2026-08-02, sin permiso propio ni Repository — mutaciones de un único registro ya cargado, `$request->user()`) | ✅ ficha completa (datos personales, avatar, apariencia, seguridad), extiende `auth-slice` (actualizado 2026-08-02) | ✅ real | 14 | 🟢 COMPLETE (actualizado 2026-08-02) |

**Totales:** 🟢 14 · 🟡 2 · 🔴 0 — ningún módulo 🔴 restante. Los 4 módulos de la secuencia vertical-slice (Roles→Auditoría→Reportes→Perfil) están completos.

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

### 🟢 COMPLETE — Roles (2026-08-02, segundo vertical slice Repository+Service+DTO del proyecto)

Mismo patrón arquitectónico que Clientes (ver bloque arriba), con dos diferencias de diseño propias de RBAC: el catálogo de permisos es global y fijo (no lo crea este módulo, solo lo consume vía `PermissionController`), y el modelo de permisos usa solo 2 (`roles.ver`/`roles.gestionar`) en vez de los 4 del resto del ERP — decisión ya documentada en `docs/security/ROLES_MATRIX.md` §6 antes de escribir código. Detalle completo en `docs/05_IMPLEMENTATION/RolesModule.md`.

1. Base de datos: ✅ — el motor Spatie (`roles`, `permissions`, `model_has_roles`, `role_has_permissions`) más `empresa_id`/`estado` agregados en Fase 4.5, sin migración nueva para este módulo. 2. Migraciones: ✅ (ya existían). 3. Model: ✅ `App\Models\Role` (subclase de Spatie con `TenantScope`, más la relación `usuarios()` agregada en este módulo). 4. Repository: ✅ `RoleRepository`. 5. Service: ✅ `RoleService` (incluye la guarda de negocio "no desactivar con usuarios asignados"). 6. Policy: ✅ `RolePolicy` — `roles.ver` para lectura, `roles.gestionar` para las 4 escrituras juntas (crear/editar/activar/desactivar), a diferencia del patrón de 4 permisos separados del resto del ERP. 7. Controller: ✅ `RoleController` + `PermissionController` (catálogo de solo lectura, nuevo, compartido). 8. Endpoints de API: ✅ 7 rutas (`index/store/show/update/activar/desactivar/usuarios`) + `GET /permisos`. 9. Página frontend: ✅ listado + ficha de detalle con tabs "Detalle"/"Usuarios", `PermissionPicker` reutilizable. 10. Conectada al backend real: ✅. 11. Persistencia: ✅, confirmada por test y verificación de navegador. 12. Tests: 24 (`RoleControllerTest`), incluye 3 de regresión para un bug real encontrado (`RoleAlreadyExists` de Spatie sin capturar en nombre duplicado — ver informe). 13. Documentación: ✅ `Roles.md` actualizado a `Status: Built`. 14. Usable: sí, verificado en navegador real (crear rol, asignar permisos, editar, bloqueo de desactivación con usuarios asignados, mensaje 409 accionable vía el tab Usuarios).

### 🟢 COMPLETE — Auditoría (2026-08-02, tercer vertical slice Repository+Service del proyecto, 100% de solo lectura)

Distinto de Clientes/Roles en un aspecto clave: no crea nada nuevo que escribir — `AuditLogger` (invocado por los otros 11 módulos de negocio) ya escribía en `audit_logs` desde antes; este módulo es exclusivamente la superficie de consulta sobre eso. Decisión de arquitectura propia, confirmada con el propietario del proyecto antes de codificar: el campo `usuario` de cada registro expone únicamente `email` y `roles`, **nunca** el nombre real de la persona (regla de privacidad no negociable, sin equivalente en ningún otro módulo del ERP). Detalle completo en `docs/05_IMPLEMENTATION/AuditoriaModule.md`.

1. Base de datos: ✅ `audit_logs`, con `empresa_id`, sin cambios de esquema para este módulo. 2. Migraciones: ✅ (ya existían). 3. Model: ✅ `AuditLog` (inmutable por diseño desde antes — `update()`/`delete()` lanzan excepción). 4. Repository: ✅ `AuditLogRepository` — nuevo, solo lectura (paginar/filtrar, sin ningún método de escritura). 5. Service: ✅ `AuditLogService`, delgado, delega al Repository — las escrituras siguen siendo exclusivas de `AuditLogger`. 6. Policy: ✅ `AuditLogPolicy` — solo `viewAny`/`view`, sin `create`/`update`/`delete` (no existen esas abilities). 7. Controller: ✅ `AuditLogController` — solo `index`/`show`, sin `store`/`update`/`destroy` (confirmado por test: esos verbos devuelven 405). 8. Endpoints de API: ✅ `GET /auditoria`, `GET /auditoria/{id}`. 9. Página frontend: ✅ listado con filtros (módulo/acción/usuario/fecha/texto libre) + ficha de detalle con diff de estado anterior/nuevo — sin botón "Nuevo" ni "Editar" en ningún lugar. 10. Conectada al backend real: ✅. 11. Persistencia: ✅ — de solo lectura por diseño, no aplica "persistencia" en el sentido de escritura, pero la lectura está confirmada contra más de 5.000 registros reales sembrados. 12. Tests: 15 (`AuditLogControllerTest`), incluye un caso dedicado a que el nombre real de una persona nunca aparezca en la respuesta (`test_a_real_persons_name_is_never_exposed_anywhere_in_the_response`). 13. Documentación: ✅ `Auditoria.md` (reemplaza `FUTURE/Auditoria.md`, con el alcance real documentado frente al borrador original — sin exportación, sin panel de estadísticas). 14. Usable: sí, verificado en navegador real contra los datos demo reales de la empresa.

### 🟢 COMPLETE — Reportes (2026-08-02, cuarto vertical slice Repository+Service del proyecto, 100% de solo lectura, sin Policy propia)

Distinto de los otros 3 vertical slices: no tiene un modelo Eloquent propio — agrega en vivo sobre 5 modelos existentes (Producto/Movimiento/Cliente/Proveedor/ProductoProveedor). Alcance acotado a propósito frente al borrador original (`FUTURE/Reports.md`, que llamaba a este mismo alcance "el único candidato remotamente viable" — Ventas/Compras siguen bloqueados por no existir esos módulos). Detalle completo en `docs/05_IMPLEMENTATION/ReportesModule.md`.

1. Base de datos: ✅ (indirecta) — usa `productos`/`movimientos`/`clientes`/`proveedores`/`producto_proveedor`/`categorias`, todas ya existentes, sin migración nueva. 2. Migraciones: ➖ (ninguna nueva). 3. Model: ➖ (sin modelo propio, por diseño). 4. Repository: ✅ `ReporteRepository` — nuevo, solo lectura, 4 métodos de agregación. 5. Service: ✅ `ReporteService`, resuelve el rango de fechas por defecto (últimos 30 días) y compone las 4 secciones. 6. Policy: ❌ **a propósito** — sin modelo propio no hay una clase natural a la que atarla; `$this->authorize('reportes.ver')` se resuelve directo contra el `Gate::before()` global de Spatie (verificado contra el código fuente del paquete antes de escribir el Controller). 7. Controller: ✅ `ReporteController`, un único método `index`. 8. Endpoints de API: ✅ `GET /reportes` (sin `store`/`update`/`destroy` — 405 confirmado por test). 9. Página frontend: ✅ selector de rango de fechas, tarjetas KPI (reutiliza `StatCard` del Dashboard), gráfico de barras en CSS puro de entradas/salidas por día, listas de productos más movidos/por categoría/proveedores principales. 10. Conectada al backend real: ✅. 11. Persistencia: ✅ — de solo lectura por diseño; verificado contra datos reales (497 productos, 701 entradas/368 salidas/236 ajustes en 30 días, etc.). 12. Tests: 13 (`ReporteControllerTest`), incluye un caso dedicado a que los agregados sean matemáticamente correctos contra datos conocidos y otro a que ningún dato de otra empresa se filtre. 13. Documentación: ✅ `Reports.md` (reemplaza `FUTURE/Reports.md`). 14. Usable: sí, verificado en navegador real contra los datos demo reales de la empresa.

**Hallazgos reales encontrados durante la verificación de este módulo, ninguno relacionado con Reportes en sí:**

- **`RoleSeeder` tenía un bug de larga data**: `Collection::only()` sobre un `Eloquent\Collection` filtra por primary key, no por las claves de `keyBy()` — `RoleSeeder::crear()` nunca sincronizó correctamente los permisos de ningún rol demo desde que ese código se escribió, vaciando silenciosamente `role_has_permissions` en cada re-ejecución. Corregido con `->toBase()` antes de `only()`. Sin impacto en tests (que nunca pasan por `RoleSeeder`); impacto exclusivo en datos demo de desarrollo, ya restaurados.
- **Colisión de `key` de React en 3 listas del propio módulo**: dos productos/categorías/proveedores demo distintos pueden compartir el mismo nombre — encontrado con datos reales, no hipotético. Corregido exponiendo el `id` real de cada fila desde el backend en vez de usar el nombre como key.

### 🟢 COMPLETE — Perfil (2026-08-02, cuarto y último módulo de la secuencia, sin Repository ni permiso propio)

Sin borrador previo en `FUTURE/` (a diferencia de Auditoría/Reportes) — diseñado desde cero sobre las columnas `avatar_path`/`theme`/`language`/`timezone` de `users`, ya sembradas desde Fase 0/1 sin que ningún endpoint las tocara hasta hoy. Único módulo de los 4 cuyo alcance es exclusivamente "el propio usuario sobre sí mismo" — ninguna ruta acepta el id de otro usuario. Detalle completo en `docs/05_IMPLEMENTATION/ProfileModule.md`.

1. Base de datos: ✅ — mismas 4 columnas de `users` que antes estaban sin usar, ahora leídas y escritas de verdad. Sin migración nueva. 2. Migraciones: ➖ (ninguna nueva). 3. Model: ➖ (usa `User`, ya existente, sin cambios de esquema). 4. Repository: ➖ **a propósito** — son mutaciones de un único registro ya cargado (`$request->user()`), no hay una consulta que encapsular. 5. Service: ✅ `ProfileService` (`actualizar`/`actualizarAvatar`/`eliminarAvatar`/`cambiarPassword`, reutiliza `AuthenticationService::forcePasswordReset()` para revocar sesiones en vez de duplicar esa lógica). 6. Policy: ➖ **a propósito** — sin permiso propio, la acotación estructural a "uno mismo" ya cierra cualquier escalamiento. 7. Controller: ✅ `ProfileController` (`update`/`subirAvatar`/`eliminarAvatar`/`cambiarPassword`, sin `index`/`show` — `GET /auth/me` ya es la fuente de verdad). 8. Endpoints de API: ✅ `PATCH /perfil`, `POST /perfil/avatar`, `DELETE /perfil/avatar`, `POST /perfil/password`. 9. Página frontend: ✅ `/perfil` completa (avatar, datos personales, apariencia, seguridad); ganó una entrada real en el dropdown del sidebar ("Mi Perfil", antes inexistente). 10. Conectada al backend real: ✅. 11. Persistencia: ✅, confirmada por test y por un round-trip completo en navegador real (cambiar contraseña, cerrar sesión forzado, la contraseña vieja deja de servir, la nueva funciona). 12. Tests: 14 (`ProfileControllerTest`). 13. Documentación: ✅ `Profile.md` (nuevo — no reemplaza ningún borrador, no existía ninguno). 14. Usable: sí, verificado en navegador real de punta a punta.

**Hallazgo real encontrado durante la verificación de este módulo, no relacionado con Perfil en sí**: `APP_URL` en `.env`/`.env.example` estaba sin puerto (`http://localhost`, el backend real corre en `:8000`) — nunca se había manifestado porque ningún módulo anterior generaba una URL absoluta pública (Captura IA guarda en el disco `local`, privado). La primera subida de avatar la expuso: `Storage::disk('public')->url(...)` producía una URL que apuntaba al puerto equivocado, `net::ERR_CONNECTION_REFUSED` en el navegador. Corregido en ambos archivos.

**Nota (2026-08-02)**: Roles, Auditoría, Reportes y Perfil dejaron de tener CUALQUIER placeholder — sus directorios de página, el componente `PendingModule`, y sus entradas del sidebar fueron eliminados por completo. Antes de esta fecha, mostraban una pantalla real de "pendiente de implementación" con badge "Próximamente"; sus rutas pasaron a no existir (404 real de Next.js) y no aparecían en el sidebar en absoluto. Decisión explícita del propietario del proyecto que revoca la regla anterior ("nunca ocultar un módulo del sidebar, mostrar Coming Soon en su lugar").

**Nota (2026-08-02, más tarde el mismo día)**: Roles, Auditoría, Reportes y Perfil se reconstruyeron los 4 como vertical slice completo — ver los bloques 🟢 COMPLETE arriba. Cada uno volvió al sidebar en el mismo commit que lo hizo real, nunca antes, exactamente como establece la sección "Estado del sidebar" abajo. No queda ningún módulo 🔴 en este inventario.

---

## Correcciones respecto a la versión anterior de este documento (2026-07-30)

- **Proveedores**: pasó de 🟡 Parcial a 🟢 Completo. La versión anterior señalaba falta de retrofit a `useCrudList` y verificación de navegador para las pestañas de Producto↔Proveedor — ambas cosas ya se completaron y probaron en unidades de trabajo posteriores (Fase 4.5), con 29 tests en verde hoy.
- **Stock**: la versión anterior no tenía una fila propia con este nivel de detalle; se confirma aquí que usa una `StockPolicy` **dedicada**, nunca `ProductoPolicy` — cualquier referencia previa a que "Stock reutiliza ProductoPolicy" (sección de Gaps de la versión anterior) era incorrecta.
- **Categorías, Marcas, Unidades de Medida, Movimientos, Usuarios**: confirmados 🟢 Completo, ahora además con autorización RBAC real (permiso Y pertenencia de empresa) desde Fase 4.5/4.6 — la versión anterior es previa a esa arquitectura y no la menciona.
- **Notificaciones**: eliminado de esta auditoría — no aparece en la lista de 16 módulos que el propietario del proyecto pidió auditar explícitamente en esta ronda. El hallazgo de la versión anterior (sin centro de notificaciones persistente, solo toasts transitorios vía `sonner`) sigue siendo cierto si se necesita en el futuro.

---

## Estado del sidebar frente a esta auditoría

**Actualizado 2026-08-02 — regla revisada.** La regla original de esta auditoría (COMPLETE/PARTIAL abre el módulo real, NOT IMPLEMENTED muestra un placeholder "Próximamente") quedó revocada el mismo día por decisión explícita del propietario del proyecto: "A module is either COMPLETE or it does not exist in the navigation." Bajo la regla nueva: Clientes, Roles, Auditoría, Reportes y Perfil se reconstruyeron los 5 como vertical slice completo y ahora abren sus módulos reales — **ningún módulo queda 🔴**. Perfil es un caso particular de navegación: no tiene entrada en los grupos temáticos del sidebar (Inventario/Terceros/Administración), vive exclusivamente en el dropdown de cuenta del pie del sidebar (junto a "Cerrar sesión") — coherente con ser el único módulo cuyo alcance es "el propio usuario sobre sí mismo", no un recurso de negocio de la empresa. El árbol de navegación completo (`app-sidebar.tsx`, grupos + dropdown) hoy cubre los 16 módulos de este inventario, todos 🟢 COMPLETE o 🟡 PARTIAL.

---

**Este documento es un inventario verificado contra código, no una aprobación de alcance ni una autorización para construir los módulos faltantes.**
