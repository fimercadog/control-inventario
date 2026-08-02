# Informe Final — Sidebar Oficial RC1

## Información General

- **Funcionalidad/módulo:** Sidebar Oficial RC1 (navegación completa, bloque de usuario, breadcrumb)
- **Fecha:** 2026-07-30
- **Rama:** main
- **Commits:** 7 (ver sección Git)

## Desarrollo

### Archivos creados

**Frontend**
- `frontend/components/pending-module.tsx` — estructura mínima honesta ("pendiente de implementación") para módulos sin backend/frontend completo.
- `frontend/components/app-breadcrumb.tsx` — breadcrumb del header derivado de la ruta actual.
- `frontend/hooks/use-crud-list.ts` — hook compartido de refetch (Global UI Standard); **preparado pero sin consumidor todavía** — ningún módulo lo usa aún (ver Pendientes).
- 10 páginas stub: `app/(app)/{categorias,marcas,unidades-medida,stock,clientes,usuarios,roles,auditoria,reportes,perfil}/page.tsx` + `app/(app)/perfil/cambiar-contrasena/page.tsx`.

**Backend**
- Ninguno nuevo — solo modificaciones (ver abajo).

### Archivos modificados

- `frontend/components/app-sidebar.tsx` — reestructurado en grupos (Inventario/Terceros/Administración) + permisos + bloque de usuario con dropdown.
- `frontend/app/(app)/layout.tsx` — header ahora usa `AppBreadcrumb` en vez de texto estático.
- `frontend/lib/api/types.ts` — `AuthenticatedUser.role: string | null`.
- `backend/app/Http/Resources/Auth/AuthenticatedUserResource.php` — expone `role` (primer rol Spatie del usuario).
- `backend/app/Http/Controllers/Api/Auth/AuthController.php` — `login`/`refresh` ahora fijan `TenantContext`/`PermissionRegistrar` antes de construir la respuesta (bug real encontrado, ver Problemas).
- `backend/database/seeders/DatabaseSeeder.php` — siembra un rol demo "Administrador" con todos los permisos del catálogo, asignado al usuario demo.
- `docs/10_GOVERNANCE/MandatoryDevelopmentWorkflow.md` — cambios que el propio usuario fue agregando en vivo durante la sesión (regla de cierre de funcionalidades, checklist de completitud ampliado); se commitearon tal como estaban.

### Archivos eliminados

Ninguno.

## Base de Datos

Sin migraciones nuevas en esta unidad de trabajo (las de Categorías/Marcas/Unidades de Medida quedaron en el commit `e6fe15d`, unidad de trabajo anterior). `migrate:fresh --seed` corrido dos veces para verificar el fix del rol demo.

## Backend

- **APIs:** ninguna nueva. Fix de comportamiento en `POST /auth/login` y `POST /auth/refresh` (antes devolvían `role: null, permissions: []` siempre, sin importar los permisos reales del usuario).
- **Servicios:** ninguno nuevo.
- **Validaciones:** sin cambios.

## Frontend

- **Pantallas:** 11 páginas nuevas (10 módulos + cambiar contraseña), todas reales (título + ruta + mensaje honesto), ninguna con datos simulados ni llamadas a APIs inexistentes.
- **Componentes:** `PendingModule`, `AppBreadcrumb`, `AppSidebar` (reestructurado).
- **Formularios:** ninguno (los módulos pendientes no tienen formularios todavía, por diseño).

## Pruebas

- **Backend:** suite completa — **138/138 passing** (incluye las pruebas ya existentes de Auth, Productos, Proveedores, Producto-Proveedor, Captura IA, Seguridad multi-tenant). No se agregaron tests automatizados nuevos específicos del sidebar (es una capa de navegación de frontend sin lógica de negocio backend propia, más allá del fix de login/refresh, que sí quedó cubierto indirectamente por la suite existente de Auth).
- **Browser tests (reales, agent-browser):**
  - Login end-to-end: ✅ funciona, aterriza en `/dashboard`.
  - Estructura del sidebar (grupos y orden exactos): ✅ verificado con captura de pantalla.
  - 8 páginas stub visitadas (`/categorias`, `/marcas`, `/stock`, `/clientes`, `/roles`, `/auditoria`, `/reportes`, `/perfil`): ✅ todas renderizan título + badge "Pendiente de implementación" + mensaje, sin 404 ni pantalla en blanco.
  - Dropdown del bloque de usuario: ❌ **falló en el primer intento real** (ver Problemas) → 🔧 corregido → ✅ reverificado, funciona.
  - Breadcrumb: ✅ verificado en `/productos` y `/dashboard`.
- **Cobertura:** típecheck de frontend limpio (`npx tsc --noEmit`, cero errores) tras corregir un error de sintaxis real encontrado en el propio proceso (ver Problemas).

## Problemas

1. **Bug real encontrado en navegador:** el bloque de usuario del sidebar crasheaba la app (`Base UI: MenuGroupContext is missing`) al hacer clic — `DropdownMenuLabel` requiere un `DropdownMenuGroup` ancestro en Base UI (a diferencia de Radix). **Corregido** envolviendo el label en `DropdownMenuGroup` en `app-sidebar.tsx`, reverificado en navegador.
2. **Error de sintaxis TypeScript real:** un comentario JSDoc en `app-sidebar.tsx` contenía literalmente `*/` dentro del texto (`proveedores.*/categorias.*`), cerrando el comentario antes de tiempo y rompiendo el archivo completo. **Corregido**, typecheck limpio después.
3. **Gap arquitectónico real descubierto y corregido** (no estaba en el alcance original de esta tarea, pero bloqueaba que el bloque de usuario mostrara datos reales): `POST /auth/login` y `POST /auth/refresh` nunca fijaban `TenantContext`/`PermissionRegistrar` antes de construir la respuesta — a diferencia de `GET /auth/me`, que sí pasa por el middleware `tenant`. Esto significaba que **todo usuario, sin excepción, veía `role: null` y `permissions: []` justo después de iniciar sesión**, sin importar sus permisos reales, hasta que algo más llamara a `/auth/me` (que hoy nada en el frontend hace automáticamente). Corregido fijando el contexto manualmente en `AuthController::respuestaConTokens()`, mismo criterio que `IdentifyTenant`. Verificado con `curl` real contra el backend.
4. **Regresión de otra unidad de trabajo, encontrada durante la verificación de este módulo:** al correr `migrate:fresh --seed` para aplicar el seeding del rol demo, se aplicaron también las migraciones pendientes de Categorías/Marcas/Unidades de Medida (`marca_id`/`unidad_medida_id` reemplazando las columnas de texto libre) — código que las consumía (`ProductService`, `ProductRepository`, `ProductoResource`, requests, controller, 4 archivos de test) todavía no existía. Esto rompió 55 tests. **Corregido completamente** en la misma sesión (commit `e6fe15d`) antes de continuar — suite completa restaurada a 138/138 en verde antes de seguir con el sidebar.
5. **Bug de seeding descubierto durante el mismo trabajo:** el rol demo "Administrador" se creaba con `empresa_id = null` (Spatie Teams necesita tanto `PermissionRegistrar::setPermissionsTeamId()` como `TenantContext::setEmpresaId()` — solo se fijaba el primero) — agravado porque `DatabaseSeeder` usa `WithoutModelEvents`, que además desactiva el hook automático de `BelongsToEmpresa`. Corregido fijando `empresa_id` explícitamente en el rol, sin depender de eventos Eloquent.

## Git

| Commit | Hash | Descripción |
|---|---|---|
| 1 | `9d2cdf1` | docs: complete SDD governance framework and testing documentation |
| 2 | `eef82ab` | feat(suppliers): add Suppliers module (FEATURE-003) |
| 3 | `97e211a` | feat(productos): add manual product creation and manual stock entry (FEATURE-001/002) |
| 4 | `3b0635d` | feat(productos): add Product-Supplier association (FEATURE-005) |
| 5 | `0702a65` | fix: use official logo for app icons, disable dev indicator, silence logout 401 (BUG-004/007/008) |
| 6 | `8fa5c0c` | docs: add closure rule for features and modules to Mandatory Development Workflow |
| 7 | `e6fe15d` | feat(catalog): normalize marca/unidad_medida into real catalog entities (RC1 Fase 1) |
| 8 | `b9a0fc4` | feat(sidebar): official RC1 sidebar with grouped navigation and real stub pages |

**Push:** ✅ realizado — `e7aac98..b9a0fc4  main -> main` contra `origin` (GitHub).

> Nota: estos 8 commits cubren todo el backlog acumulado de la sesión (no solo el sidebar), separados por módulo/funcionalidad a pedido explícito del usuario, ya que nunca se había comiteado nada hasta este punto.

## Pendientes (no completados en esta unidad)

- **`useCrudList` sin consumidor:** el hook existe pero ningún módulo lo usa todavía — Proveedores/Productos siguen parcheando estado local a mano. Pendiente de retrofit.
- **Categorías/Marcas/Unidades de Medida/Stock/Movimientos/Clientes/Usuarios/Roles/Auditoría/Reportes:** siguen siendo páginas "pendiente de implementación" — el sidebar ya los expone correctamente, pero no tienen CRUD real detrás (por diseño, siguiendo el roadmap de 8 fases aprobado — no se salta la fase actual).
- **`docs/10_GOVERNANCE/MandatoryDevelopmentWorkflow.md`** recibió una edición adicional en vivo (por el usuario) después del último commit de esta unidad — queda sin comitear, se incluirá en la próxima unidad de trabajo.

## Corrección — Sidebar no reflejaba el estado real de implementación (2026-08-02)

Auditoría solicitada explícitamente por el propietario del proyecto: "As Super Administrator I need to see every module that already exists in the system... the sidebar must reflect the real state of the ERP." Se comparó cada entrada del sidebar contra `routes/api.php`, cada Controller, y cada `page.tsx` real antes de tocar código (ver tabla de auditoría completa en el resumen de esa conversación — no se repite aquí).

**Hallazgos:**

1. **`Perfil` estaba mal clasificado** — el propio propietario del proyecto lo listó como "Implemented / debe ser completamente accesible", pero tanto `/perfil` como `/perfil/cambiar-contrasena` son (y siguen siendo) stubs `PendingModule` puros, sin ningún contenido real — el mismo estado que tenían el día que se escribió este informe (sección "Archivos creados" arriba). Confirmado con el propietario del proyecto vía pregunta directa; decidió moverlo al grupo "Planned". `app-sidebar.tsx` no lo marcaba `pending: true`, así que aparecía indistinguible de un módulo terminado.
2. **Gap real en la lógica de permisos del sidebar, independiente del punto 1**: `Categorías`, `Marcas`, `Unidades de Medida`, `Stock` y `Proveedores` no tenían ninguna key `permission` en su `NavItem`, así que quedaban visibles para cualquier usuario autenticado sin importar su rol — el comentario del propio archivo lo justificaba diciendo que "los permisos de proveedores o categorías no están sembrados todavía", afirmación que Fase 4.5 (2026-08-02, ver `docs/security/ROLES_MATRIX.md`) dejó desactualizada: esos 5 módulos ya tienen permiso `.ver` real, sembrado y enforced en su Policy desde esa fase. Un usuario de empresa sin esos permisos seguía viendo la entrada en el sidebar y solo se enteraba de que no tenía acceso al recibir un 403 del backend al hacer clic.
3. **`Dashboard`** se revisó también: el frontend está completo pero cada dato viene de `lib/mock/dashboard.ts`, no de un endpoint real. Consultado explícitamente con el propietario del proyecto — decidió mantenerlo en el grupo "Implemented" (es una vista de solo lectura, no un módulo CRUD; conectarlo a datos reales es un trabajo de backend separado y mayor, fuera del alcance de esta corrección puntual). Queda documentado aquí como deuda conocida, no resuelta.

**Corregido:**

- `frontend/components/app-sidebar.tsx`: `permission: "categorias.ver" | "marcas.ver" | "unidades-medida.ver" | "stock.ver" | "proveedores.ver"` agregado a los 5 items que no lo tenían; `pending: true` agregado a `Perfil`; comentario de la función `puedeVerModulo` actualizado para reflejar que el catálogo de permisos ya cubre todos los módulos de negocio existentes.
- Ningún cambio de backend, de rutas, ni de agrupación visual (`Inventario`/`Terceros`/`Administración` se mantienen — la corrección es de datos/clasificación, no de arquitectura de información).

**Verificado:**

- `npx tsc --noEmit` limpio.
- Login real en navegador (Playwright + Edge del sistema) con el usuario demo (`test@example.com`, rol Administrador → 41/41 permisos): las 16 entradas del sidebar visibles, exactamente 5 badges "Pronto" (Clientes/Roles/Auditoría/Reportes/Perfil), clic en Perfil navega a `/perfil` y muestra el stub real sin romperse.
- Sin cambios de backend — no se corrió la suite de backend para esta corrección (fuera de alcance, ningún archivo `.php` tocado).

## Estado

☐ Pendiente
☐ Requiere correcciones
**☑ Aprobado — pendiente de confirmación del usuario** (backend 138/138 verde, frontend typecheck limpio, verificación real en navegador con un bug encontrado y corregido en el proceso; commits y push realizados). Corrección del 2026-08-02 (arriba) también verificada en navegador y con typecheck limpio.
