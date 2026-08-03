# Clientes

**Status: Built (2026-08-02)**

> Verificado contra código real: `backend/app/Models/Cliente.php`, `backend/app/Repositories/ClienteRepository.php`, `backend/app/Services/ClienteService.php`, `backend/app/DTO/Cliente/ClienteDTO.php`, `backend/app/Policies/ClientePolicy.php`, `backend/app/Http/Controllers/Api/ClienteController.php`, `backend/routes/api.php`, `backend/tests/Feature/ClienteControllerTest.php`, `frontend/app/(app)/clientes/`. Primer módulo construido bajo la metodología de vertical slice completo (decisión del propietario del proyecto, 2026-08-02: "A module is either COMPLETE or it does not exist in the navigation") — todas las capas (DB, Domain, API, Frontend, Persistencia, Documentación) se construyeron en la misma unidad de trabajo, sin placeholder intermedio.
>
> Reemplaza `docs/03_FUNCTIONAL_SPEC/FUTURE/Customers.md` (el borrador original de la sección 28 del master spec, con historial de compras, clasificación Nuevo/Frecuente/Premium/Inactivo, e integraciones CRM/WhatsApp/campañas). Ese alcance dependía de `Sales.md` (módulo de Ventas), que no existe todavía en el sistema — se construyó deliberadamente un alcance menor y real: gestión de la ficha de cliente en sí (mismo nivel que Proveedores), sin las funcionalidades que dependen de un módulo de Ventas inexistente. Esas quedan en "Future Improvements" abajo, no descartadas, solo no construidas todavía.

## Purpose

Administrar el catálogo de clientes de cada empresa — alta, edición, búsqueda, activación/desactivación — como entidad independiente, mismo nivel funcional que Proveedores.

## Business Flow

1. Usuario con permiso `clientes.ver` navega a `/clientes` desde el sidebar (grupo "Terceros").
2. Ve el listado real (paginado, 20 por página), con búsqueda por nombre/NIT/contacto/email y filtro de estado (activos por defecto, "todos" opcional).
3. Con `clientes.crear`, crea un cliente nuevo vía el diálogo "Nuevo Cliente" (solo `nombre` es obligatorio).
4. Con `clientes.ver`, entra a la ficha de un cliente (`/clientes/{id}`) para ver el detalle completo.
5. Con `clientes.editar`, edita cualquier campo desde la misma ficha (modo edición inline, sin navegar a otra pantalla).
6. Con `clientes.gestionar`, deshabilita (o vuelve a habilitar) un cliente — nunca un DELETE físico.

## Actors

- Cualquier usuario de la empresa con los permisos `clientes.*` correspondientes (ver sección Permissions). El Platform Super Admin ve el módulo siempre, sin restricción de permiso.

## Screens

- `/clientes` — listado con búsqueda, filtro de estado, paginación real (Anterior/Siguiente), badge de estado, menú de acciones por fila (Editar / Eliminar-deshabilitar / Habilitar).
- `/clientes/{id}` — ficha de detalle con modo edición inline y cambio de estado con confirmación.

## Fields

| Campo | Tipo | Notas |
|---|---|---|
| `nombre` | string, requerido | Único campo obligatorio al crear. |
| `nit` | string, opcional | Documento/identificación tributaria — mismo campo que Proveedores usa para el mismo propósito. |
| `contacto` | string, opcional | Nombre de la persona de contacto. |
| `telefono` | string, opcional | |
| `email` | string, opcional | Validado como email si se envía. Único por `empresa_id` (ampliación 2026-08-03) — dos clientes de la misma empresa no pueden compartir email; dos clientes de empresas distintas sí pueden. |
| `direccion` | string, opcional | |
| `ciudad` | string, opcional | |
| `pais` | string, opcional | |
| `notas` | text, opcional | |
| `estado` | `activo` \| `inactivo` | Borrado lógico — nunca DELETE físico (GLOBAL RULE, sesión 2026-07-29). |
| `empresa_id` | FK | `TenantScope` vía `BelongsToEmpresa`, automático. |

El alcance del borrador original (Tipo Documento, Apellido separado, Fecha Nacimiento, clasificación Nuevo/Frecuente/Premium) **no se construyó** — el shape real sigue el mismo patrón que `Proveedor` (empresa como entidad, no persona natural con esos campos específicos), consistente con cómo el resto del ERP ya modela clientes/proveedores como organizaciones.

## Validation Rules

Ver `StoreClienteRequest`/`UpdateClienteRequest`: `nombre` requerido solo al crear (`sometimes` al editar); `email` debe ser un email válido si se envía; `estado` solo acepta `activo`/`inactivo`. Todos los demás campos son `nullable` — un campo `nullable` enviado explícitamente como `null` se vacía de verdad (ver el comentario de `ClienteDTO` y el test `test_explicitly_clearing_a_nullable_field_persists_as_null`).

## Permissions

Catálogo real (`clientes.ver`/`clientes.crear`/`clientes.editar`/`clientes.gestionar`), mismo patrón `recurso.accion` que el resto del ERP desde Fase 4.5. `ClientePolicy` exige pertenencia de empresa **Y** permiso en cada método, sin excepción — este módulo nunca pasó por la fase de "solo pertenencia" que tuvieron los módulos anteriores a Fase 4.5, porque se construyó después de que ese modelo ya fuera obligatorio. Ver `docs/security/ROLES_MATRIX.md`.

## Loading States

Spinner + "Cargando clientes..."/"Cargando cliente..." mientras `loading` es `true` (estado real de Redux, no simulado).

## Empty States

"No encontramos clientes / Prueba con otro nombre, o crea el primero." — mismo componente `EmptyState` que el resto del ERP.

## Error States

Toast de error con el mensaje real del backend (`ApiError.message`) en cualquier mutación fallida; 404 real (no una pantalla genérica) si el cliente no existe o pertenece a otra empresa.

## Business Rules

- Borrado siempre lógico — `estado = inactivo`, nunca un DELETE físico (GLOBAL RULE, sesión 2026-07-29).
- `empresa_id` siempre viene de `TenantScope`/`TenantContext`, nunca del payload del cliente.
- Toda mutación exitosa escribe una entrada real en `AuditLog` (`clientes.crear`/`clientes.editar`/`clientes.deshabilitar`/`clientes.habilitar`).
- `clientes.editar` audita el diff real (`getChanges()`, ampliación 2026-08-03) — cualquier campo que de verdad cambió, no una lista fija; una edición que no cambia ningún valor no escribe entrada de auditoría.

## Acceptance Criteria

- [x] Listar clientes propios de la empresa, paginado, con búsqueda y filtro de estado.
- [x] Crear un cliente nuevo.
- [x] Ver el detalle de un cliente.
- [x] Editar cualquier campo.
- [x] Deshabilitar/habilitar (borrado lógico).
- [x] Aislamiento multi-tenant real (una empresa nunca ve/edita clientes de otra).
- [x] RBAC real: sin el permiso correspondiente, 403 — nunca un fallback silencioso.
- [x] Tests automatizados (13 casos, `ClienteControllerTest`).

## Edge Cases

- Cliente con `nit` duplicado dentro de la misma empresa — **no se valida como error** (mismo comportamiento que Proveedores: `nit` no tiene constraint de unicidad, es un campo de referencia, no una clave). Documentado aquí para que no se asuma unicidad implícita.
- Campo `nullable` enviado explícitamente como `null` en una edición — se vacía de verdad, cubierto por test dedicado.
- Email duplicado **dentro de la misma empresa** — sí se valida como error (`422`, ampliación 2026-08-03), a diferencia de `nit`. Email duplicado **entre empresas distintas** — permitido, cubierto por test dedicado.

## Future Improvements

Explícitamente fuera de alcance de esta unidad de trabajo, dependientes de módulos que no existen todavía:

- Historial de compras por cliente — depende de un módulo de Ventas (`FUTURE/Sales.md`), que no existe.
- Clasificación Cliente Nuevo/Frecuente/Premium/Inactivo — reglas de corte nunca definidas en el borrador original, y sin datos de compra que las alimenten.
- Reportes (Clientes Nuevos, Top Compradores, Frecuencia de Compra) — depende de `Reportes`, que tampoco existe (`FUTURE/Reports.md`).
- Integraciones CRM/WhatsApp/correo/SMS/campañas — sin decisión de producto tomada, mencionadas en el borrador original solo como ideas.
