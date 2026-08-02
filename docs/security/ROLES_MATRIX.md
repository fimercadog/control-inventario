# Roles Matrix — RBAC de FidelOS

**Status: Approved — referencia oficial del modelo de autorización** (aprobado 2026-08-02; Fase 4.5 — Authorization Alignment — cerró los Gaps 2 y 3 originales el mismo día)

> Verificado contra código real, no inferencia: `backend/database/seeders/PermissionSeeder.php`, `RoleSeeder.php`, `backend/app/Policies/*.php` (las 11 Policies existentes, incluye `StockPolicy` nueva), `backend/routes/api.php` (fuente única de verdad de qué endpoints existen hoy), `backend/app/Models/Role.php`, `config/permission.php`, `database/migrations/2026_08_02_090000_add_estado_to_roles_table.php`. Complementa — no reemplaza — `docs/03_FUNCTIONAL_SPEC/Roles.md` (diseño narrativo del motor RBAC) y `docs/04_TECHNICAL_SPEC/Security.md` (principios de seguridad generales, desactualizado respecto a los módulos construidos desde Fase 1). Este documento es la referencia obligatoria para construir el Módulo 5 (Role Management) — "el módulo Roles se construye desde esta matriz, no desde supuestos".
>
> **Fase 4.5 (Authorization Alignment, 2026-08-02)** alineó los seis módulos que esta matriz identificó sin permiso propio (Categorías, Marcas, Unidades de Medida, Stock, Proveedores, Producto↔Proveedor): cada uno ganó su propio namespace de permisos y sus Policies pasaron de "solo pertenencia de empresa" a **pertenencia de empresa Y permiso** (`AND`, nunca `OR`). 6 tests nuevos por módulo (36 en total) prueban explícitamente: usuario autorizado tiene éxito, usuario sin permiso recibe 403, acceso cross-company sigue prohibido. Suite completa: **228/228**. El detalle de qué se hizo por módulo vive en `docs/05_IMPLEMENTATION/AuthorizationAlignment.md`.

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

`PermissionSeeder` (guard `api`, global y fijo — ninguna empresa lo edita), 15 permisos sembrados hoy:

| Permiso | Descripción | Módulo que lo consume hoy |
| --- | --- | --- |
| `productos.ver` | Ver catálogo de productos | Ninguno todavía (Policy solo verifica empresa — Productos queda **fuera** del alcance de Fase 4.5, ver nota abajo) |
| `productos.crear` | Crear productos | Ninguno todavía |
| `productos.editar` | Editar productos | Ninguno todavía |
| `productos.eliminar` | Deshabilitar/habilitar productos | Ninguno todavía |
| `categorias.ver/crear/editar/gestionar` | CRUD de Categorías (`gestionar` = activar/desactivar) | **Sí** — `CategoriaPolicy` (Fase 4.5) |
| `marcas.ver/crear/editar/gestionar` | CRUD de Marcas | **Sí** — `MarcaPolicy` (Fase 4.5) |
| `unidades-medida.ver/crear/editar/gestionar` | CRUD de Unidades de Medida | **Sí** — `UnidadMedidaPolicy` (Fase 4.5) |
| `stock.ver/editar/gestionar` | Ver/editar umbrales/activar-desactivar Stock (sin `.crear` — nunca se crea independiente) | **Sí** — `StockPolicy` (Fase 4.5, dedicada — ver nota sobre conflicto con `ProductoPolicy` en la sección 3) |
| `proveedores.ver/crear/editar/gestionar` | CRUD de Proveedores | **Sí** — `ProveedorPolicy` (Fase 4.5) |
| `producto-proveedor.ver/crear/editar/gestionar` | CRUD de la asociación Producto↔Proveedor | **Sí** — `ProductoProveedorPolicy` (Fase 4.5) |
| `movimientos.ver` | Ver movimientos de inventario | Ninguno todavía (fuera de alcance de Fase 4.5) |
| `movimientos.crear` | Registrar movimientos (Entrada/Salida/Ajuste) | Ninguno todavía |
| `captura-ia.usar` | Usar Captura IA (foto/voz) | Ninguno todavía |
| `captura-ia.revisar` | Revisar/corregir una detección | Ninguno todavía |
| `captura-ia.confirmar` | Confirmar/descartar una detección | Ninguno todavía |
| `usuarios.ver` | Ver listado/ficha de usuarios | Ninguno todavía (solo pertenencia de empresa) |
| `usuarios.editar` | Activar/desactivar usuarios | **Sí — lógica de negocio real** (`UserController::esElUltimoConGestion()`, RC1 Fase 4) |
| `usuarios.invitar` | Invitar un usuario nuevo | Ninguno (Módulo 6, sin construir) |
| `roles.ver` | Ver roles de la empresa | Ninguno (Módulo 5, sin construir) |
| `roles.gestionar` | Crear/editar/activar/desactivar roles | Ninguno (Módulo 5, sin construir) |
| `auditoria.ver` | Ver el módulo de Auditoría | Ninguno (Fase 7, sin construir) |
| `plataforma.empresas.ver` | Platform Super Admin: ver empresas | Ninguno |
| `plataforma.usuarios.ver` | Platform Super Admin: ver usuarios de cualquier empresa | Ninguno |

**"Módulo que lo consume hoy" = ¿algún `Policy`/`Controller` llama `$user->can('ese.permiso')` o equivalente?** Tras Fase 4.5, **11 de las 12 Policies existentes** (`CategoriaPolicy`, `MarcaPolicy`, `UnidadMedidaPolicy`, `StockPolicy`, `ProveedorPolicy`, `ProductoProveedorPolicy`, `UserPolicy` + la guarda de negocio de Usuarios) ya verifican un permiso Spatie real, **AND**eado con la pertenencia de empresa preexistente — nunca reemplazándola. Quedan exactamente **tres** Policies sin ese segundo factor: `ProductoPolicy`, `MovimientoPolicy`, `CapturaIAPolicy` — deliberadamente fuera del alcance de Fase 4.5 (ver nota abajo), y `roles.*`/`auditoria.*`/`usuarios.invitar` (esperan a los Módulos 5/6/7 que todavía no existen).

**Nota sobre Productos/Movimientos/Captura IA, deliberadamente fuera de Fase 4.5**: estos tres módulos **también** carecen hoy de enforcement de permiso real en su Policy — el mismo gap que tenían los seis módulos recién alineados. La Decisión de Fase 4.5 nombró explícitamente solo seis módulos como alcance; Productos/Movimientos/Captura IA quedan como el mismo tipo de gap, documentado aquí para que no se pierda, pendiente de una decisión explícita del propietario del proyecto sobre si entran en una fase de alineación posterior o se resuelven junto con el Módulo 3 (Authorization/RBAC) de una vez.

Módulo 3 (Authorization/RBAC — middleware que aplica el permiso a nivel de ruta, `PermissionContext` en el frontend) sigue `[ ]` sin construir en `docs/00_VISION/Roadmap.md`. Fase 4.5 no lo reemplaza: mueve el chequeo de permiso a la capa de Policy (server-side, siempre evaluado), que es más fuerte que un middleware de ruta pero no incluye el `PermissionContext`/sidebar dinámico que Módulo 3 todavía debe construir para el frontend.

### Gap 2 — CERRADO (Fase 4.5, 2026-08-02)

~~`PermissionSeeder` no tiene ninguna entrada para: Categorías, Marcas, Unidades de Medida, Stock, Proveedores, Producto↔Proveedor.~~ Los 23 permisos de estos seis módulos ya están sembrados y enforced. Ver tabla arriba y sección 4.

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
| Productos | ✔ | ✔ | ✔ | ✔ | ✔ (`disable`/`enable`) | — (nunca físico) | `productos.*` (sembrado, **sin enforcement en Policy todavía** — fuera de alcance de Fase 4.5) |
| Categorías | ✔ | ✔ | ✔ | ✔ | ✔ | — | `categorias.*` — **enforced (Fase 4.5)** |
| Marcas | ✔ | ✔ | ✔ | ✔ | ✔ | — | `marcas.*` — **enforced (Fase 4.5)** |
| Unidades de Medida | ✔ | ✔ | ✔ | ✔ | ✔ | — | `unidades-medida.*` — **enforced (Fase 4.5)** |
| Stock | ✔ | ✔ | — (nunca aplica, ver `Stock.md`) | ✔ (solo umbrales) | ✔ | — | `stock.*` (sin `.crear`) — **enforced (Fase 4.5)**, vía `StockPolicy` dedicada |
| Movimientos | ✔ | ✔ | ✔ | ✔ (solo metadata) | — (ledger append-only, ver `Movements.md`) | — | `movimientos.*` (sembrado, sin enforcement todavía — fuera de alcance de Fase 4.5) |
| Proveedores | ✔ | ✔ | ✔ | ✔ | ✔ | — | `proveedores.*` — **enforced (Fase 4.5)** |
| Producto↔Proveedor | ✔ | ✔ | ✔ | ✔ | ✔ (solo `disable`) | — | `producto-proveedor.*` (namespace propio) — **enforced (Fase 4.5)** |
| Captura IA | ✔ | ✔ | ✔ (foto/voz) | ✔ (corregir detalle) | ✔ (confirmar/descartar) | — | `captura-ia.*` (sembrado, sin enforcement todavía — fuera de alcance de Fase 4.5) |
| **Usuarios** | ✔ | ✔ | — (Módulo 6) | — (fuera de alcance, ver `Users.md`) | ✔ | — (nunca) | `usuarios.*` — enforcement parcial (solo la guarda del último administrador, RC1 Fase 4) |
| **Roles** *(Fase 5, a construir)* | por construir | por construir | por construir | por construir | por construir | **—** (confirmado: sin Delete) | `roles.*` (ya existe, sin enforcement — lo construye Fase 5) |

---

## 5. Module Permissions — mapeo permiso → módulo

| Permiso (existente) | Empaqueta acceso a |
| --- | --- |
| `productos.ver/crear/editar/eliminar` | Módulo Productos — sembrado, **sin enforcement en Policy todavía** (fuera de alcance de Fase 4.5) |
| `categorias.ver/crear/editar/gestionar` | Módulo Categorías — **enforced (Fase 4.5)** |
| `marcas.ver/crear/editar/gestionar` | Módulo Marcas — **enforced (Fase 4.5)** |
| `unidades-medida.ver/crear/editar/gestionar` | Módulo Unidades de Medida — **enforced (Fase 4.5)** |
| `stock.ver/editar/gestionar` | Módulo Stock (vista sobre `Producto`, permiso independiente vía `StockPolicy` dedicada) — **enforced (Fase 4.5)** |
| `proveedores.ver/crear/editar/gestionar` | Módulo Proveedores — **enforced (Fase 4.5)** |
| `producto-proveedor.ver/crear/editar/gestionar` | Asociación Producto↔Proveedor (namespace propio, distinto de `proveedores.*`) — **enforced (Fase 4.5)** |
| `movimientos.ver/crear` | Módulo Movimientos (Listar/Ver/Crear) — sembrado, sin enforcement todavía (fuera de alcance de Fase 4.5). No hay `movimientos.editar` en el catálogo — la edición de metadata no tiene permiso propio. |
| `captura-ia.usar/revisar/confirmar` | Pipeline de Captura IA completo — sembrado, sin enforcement todavía |
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
2. **Convención de nombres, formalizada en Fase 4.5**: `recurso.accion`, minúsculas, singular o plural según ya esté establecido para ese recurso (`productos` no `producto`), separados por punto (o guion para nombres compuestos: `unidades-medida`, `producto-proveedor`). Verbos: `ver`, `crear`, `editar`, `gestionar` (activar/desactivar — usado consistentemente en los 6 permisos nuevos de Fase 4.5), `usar`, `revisar`, `confirmar`, `invitar`. **Nota de consistencia heredada, sin resolver todavía**: `productos.eliminar` (permiso preexistente, fuera de alcance de Fase 4.5) sigue nombrado con un verbo que no refleja el comportamiento real — Productos nunca hace un DELETE físico, solo activa/desactiva. Los 6 módulos de Fase 4.5 ya usan `gestionar` para esa misma acción, evitando repetir la inconsistencia. No se propone renombrar `productos.eliminar` retroactivamente aquí — tiene impacto en roles ya asignados, a evaluar aparte.
3. **`plataforma.*` es namespace reservado permanente** — ningún rol de empresa puede recibirlo, sin excepción, validado a nivel de aplicación cuando exista el Módulo 5.
4. **Todo módulo nuevo que exponga un recurso propio nace con su propio namespace de permisos** desde su primera unidad de trabajo — Fase 4.5 cerró el gap retroactivo para los seis módulos que no lo tenían; ningún módulo futuro debería volver a acumular esta deuda.
5. **Enforcement real de ruta (Módulo 3) es un prerrequisito de producto, no de este módulo específico** — Roles puede construirse y ser funcional (gestionar roles y sus permisos) sin que Módulo 3 exista todavía, exactamente como Usuarios y Fase 4.5 se construyeron sobre el mismo nivel incremental (permiso verificado en la Policy, sin middleware de ruta ni `PermissionContext` en el frontend todavía). Cuando Módulo 3 se construya, debe consumir esta misma matriz (sección 4/5) para decidir qué permiso exige cada ruta — no debe inventar un mapeo nuevo.
6. **Productos, Movimientos y Captura IA quedan con el mismo gap que tenían los 6 módulos de Fase 4.5** — permiso sembrado, sin `$user->can()` en su Policy. No se resolvió en esta unidad de trabajo porque el alcance de Fase 4.5 nombró explícitamente solo seis módulos. Queda como decisión pendiente y explícita del propietario del proyecto, no un olvido.

---

## Resumen de gaps para decisión del propietario del proyecto

| # | Gap | Estado |
| --- | --- | --- |
| 1 | Sin flujo real de alta de empresa/primer administrador | Abierto — documentado, fuera del roadmap de 8 fases actual |
| 2 | 6 recursos sin permisos propios en el catálogo | **Cerrado (Fase 4.5)** — 23 permisos nuevos, Policies actualizadas, 36 tests nuevos, 228/228 suite completa |
| 3 | `roles` sin columna de estado | **Cerrado (Fase 4.5)** — migración aplicada, string `estado`, no booleano |
| 4 | `API.md` documentaba `DELETE /roles/{id}` | **Cerrado (Fase 4.5)** — removido |
| 5 | Productos/Movimientos/Captura IA tienen el mismo gap que tenían los 6 módulos de Fase 4.5 | Abierto — decisión explícita pendiente: ¿una Fase 4.6, o se resuelve junto con Módulo 3? |

---

**Aprobado como referencia oficial del modelo de autorización — Fase 5 puede comenzar.**
