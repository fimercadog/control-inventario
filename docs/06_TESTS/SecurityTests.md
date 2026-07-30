# Tests de Seguridad

> Seedeado sustancialmente desde la suite adversarial real de Company Isolation (Auth Módulo 2) — `backend/tests/Feature/Security/CompanyIsolationHttpTest.php` y `backend/tests/Unit/Security/TenantScopeTest.php`. Formato ID/Objetivo/Precondiciones/Pasos/Resultado Esperado, describiendo cada escenario adversarial ya probado por código. Todos con estado **Pasa** (ejecutados como parte de la suite automatizada de 94 tests).

## Aislamiento multi-tenant — vía HTTP (`CompanyIsolationHttpTest`)

### SEC-001 — Company A no puede ver la captura de Company B

- **Objetivo:** confirmar que el endpoint `GET /captura-ia/{uuid}` nunca devuelve una captura de otra empresa.
- **Precondiciones:** dos empresas (A, B), un usuario por empresa, una captura creada por B.
- **Pasos:** autenticado como usuario A, `GET /api/v1/captura-ia/{uuid de la captura de B}`.
- **Resultado esperado:** 404, sin `data.id` ni contenido de la captura (ej. el nombre del producto detectado) en la respuesta.
- **Estado:** Pasa.

### SEC-002 — UUID bien formado pero inexistente falla limpio

- **Objetivo:** un UUID adivinado (válido en formato, no asignado a ninguna captura) no debe comportarse distinto de uno real de otra empresa.
- **Pasos:** `GET /api/v1/captura-ia/{uuid random}`.
- **Resultado esperado:** 404, sin filtrar detalles de excepción.
- **Estado:** Pasa.

### SEC-003 — Company A no puede confirmar la captura pendiente de Company B

- **Objetivo:** verificar que la acción de escritura `confirmar` respeta el aislamiento igual que la lectura.
- **Pasos:** captura de B en `pendiente_revision`; autenticado como A, `POST /captura-ia/{uuid}/confirmar`.
- **Resultado esperado:** 404; el estado de la captura de B permanece `pendiente_revision` (no cambia).
- **Estado:** Pasa.

### SEC-004 — Company A no puede descartar la captura de Company B

- **Objetivo:** igual que SEC-003, para la acción `descartar`.
- **Resultado esperado:** 404; el estado permanece sin cambios.
- **Estado:** Pasa.

### SEC-005 — Company A no puede corregir un detalle de la captura de Company B

- **Objetivo:** verificar aislamiento en el recurso anidado `detalle/{detalleId}`.
- **Pasos:** `PATCH /captura-ia/{uuid de B}/detalle/{detalleId}` con `nombre_detectado: 'Nombre Hackeado'`, autenticado como A.
- **Resultado esperado:** 404; el nombre detectado del detalle de B no cambia.
- **Estado:** Pasa.

### SEC-006 — `empresa_id` forjado en el body es ignorado al crear

- **Objetivo:** un atacante autenticado como A que envía `empresa_id` de B en el payload no debe poder crear un recurso "como B".
- **Pasos:** autenticado como A, `POST /captura-ia/foto` con `empresa_id: <id de B>` en el body.
- **Resultado esperado:** 201; el registro creado tiene `empresa_id = A` (el forjado se ignora por completo).
- **Estado:** Pasa.

### SEC-007 — `empresa_id` forjado en el query string es ignorado al listar

- **Objetivo:** igual que SEC-006, para el filtro de listado.
- **Pasos:** existe una captura de B; autenticado como A, `GET /captura-ia?empresa_id=<id de B>`.
- **Resultado esperado:** 200, `data.items` vacío, `data.meta.total = 0` — nunca las capturas de B.
- **Estado:** Pasa.

### SEC-008 — La metadata de paginación nunca refleja registros de otra empresa

- **Objetivo:** el total paginado debe reflejar únicamente los registros de la empresa autenticada, aun con datos de otras empresas presentes en la base.
- **Pasos:** B crea 2 capturas; A crea 1; autenticado como A, `GET /captura-ia`.
- **Resultado esperado:** `data.items` con 1 elemento, `data.meta.total = 1`.
- **Estado:** Pasa.

### SEC-009 — Reproducir la `Idempotency-Key` adivinada de otra empresa no filtra su captura

- **Objetivo:** un atacante que adivina o intercepta la clave de idempotencia de otra empresa no debe recibir la captura de esa empresa como respuesta.
- **Pasos:** B crea una captura con `Idempotency-Key: shared-key-guessed`; A reenvía la misma clave.
- **Resultado esperado:** 201 (no 200) — se crea una captura NUEVA propia de A, distinta de la de B; el `empresa_id` de la nueva captura es el de A.
- **Estado:** Pasa.

### SEC-010 — Un Platform Admin sin empresa recibe error limpio en endpoints de negocio

- **Objetivo:** verificar que la ausencia de `empresa_id` en un usuario admin no produce un error crudo de constraint de base de datos.
- **Pasos:** usuario con `empresa_id: null`, `is_platform_admin: true`; `POST /captura-ia/foto`.
- **Resultado esperado:** 403, sin `exception` en la respuesta.
- **Estado:** Pasa.

## Aislamiento multi-tenant — vía Eloquent/Policy (`TenantScopeTest`)

### SEC-011 — `find()` por id secuencial de otra empresa devuelve null

- **Objetivo:** un id numérico secuencial adivinado de otra empresa no debe ser resoluble.
- **Resultado esperado:** `Producto::find($idDeOtraEmpresa)` es `null` bajo el contexto de la empresa propia.
- **Estado:** Pasa.

### SEC-012 — Una query Eloquent cruda nunca filtra productos de otra empresa

- **Objetivo:** simular a un desarrollador que olvida agregar un filtro manual — `TenantScope` debe protegerlo de todas formas.
- **Resultado esperado:** `Producto::all()` bajo el contexto de A solo devuelve productos de A.
- **Estado:** Pasa.

### SEC-013 — Igual que SEC-012, para `Movimiento`

- **Estado:** Pasa.

### SEC-014 — Mass-assignment de `empresa_id` en creación es sobrescrito por el contexto de tenant

- **Objetivo:** verificar a nivel de modelo (no solo HTTP) que `empresa_id` forjado en `create()` se ignora.
- **Resultado esperado:** el `empresa_id` final es siempre el del `TenantContext`, nunca el pasado explícitamente.
- **Estado:** Pasa.

### SEC-015 — La Policy niega acceso aun con el scope bypaseado explícitamente

- **Objetivo:** defensa en profundidad — si un desarrollador usa `withoutGlobalScope(TenantScope::class)`, la Policy debe seguir bloqueando `view`/`update`/`delete` sobre un registro ajeno.
- **Resultado esperado:** las tres acciones devuelven `false` para un usuario de otra empresa.
- **Estado:** Pasa.

### SEC-016 — La Policy permite acceso al propio registro de la empresa

- **Objetivo:** contraprueba de SEC-015 — verificar que la Policy no es un bloqueo total, solo aísla por empresa.
- **Estado:** Pasa.

### SEC-017 — `MovimientoPolicy` niega acceso cruzado con el scope bypaseado

- **Objetivo:** igual que SEC-015, para `Movimiento`.
- **Estado:** Pasa.

### SEC-018 — El Platform Admin bypasea `TenantScope` y ve productos de todas las empresas

- **Objetivo:** confirmar el único bypass intencional del sistema.
- **Resultado esperado:** con `TenantContext::bypass()` activo, `Producto::all()` devuelve registros de todas las empresas.
- **Estado:** Pasa.

### SEC-019 — Eager loading nunca filtra mal entre empresas

- **Objetivo:** `Movimiento::with('producto')` no debe traer productos de otra empresa a través de la relación cargada.
- **Estado:** Pasa.

### SEC-020 / SEC-021 — Traversal de relación desde `Categoria`/`Empresa` no filtra mal

- **Objetivo:** acceder a productos vía `$categoria->productos` o `$empresa->productos()` debe seguir respetando el aislamiento.
- **Estado:** Pasa (ambos).

### SEC-022 — `Role::find()` por id de otra empresa devuelve null

- **Objetivo:** el aislamiento también aplica a roles (Módulo 0/1), no solo a datos de negocio.
- **Estado:** Pasa.

### SEC-023 — `AuditLog` (inmutable) también respeta el aislamiento

- **Objetivo:** confirmar que la tabla de auditoría, aunque genérica y compartida entre módulos, sigue el mismo aislamiento.
- **Estado:** Pasa.

### SEC-024 — Fail-closed: sin contexto de tenant, cero filas, nunca todas

- **Objetivo:** el escenario más crítico de todos — verificar que un fallo en resolver el contexto de tenant nunca degrada a "mostrar todo".
- **Pasos:** forzar una instancia nueva y prístina de `TenantContext` (nunca tocada, simulando el estado antes de que `IdentifyTenant` corra).
- **Resultado esperado:** `Producto::all()` devuelve 0 filas.
- **Estado:** Pasa.

### SEC-025 — `CapturaIAPolicy` niega acceso cruzado

- **Objetivo:** confirmar la Policy específica de Captura IA de forma aislada (no solo vía HTTP en SEC-001 a SEC-010).
- **Estado:** Pasa.

## Pruebas de permisos por rol (planeadas — depende de Auth Módulo 3)

**Status: Planned — no ejecutado.** Requisito de producto entregado directamente por el product owner (sesión 2026-07-29, "FASE 17"). A diferencia de las secciones anteriores (aislamiento multi-tenant, ya construido y probado), esta sección depende enteramente de Auth Módulo 3 (Authorization), no construido — hoy el sistema valida sesión + tenant, pero **ningún endpoint de negocio valida un permiso específico** (ver `docs/03_FUNCTIONAL_SPEC/Roles.md`).

Matriz de ejemplo a validar una vez construido el Módulo 3:

| Rol | Expectativa |
|---|---|
| Administrador | Debe acceder a todo. |
| Auxiliar de Inventario | No puede administrar usuarios. |
| Vendedor | No puede modificar configuración. |
| Auditor | Solo lectura del módulo de Auditoría (`auditoria.ver`, permiso ya sembrado en el catálogo — ver `Roles.md` línea 48). |

Cada fila de esta matriz debe convertirse en un caso de prueba formal (formato `docs/09_TEMPLATES/Template_TestCase.md`, prefijo `SEC-0XX` continuando la numeración de arriba) cuando el Módulo 3 exista — no antes, para no fabricar un resultado de "Pasa" sobre una validación que el sistema todavía no realiza.

## Fuera del alcance de la suite actual (gaps de seguridad)

- Sin tests de fuerza bruta / rate limiting sobre `login` (no hay rate limiting implementado ni verificado).
- Sin tests de inyección SQL/XSS explícitos (mitigado implícitamente por el uso de Eloquent/Blade/React, pero sin verificación dedicada).
- Sin auditoría de dependencias (`composer audit`/`npm audit`) integrada a ningún proceso.
- Sin pentesting externo ni escaneo automatizado de vulnerabilidades.
