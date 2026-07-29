# ADR-007: Refresh tokens opacos, revocables, en cookie httpOnly (no JWT puro)

## Estado
Accepted (Verified)

## Fecha
No verificable con fecha exacta (ver ADR-001). Proxy verificable: `backend/database/migrations/2026_07_28_183608_create_auth_sessions_table.php`, fechada `2026-07-28`.

## Contexto
El access token JWT es de corta duración (según `docs/04_TECHNICAL_SPEC/Architecture.md`, 15 minutos) y no es revocable individualmente sin infraestructura adicional (blacklist). El sistema necesita renovar la sesión del usuario sin pedirle credenciales cada 15 minutos, y necesita poder revocar sesiones individuales (por ejemplo, "cerrar sesión en todos los dispositivos").

## Problema
¿Cómo implementar la renovación de sesión de forma segura y revocable, sin mantener el access token vivo por mucho tiempo?

## Alternativas evaluadas
No documentadas como comparación explícita, pero la fuente citada abajo sí explica el motivo de la elección hecha (lo cual es distinto de comparar alternativas rechazadas formalmente):

> *"`auth_sessions` — registro de refresh tokens (...). Es lo que hace posible 'Active Sessions' y la revocación individual (un JWT puro no se puede revocar sin esto)."* — `docs/04_TECHNICAL_SPEC/Database.md`, línea 44.

Esto documenta el motivo (revocabilidad) pero no registra si se evaluaron alternativas como un refresh token JWT de larga duración con blacklist, o Sanctum con `personal_access_tokens`.

## Decisión
El refresh token es opaco (no JWT), hasheado antes de guardarse en `auth_sessions`, viaja en una cookie `httpOnly`, `Secure`, `SameSite=Lax` (nunca accesible desde JS), y se rota en cada uso (nunca se reutiliza el mismo valor). El access token JWT vive solo en memoria en el frontend (Redux), nunca en `localStorage`.

**Fuentes verificadas:**
- `docs/04_TECHNICAL_SPEC/Architecture.md`, línea 29: *"Tokens en cookies httpOnly: el refresh token viaja en una cookie `httpOnly`, `Secure`, `SameSite=Lax`, nunca accesible desde JS. El access token (JWT de corta duración) se devuelve en el body del login/refresh y se guarda solo en memoria (Redux), nunca en `localStorage`."*
- `docs/04_TECHNICAL_SPEC/Architecture.md`, línea 57: *"Emite access token JWT (15 min, claims: `user_id`, `empresa_id`) y un refresh token opaco (no JWT — así es revocable individualmente sin necesitar blacklist), hasheado y guardado en `auth_sessions` junto a IP/device/expiración (7 días normal, 30 días con 'Remember Me')."*
- `docs/04_TECHNICAL_SPEC/Architecture.md`, línea 59: *"Al expirar el access token, el frontend llama `POST /auth/refresh` (...); el backend valida el hash contra `auth_sessions`, rota el refresh token (nunca se reutiliza el mismo valor) y emite un nuevo access token."*
- `docs/04_TECHNICAL_SPEC/Database.md`, línea 44 (citado arriba).
- Código real: `backend/database/migrations/2026_07_28_183608_create_auth_sessions_table.php` — columnas `refresh_token_hash` (único), `device_name`, `ip_address`, `remember_me`, `last_used_at`, `expires_at`, `revoked_at`.
- `backend/config/jwt.php`, línea 123: `'refresh_ttl' => env('JWT_REFRESH_TTL', 20160)` (ventana de refresco del propio JWT, distinta del refresh token opaco de `auth_sessions` — confirma que ambos mecanismos coexisten en configuración).

## Consecuencias
- Revocación individual de sesión es posible (marcar `revoked_at`) sin necesitar blacklist de JWT.
- La rotación del refresh token en cada uso mitiga el riesgo de reuso de un token robado (si el atacante y el usuario legítimo compiten por refrescar, uno de los dos falla).
- Costo: una tabla adicional (`auth_sessions`) y una consulta a base de datos en cada refresh, en vez de un JWT de refresco puramente stateless.

## Impacto
Alto — es el mecanismo que sostiene la sesión de todo usuario autenticado; afecta directamente el flujo de login/logout/refresh en frontend y backend.

## Referencias
- `docs/04_TECHNICAL_SPEC/Architecture.md` (líneas 29, 57, 59)
- `docs/04_TECHNICAL_SPEC/Database.md` línea 44
- `backend/database/migrations/2026_07_28_183608_create_auth_sessions_table.php`
- `backend/config/jwt.php`

## Estado de implementación
Implementado y verificado en código (migración `auth_sessions` existe con las columnas descritas). Verificar en `docs/05_IMPLEMENTATION/Auth_Module1_Authentication.md` si los tests cubren la rotación y revocación end-to-end.

## Información Faltante
No se documentó si se evaluó (y descartó) usar únicamente un JWT de refresco de larga duración con blacklist, ni si se consideró Sanctum `personal_access_tokens` como alternativa. Se documenta el resultado y su justificación funcional (revocabilidad), no un proceso de comparación formal entre opciones.
