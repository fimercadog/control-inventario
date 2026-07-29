# ADR-008: Aislamiento multi-tenant en defensa en profundidad (dos capas: Scope + Policy)

## Estado
Accepted (Verified)

## Fecha
No verificable con fecha exacta (ver ADR-001). Proxy verificable: `backend/database/migrations/2026_07_28_190001_add_empresa_foreign_keys_to_permission_pivot_tables.php` y las migraciones de aislamiento del Módulo 2, fechadas `2026-07-28`.

## Contexto
Fidel OS es multi-tenant: varias empresas comparten el mismo backend y base de datos, identificadas por `empresa_id`. Un fallo de aislamiento (que una empresa vea o modifique datos de otra) es la clase de bug más grave que el sistema puede tener.

## Problema
¿Cómo garantizar que ninguna consulta ni ninguna acción de un usuario pueda alcanzar datos de una empresa distinta a la suya, incluso si un desarrollador olvida agregar el filtro manualmente?

## Alternativas evaluadas
No documentadas como comparación explícita. La alternativa implícita descartada (confiar en que cada Controller/Query agregue manualmente `->where('empresa_id', ...)`, o confiar en el `empresa_id` recibido del request) está descartada explícitamente por la regla dura documentada.

## Decisión
Aislamiento en dos capas independientes: (1) un Global Scope de Eloquent (`TenantScope`, ver ADR-009) que filtra automáticamente toda consulta por `empresa_id`, fail-closed; (2) cada Policy de negocio (`ProductoPolicy`, `MovimientoPolicy`, `CapturaIAPolicy`) vuelve a verificar `$model->empresa_id === $user->empresa_id` como respaldo, por si algún código bypassea el Scope intencionalmente (`withoutGlobalScope`) en el futuro. Nunca se confía en `empresa_id` recibido del request.

**Fuentes verificadas:**
- `AGENTS.md` §"Multi-Tenant Rules": *"Every company-owned resource must be isolated. Use TenantScope. Use Policies. Never trust empresa_id coming from the request. Always derive company context from the authenticated user. Fail Closed. No tenant context must return zero records."*
- `docs/04_TECHNICAL_SPEC/Security.md`, línea 44: *"Cada Policy (`ProductoPolicy`, `MovimientoPolicy`, `CapturaIAPolicy`) verifica de nuevo `$model->empresa_id === $user->empresa_id` (u `$user->is_platform_admin`) — respaldo por si algún código bypassea `TenantScope` intencionalmente (`withoutGlobalScope`) en el futuro."*
- `docs/04_TECHNICAL_SPEC/Architecture.md`, línea 52: *"Global Scope automático (`TenantScope`) aplicado a todo modelo `empresa_id`-scoped (...). Se resuelve contra el `empresa_id` del usuario autenticado (...). Ninguna consulta puede 'olvidar' el filtro — es automático a nivel Eloquent."*
- Código real: `backend/app/Models/Scopes/TenantScope.php`, `backend/app/Policies/` (existencia verificada como directorio).

## Consecuencias
- Defensa en profundidad real: un fallo en una sola capa (Scope bypasseado, o Policy no llamada) no basta por sí solo para filtrar datos entre empresas, siempre que ambas capas se apliquen consistentemente.
- Costo de mantenimiento: cada modelo nuevo `empresa_id`-scoped debe recordar aplicar el trait `BelongsToEmpresa` Y tener su Policy correspondiente — un olvido en cualquiera de los dos reduce (no elimina, si el otro está presente) la protección.
- El caso `is_platform_admin = true` es una excepción documentada y explícita al Scope, no un bypass silencioso (ver ADR-009 para el mecanismo exacto).

## Impacto
Crítico — es la garantía de seguridad central del producto. Cualquier regresión aquí es un incidente de seguridad de máxima severidad, no solo un bug funcional.

## Referencias
- `AGENTS.md`
- `docs/04_TECHNICAL_SPEC/Security.md` (líneas 26–53 aprox.)
- `docs/04_TECHNICAL_SPEC/Architecture.md` línea 52
- `backend/app/Models/Scopes/TenantScope.php`

## Estado de implementación
Implementado y verificado — según `docs/05_IMPLEMENTATION/Auth_Module2_CompanyIsolation.md` y `docs/06_TESTS/SecurityTests.md`, existe una suite adversarial de tests (`backend/tests/Feature/Security/`) que ejercita específicamente intentos de acceso cruzado entre empresas.

## Información Faltante
No se documentó si se evaluaron alternativas como bases de datos separadas por tenant (schema-per-tenant) o un middleware único de filtrado en vez de la combinación Scope+Policy. Se documenta la decisión tomada y su mecanismo, no una comparación formal con otras estrategias de aislamiento multi-tenant.
