# Roles Matrix — RBAC de FidelOS

**Status: Approved — referencia oficial del modelo de autorización, arquitectura de autorización completa** (aprobado 2026-08-02; Fase 4.5 — Authorization Alignment — cerró los Gaps 2 y 3 originales el mismo día; Fase 4.6 — Authorization Completion — cerró el Gap 5 restante el mismo día)

> Verificado contra código real, no inferencia: `backend/database/seeders/PermissionSeeder.php`, `RoleSeeder.php`, `backend/app/Policies/*.php` (las 10 Policies existentes, incluye `StockPolicy`), `backend/routes/api.php` (fuente única de verdad de qué endpoints existen hoy), `backend/app/Models/Role.php`, `config/permission.php`, `database/migrations/2026_08_02_090000_add_estado_to_roles_table.php`, `database/migrations/2026_08_02_100000_rename_productos_eliminar_permission.php`. Complementa — no reemplaza — `docs/03_FUNCTIONAL_SPEC/Roles.md` (diseño narrativo del motor RBAC) y `docs/04_TECHNICAL_SPEC/Security.md` (principios de seguridad generales, desactualizado respecto a los módulos construidos desde Fase 1). Este documento es la referencia obligatoria para construir el Módulo 5 (Role Management) — "el módulo Roles se construye desde esta matriz, no desde supuestos".
>
> **Fase 4.5 (Authorization Alignment, 2026-08-02)** alineó los seis módulos que esta matriz identificó sin permiso propio (Categorías, Marcas, Unidades de Medida, Stock, Proveedores, Producto↔Proveedor): cada uno ganó su propio namespace de permisos y sus Policies pasaron de "solo pertenencia de empresa" a **pertenencia de empresa Y permiso** (`AND`, nunca `OR`). 6 tests nuevos por módulo (36 en total) prueban explícitamente: usuario autorizado tiene éxito, usuario sin permiso recibe 403, acceso cross-company sigue prohibido. Suite completa: **228/228**. El detalle de qué se hizo por módulo vive en `docs/05_IMPLEMENTATION/AuthorizationAlignment.md`.
>
> **Fase 4.6 (Authorization Completion, 2026-08-02)** cerró el Gap 5 que Fase 4.5 dejó documentado a propósito: los tres módulos restantes sin segundo factor de permiso — Productos, Movimientos, Captura IA — ahora siguen exactamente el mismo modelo `AND`. Reglas de negocio explícitas de esta fase: Movimientos sigue siendo un ledger append-only — los permisos nuevos (`movimientos.ver`/`movimientos.crear`) solo gatean Listar/Ver/Crear, **nunca** Editar/Eliminar/Deshabilitar (esas operaciones no existen; editar metadata deliberadamente se queda sin permiso propio, ver sección 4); Captura IA separa el permiso por responsabilidad (`captura-ia.usar` crear+ver, `captura-ia.revisar` corregir un detalle de baja confianza, `captura-ia.confirmar` confirmar/descartar); Productos sigue el patrón estándar del ERP (`productos.ver/crear/editar/gestionar`, sin delete físico) y de paso corrigió una inconsistencia de nombres heredada — `productos.eliminar` nunca reflejó el comportamiento real (nunca hay un DELETE físico) y se renombró a `productos.gestionar` vía migración que preserva el `id` del permiso y todas sus asociaciones existentes (`role_has_permissions`), el mismo verbo que ya usaban los 6 módulos de Fase 4.5. Con esto, **las 9 Policies de recursos de negocio del ERP comparten exactamente el mismo modelo de autorización** (pertenencia de empresa AND permiso) — `UserPolicy` es la única excepción, y es deliberada y anterior a esta fase (RC1 Fase 4: `usuarios.ver`/`usuarios.editar` existen en el catálogo pero `UserPolicy` solo verifica pertenencia, sin cambios aquí). El detalle vive en `docs/05_IMPLEMENTATION/AuthorizationCompletion.md`.
>
> Durante esta fase se identificó y corrigió además un hallazgo de arquitectura independiente del alcance original: la caché de permisos de Spatie (`PermissionRegistrar`) no es team-aware — se construye una vez de forma global y, como `App\Models\Role` tiene `TenantScope` como global scope, la primera construcción "congela" la caché con los roles de la empresa que estaba activa en ese instante, filtrando incorrectamente los permisos de cualquier otra empresa hasta que se invalide. `IdentifyTenant` ahora llama `forgetCachedPermissions()` en cada request, garantizando que la caché se reconstruya siempre con el team correcto antes de cualquier chequeo de permiso — ver el comentario en `backend/app/Http/Middleware/IdentifyTenant.php`.

---

## 1. System Roles

**Los roles NO son un catálogo fijo del sistema.** Por diseño (Spatie Teams, `roles.empresa_id`), cada empresa crea y administra sus propios roles — dos empresas pueden tener ambas un rol llamado "Supervisor" sin colisión ni relación entre sí. No existe ni existirá un rol "hardcodeado" a nivel de aplicación, con una única excepción reservada:

| Rol | Tipo | empresa_id | Permisos | Notas |
| --- | --- | --- | --- | --- |
| **Platform Super Admin** | Pseudo-rol reservado, no es una fila en `roles` | `null` (`is_platform_admin = true` en `users`) | Exclusivamente namespace `plataforma.*` | Nunca aprobado vía `Gate::before()` — pasa por el mismo chequeo de permiso que cualquier usuario, para no crear una puerta trasera sin auditoría (`Security.md` §5). Un usuario normal (`empresa_id` no nulo) nunca puede volverse `is_platform_admin = true`. |

### Roles de referencia (Demo Data, no roles "del sistema")

`RoleSeeder` crea estos 5 roles como **ejemplo poblado para cada empresa demo** — una empresa real los puede editar, renombrar o borrar libremente una vez exista el Módulo 5. Se documentan aquí porque son el único conjunto de roles con datos reales verificables hoy, y son un punto de partida razonable para el "conjunto sugerido" que la UI de Módulo 5 podría ofrecer al dar de alta una empresa nueva (ver Gap 1 abajo).

| Rol | Permisos asignados (`RoleSeeder`, verificado) |
| --- | --- |
| Administrador | Todo el catálogo global de permisos (`Permission::all()`) |
| Supervisor | `productos.ver`, `productos.crear`, `productos.editar`, `movimientos.ver`, `movimientos.crear`, `captura-ia.usar`, `captura-ia.revisar`, `captura-ia.confirmar`, `usuarios.ver`, `auditoria.ver` |
| Bodeguero | `productos.ver`, `movimientos.ver`, `movimientos.crear`, `captura-ia.usar`, `captura-ia.revisar` |
| Vendedor | `productos.ver`, `movimientos.ver` |
| Auxiliar Contable | `productos.ver`, `auditoria.ver` |

### Gap 1 — Alta de la primera empresa real (no bloqueante para Fase 5, documentado para no perderlo)

Hoy, la única forma de que un usuario tenga el rol "Administrador" con permiso `usuarios.editar` es el seeder de demo data. **No existe todavía ningún flujo real de "alta de empresa nueva"** que cree automáticamente un primer usuario + un primer rol con permisos administrativos completos. Cuando ese flujo se construya (fuera del roadmap de 8 fases actual), debe garantizar que toda empresa nace con al menos un usuario activo con `usuarios.editar` — la misma invariante que ya protege `UserController::desactivar()` (RC1 Fase 4) para que ninguna empresa quede sin nadie que pueda gestionar cuentas.

---

## 2. Permissions — catálogo completo actual

`PermissionSeeder` (guard `api`, global y fijo — ninguna empresa lo edita), 41 permisos sembrados hoy:

| Permiso | Descripción | Módulo que lo consume hoy |
| --- | --- | --- |
| `productos.ver` | Ver catálogo de productos | **Sí** — `ProductoPolicy` (Fase 4.6) |
| `productos.crear` | Crear productos | **Sí** — `ProductoPolicy` (Fase 4.6) |
| `productos.editar` | Editar productos (incluye `registrarIngreso`/`enable`) | **Sí** — `ProductoPolicy` (Fase 4.6) |
| `productos.gestionar` | Deshabilitar productos (`disable`) | **Sí** — `ProductoPolicy` (Fase 4.6). Renombrado desde `productos.eliminar` vía migración que preserva `id`/asociaciones — nunca hubo ni hay un DELETE físico, el nombre viejo no reflejaba el comportamiento real. |
| `categorias.ver/crear/editar/gestionar` | CRUD de Categorías (`gestionar` = activar/desactivar) | **Sí** — `CategoriaPolicy` (Fase 4.5) |
| `marcas.ver/crear/editar/gestionar` | CRUD de Marcas | **Sí** — `MarcaPolicy` (Fase 4.5) |
| `unidades-medida.ver/crear/editar/gestionar` | CRUD de Unidades de Medida | **Sí** — `UnidadMedidaPolicy` (Fase 4.5) |
| `stock.ver/editar/gestionar` | Ver/editar umbrales/activar-desactivar Stock (sin `.crear` — nunca se crea independiente) | **Sí** — `StockPolicy` (Fase 4.5, dedicada — ver nota sobre conflicto con `ProductoPolicy` en la sección 3) |
| `proveedores.ver/crear/editar/gestionar` | CRUD de Proveedores | **Sí** — `ProveedorPolicy` (Fase 4.5) |
| `producto-proveedor.ver/crear/editar/gestionar` | CRUD de la asociación Producto↔Proveedor | **Sí** — `ProductoProveedorPolicy` (Fase 4.5) |
| `movimientos.ver` | Ver/listar movimientos de inventario | **Sí** — `MovimientoPolicy` (Fase 4.6) |
| `movimientos.crear` | Registrar movimientos (Entrada/Salida/Ajuste) | **Sí** — `MovimientoPolicy` (Fase 4.6) |
| `captura-ia.usar` | Crear una captura (foto/voz/foto+voz) y verla | **Sí** — `CapturaIAPolicy` (Fase 4.6) |
| `captura-ia.revisar` | Corregir un detalle de baja confianza antes de confirmar (`actualizarDetalle`) | **Sí** — `CapturaIAPolicy` (Fase 4.6, ability `review` nueva, separada de `update`) |
| `captura-ia.confirmar` | Confirmar/descartar una captura ya procesada | **Sí** — `CapturaIAPolicy` (Fase 4.6) |
| `captura-ia.gestionar` | Configuración del pipeline de Captura IA | Sembrado, sin ninguna acción real que lo consuma todavía — no existe pantalla de configuración (mismo patrón que `roles.gestionar`/`usuarios.invitar`) |
| `usuarios.ver` | Ver listado/ficha de usuarios | Ninguno todavía (solo pertenencia de empresa) |
| `usuarios.editar` | Activar/desactivar usuarios | **Sí — lógica de negocio real** (`UserController::esElUltimoConGestion()`, RC1 Fase 4) |
| `usuarios.invitar` | Invitar un usuario nuevo | Ninguno (Módulo 6, sin construir) |
| `roles.ver` | Ver roles de la empresa | Ninguno (Módulo 5, sin construir) |
| `roles.gestionar` | Crear/editar/activar/desactivar roles | Ninguno (Módulo 5, sin construir) |
| `auditoria.ver` | Ver el módulo de Auditoría | Ninguno (Fase 7, sin construir) |
| `plataforma.empresas.ver` | Platform Super Admin: ver empresas | Ninguno |
| `plataforma.usuarios.ver` | Platform Super Admin: ver usuarios de cualquier empresa | Ninguno |

**"Módulo que lo consume hoy" = ¿algún `Policy`/`Controller` llama `$user->can('ese.permiso')` o equivalente?** Tras Fase 4.6, **9 de las 10 Policies existentes** (`ProductoPolicy`, `MovimientoPolicy`, `CapturaIAPolicy`, `CategoriaPolicy`, `MarcaPolicy`, `UnidadMedidaPolicy`, `StockPolicy`, `ProveedorPolicy`, `ProductoProveedorPolicy`) verifican un permiso Spatie real, **AND**eado con la pertenencia de empresa preexistente — nunca reemplazándola. Queda exactamente **una** excepción deliberada y anterior a Fase 4.5/4.6: `UserPolicy` (RC1 Fase 4) solo verifica pertenencia de empresa — `usuarios.ver` no tiene ningún consumidor todavía (ver fila arriba); la única lógica de negocio real hoy sobre Usuarios es la guarda del último administrador (`esElUltimoConGestion()`), no un chequeo de permiso Spatie. `roles.*`/`auditoria.*`/`usuarios.invitar` tampoco tienen Policy propia — esperan a los Módulos 5/6/7 que todavía no existen, no es un gap del modelo de autorización en sí.

Módulo 3 (Authorization/RBAC — middleware que aplica el permiso a nivel de ruta, `PermissionContext` en el frontend) sigue `[ ]` sin construir en `docs/00_VISION/Roadmap.md`. Ni Fase 4.5 ni Fase 4.6 lo reemplazan: mueven el chequeo de permiso a la capa de Policy (server-side, siempre evaluado, ahora sobre **todos** los recursos existentes), que es más fuerte que un middleware de ruta pero no incluye el `PermissionContext`/sidebar dinámico que Módulo 3 todavía debe construir para el frontend.

### Gap 2 — CERRADO (Fase 4.5, 2026-08-02)

~~`PermissionSeeder` no tiene ninguna entrada para: Categorías, Marcas, Unidades de Medida, Stock, Proveedores, Producto↔Proveedor.~~ Los 23 permisos de estos seis módulos ya están sembrados y enforced. Ver tabla arriba y sección 4.

### Gap 5 — CERRADO (Fase 4.6, 2026-08-02)

~~Productos, Movimientos y Captura IA tienen el mismo gap que tenían los 6 módulos de Fase 4.5: permiso sembrado, sin `$user->can()` en su Policy.~~ `ProductoPolicy`, `MovimientoPolicy` y `CapturaIAPolicy` ya exigen permiso real, AND-eado con pertenencia de empresa. 1 permiso nuevo (`captura-ia.gestionar`, sembrado sin consumidor todavía, mismo patrón que `roles.gestionar`), 1 permiso renombrado (`productos.eliminar` → `productos.gestionar`, sin pérdida de asociaciones existentes), 1 ability nueva (`CapturaIAPolicy::review()`, separada de `update()`). Tests nuevos por módulo (Producto, Movimiento, Captura IA + `CompanyIsolationHttpTest`) prueban explícitamente: usuario autorizado tiene éxito, usuario sin permiso recibe 403, acceso cross-company sigue prohibido. Suite completa: **232/232**. El detalle vive en `docs/05_IMPLEMENTATION/AuthorizationCompletion.md`.

---

## 3. Resource Access — modelo de aislamiento por recurso

| Recurso | Modelo Eloquent | Aislamiento por empresa | Policy |
| --- | --- | --- | --- |
| Productos | `Producto` | Automático (`TenantScope` vía `BelongsToEmpresa`) | `ProductoPolicy` |
| Categorías | `Categoria` | Automático | `CategoriaPolicy` |
| Marcas | `Marca` | Automático | `MarcaPolicy` |
| Unidades de Medida | `UnidadMedida` | Automático | `UnidadMedidaPolicy` |
| Stock | `Producto` (mismo modelo — Stock no es una entidad independiente) | Automático | `StockPolicy` — **dedicada, no `ProductoPolicy`** (ver nota abajo) |
| Movimientos | `Movimiento` | Automático | `MovimientoPolicy` |
| Proveedores | `Proveedor` | Automático | `ProveedorPolicy` |
| Producto↔Proveedor | `ProductoProveedor` | Automático | `ProductoProveedorPolicy` |
| Captura IA | `CapturaIA` | Automático | `CapturaIAPolicy` |
| **Usuarios** | `User` | **Manual** — `User` no usa `BelongsToEmpresa` a propósito (aplicar un scope global a un modelo que el propio guard de autenticación resuelve se consideró riesgo fuera de alcance de Fase 4); cada Controller filtra por `empresa_id` vía `TenantContext::empresaId()` | `UserPolicy` (segunda capa, sobre el resultado ya filtrado) |
| Roles | `Role` (subclase de Spatie con `BelongsToEmpresa`; columna `estado` agregada en Fase 4.5) | Automático | **No existe todavía** — Módulo 5 |
| Auditoría (`AuditLog`) | `AuditLog` | Automático (`BelongsToEmpresa`, per Módulo 2) | No existe todavía — no hay endpoint de consulta (Fase 7) |
| Plataforma (multi-empresa) | `Empresa`, `User` sin scope | N/A — `TenantScope::bypass()` exclusivo de `is_platform_admin` | No existe todavía |

**Nota — por qué Stock tiene su propia Policy (Fase 4.5)**: Laravel resuelve una Policy por **clase de modelo**, no por controller. Stock opera sobre `Producto` (mismo modelo que `ProductoController`), así que si su chequeo de permiso viviera dentro de `ProductoPolicy`, gatearía también las acciones propias de Productos con el permiso equivocado. `StockPolicy` es una clase separada, y `StockController` la invoca directamente (inyectada, vía un helper `authorizeStock()`) en vez de usar el atajo `$this->authorize('ability', $producto)`, que siempre habría resuelto a `ProductoPolicy`. Cualquier módulo futuro que comparta modelo con otro (como Stock con Producto) debe seguir este mismo patrón, no intentar mezclar dos permisos dentro de una Policy compartida.

---

## 4. CRUD Permissions — estado real por módulo

Columnas: acción existente hoy (✔/✘) y el permiso que la gatea. `—` = la acción no aplica a ese módulo por diseño (decisión de arquitectura ya confirmada, no un gap).

| Módulo | Listar | Ver | Crear | Editar | Activar/Desactivar | Eliminar (físico) | Permiso (prefijo) |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | --- |
| Productos | ✔ | ✔ | ✔ | ✔ | ✔ (`disable`/`enable`) | — (nunca físico) | `productos.*` — **enforced (Fase 4.6)**; `disable` exige `productos.gestionar`, `enable`/`registrarIngreso` reusan `productos.editar` |
| Categorías | ✔ | ✔ | ✔ | ✔ | ✔ | — | `categorias.*` — **enforced (Fase 4.5)** |
| Marcas | ✔ | ✔ | ✔ | ✔ | ✔ | — | `marcas.*` — **enforced (Fase 4.5)** |
| Unidades de Medida | ✔ | ✔ | ✔ | ✔ | ✔ | — | `unidades-medida.*` — **enforced (Fase 4.5)** |
| Stock | ✔ | ✔ | — (nunca aplica, ver `Stock.md`) | ✔ (solo umbrales) | ✔ | — | `stock.*` (sin `.crear`) — **enforced (Fase 4.5)**, vía `StockPolicy` dedicada |
| Movimientos | ✔ | ✔ | ✔ | ✔ (solo metadata) | — (ledger append-only, ver `Movements.md`) | — | `movimientos.ver`/`movimientos.crear` — **enforced (Fase 4.6)**. Editar metadata **deliberadamente sin permiso propio** — no existe `movimientos.editar` en el catálogo, cualquier usuario autenticado de la empresa puede corregir `documento`/`observacion`/`lote`/`vencimiento` (decisión de negocio explícita: los permisos solo controlan quién crea o ve movimientos) |
| Proveedores | ✔ | ✔ | ✔ | ✔ | ✔ | — | `proveedores.*` — **enforced (Fase 4.5)** |
| Producto↔Proveedor | ✔ | ✔ | ✔ | ✔ | ✔ (solo `disable`) | — | `producto-proveedor.*` (namespace propio) — **enforced (Fase 4.5)** |
| Captura IA | ✔ | ✔ | ✔ (foto/voz) | ✔ (corregir detalle) | ✔ (confirmar/descartar) | — | `captura-ia.*` — **enforced (Fase 4.6)**; crear/ver exige `.usar`, corregir detalle exige `.revisar`, confirmar/descartar exige `.confirmar` |
| **Usuarios** | ✔ | ✔ | — (Módulo 6) | — (fuera de alcance, ver `Users.md`) | ✔ | — (nunca) | `usuarios.*` — enforcement parcial (solo la guarda del último administrador, RC1 Fase 4) |
| **Roles** *(Fase 5, a construir)* | por construir | por construir | por construir | por construir | por construir | **—** (confirmado: sin Delete) | `roles.*` (ya existe, sin enforcement — lo construye Fase 5) |

---

## 5. Module Permissions — mapeo permiso → módulo

| Permiso (existente) | Empaqueta acceso a |
| --- | --- |
| `productos.ver/crear/editar/gestionar` | Módulo Productos — **enforced (Fase 4.6)**. `gestionar` renombrado desde `eliminar` (mismo permiso, misma fila en BD — solo el nombre cambió) |
| `categorias.ver/crear/editar/gestionar` | Módulo Categorías — **enforced (Fase 4.5)** |
| `marcas.ver/crear/editar/gestionar` | Módulo Marcas — **enforced (Fase 4.5)** |
| `unidades-medida.ver/crear/editar/gestionar` | Módulo Unidades de Medida — **enforced (Fase 4.5)** |
| `stock.ver/editar/gestionar` | Módulo Stock (vista sobre `Producto`, permiso independiente vía `StockPolicy` dedicada) — **enforced (Fase 4.5)** |
| `proveedores.ver/crear/editar/gestionar` | Módulo Proveedores — **enforced (Fase 4.5)** |
| `producto-proveedor.ver/crear/editar/gestionar` | Asociación Producto↔Proveedor (namespace propio, distinto de `proveedores.*`) — **enforced (Fase 4.5)** |
| `movimientos.ver/crear` | Módulo Movimientos (Listar/Ver/Crear) — **enforced (Fase 4.6)**. No hay `movimientos.editar` en el catálogo — la edición de metadata deliberadamente no tiene permiso propio (ver sección 4) |
| `captura-ia.usar/revisar/confirmar/gestionar` | Pipeline de Captura IA completo — **enforced (Fase 4.6)** para `usar`/`revisar`/`confirmar`; `gestionar` sembrado para configuración futura, sin consumidor todavía |
| `usuarios.ver/editar/invitar` | Módulo Usuarios (Fase 4, certificado construido) + futuro Módulo 6 |
| `roles.ver/gestionar` | Módulo Roles (Fase 5, a construir desde este documento) |
| `auditoria.ver` | Futura pantalla de Auditoría (Fase 7) |
| `plataforma.empresas.ver`, `plataforma.usuarios.ver` | Superficie exclusiva de Platform Super Admin, namespace reservado — **nunca** asignable a un rol de empresa (validación de aplicación, no constraint de base de datos, a implementar en Módulo 5) |

---

## 6. Reglas de Fase 5 (Roles), confirmadas por el propietario del proyecto

- **CRUD**: Listar, Ver, Crear, Editar, Activar, Desactivar. **Sin Delete** — `docs/04_TECHNICAL_SPEC/API.md` ya no documenta `DELETE /roles/{id}` (corregido en Fase 4.5, ver `docs/07_RELEASE` del changelog); el diseño de Fase 5 debe seguir exactamente el mismo patrón de Categorías/Marcas/Unidades de Medida/Proveedores.
- **Un rol con usuarios asignados no puede desactivarse hasta reasignarlos.** Requiere, antes de desactivar, verificar `model_has_roles` por ese `role_id` — si algún usuario (activo o inactivo) todavía lo tiene asignado, rechazar con 409 (mismo patrón de excepción de negocio que `LastCompanyAdminException` en Usuarios) hasta que se reasignen a otro rol.
- **Los permisos son exclusivamente vía rol.** Verificado en código: `model_has_permissions` (permiso directo a un usuario, sin rol intermedio) **nunca se usa** hoy — el único lugar que asigna permisos es `RoleSeeder::crear()`, siempre sobre un `Role`, nunca sobre un `User`. Esto cierra formalmente la pregunta abierta en `Roles.md` ("¿se usa `model_has_permissions` alguna vez?"): **no, queda prohibido por diseño**. El Módulo 5 nunca debe exponer una UI ni un endpoint que otorgue un permiso directamente a un usuario.
- **Resuelto en Fase 4.5**: `roles.estado` (string, `activo`/`inactivo`, mismo patrón que el resto del ERP — **no** un booleano) ya existe (`database/migrations/2026_08_02_090000_add_estado_to_roles_table.php`). Fase 5 construye la lógica de Activar/Desactivar sobre esta columna ya lista, sin necesitar su propia migración.
- **Regla dura heredada, sin cambios**: ningún Policy/Controller de Roles debe verificar `hasRole('Admin')` — el propio motor de autorización no debe conocer nombres de rol como concepto de negocio, solo permisos (`Roles.md`, "Regla dura").

---

## 7. Future Expansion Rules

1. **Cómo se agrega un permiso nuevo**: únicamente vía `PermissionSeeder::PERMISSIONS`, como parte de la unidad de trabajo que construye el módulo que lo necesita — nunca editable por una empresa, nunca vía UI. Ejecutar `php artisan migrate:fresh --seed` (o un seeder idempotente equivalente en producción) tras agregarlo.
2. **Convención de nombres, formalizada en Fase 4.5**: `recurso.accion`, minúsculas, singular o plural según ya esté establecido para ese recurso (`productos` no `producto`), separados por punto (o guion para nombres compuestos: `unidades-medida`, `producto-proveedor`). Verbos: `ver`, `crear`, `editar`, `gestionar` (activar/desactivar), `usar`, `revisar`, `confirmar`, `invitar`. **Resuelto en Fase 4.6**: `productos.eliminar` (la única inconsistencia de nombres heredada que quedaba) se renombró a `productos.gestionar` vía migración de datos (`UPDATE permissions SET name = ...`, no delete+recreate) — preserva el `id` del permiso y todas sus asociaciones en `role_has_permissions`/`model_has_permissions`. Los 9 módulos con `gestionar` (los 6 de Fase 4.5 + Productos/Stock ya lo tenían) ahora comparten el mismo verbo para la misma acción; no queda ningún permiso nombrado con un verbo que no refleje el comportamiento real.
3. **`plataforma.*` es namespace reservado permanente** — ningún rol de empresa puede recibirlo, sin excepción, validado a nivel de aplicación cuando exista el Módulo 5.
4. **Todo módulo nuevo que exponga un recurso propio nace con su propio namespace de permisos** desde su primera unidad de trabajo — Fase 4.5 cerró el gap retroactivo para los seis módulos que no lo tenían; ningún módulo futuro debería volver a acumular esta deuda.
5. **Enforcement real de ruta (Módulo 3) es un prerrequisito de producto, no de este módulo específico** — Roles puede construirse y ser funcional (gestionar roles y sus permisos) sin que Módulo 3 exista todavía, exactamente como Usuarios y Fase 4.5 se construyeron sobre el mismo nivel incremental (permiso verificado en la Policy, sin middleware de ruta ni `PermissionContext` en el frontend todavía). Cuando Módulo 3 se construya, debe consumir esta misma matriz (sección 4/5) para decidir qué permiso exige cada ruta — no debe inventar un mapeo nuevo.
6. **Resuelto en Fase 4.6**: ~~Productos, Movimientos y Captura IA quedan con el mismo gap que tenían los 6 módulos de Fase 4.5~~ — `ProductoPolicy`, `MovimientoPolicy` y `CapturaIAPolicy` ya exigen permiso real. La arquitectura de autorización se considera completa: todo módulo existente comparte exactamente el mismo modelo RBAC (pertenencia de empresa AND permiso). No debería requerirse trabajo de autorización adicional salvo para módulos futuros (Roles, Auditoría, Módulo 6).

---

## Resumen de gaps para decisión del propietario del proyecto

| # | Gap | Estado |
| --- | --- | --- |
| 1 | Sin flujo real de alta de empresa/primer administrador | Abierto — documentado, fuera del roadmap de 8 fases actual |
| 2 | 6 recursos sin permisos propios en el catálogo | **Cerrado (Fase 4.5)** — 23 permisos nuevos, Policies actualizadas, 36 tests nuevos, 228/228 suite completa |
| 3 | `roles` sin columna de estado | **Cerrado (Fase 4.5)** — migración aplicada, string `estado`, no booleano |
| 4 | `API.md` documentaba `DELETE /roles/{id}` | **Cerrado (Fase 4.5)** — removido |
| 5 | Productos/Movimientos/Captura IA tienen el mismo gap que tenían los 6 módulos de Fase 4.5 | **Cerrado (Fase 4.6)** — 3 Policies actualizadas, 1 permiso renombrado, 1 permiso nuevo, 1 ability nueva, tests nuevos, 232/232 suite completa |

Gap 1 es el único abierto — fuera del roadmap de 8 fases actual, no bloquea Fase 5.

---

**Aprobado como referencia oficial del modelo de autorización — arquitectura de autorización completa. Fase 5 (Roles UI) puede comenzar sin trabajo de autorización pendiente en los módulos existentes.**
