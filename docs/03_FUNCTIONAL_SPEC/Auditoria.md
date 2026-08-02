# Auditoría y Trazabilidad

**Status: Built (2026-08-02, segundo módulo de la secuencia vertical-slice Roles→Auditoría→Reportes→Perfil)**

> Verificado contra `backend/app/Models/AuditLog.php`, `backend/app/Services/Audit/AuditLogger.php`, `backend/app/Repositories/AuditLogRepository.php`, `backend/app/Services/AuditLogService.php`, `backend/app/Policies/AuditLogPolicy.php`, `backend/app/Http/Controllers/Api/AuditLogController.php`, `backend/app/Http/Resources/Audit/AuditLogResource.php`, `backend/routes/api.php`, `backend/tests/Feature/AuditLogControllerTest.php`, `frontend/app/(app)/auditoria/`. Reemplaza `docs/03_FUNCTIONAL_SPEC/FUTURE/Auditoria.md` (Status: Planned), cuyo contenido se reconcilia aquí contra lo realmente construido — el alcance real es más acotado que el borrador original (sin exportación PDF/Excel/CSV, sin panel de estadísticas): ambos quedan documentados como Future Improvements, no como gaps silenciosos.

## Purpose

Ser el registro de solo lectura de toda acción de negocio relevante ya escrita en `audit_logs` por los 11 módulos que la alimentan (Categorías, Marcas, Unidades de Medida, Stock, Proveedores, Producto↔Proveedor, Productos, Movimientos, Usuarios, Captura IA, Clientes, Roles), consultable, filtrable y paginable por un usuario con `auditoria.ver` — sin que ninguna operación de negocio quede sin trazabilidad visible.

## Business Flow

1. Un usuario ejecuta una acción de negocio en cualquier módulo existente. El propio Controller/Service de ese módulo escribe un registro en `audit_logs` vía `Services\Audit\AuditLogger::registrarAccionManual()` (o `registrarCapturaIA()` para Captura IA) — esto ya existía antes de este módulo, sin cambios.
2. Este módulo **no escribe nada** — es exclusivamente la superficie de consulta sobre lo que los demás módulos ya escribieron. `AuditLogRepository`/`AuditLogService` no tienen ningún método de creación.
3. Un usuario con `auditoria.ver` accede a `/auditoria`, filtra por módulo/acción/usuario/rango de fechas/texto libre, pagina, y abre el detalle de un evento puntual para ver el estado anterior/nuevo completo (JSON).
4. `AuditLog` es inmutable a nivel de modelo (`update()`/`delete()` lanzan `LogicException`) — ni este módulo ni ningún otro puede editar o borrar un registro ya escrito, ni siquiera un Platform Super Admin.

## Actors

- **Usuario con `auditoria.ver`**: puede listar, filtrar y ver el detalle de los eventos de su propia empresa. No hay una acción distinta para "exportar" en este alcance (ver Future Improvements).
- **Platform Super Admin**: sujeto a la misma regla que el resto del ERP — sin `empresa_id`, su alcance real son los permisos `plataforma.*`; no tiene una vista cross-empresa de auditoría en este módulo.

## Screens

- **`/auditoria`** (`frontend/app/(app)/auditoria/page.tsx`): tabla con columnas Fecha/Usuario/Módulo/Acción/Resultado, búsqueda de texto libre (módulo/acción/resultado), filtros por Módulo y Acción (poblados dinámicamente desde los valores reales ya sembrados en la empresa, vía `meta.modulos_disponibles`/`meta.acciones_disponibles`), rango de fechas, paginación real. **Sin botón "Nuevo"** — no existe una acción de creación manual en este módulo.
- **`/auditoria/{id}`** (`frontend/app/(app)/auditoria/[id]/page.tsx` → `audit-log-detail-screen.tsx`): ficha de un evento — módulo, acción, resultado, registro afectado (`auditable_type`/`auditable_id`), IP, dispositivo/navegador, usuario, y paneles de "Estado anterior"/"Estado nuevo" con el JSON completo. **Sin botón "Editar"** — el módulo es de solo lectura de punta a punta, a nivel de UI y de API.

## Fields

Modelo de datos ya existente, sin cambios de esquema para este módulo:

| Campo | Notas |
|---|---|
| `id`/`uuid` | identificador del registro |
| `created_at` | fecha/hora del evento (único timestamp — la tabla no tiene `updated_at`, el registro nunca se actualiza) |
| `usuario` | **expone solo `email` y `roles` (resueltos en vivo vía Spatie, no un snapshot histórico) — nunca `name`.** Ver "Regla de privacidad" abajo |
| `modulo`/`accion` | ej. `roles`/`roles.editar` — mismo namespace que usan los 11 módulos que escriben aquí |
| `auditable_type`/`auditable_id` | referencia polimórfica al registro afectado |
| `valores_anteriores`/`valores_nuevos` | JSON, cuando aplica |
| `resultado` | string libre (`exitoso` en la mayoría de los casos; Captura IA usa el estado real de la captura) |
| `ip`/`user_agent` | capturados en el momento del evento, cuando están disponibles |

**Regla de privacidad, no negociable — confirmada explícitamente por el propietario del proyecto para este módulo (2026-08-02):** ningún registro ni ninguna pantalla de Auditoría expone el nombre real de una persona. Se muestra únicamente el email de la cuenta y su(s) rol(es). `AuditLogRepository` restringe las columnas del eager-load de `usuario` a `id,email` (y `roles` a `id,name`, donde `name` es el nombre del **rol**, no de la persona) — `users.name` nunca se hidrata en memoria para una consulta de auditoría, no solo se omite en el Resource. Cubierto por un test dedicado (`test_a_real_persons_name_is_never_exposed_anywhere_in_the_response`) y verificado visualmente en navegador.

**Nota de alcance frente al borrador original** (`FUTURE/Auditoria.md`): ese borrador imaginaba un "identificador de cuenta" tipo `admin01` distinto del email, y un snapshot histórico del rol en el momento exacto de la acción (para que el registro no cambie si el usuario cambia de rol después). Ninguno de los dos existe en el esquema real (`users` no tiene un campo de handle separado de `email`; `audit_logs` no persiste un snapshot de rol). Este módulo usa el email como identificador de cuenta (el equivalente más cercano que ya existe y que tampoco es el nombre real de la persona) y resuelve el rol **en vivo** contra `model_has_roles` en el momento de la consulta, no como snapshot histórico — decisión explícita para no tener que tocar los 11 call-sites de `AuditLogger` en otros módulos ya construidos. Si un usuario cambió de rol después de una acción, el registro mostrará su rol *actual*, no el que tenía en ese momento. Ver Edge Cases.

## Validation Rules

No aplica — el módulo es estrictamente de solo lectura, sin ningún formulario de creación/edición.

## Permissions

`auditoria.ver` — único permiso de este módulo, ya sembrado en el catálogo desde antes de esta unidad de trabajo. Sin un segundo permiso para "gestionar": no hay nada que gestionar en un módulo de solo lectura.

## Loading States

- Lista: "Cargando..." en el contador de eventos, fila "Cargando auditoría..." en la tabla, mientras `loading` (Redux) es `true`.
- Detalle: "Cargando evento..." mientras se resuelve el fetch inicial.

## Empty States

- Lista sin resultados (filtros sin coincidencias): `EmptyState` con título "No encontramos eventos", descripción "Prueba con otros filtros, o un rango de fechas más amplio."

## Error States

- **Backend**: mismo doble aislamiento que el resto del ERP — `TenantScope` automático sobre `AuditLog` (ya existía desde Módulo 2) + verificación explícita en `AuditLogPolicy::ownedBy()`.
- **Frontend**: fetch fallido de la lista o el detalle muestra `toast.error(...)` con el mensaje real del backend, o un fallback genérico si no es un string.
- **404 real** al abrir el detalle de un evento de otra empresa (filtrado automáticamente por `TenantScope` antes de que la Policy siquiera se evalúe) — mismo comportamiento que Roles/Clientes/Productos.

## Business Rules

- **Regla dura, no negociable**: nunca se expone el nombre real de una persona en ninguna capa (API, frontend) — ver "Regla de privacidad" en Fields.
- **Solo lectura de punta a punta**: no existen rutas `POST`/`PATCH`/`DELETE` bajo `/auditoria` (verificado por test — devuelven 405, no 404, porque el prefijo de ruta sí existe con otro verbo). Las escrituras siguen siendo responsabilidad exclusiva de `Services\Audit\AuditLogger`, invocado por los 11 módulos de negocio existentes.
- `AuditLog::update()`/`delete()` lanzan `LogicException` a nivel de modelo — ninguna ruta nueva de este módulo puede bypassear esa garantía porque ninguna ruta nueva las llama.
- Los filtros de Módulo/Acción se derivan de los valores **realmente sembrados** en la empresa actual (`DISTINCT modulo`/`DISTINCT accion` sobre `audit_logs`, ya acotado por `TenantScope`) — nunca una lista estática que podría desincronizarse de lo que el sistema realmente registra.

## Acceptance Criteria

- [x] Un usuario con `auditoria.ver` puede listar, filtrar (módulo/acción/usuario/fecha/texto libre) y paginar los eventos de su propia empresa.
- [x] Un usuario puede ver el detalle completo de un evento, incluyendo `valores_anteriores`/`valores_nuevos`.
- [x] Ningún registro ni ninguna pantalla expone el nombre real de una persona en ningún punto — verificado por test dedicado y por navegador.
- [x] Los registros de auditoría son inmutables — no existe ninguna ruta de creación/edición/eliminación en este módulo (verificado por test: 405 en los tres verbos).
- [x] Un evento de la Empresa A nunca es visible para un usuario de la Empresa B (404 real, vía `TenantScope`).

## Edge Cases

- **Usuario cuyo rol cambió después de una acción**: el registro muestra el rol *actual* del usuario, no el que tenía en el momento de la acción — decisión de alcance explícita (ver "Nota de alcance" en Fields), no un bug. Documentado aquí para que quede claro que es un comportamiento conocido, no accidental.
- **Registro sin usuario asociado** (`usuario_id` nulo — el campo es `nullOnDelete()`): la UI muestra "Sistema (sin usuario asociado)" en vez de fallar o mostrar un hueco vacío. Cubierto por test dedicado.
- **Volumen alto** (la empresa demo ya tiene más de 5.000 eventos sembrados): paginación real de extremo a extremo, sin cargar todo el historial en memoria — mismo patrón que Movimientos.

## Future Improvements

- **Exportación (PDF/Excel/CSV)**: estaba en el borrador original (`FUTURE/Auditoria.md`, "capacidad compartida con el resto del sistema, ver `FUTURE/Export.md`") — explícitamente fuera de alcance de esta unidad de trabajo, no requerida por el checklist vertical-slice de este módulo.
- **Panel de estadísticas** (eventos por día, usuarios más activos, módulos con mayor actividad): también estaba en el borrador original, también fuera de alcance aquí — el checklist de este módulo pide Lista/Ver/Filtros/Búsqueda/Paginación, no un dashboard analítico. Si se construye en el futuro, probablemente vive mejor como parte del módulo Reportes (siguiente en la secuencia activa), que si tiene "estadísticas reales" como requisito explícito.
- **Snapshot histórico de rol**: si en el futuro se vuelve un requisito real (no solo un "sería bueno"), requiere tocar los 11 call-sites de `AuditLogger` en los módulos existentes para pasar el rol en el momento de la acción — alcance deliberadamente diferido, ver Edge Cases.
- **Identificador de cuenta distinto del email** (tipo `admin01` del borrador original): requeriría un campo nuevo en `users` y tocar el flujo de creación de usuarios — no construido, el email ya cumple la regla de privacidad (no es el nombre real de la persona) sin ese trabajo adicional.
