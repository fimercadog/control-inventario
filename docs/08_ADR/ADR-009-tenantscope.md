# ADR-009: `TenantScope` como Global Scope fail-closed, resuelto vía `TenantContext` singleton

## Estado
Accepted (Verified). Complementa ADR-008 (estrategia general de dos capas); esta ADR documenta el mecanismo específico del Global Scope.

## Fecha
No verificable con fecha exacta (ver ADR-001). Proxy verificable: migraciones de Módulo 2 (Company Isolation), `2026-07-28`.

## Contexto
El Global Scope que filtra por `empresa_id` necesita resolver "cuál es la empresa actual" de forma consistente en cada request, y debe fallar de forma segura (cero resultados) si ese contexto no está disponible, en vez de devolver todos los registros.

## Problema
¿Cómo implementar el filtro automático por tenant de forma que sea imposible "olvidarlo" por accidente, y que un fallo en la resolución del tenant nunca exponga datos de otras empresas?

## Alternativas evaluadas
No documentadas como comparación explícita. La alternativa implícita descartada (fail-open: si no hay tenant resuelto, no filtrar y devolver todo) está descartada explícitamente por la regla "Fail Closed" de `AGENTS.md` y por el diseño verificado en código.

## Decisión
`App\Models\Scopes\TenantScope` es un Global Scope de Eloquent, aplicado a todo modelo que use el trait `App\Models\Concerns\BelongsToEmpresa` (`Producto`, `Categoria`, `Movimiento`, `CapturaIA`, `Role`). Lee el tenant actual de `App\Services\Auth\TenantContext`, un singleton por request registrado en `AppServiceProvider`, fijado por el middleware `IdentifyTenant` justo después de la autenticación. Si el contexto no está resuelto, el Scope filtra a cero resultados (fail-closed), nunca a todos.

**Fuentes verificadas:**
- `AGENTS.md` §"Multi-Tenant Rules": *"Fail Closed. No tenant context must return zero records."* (nota: la redacción literal de `AGENTS.md` es ambigua/posiblemente con una negación de más; el comportamiento fail-closed real — verificado en la fuente de código citada abajo — es "sin contexto de tenant, cero registros", que es la interpretación consistente con el resto del documento y con `docs/04_TECHNICAL_SPEC/Glossary.md`).
- `docs/04_TECHNICAL_SPEC/Glossary.md`, línea 22: *"**TenantScope** | Global Scope de Eloquent (`App\Models\Scopes\TenantScope`) que filtra automáticamente toda consulta por `empresa_id`, fail-closed (cero filas si el contexto no está resuelto)."*
- `docs/04_TECHNICAL_SPEC/Glossary.md`, línea 23: *"**TenantContext** | Servicio singleton (`App\Services\Auth\TenantContext`) que resuelve 'qué empresa es esta request'; única fuente de verdad que lee `TenantScope`."*
- `docs/04_TECHNICAL_SPEC/Architecture.md`, línea 52: *"Global Scope automático (`TenantScope`) aplicado a todo modelo `empresa_id`-scoped (...). Se resuelve contra el `empresa_id` del usuario autenticado (fijado por un middleware `IdentifyTenant` justo después de auth)."*
- `docs/04_TECHNICAL_SPEC/Security.md`, línea 26: *"`App\Models\Scopes\TenantScope` se aplica a todo modelo que use el trait `App\Models\Concerns\BelongsToEmpresa` (`Producto`, `Categoria`, `Movimiento`, `CapturaIA`, `Role`). Lee el tenant actual de `App\Services\Auth\TenantContext` (singleton por request, registrado en `AppServiceProvider`)."*
- `docs/04_TECHNICAL_SPEC/Security.md`, línea 28: *"Diseño fail-closed verificado en código (`TenantScope::apply()`)."*
- Código real: `backend/app/Models/Scopes/TenantScope.php` existe.

## Consecuencias
- Ninguna consulta Eloquent sobre un modelo `empresa_id`-scoped puede "olvidar" el filtro — es automático, no depende de que cada desarrollador lo agregue manualmente en cada Controller.
- Un fallo en la resolución del tenant (`TenantContext` no fijado) produce cero resultados, no un error 500 ni una fuga de datos — comportamiento seguro por defecto.
- El caso `is_platform_admin = true` desactiva el Scope completamente (no es "una empresa más"), lo cual es una excepción explícita y auditada, no un bypass accidental (ver `docs/04_TECHNICAL_SPEC/Security.md` línea 63).

## Impacto
Crítico — mismo nivel que ADR-008, del cual es el mecanismo concreto.

## Referencias
- `AGENTS.md`
- `docs/04_TECHNICAL_SPEC/Glossary.md` (líneas 22–23)
- `docs/04_TECHNICAL_SPEC/Architecture.md` línea 52
- `docs/04_TECHNICAL_SPEC/Security.md` (líneas 26–63)
- `backend/app/Models/Scopes/TenantScope.php`, `backend/app/Services/Auth/TenantContext.php`, `backend/app/Http/Middleware/IdentifyTenant.php`

## Estado de implementación
Implementado y verificado en código. Cobertura de tests: ver `docs/06_TESTS/SecurityTests.md` (casos derivados de `backend/tests/Feature/Security/`).

## Información Faltante
No se documentó por qué se eligió un Global Scope de Eloquent en vez de, por ejemplo, un middleware que inyecte el filtro manualmente en cada Repository, ni si se evaluaron alternativas al patrón singleton para `TenantContext`. Se documenta el mecanismo implementado, no un proceso de comparación de diseño.
