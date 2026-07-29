# Glossary

> Base: master spec §72 (Anexos/Glosario/Referencias), ampliado con términos propios del dominio real de este proyecto (Captura IA, Auth/RBAC) verificados contra el código y `Architecture.md`/`Database.md`/`API.md`.

## Términos generales

| Término | Definición |
|---|---|
| **API** | Application Programming Interface |
| **CRUD** | Create, Read, Update, Delete |
| **DTO** | Data Transfer Object — objeto inmutable para pasar datos entre capas sin exponer el modelo de dominio directamente. En este backend, siempre `final readonly class` (ver `Backend.md` §6) |
| **JWT** | JSON Web Token — access token de corta duración usado por este backend (`tymon/jwt-auth`) |
| **KPI** | Key Performance Indicator |
| **RBAC** | Role Based Access Control — en este proyecto, implementado (parcialmente, ver `Security.md` §4) vía `spatie/laravel-permission` con Teams |
| **REST** | Representational State Transfer |

## Términos específicos de este proyecto (verificados en código)

| Término | Definición |
|---|---|
| **Tenant / Empresa** | Unidad de aislamiento multi-cliente. Toda fila de un modelo `empresa_id`-scoped pertenece a exactamente una `Empresa`, salvo el Platform Super Admin |
| **TenantScope** | Global Scope de Eloquent (`App\Models\Scopes\TenantScope`) que filtra automáticamente toda consulta por `empresa_id`, fail-closed (cero filas si el contexto no está resuelto) |
| **TenantContext** | Servicio singleton (`App\Services\Auth\TenantContext`) que resuelve "qué empresa es esta request"; única fuente de verdad que lee `TenantScope` |
| **Platform Super Admin** | Usuario con `empresa_id = null` e `is_platform_admin = true`; no pertenece a ninguna empresa, usado para soporte/operaciones internas de Fidel OS, nunca para clientes |
| **Refresh token opaco** | String aleatorio (no JWT) usado para renovar el access token; se persiste solo su hash SHA-256 en `auth_sessions` |
| **Access token** | JWT de corta duración (15 min por defecto) devuelto en el body de login/refresh, guardado solo en memoria en el frontend |
| **AuthSession** | Registro server-side de un refresh token emitido; permite revocación individual ("Active Sessions") |
| **AuditLog** | Bitácora de acciones de negocio, inmutable (`update()`/`delete()` lanzan excepción), genérica por diseño (`modulo`/`accion` + relación polimórfica `auditable`) |
| **SecurityLog** | Bitácora de intentos de login (éxito y fallo), incluye actores no autenticados; distinta de `AuditLog` |
| **Captura IA** | Módulo que permite registrar inventario mediante foto, voz o foto+voz, con IA proponiendo Productos y Movimientos que el usuario confirma (o se auto-aplican sobre el umbral de confianza) |
| **AIProviderInterface** | Contrato único entre Captura IA y cualquier proveedor de IA externo (`analyzeImage`, `transcribeAudio`, `extractStructured`) — desacopla el pipeline de OpenAI específicamente |
| **CaptureStrategy** | Estrategia (`PhotoCaptureStrategy`, `VoiceCaptureStrategy`, `CombinedCaptureStrategy`) que orquesta un modo de captura, cada una dependiendo solo de `AIProviderInterface` |
| **Umbral de confianza** | Valor (`confidence`, default 0.85) que determina si una detección de IA se aplica automáticamente o queda en cola de revisión manual |
| **Idempotency Key** | Clave enviada por el cliente para evitar procesar dos veces la misma captura ante reintentos de red; única por `empresa_id` en `capturas_ia` |
| **Stock exclusivo (`InventoryService`)** | Regla de dominio: `productos.stock_actual` solo puede modificarse a través de `InventoryService::registrarMovimiento()`, nunca directamente por Captura IA ni ningún otro componente |
| **Kardex** | Registro histórico de movimientos de un producto (entradas/salidas). En este proyecto, `movimientos` cumple una función de kardex simplificado (append-only); no existe un módulo de Kardex dedicado con reportes — ver `docs/_ARCHIVE/pre-pivot-erp-scope.md` |

## Referencias

Laravel Documentation, Next.js Documentation, TypeScript Handbook, OWASP Top 10, PSR Standards (master spec §72). Ampliado por esta migración: `spatie/laravel-permission` documentation (Teams feature), `tymon/jwt-auth` documentation.
