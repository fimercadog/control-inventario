# ADR-015: Modelo de identidad ERP — campos Identity / Operational / Controlled

## Estado
Accepted (Verified) — decisión tomada y su código implementado en la misma unidad de trabajo que este ADR documenta.

## Fecha
2026-08-04.

## Contexto
La auditoría de campos editables de Clientes/Proveedores/Usuarios (2026-08-04, ver `CHANGELOG.md`) clasificó cada campo como Editable/Read-Only/Conditionally Editable y cerró varias inconsistencias reales (`estado` reachable con permiso más laxo que `/deshabilitar`, `nombre` vaciable vía PATCH, `UserPolicy::update()` sin chequeo de permiso). Esa primera pasada dejó `email`/`nit` (Clientes, Proveedores) y `name` (Usuarios) como "Editable" — correctos según la implementación existente en ese momento, pero sin una regla explícita sobre qué distingue un campo que *identifica* un registro de uno que solo lo *describe*.

El propietario del proyecto entregó, en la misma sesión, una política de campos explícita y completa para los tres módulos (Objective: "transform the Edit functionality into a true ERP-style identity model") que reclasifica `email`/`nit`/`name` como campos de **identidad**, inmutables después de la creación — un endurecimiento deliberado sobre la primera pasada, no una corrección de un error.

## Problema
¿Cómo distinguir, de forma reutilizable a través de módulos futuros, entre un campo que identifica un registro (no debería cambiar libremente después de crearse), uno que describe su estado operativo actual (cambia por el curso normal del negocio), y uno cuyo cambio requiere un flujo dedicado con su propio permiso y auditoría (ni libremente editable, ni permanentemente fijo)?

## Alternativas consideradas
1. **Mantener la clasificación binaria Editable/Read-Only de la auditoría anterior, sin una tercera categoría.** Descartada explícitamente por el propietario del proyecto — no distingue "nunca editable, campo de sistema" (`id`/`created_at`) de "editable solo vía un flujo dedicado, con su propio permiso" (`estado`, `password`, `role`), dos mecanismos genuinamente distintos que la política entregada sí separa.
2. **Aplicar la política solo a los campos que ya eran read-only o controlados (`estado`, `empresa_id`), dejando `email`/`nit`/`name` como estaban.** Descartada — contradice explícitamente la política entregada, que nombra `email`/`nit`/`name` como Identity, no como Operational.
3. **Tres categorías — Identity / Operational / Controlled — elegida.** Coincide exactamente con la política entregada campo por campo para los tres módulos (ver `docs/03_FUNCTIONAL_SPEC/Customers.md`, `Users.md`, y la Field Matrix del informe de esta unidad de trabajo). Identity = inmutable después de crear (`id`, `empresa_id`, `created_at`, `updated_at`, más `email`/`nit` en Clientes/Proveedores y `name`/`email`/`is_platform_admin` en Usuarios). Operational = editable libremente (contacto/teléfono/dirección/ciudad/país/notas; avatar/idioma/zona horaria/tema). Controlled = editable únicamente vía un endpoint/flujo dedicado con su propio permiso y acción de auditoría (`estado` vía habilitar/deshabilitar, `password` vía cambiar contraseña, `role` vía asignar rol).

## Decisión
Todo campo de un módulo de negocio se clasifica en exactamente una de tres categorías:

- **Identity**: fijado en la creación, nunca acepta cambios en el endpoint de actualización genérico. Se implementa **excluyendo el campo de las reglas de validación del `UpdateXRequest`/`UpdateProfileRequest` correspondiente** — si se envía en el PATCH, se ignora en silencio (mismo mecanismo estructural ya usado para `empresa_id`/`id`, nunca un 422). El frontend refuerza esto visualmente deshabilitando el input correspondiente en modo edición (no lo oculta — el usuario debe poder ver el valor, solo no editarlo).
- **Operational**: editable libremente vía el endpoint de actualización genérico, sujeto solo a validación de formato/tipo.
- **Controlled**: excluido también del `UpdateXRequest` genérico, pero por una razón distinta — tiene su propio endpoint dedicado con su propio permiso (a menudo más estricto) y su propia acción de auditoría, no porque el valor sea inmutable, sino porque cambiarlo es una operación de negocio con su propia semántica que no debe compartir el permiso `*.editar` genérico.

Aplicado en esta unidad de trabajo:
- **Clientes/Proveedores** — `email`/`nit` pasan de Operational a Identity: removidos de `UpdateClienteRequest`/`UpdateProveedorRequest` (junto con su regla `Rule::unique(...)->ignore(...)`, que ya no aplica — la unicidad solo se valida en `Store*Request`). NIT/Email deshabilitados en `ClienteFormModal`/`ProveedorFormModal` cuando `isEdit`.
- **Usuarios** — `name` pasa de Operational (editable vía Perfil) a Identity: removido de `UpdateProfileRequest`, `ProfileService::actualizar()`, y el tipo `UpdateProfilePayload`. Input "Nombre" deshabilitado en `/perfil`, mismo tratamiento visual que "Correo" (ya deshabilitado desde antes).
- `estado` (Clientes/Proveedores) y `is_active`/`role`/`password` (Usuarios) ya eran Controlled desde la auditoría previa — sin cambios, se documentan aquí formalmente bajo esta misma taxonomía.
- **`nit` único por empresa** (Clientes, Proveedores) — cerrado el mismo día, a pedido explícito del propietario del proyecto, revisando esta misma ADR: las 4 capas — constraint de base de datos (migración `2026_08_04_140000_add_unique_nit_to_clientes_and_proveedores`, reemplaza el índice compuesto no-único existente por uno único sobre `[empresa_id, nit]`), validación backend (`Rule::unique(...)` en `StoreClienteRequest`/`StoreProveedorRequest` — solo en creación, `nit` ya no se acepta en absoluto al editar), mensaje específico para que el frontend lo muestre (`nit.unique`), y el índice (el propio constraint único cumple ambas funciones). Verificado contra los datos reales antes de escribir la migración: cero duplicados existentes, sin necesidad de limpieza previa.
- **Bug real encontrado y corregido al verificar "Validación Frontend" en navegador**: `frontend/lib/api/client.ts::toApiError()` siempre mostraba el título genérico de la API (`"Error de validación"`) en el toast, nunca el mensaje específico por campo (`nit.unique`, y — sin haberlo notado antes — `email.unique` tenía el mismo problema desde que existe). Corregido para usar el primer mensaje de campo cuando existe.
- **Afordancia visual de campo bloqueado** — un input `disabled` por sí solo no comunica *por qué*. `Field` (`frontend/components/crud-modal.tsx`) ganó un prop `locked?: boolean`: ícono de candado junto a la etiqueta + leyenda "Campo de identidad. No se puede modificar después de crear el registro." debajo del input. Aplicado a los mismos 5 campos (NIT/Email en Clientes y Proveedores, Nombre en Perfil) — `Perfil` además migró sus inputs de Nombre/Correo de `<Label>`+`<Input>` sueltos al componente `Field` compartido, para heredar esta afordancia sin duplicar el patrón.

## Consecuencias

**Positivas:**
- Taxonomía reutilizable para cualquier módulo futuro — el Design System (`docs/11_DESIGN_SYSTEM/FORMS.md`) puede referenciar esta ADR en vez de que cada módulo nuevo reinvente su propia clasificación.
- Cierra un vector de corrupción de datos real: antes de esta ADR, cualquier usuario con `clientes.editar`/`proveedores.editar` podía cambiar el email o NIT de un tercero sin ningún registro distinto de una edición de teléfono — ahora esos campos son estructuralmente inmutables tras la creación, con el mismo mecanismo ya probado para `empresa_id`.
- Consistente con el patrón ya establecido: "protección por ausencia de la regla de validación" (no un guard explícito) es exactamente cómo `empresa_id` ya estaba protegido desde antes de esta ADR — se extiende el mismo mecanismo, no se inventa uno nuevo.

**Negativas / trade-offs aceptados:**
- **Sin flujo de corrección construido todavía para un typo real.** Si una empresa comete un error de tipeo en el NIT o el email de un cliente/proveedor al crearlo, o un usuario escribe mal su propio nombre al aceptar una invitación, hoy no existe ningún mecanismo para corregirlo desde la UI. Reconocido explícitamente por el propietario del proyecto como un problema operativo real (no aceptable dejarlo sin resolver indefinidamente) — resuelto formalizando la regla arquitectónica "Identity Correction" (ver sección dedicada abajo) como el camino oficial hacia adelante, aunque su implementación queda fuera del alcance de esta unidad de trabajo.
- `email` en Clientes/Proveedores nunca fue una credencial de autenticación (a diferencia de `email` en Usuarios) — tratarlo como campo de identidad es una decisión de integridad de datos, no de seguridad de acceso; ambas razones llevan al mismo mecanismo técnico pero por motivos distintos, documentado aquí para que no se asuma que es "porque es un login" en los tres casos.

## Identity Correction — regla arquitectónica (no implementada)

Definida a pedido explícito del propietario del proyecto para cerrar el trade-off de arriba, **sin construirla en esta unidad de trabajo** — deja el camino claro para cuando aparezca el primer caso real, en vez de improvisar una solución ad-hoc en ese momento (o forzar un DELETE+CREATE que rompería referencias ya asociadas — un cliente/proveedor con movimientos o productos vinculados no puede simplemente recrearse).

- Los campos Identity siguen siendo inmutables vía el endpoint de actualización genérico — esta regla no reabre esa puerta, abre una **distinta**.
- La corrección de un campo Identity requiere un endpoint/flujo dedicado, separado de `Update*Request`, con su propio permiso — de mayor privilegio que `*.editar` (candidatos: rol Administrador/Super Administrador, o un permiso nuevo `*.corregir-identidad` siguiendo la convención `recurso.accion` ya establecida — no decidido aquí, es trabajo de especificación futuro).
- Toda corrección debe, sin excepción:
  - Exigir el permiso elevado dedicado (nunca el permiso genérico `*.editar`).
  - Exigir una justificación/observación obligatoria — no puede ejecutarse sin explicar el motivo.
  - Registrar la corrección en `AuditLog` con **valor anterior y valor nuevo**, usuario responsable, y fecha — no una diferencia genérica.
  - Nunca eliminar ni sobrescribir el valor anterior en ningún otro lugar — el historial se preserva, la corrección se **agrega**, no reemplaza en silencio.
- **Dependencia real, no decorativa**: `AuditLogger::registrarAccionManual()` hoy solo acepta `valoresNuevos` — nunca captura `valores_anteriores`, pese a que la columna existe en `audit_logs` (riesgo ya documentado en la auditoría de campos editables previa, sin corregir). Identity Correction no puede cumplir su propio requisito de "guardar valor anterior y valor nuevo" hasta que ese gap se cierre primero — es un prerrequisito técnico real, no solo una mejora relacionada.
- Candidato natural a generalizarse más allá de Clientes/Proveedores/Usuarios — el propietario del proyecto ya esbozó el mismo modelo Identity/Operational/Controlled para Productos (`codigo`=Identity), Movimientos (`cantidad`/`producto`/`tipo`=Identity) y Roles (`nombre`=Identity). No aplicado a esos módulos en esta unidad de trabajo — mencionado aquí como dirección futura, no como alcance de esta ADR.

## Impacto
Medio-Alto — cambia comportamiento de API ya en producción (tres endpoints de actualización dejan de aceptar campos que antes aceptaban, dos endpoints de creación ganan una validación de unicidad nueva) y UI de tres formularios; agrega un constraint de base de datos (`nit` único por empresa) pero no cambia el modelo de permisos existente. La regla "Identity Correction" no tiene impacto todavía — es una decisión arquitectónica registrada, sin código.

## Referencias
- `docs/03_FUNCTIONAL_SPEC/Customers.md` (sección "Editable Fields")
- `docs/03_FUNCTIONAL_SPEC/Users.md`
- `docs/03_FUNCTIONAL_SPEC/FUTURE/Suppliers.md` (amendment)
- `docs/11_DESIGN_SYSTEM/FORMS.md` (regla de afordancia visual `locked`)
- `backend/app/Http/Requests/Cliente/{Store,Update}ClienteRequest.php`, `Proveedor/{Store,Update}ProveedorRequest.php`, `Profile/UpdateProfileRequest.php`
- `backend/database/migrations/2026_08_04_140000_add_unique_nit_to_clientes_and_proveedores.php`
- `frontend/components/crud-modal.tsx` (`Field` con prop `locked`), `cliente-form-modal.tsx`, `proveedor-form-modal.tsx`, `frontend/app/(app)/perfil/page.tsx`, `frontend/lib/api/client.ts` (fix del mensaje de error específico por campo)
- Informe de la unidad de trabajo "Field Matrix" (2026-08-04) para la clasificación completa campo por campo de los tres módulos.

## Estado de implementación
**Modelo de campos (Identity/Operational/Controlled) y unicidad de `nit`: implementados.** Backend: 3 `UpdateXRequest` modificados, `StoreClienteRequest`/`StoreProveedorRequest` con `nit` único por empresa, 1 migración nueva, suite completa **397/397** (era 391 antes de cerrar la unicidad de `nit`). Frontend: `Field` compartido gana `locked`, aplicado a los mismos 5 campos; `npx tsc --noEmit` limpio; verificado en navegador real (campos deshabilitados confirmados por atributo DOM, intento de escritura rechazado, campos operativos siguen guardando correctamente).

**"Identity Correction": únicamente definida, no implementada** — decisión deliberada del propietario del proyecto para esta unidad de trabajo. Bloqueada además por un prerrequisito técnico real (`AuditLogger` sin `valores_anteriores`, ver sección dedicada arriba).

## Información Faltante
"Identity Correction" está definida como regla arquitectónica (qué debe cumplir), pero no como especificación técnica: no se decidió el nombre exacto del permiso nuevo (`*.corregir-identidad` es un candidato, no una decisión), ni el endpoint/ruta, ni si es un flujo por-módulo o un mecanismo genérico compartido entre Clientes/Proveedores/Usuarios (y los módulos futuros mencionados arriba). Esa especificación queda para cuando se decida construirla, siguiendo el flujo normal de SDD (Functional Spec → Technical Spec → ADR de implementación si corresponde) — no inventada aquí por adelantado.
