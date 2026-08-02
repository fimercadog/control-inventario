# Informe Final — Módulo Auditoría (Vertical Slice Completo)

## Resumen del trabajo realizado

Segundo módulo de la secuencia vertical-slice Roles→Auditoría→Reportes→Perfil, construido después de que Roles quedara 100% cerrado (implementado, probado, documentado, comiteado y empujado). A diferencia de Clientes y Roles, este módulo no crea ninguna capacidad de escritura nueva: `Services\Audit\AuditLogger` ya escribía en `audit_logs` desde antes, invocado por los otros 11 módulos de negocio (Categorías, Marcas, Unidades de Medida, Stock, Proveedores, Producto↔Proveedor, Productos, Movimientos, Usuarios, Captura IA, Clientes, Roles). Este módulo es exclusivamente la superficie de consulta — solo lectura de punta a punta, sin ninguna ruta `POST`/`PATCH`/`DELETE`.

**Decisión de arquitectura resuelta con el propietario del proyecto antes de codificar**: el borrador antiguo (`docs/03_FUNCTIONAL_SPEC/FUTURE/Auditoria.md`, `Status: Planned`) tenía una regla de privacidad "no negociable" — nunca mostrar el nombre real de una persona en un registro de auditoría, solo un identificador de cuenta y su rol — pero el esquema real no tiene un campo de "identificador de cuenta" distinto de `email`, y cada otro módulo construido este mismo día (Usuarios, Roles) ya muestra el nombre real libremente. Se presentó la pregunta al propietario del proyecto con tres opciones (aplicar la regla con email como identificador, abandonarla, o aplicarla solo a usuarios sin `usuarios.editar`); la respuesta fue aplicar la regla tal cual, usando el email como identificador de cuenta. Implementado como una restricción real a nivel de columnas del eager-load (`AuditLogRepository` nunca hidrata `users.name` para una consulta de auditoría, no solo lo omite en el Resource) y cubierto por un test dedicado.

## Funcionalidades implementadas

- **Base de Datos**: sin cambios — `audit_logs`/`AuditLog` ya existían y ya estaban en uso activo desde Módulo 2 (Company Isolation). El seeder de volumen (`AuditLogSeeder`, 5.000 registros base por empresa) también ya existía, sembrado desde antes de esta unidad de trabajo — ampliamente por encima del mínimo de 500 registros pedido para este módulo.
- **Domain**: `AuditLogRepository` (nuevo — `paginar()` con filtros de búsqueda/módulo/acción/usuario/resultado/rango de fechas, más `modulosDisponibles()`/`accionesDisponibles()` para poblar los selectores de filtro con los valores realmente sembrados en la empresa; eager-load de `usuario` restringido a `id,email` y de `usuario.roles` a `id,name` — la restricción de privacidad vive a nivel de consulta, no solo de serialización), `AuditLogService` (delgado, delega al Repository, sin ningún método de escritura), `AuditLogPolicy` (`viewAny`/`view` únicamente, sin `create`/`update`/`delete` — esas abilities no existen porque no hay ninguna acción que las necesite).
- **API**: `AuditLogController` (`index`/`show` únicamente), `AuditLogResource` (expone `usuario.email`+`usuario.roles`, nunca `usuario.name`), rutas `GET /api/v1/auditoria` + `GET /api/v1/auditoria/{id}`.
- **Tests**: `AuditLogControllerTest` — 15 casos: listar, ver detalle completo (incluye `valores_anteriores`/`valores_nuevos`), **el nombre real de una persona nunca aparece en la respuesta, ni en la lista ni en el detalle** (el test distintivo de este módulo), registro sin usuario asociado muestra `null` sin error, filtrar por módulo/acción/usuario/rango de fechas, búsqueda de texto libre, la respuesta de listado incluye los catálogos de módulos/acciones disponibles, paginación real, aislamiento cross-company (404), **no existe ningún endpoint de creación/edición/eliminación** (405 en los tres verbos, no 404 — confirma que la ruta existe con otro verbo), 401 sin autenticar, 403 sin permiso.
- **Frontend**: `/auditoria` (listado real con búsqueda de texto libre, filtros de Módulo/Acción poblados dinámicamente desde el backend, rango de fechas, paginación real, columna Usuario mostrando email + badge de rol — sin botón "Nuevo"), `/auditoria/{id}` (ficha con módulo/acción/resultado/registro afectado/IP/dispositivo/usuario, y paneles de JSON para "Estado anterior"/"Estado nuevo" — sin botón "Editar"). Redux (`auditoria-slice.ts`) — primer slice 100% de solo lectura del proyecto: un único thunk de fetch, sin ningún thunk de mutación.
- **Sidebar**: `Auditoría` pasa de ruta inexistente (eliminada en la unidad de trabajo de Clientes) a entrada real con `permission: "auditoria.ver"`, entre Roles y Configuración.

## Correcciones realizadas

- **Aclaración de documentación encontrada durante la construcción**: `docs/04_TECHNICAL_SPEC/API.md` tenía `GET /auditoria` y `GET /seguridad/intentos-login` bajo el mismo encabezado "Seguridad y auditoría (Módulo 8)", con el mismo permiso — pero son dos tablas y dos propósitos distintos (`audit_logs` = acciones de negocio, este módulo; `security_logs` = intentos de inicio de sesión, todavía sin construir, ya lo aclaraba el propio borrador `FUTURE/Auditoria.md`). Separado en dos secciones explícitas para no perpetuar la confusión ahora que una de las dos mitades sí está construida.
- **`Select` de Base UI, verificado antes de escribir código, no después de un error**: antes de implementar los filtros de Módulo/Acción, se verificó en `node_modules/@base-ui/react/internals/resolveValueLabel.js` que pasar `items={{}}` (objeto vacío) a `<Select.Root>` no produce el label deseado para la opción seleccionada — cae al valor crudo (`stringifyAsLabel` → `serializeValue`), no a un fallback en blanco. Corregido construyendo un `Record<string, string>` real (`moduloItems`/`accionItems`, con `"todos"` mapeado a su etiqueta legible) antes de escribir el componente, siguiendo el mismo patrón ya probado en `roles/page.tsx` (`ESTADO_FILTROS`). Ningún error llegó a ejecutarse — se encontró leyendo el código fuente de la librería, mismo método que evitó el bug de `Checkbox`/`indeterminate` durante el módulo Roles.

## Relaciones verificadas

- `AuditLog belongsTo Empresa` / `belongsTo User` (`usuario_id`, nullable, `nullOnDelete()`) — ambas ya existían, sin cambios.
- Este módulo lee de los 11 módulos que escriben en `audit_logs` (`modulo`/`accion` reflejan el namespace real de permisos de cada uno) — verificado que los filtros de Módulo/Acción en el frontend muestran exactamente los valores que esos módulos realmente escribieron, no una lista inventada.
- `TenantScope` (ya existente) sigue siendo la primera barrera para `AuditLog`, igual que para los otros 12 recursos de negocio — ningún test de aislamiento multi-tenant preexistente se rompió.

## Cambios en Backend

**Archivos creados:**

- `backend/app/Repositories/AuditLogRepository.php`
- `backend/app/Services/AuditLogService.php`
- `backend/app/Policies/AuditLogPolicy.php`
- `backend/app/Http/Resources/Audit/AuditLogResource.php`
- `backend/app/Http/Controllers/Api/AuditLogController.php`
- `backend/tests/Feature/AuditLogControllerTest.php`

**Archivos modificados:**

- `backend/routes/api.php` (grupo `/api/v1/auditoria`)

## Cambios en Frontend

**Archivos creados:**

- `frontend/lib/api/auditoria.ts`
- `frontend/store/slices/auditoria-slice.ts`
- `frontend/components/audit-log-detail-screen.tsx`
- `frontend/app/(app)/auditoria/page.tsx`
- `frontend/app/(app)/auditoria/[id]/page.tsx`

**Archivos modificados:**

- `frontend/lib/api/types.ts` (`AuditLog`, `AuditLogFiltros`, `PaginatedAuditLogs`)
- `frontend/store/store.ts` (`auditoria` reducer registrado)
- `frontend/components/app-sidebar.tsx` (entrada real de Auditoría)

## Cambios en Base de Datos

- Sin migración nueva — `audit_logs` ya existía y ya estaba en uso.
- Sin permisos nuevos — `auditoria.ver` ya estaba sembrado desde antes de este módulo (catálogo se mantiene en 45).
- Sin datos demo nuevos — `AuditLogSeeder` (5.000 eventos base por empresa) ya existía; el ambiente de desarrollo ya tenía más de 5.000 registros acumulados de las unidades de trabajo anteriores de esta misma sesión al momento de la verificación en navegador.

## Documentación actualizada

- `docs/03_FUNCTIONAL_SPEC/Auditoria.md` (nuevo, `Status: Built`) — reemplaza `docs/03_FUNCTIONAL_SPEC/FUTURE/Auditoria.md` (eliminado), con el alcance real documentado frente al borrador original (sin exportación PDF/Excel/CSV, sin panel de estadísticas, rol resuelto en vivo en vez de snapshot histórico — los tres explícitamente diferidos, no gaps silenciosos).
- `docs/03_FUNCTIONAL_SPEC/FUTURE/README.md` — filas de `Auditoria.md` y `Customers.md` (esta última quedó pendiente en la unidad de trabajo de Clientes) removidas de la tabla de specs planeadas, con nota de "graduados" apuntando a sus ubicaciones reales.
- `docs/04_TECHNICAL_SPEC/API.md` — sección "Auditoría" separada de "Seguridad — intentos de inicio de sesión" (antes conflacionadas bajo el mismo encabezado "Módulo 8").
- `docs/security/ROLES_MATRIX.md` — catálogo de permisos, secciones 3/4/5, y resumen de gaps actualizados (Gap 8 nuevo); conteo de Policies AND-eando permiso pasa de 12 a 13.
- `docs/03_FUNCTIONAL_SPEC/RC1_FUNCTIONAL_MODULE_AUDIT.md` — Auditoría pasa de 🔴 NOT IMPLEMENTED a 🟢 COMPLETE (fila resumen + sección detallada); totales 🟢13·🟡2·🔴1.
- `docs/05_IMPLEMENTATION/AuditoriaModule.md` (este documento — nuevo).
- `CHANGELOG.md` — entrada nueva.

## Resultado de las pruebas

- **Backend:** `php artisan test` → **284/284 passing** (era 269/269 antes de esta unidad de trabajo — 15 tests nuevos, `AuditLogControllerTest`).
- **Frontend:** `npx tsc --noEmit` limpio.
- **Browser tests (reales, Playwright + Microsoft Edge del sistema)**: login real, sidebar con Auditoría visible, listado con 5.035 eventos reales sembrados, filtro de Módulo poblado con valores reales (`captura-ia`, `categorias`, `clientes`, `marcas`, `movimientos`, etc.) y funcional, ficha de detalle mostrando módulo/acción/resultado/IP/dispositivo/usuario y el JSON de estado nuevo de un registro sembrado por el seeder masivo, columna/campo Usuario mostrando en todos los casos `email` + badge de rol y **nunca** el nombre real ("Test User", visible únicamente en el pie del sidebar como dato de la propia cuenta logueada, nunca en un registro de auditoría), sin botón "Nuevo" ni "Editar" ni "Desactivar" en ninguna pantalla, cero errores de consola.

## Estado final del módulo

🟢 **Completo** — Auditoría es ahora un vertical slice real: base de datos (ya lista), dominio con Repository+Service+Policy (sin capa de escritura, por diseño), API con tests, frontend con Redux, filtros, búsqueda y paginación reales, persistencia de lectura verificada contra datos reales, regla de privacidad no negociable aplicada a nivel de consulta y cubierta por test, y documentación. Tercero de 4 módulos en la secuencia activa (Roles → Auditoría → Reportes → Perfil) — Reportes es el siguiente, no empieza hasta que este informe esté aprobado y el commit esté empujado.

## Control de versiones

- **Rama:** `main`.
- **Commit:** _pendiente — se registra en el commit de documentación posterior a este informe._

## Confirmación de push

⏳ Pendiente.

## Estado del informe

☐ Pendiente
☐ Requiere correcciones
**☑ Aprobado — pendiente de confirmación del propietario del proyecto**
