# ADR-006: JWT (`tymon/jwt-auth`) como mecanismo de autenticación, no Sanctum

## Estado
Accepted (Verified) para el hecho de que se usa JWT y no Sanctum. **Pending Validation** para el razonamiento de por qué JWT fue elegido sobre Sanctum (ver "Información Faltante").

## Fecha
No verificable con fecha exacta (ver ADR-001). Proxy verificable: `backend/database/migrations/2026_07_28_100001_add_auth_fields_to_users_table.php`, fechada `2026-07-28`.

## Contexto
El backend necesita un mecanismo de autenticación stateless para la API REST consumida por el frontend Next.js.

## Problema
¿JWT (`tymon/jwt-auth`) o Laravel Sanctum para autenticar la API?

## Alternativas evaluadas
No documentadas como comparación explícita de trade-offs (latencia, revocación, complejidad, ecosistema). Se encontró únicamente la confirmación de que Sanctum NO se usa, sin explicar por qué se descartó a favor de JWT.

## Decisión
Usar JWT vía `tymon/jwt-auth` sobre el guard `api`. Sanctum está presente solo como remanente del scaffold de Laravel, sin rutas activas.

**Fuentes verificadas:**
- `README.md` / `CLAUDE.md`, sección Stack: *"Backend: Laravel, JWT, MySQL"* — decisión de stack declarada desde el inicio del proyecto (documento raíz).
- `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md`, línea 3798 y 4600: *"El sistema utilizará JWT."* / *"Toda autenticación será mediante JWT."*
- `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md`, línea 4536: *"RFC 7519 (JWT)"* citado como estándar de referencia.
- `docs/04_TECHNICAL_SPEC/Backend.md`, línea 101: *"`paths: ['api/*', 'sanctum/csrf-cookie']` — el segundo path es un remanente del scaffold de Laravel (Sanctum no se usa en este proyecto, la autenticación es JWT vía `tymon/jwt-auth`); no genera ningún efecto porque no hay rutas Sanctum registradas, pero se documenta aquí para no confundirlo con un uso real de Sanctum."*
- Código real: `backend/config/jwt.php` existe y está configurado; no hay rutas Sanctum registradas en `backend/routes/api.php`.

## Consecuencias
- Autenticación stateless en el access token (sin sesión de servidor), consistente con el principio "Stateless Backend" declarado en el master spec §73.
- Revocación de un JWT puro no es posible sin mecanismo adicional — resuelta mediante refresh tokens en `auth_sessions` (ver ADR-007), no mediante el JWT mismo.
- El remanente de configuración de Sanctum en `backend/config/cors.php` es inofensivo pero puede generar confusión futura si no se documenta (ya documentado en `Backend.md`).

## Impacto
Alto — es el mecanismo de autenticación de toda la API; cualquier cambio futuro (por ejemplo, migrar a Sanctum) tendría impacto transversal en frontend y backend.

## Referencias
- `README.md`, `CLAUDE.md` (raíz del repo)
- `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` (líneas 3798, 4600, 4536)
- `docs/04_TECHNICAL_SPEC/Backend.md` línea 101
- `backend/config/jwt.php`

## Estado de implementación
Implementado y verificado en código: `backend/config/jwt.php` configurado, guard `api` activo, sin rutas Sanctum registradas (Módulo 1, Authentication — ver `docs/05_IMPLEMENTATION/Auth_Module1_Authentication.md`).

## Información Faltante
No se encontró documentación que compare JWT vs. Sanctum vs. sesiones tradicionales antes de esta decisión, ni quién la tomó, ni cuándo. El stack (`JWT`) aparece ya decidido desde el `README.md` original de la plantilla del proyecto, antes de que existiera código de autenticación — es decir, es una decisión de plantilla/stack, no una decisión de arquitectura evaluada específicamente para este proyecto.

## Decision Provenance

**Verified From**
- Código: `backend/config/jwt.php` (configurado, guard `api` activo); ausencia de rutas Sanctum registradas en `backend/routes/api.php`.
- Documentación: `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` (líneas 3798, 4600, 4536); `docs/04_TECHNICAL_SPEC/Backend.md` línea 101; `README.md`/`CLAUDE.md` §Stack.
- AGENTS.md: no menciona JWT ni Sanctum explícitamente; respalda indirectamente el principio "Stateless Backend" declarado en el master spec §73, consistente con esta elección.

**Not Verifiable**
- Motivo de seleccionar JWT sobre Sanctum (o sobre autenticación basada en sesión) — ninguna fuente disponible registra la comparación ni quién la decidió.

**Pending Historical Validation**
Este apartado deberá completarse únicamente si en el futuro aparece evidencia documental o histórica (por ejemplo, una nota de decisión, un hilo de conversación registrado, o confirmación directa del autor original) que explique por qué se eligió JWT sobre Sanctum. Hasta entonces, permanece vacío — no se rellena con una justificación plausible.
