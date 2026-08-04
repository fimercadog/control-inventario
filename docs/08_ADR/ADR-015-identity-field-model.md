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

## Consecuencias

**Positivas:**
- Taxonomía reutilizable para cualquier módulo futuro — el Design System (`docs/11_DESIGN_SYSTEM/FORMS.md`) puede referenciar esta ADR en vez de que cada módulo nuevo reinvente su propia clasificación.
- Cierra un vector de corrupción de datos real: antes de esta ADR, cualquier usuario con `clientes.editar`/`proveedores.editar` podía cambiar el email o NIT de un tercero sin ningún registro distinto de una edición de teléfono — ahora esos campos son estructuralmente inmutables tras la creación, con el mismo mecanismo ya probado para `empresa_id`.
- Consistente con el patrón ya establecido: "protección por ausencia de la regla de validación" (no un guard explícito) es exactamente cómo `empresa_id` ya estaba protegido desde antes de esta ADR — se extiende el mismo mecanismo, no se inventa uno nuevo.

**Negativas / trade-offs aceptados:**
- **Sin flujo de corrección para un typo real.** Si una empresa comete un error de tipeo en el NIT o el email de un cliente/proveedor al crearlo, o un usuario escribe mal su propio nombre al aceptar una invitación, no existe hoy ningún mecanismo para corregirlo — ni siquiera con un permiso elevado. Esto es una regresión de usabilidad real frente al estado anterior (donde sí era editable), documentada aquí explícitamente y no descubierta después: la política fue entregada así deliberadamente, y esta ADR no inventa una vía de corrección no solicitada (fuera del mandato del rol Developer — no puede inventar una regla de negocio nueva). Ver "Información Faltante".
- `email` en Clientes/Proveedores nunca fue una credencial de autenticación (a diferencia de `email` en Usuarios) — tratarlo como campo de identidad es una decisión de integridad de datos, no de seguridad de acceso; ambas razones llevan al mismo mecanismo técnico pero por motivos distintos, documentado aquí para que no se asuma que es "porque es un login" en los tres casos.

## Impacto
Medio-Alto — cambia comportamiento de API ya en producción (tres endpoints de actualización dejan de aceptar campos que antes aceptaban) y UI de tres formularios; no cambia esquema de base de datos ni modelo de permisos.

## Referencias
- `docs/03_FUNCTIONAL_SPEC/Customers.md` (sección "Editable Fields")
- `docs/03_FUNCTIONAL_SPEC/Users.md`
- `docs/03_FUNCTIONAL_SPEC/FUTURE/Suppliers.md` (amendment)
- `backend/app/Http/Requests/Cliente/UpdateClienteRequest.php`, `Proveedor/UpdateProveedorRequest.php`, `Profile/UpdateProfileRequest.php`
- `frontend/components/cliente-form-modal.tsx`, `proveedor-form-modal.tsx`, `frontend/app/(app)/perfil/page.tsx`
- Informe de la unidad de trabajo "Field Matrix" (2026-08-04) para la clasificación completa campo por campo de los tres módulos.

## Estado de implementación
Implementado. Backend: 3 `UpdateXRequest` modificados, suite completa **391/391**. Frontend: 3 componentes modificados (NIT/Email en Clientes y Proveedores, Nombre en Perfil), `npx tsc --noEmit` limpio, verificado en navegador real (campos deshabilitados confirmados por atributo DOM, intento de escritura rechazado, campos operativos siguen guardando correctamente).

## Información Faltante
No existe, en ninguna fuente disponible en este repositorio, una justificación de negocio documentada para la ausencia deliberada de un flujo de corrección de campos de identidad (por ejemplo, un permiso `*.corregir-identidad` de alto privilegio, o un proceso de soporte). Se documenta como decisión tomada, no como olvido — pero la razón de negocio detrás de "sin excepción, ni con permiso elevado" no tiene fuente verificable más allá de la política entregada en sí misma.
