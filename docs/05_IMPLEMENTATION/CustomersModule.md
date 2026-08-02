# Informe Final — Módulo Clientes (Vertical Slice Completo)

## Resumen del trabajo realizado

Cambio de metodología explícito del propietario del proyecto (2026-08-02): "A module is either COMPLETE or it does not exist in the navigation." Se removieron los 4 módulos placeholder restantes (Clientes, Roles, Auditoría, Reportes, Perfil — 5 en total, Clientes se reconstruyó, los otros 4 se eliminaron) y se construyó Clientes como el primer módulo bajo la nueva regla: vertical slice completo desde el primer commit — Base de Datos, Domain (Model+Repository+Service+DTO+Policy), API (Controller+Validación+Rutas+Tests), Frontend (Listado+Crear+Editar+Ver+Filtros+Búsqueda+Paginación+Redux+integración real), Persistencia real, y Documentación — sin ninguna etapa intermedia de placeholder.

Precede a esta unidad de trabajo una auditoría exhaustiva de los 16 módulos del ERP contra el código real (no contra documentación), solicitada explícitamente por el propietario del proyecto, que confirmó cuáles módulos eran realmente COMPLETE/PARTIAL/NOT IMPLEMENTED (`docs/03_FUNCTIONAL_SPEC/RC1_FUNCTIONAL_MODULE_AUDIT.md`).

## Funcionalidades implementadas

- **Base de Datos**: migración `create_clientes_table` (mismo shape que `proveedores`), `ClienteFactory`, `ClienteSeeder` — 150 clientes demo en la empresa principal, 25 en la secundaria.
- **Domain**: `Cliente` (Model, `BelongsToEmpresa`), `ClienteRepository` (primer Repository de este proyecto — encapsula búsqueda/filtro/paginación), `ClienteService` (orquesta Repository + `AuditLogger`), `ClienteDTO` (segundo DTO del proyecto tras Captura IA — preserva la distinción entre "campo no enviado" y "campo enviado como `null`", con test dedicado), `ClientePolicy` (pertenencia de empresa AND permiso, mismo modelo que el resto del ERP desde Fase 4.5/4.6, sin etapa de transición).
- **API**: `ClienteController` (index/store/show/update/disable/enable), `StoreClienteRequest`/`UpdateClienteRequest`, `ClienteResource`, rutas `/api/v1/clientes` — mismo shape que `/proveedores`. Permisos `clientes.ver/crear/editar/gestionar` sembrados y otorgados a los roles demo relevantes (Administrador vía catálogo completo, Supervisor/Vendedor/Auxiliar Contable con subconjuntos realistas).
- **Tests**: `ClienteControllerTest` — 13 casos: crear, auditoría real, ver/listar, búsqueda por nombre/NIT/contacto/email, editar + auditoría, **vaciar explícitamente un campo `nullable` a `null`** (prueba dedicada de la corrección del DTO), deshabilitar/habilitar (lógico, nunca físico), oculto por defecto/visible con filtro `todos`, paginación real con `page`, aislamiento cross-company, 401 sin autenticar, 403 sin permiso.
- **Frontend**: `/clientes` (listado real con búsqueda, filtro de estado, paginación Anterior/Siguiente, badge de estado, menú de acciones), `/clientes/{id}` (ficha con edición inline), `NewClienteDialog`. Primer módulo de datos de negocio que usa Redux Toolkit (`clientes-slice.ts`) en vez del hook `useCrudList` que usan los demás módulos — cumple el stack oficial declarado en `CLAUDE.md`, sin reescribir retroactivamente los módulos anteriores.
- **Sidebar**: `Clientes` pasa de `pending: true` a entrada real con `permission: "clientes.ver"`. Se aprovechó la misma unidad de trabajo para cerrar un gap encontrado en la auditoría previa: `Categorías`/`Marcas`/`Unidades de Medida`/`Stock`/`Proveedores` tampoco tenían su `permission` correspondiente en el sidebar pese a estar sembrado y enforced desde Fase 4.5 — corregido en la unidad de trabajo anterior a esta, no en esta.

## Correcciones realizadas

- **Placeholder de Perfil, Roles, Auditoría y Reportes removidos por completo** — no solo ocultos del sidebar: se eliminaron los directorios `app/(app)/{roles,auditoria,reportes,perfil}` (incluye `perfil/cambiar-contrasena`) y el componente `pending-module.tsx`, que quedó sin ningún consumidor. El dropdown del bloque de usuario en el sidebar enlazaba a `/perfil` y `/perfil/cambiar-contrasena` (ninguno construido); se reemplazaron por un enlace a `/configuracion` (la única pantalla real de cuenta que existe hoy).
- **Bug real de diseño encontrado y corregido antes de escribir el Controller**: la primera versión de `ClienteDTO::toArray()` usaba `array_filter(fn ($v) => $v !== null)` para excluir campos no enviados — esto habría roto silenciosamente el caso de "vaciar un campo `nullable` enviándolo como `null` explícito" (un campo así habría quedado excluido del array y `update()` nunca lo habría tocado), un comportamiento distinto y peor que `$request->validated()` usado directo en el resto del proyecto. Corregido guardando el array validado original junto a las propiedades tipadas; cubierto por un test dedicado (`test_explicitly_clearing_a_nullable_field_persists_as_null`).
- **Cache de build de Next.js corrompida durante la verificación en navegador**: borrar `.next/types` mientras el servidor de desarrollo seguía corriendo (Turbopack) dejó su caché persistente en un estado de escritura concurrente inválido (`Another write batch or compaction is already active`), tumbando el proceso de `next dev` que corría en segundo plano. Corregido matando el proceso, borrando `.next` por completo, y arrancando un servidor de desarrollo limpio antes de continuar la verificación.
- **Falsos negativos de la propia verificación en navegador, no bugs de la aplicación** (documentados aquí porque consumieron tiempo real de depuración): (1) `input[autofocus]` como selector CSS nunca matchea el `autoFocus` de React (es un efecto JS post-montaje, no un atributo HTML literal) — el diálogo de creación sí funcionaba, el selector del script de verificación no; (2) esperas de 700-800ms insuficientes para una combinación de búsqueda + cambio de filtro de estado sobre 151 registros hicieron parecer una petición "colgada" cuando en realidad tardaba ~1-1.5s en resolver — confirmado con un script de polling que la petición sí completaba y el resultado era correcto. Confirmado además directamente contra la base de datos (`tinker`) que crear/editar/deshabilitar sí persistieron correctamente durante la corrida que estos falsos negativos interrumpieron.

## Relaciones verificadas

- Ningún test de aislamiento multi-tenant pre-existente se rompió — `TenantScope` sigue siendo la primera barrera para Clientes igual que para el resto de los módulos.
- El rol "Administrador" de Demo Data recibe automáticamente los 4 permisos nuevos (`Permission::all()` dinámico); Supervisor/Vendedor/Auxiliar Contable recibieron subconjuntos explícitos y realistas en `RoleSeeder`.
- Confirmado en navegador que las 4 rutas eliminadas (`/roles`, `/auditoria`, `/reportes`, `/perfil`) devuelven 404 real de Next.js, no una pantalla en blanco ni un crash — comportamiento correcto para rutas que ya no existen.

## Cambios en Backend

**Archivos creados:**

- `backend/database/migrations/2026_08_02_191934_create_clientes_table.php`
- `backend/database/factories/ClienteFactory.php`
- `backend/database/seeders/ClienteSeeder.php`
- `backend/app/Models/Cliente.php`
- `backend/app/Repositories/ClienteRepository.php` (directorio `Repositories/` nuevo en el proyecto)
- `backend/app/Services/ClienteService.php`
- `backend/app/DTO/Cliente/ClienteDTO.php`
- `backend/app/Policies/ClientePolicy.php`
- `backend/app/Http/Requests/Cliente/StoreClienteRequest.php`, `UpdateClienteRequest.php`
- `backend/app/Http/Resources/Cliente/ClienteResource.php`
- `backend/app/Http/Controllers/Api/ClienteController.php`
- `backend/tests/Feature/ClienteControllerTest.php`

**Archivos modificados:**

- `backend/routes/api.php` (grupo `/api/v1/clientes`)
- `backend/database/seeders/PermissionSeeder.php` (4 permisos nuevos)
- `backend/database/seeders/RoleSeeder.php` (Supervisor/Vendedor/Auxiliar Contable ganan subconjuntos de `clientes.*`)
- `backend/database/seeders/DatabaseSeeder.php` (`ClienteSeeder` wired, volumen `clientes => 150`)

## Cambios en Frontend

**Archivos creados:**

- `frontend/lib/api/clientes.ts`
- `frontend/store/slices/clientes-slice.ts`
- `frontend/components/new-cliente-dialog.tsx`
- `frontend/components/cliente-detail-screen.tsx`
- `frontend/app/(app)/clientes/[id]/page.tsx`

**Archivos modificados:**

- `frontend/app/(app)/clientes/page.tsx` (reemplaza el stub `PendingModule`)
- `frontend/lib/api/types.ts` (`Cliente`, `StoreClientePayload`, `UpdateClientePayload`)
- `frontend/store/store.ts` (`clientes` reducer registrado)
- `frontend/components/app-sidebar.tsx` (Clientes real; Roles/Auditoría/Reportes eliminados de `ADMINISTRACION_ITEMS`/`BOTTOM_ITEMS`; dropdown de usuario ya no enlaza a Perfil)

**Archivos eliminados:**

- `frontend/app/(app)/roles/`, `frontend/app/(app)/auditoria/`, `frontend/app/(app)/reportes/`, `frontend/app/(app)/perfil/` (incluye `cambiar-contrasena/`)
- `frontend/components/pending-module.tsx` (sin consumidores tras el punto anterior)

## Cambios en Base de Datos

- Tabla `clientes` nueva (mismas columnas que `proveedores`).
- 4 permisos nuevos (`clientes.ver/crear/editar/gestionar`) — catálogo total: 41 → 45.
- 175 clientes demo sembrados (150 + 25) en la base de datos de desarrollo existente, sin `migrate:fresh`.

## Documentación actualizada

- `docs/03_FUNCTIONAL_SPEC/Customers.md` (nuevo, Status: Built) — reemplaza `FUTURE/Customers.md` (eliminado), con el alcance real construido documentado frente al alcance del borrador original (historial de compras, clasificación, integraciones — explícitamente fuera de alcance, dependientes de módulos que no existen).
- `docs/04_TECHNICAL_SPEC/API.md` — nueva sección Clientes.
- `docs/security/ROLES_MATRIX.md` — catálogo de permisos, secciones 3/4/5, y resumen de gaps actualizados (Gap 6 nuevo).
- `docs/03_FUNCTIONAL_SPEC/RC1_FUNCTIONAL_MODULE_AUDIT.md` — Clientes pasa de 🔴 NOT IMPLEMENTED a 🟢 COMPLETE.
- `docs/05_IMPLEMENTATION/CustomersModule.md` (este documento — nuevo).
- `docs/05_IMPLEMENTATION/SidebarRC1.md` — nota sobre la revocación de la regla "nunca ocultar un módulo del sidebar" (ver sección de Correcciones de ese documento, unidad de trabajo anterior).
- `CHANGELOG.md` — entrada nueva.

## Resultado de las pruebas

- **Backend:** `php artisan test` → **245/245 passing** (816 assertions; era 232/232 antes de esta unidad de trabajo — 13 tests nuevos, `ClienteControllerTest`).
- **Frontend:** `npx tsc --noEmit` limpio.
- **Browser tests (reales, Playwright + Microsoft Edge del sistema)**: login real, sidebar sin badges "Pronto" y sin Roles/Auditoría/Reportes/Perfil, listado de Clientes con 151 registros tras crear uno nuevo, búsqueda funcional, filtro de estado combinado con búsqueda funcional (confirmado con polling de red), crear/editar/deshabilitar confirmados directamente contra la base de datos (`tinker`) tras que los falsos negativos del script de verificación interrumpieran la corrida en vivo, rutas eliminadas devuelven 404 real sin crash, cero errores de consola.

## Estado final del módulo

🟢 **Completo** — Clientes es ahora un vertical slice real: base de datos, dominio con Repository+Service+DTO+Policy, API con tests, frontend con Redux y las 9 capacidades pedidas (Listar/Crear/Editar/Ver/Filtros/Búsqueda/Paginación/Redux/integración real), persistencia real, y documentación. Los otros 4 módulos placeholder (Roles, Auditoría, Reportes, Perfil) fueron removidos de la navegación por completo, no solo marcados "Próximamente" — quedan pendientes de la misma reconstrucción como vertical slice cuando el propietario del proyecto lo indique, uno a la vez.

## Control de versiones

- **Rama:** `main`.
- **Commit:** `0662331` — `feat(clientes): build Customers module as a complete vertical slice, remove all placeholders`.

## Confirmación de push

✅ Ejecutado correctamente: `8961c24..0662331  main -> main` contra `origin` (GitHub).

## Estado del informe

☐ Pendiente
☐ Requiere correcciones
**☑ Aprobado — pendiente de confirmación del propietario del proyecto**
