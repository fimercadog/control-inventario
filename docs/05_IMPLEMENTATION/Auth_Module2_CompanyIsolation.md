# Implementación — Auth Módulo 2: Company Isolation

> Documento retroactivo, reconstruido de `docs/00_VISION/Roadmap.md`, `docs/04_TECHNICAL_SPEC/Architecture.md`, y verificado contra `backend/app/Models/Scopes/TenantScope.php`, `backend/app/Http/Middleware/IdentifyTenant.php`, `backend/app/Models/Concerns/BelongsToEmpresa.php`, las Policies, y los tests de `backend/tests/Feature/Security/` y `backend/tests/Unit/Security/`.

## Estado

**Completo.** 25 tests adversariales (HTTP + Eloquent/Policy) más una verificación en vivo contra el servidor real, según el roadmap. En el estado actual del repo la cobertura automatizada vive en 2 archivos (10 + 15 tests — ver Tests).

## Goal

Garantizar que ningún dato de una empresa sea nunca visible, editable ni eliminable por un usuario de otra empresa, de forma automática y a prueba de olvidos de desarrollador — no depender de que cada query recuerde agregar `WHERE empresa_id = ...`.

## Scope

- `TenantScope` — global scope de Eloquent, aplicado automáticamente a todo modelo `empresa_id`-scoped.
- `IdentifyTenant` — middleware que corre justo después de `auth:api`, fija `TenantContext` y el team id de Spatie a partir del usuario autenticado (nunca del request).
- `TenantContext` — única fuente de verdad de "qué empresa es esta request"; `TenantScope` y `BelongsToEmpresa` leen de aquí, nunca directamente de `auth()->user()`.
- `BelongsToEmpresa` (trait) — aplicado a `Producto`, `Categoria`, `Movimiento`, `CapturaIA`, `AuditLog`, `Role`: registra `TenantScope` como global scope y fuerza `empresa_id` al crear, ignorando cualquier valor forjado en el payload.
- Policies de ownership (`ProductoPolicy`, `MovimientoPolicy`, `CapturaIAPolicy`) — defensa en profundidad, activa incluso si `TenantScope` se bypasea explícitamente (`withoutGlobalScope`).
- Bypass exclusivo para `is_platform_admin` (`TenantContext::bypass()`), nunca activado por defecto.
- FKs agregadas a `model_has_roles`/`model_has_permissions` (`empresa_id` → `empresas.id`), completando lo que Spatie deja solo indexado.

## Out of Scope

- Permisos finos por acción (Módulo 3) — este módulo aísla por empresa, no decide qué puede hacer un usuario dentro de su propia empresa.
- Selector de empresa / multi-tenant real en la UI — sigue existiendo una sola empresa de demo (ver `DEMO.md`).

## Dependencies

- Auth Módulo 0 (columna `empresa_id` en `users`, tablas de permisos con Teams).
- Auth Módulo 1 (`auth:api` ya protegiendo las rutas; `IdentifyTenant` se agrega junto a él).

## Database Changes

Ninguna migración de esquema propia más allá de la FK agregada en `2026_07_28_190001_add_empresa_foreign_keys_to_permission_pivot_tables.php` (Módulo 0). Este módulo es principalmente código de aplicación (Scope, Middleware, Policies), no esquema.

## API Changes

Ninguna ruta nueva. Cambio de comportamiento: toda ruta de negocio (`/api/v1/captura-ia/*`) pasa a requerir `['auth:api', 'tenant']` juntos, nunca `auth:api` solo — `tenant` es lo que efectivamente activa el filtrado automático.

## Frontend Changes

Ninguno directo — el aislamiento es invisible al frontend (la API simplemente nunca devuelve datos de otra empresa).

## Security

Reglas de `AGENTS.md` aplicadas literalmente:
- **Fail-closed**: sin contexto de tenant resuelto, las queries devuelven **cero filas**, nunca todas (`TenantScope::apply()` hace `whereRaw('1 = 0')` cuando `empresaId()` es `null`).
- **Nunca confiar en `empresa_id` del request**: tanto en creación (mass-assignment forjado) como en filtros de query string, el valor viene siempre de `TenantContext`, derivado del usuario autenticado — nunca del body/query.
- **Defensa en profundidad**: aunque un desarrollador bypasee `TenantScope` a mano (`withoutGlobalScope`), la Policy correspondiente sigue negando acceso cruzado.
- **Bug real encontrado y corregido**: `SubstituteBindings` (route-model-binding de `{captura}`) corría, por la prioridad de middleware por defecto de Laravel, *antes* de `IdentifyTenant` — lo que permitía que el binding resolviera un registro de otra empresa antes de que el contexto de tenant estuviera fijado. Corregido con `appendToPriorityList` para forzar el orden correcto.
- Platform Super Admin (`is_platform_admin = true`) es el único bypass intencional, y requiere `empresa_id = null` explícito, no una empresa "especial".

## Permissions

No implementa permisos finos (eso es Módulo 3); las Policies de este módulo solo verifican pertenencia a empresa (ownership), no una acción específica.

## Events

Ninguno propio de este módulo.

## Tests

- `backend/tests/Feature/Security/CompanyIsolationHttpTest.php` — 10 tests, adversariales end-to-end vía HTTP real contra Captura IA (única superficie REST real hoy): Company A no puede ver la captura de Company B (404 limpio, sin `data.id` ni contenido filtrado); UUID bien formado pero inexistente falla limpio; Company A no puede confirmar/descartar la captura de Company B; Company A no puede corregir un detalle de la captura de Company B; `empresa_id` forjado en el payload es ignorado al crear; `empresa_id` forjado en el query string es ignorado al listar; metadata de paginación nunca refleja registros de otra empresa; reintentar el `Idempotency-Key` de otra empresa no filtra su captura (crea una nueva, propia); un Platform Admin sin empresa recibe error limpio (403) en los endpoints de captura.
- `backend/tests/Unit/Security/TenantScopeTest.php` — 15 tests, a nivel Eloquent/Policy directo (cubre Producto/Movimiento, que no tienen endpoint REST propio): `find()` por id secuencial de otra empresa devuelve `null`; una query Eloquent cruda nunca filtra productos de otra empresa; lo mismo para movimientos; mass-assignment de `empresa_id` es sobrescrito por el contexto; la Policy niega acceso aun con el scope bypaseado a mano; la Policy permite acceso al propio producto; lo mismo para `MovimientoPolicy`; el Platform Admin bypasea el scope y ve productos de todas las empresas; eager loading nunca filtra mal (`Movimiento::with('producto')`); traversal de relación desde `Categoria` no filtra mal; traversal desde `Empresa` respeta el scope del lado de `Producto`; `Role::find()` por id de otra empresa devuelve `null`; `AuditLog` (inmutable) también respeta el aislamiento; sin contexto de tenant, las queries devuelven cero filas (fail-closed) — probado forzando una instancia nueva y prístina de `TenantContext`; `CapturaIAPolicy` niega acceso cruzado.

## Risks

- Cualquier modelo `empresa_id`-scoped nuevo que **olvide** aplicar el trait `BelongsToEmpresa` quedaría sin protección automática — mitigado solo por disciplina de code review, no hay chequeo automático que lo fuerce.
- El bug de orden de middleware ya corregido (`SubstituteBindings` vs. `IdentifyTenant`) es una clase de bug que podría reaparecer si se agregan middlewares nuevos sin revisar la prioridad — vale la pena un test de regresión explícito de orden de middleware (no existe hoy).

## Checklist

- [x] `TenantScope` implementado y fail-closed.
- [x] `IdentifyTenant` fijando `TenantContext` + team id de Spatie.
- [x] `BelongsToEmpresa` aplicado a Producto/Categoria/Movimiento/CapturaIA/AuditLog/Role.
- [x] Policies de ownership para Producto/Movimiento/CapturaIA.
- [x] Bypass exclusivo para Platform Admin, probado.
- [x] FKs agregadas a las tablas pivote de permisos.
- [x] Bug de orden de middleware encontrado y corregido.
- [x] 25 tests adversariales (HTTP + Eloquent/Policy) pasando.
- [x] Verificación en vivo contra servidor real (mencionada en el roadmap; sin registro escrito como caso de prueba manual formal más allá de esta mención).

## Definition of Done

Cumplida a nivel de código y tests automatizados. La "verificación en vivo contra el servidor real" mencionada en el roadmap no está documentada como un caso de `docs/06_TESTS/ManualTestCases.md` — se reconstruye ahí de forma genérica, pero el detalle específico de esa sesión de verificación no quedó registrado en su momento (gap real de trazabilidad, no solo de formato).
