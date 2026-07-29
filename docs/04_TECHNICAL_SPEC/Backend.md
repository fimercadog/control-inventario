# Backend — Technical Spec

> Convenciones reales de `backend/` (Laravel 12, PHP 8.2). Consistente con `Architecture.md`, `Database.md`, `API.md`. Todo ejemplo cita un archivo real.

## 1. Stack (verificado contra `backend/composer.json`)

- PHP `^8.2`, Laravel `^12.0`.
- `tymon/jwt-auth ^2.2` — autenticación JWT (guard `api`).
- `spatie/laravel-permission ^6.0` — roles/permisos con **Teams** habilitado.
- SQLite en `.env.example` para desarrollo local (`DB_CONNECTION=sqlite`); MySQL es el motor oficial de producción (`Database.md`).
- Sin paquetes de testing adicionales fuera de PHPUnit/Faker/Mockery estándar de Laravel — 94 tests reales (ver `docs/06_TESTS/AutomatedTests.md`).

## 2. Estructura de carpetas real (`backend/app/`)

```
app/
├── Actions/CapturaIA/          # unidades de trabajo de un solo paso, invocables (__invoke), sin estado
├── Contracts/                  # interfaces — AI/, Auth/, CapturaIA/
├── DTO/                        # objetos de transferencia inmutables (readonly) — AI/, Auth/, CapturaIA/
├── Enums/                      # enums de PHP respaldados por VARCHAR en BD, no ENUM de MySQL
├── Events/                     # eventos de dominio — Auth/, raíz (ProductCreated, StockUpdated, ...)
├── Exceptions/                 # excepciones de dominio, mapeadas a códigos HTTP por el Handler — Auth/
├── Http/
│   ├── Controllers/Api/        # delgados: validan (vía FormRequest), llaman un Service, devuelven Resource
│   ├── Middleware/              # IdentifyTenant (tenant)
│   ├── Requests/                # FormRequest — toda validación de entrada vive aquí, nunca en el Controller
│   ├── Resources/                # transforman Model/DTO → JSON de respuesta
│   └── Support/ApiResponse.php  # único envoltorio de respuesta {success, message, data}
├── Jobs/                        # colas — hoy solo ProcesarCapturaIAJob, preparado pero no despachado async aún
├── Models/                      # Eloquent — Concerns/BelongsToEmpresa, Scopes/TenantScope
├── Notifications/Auth/          # notificaciones (reset de contraseña)
├── Policies/                    # una por modelo — ProductoPolicy, MovimientoPolicy, CapturaIAPolicy
├── Providers/AppServiceProvider.php  # bindings de interfaces → implementaciones
├── Repositories/                 # acceso a datos detrás de una clase concreta (sin interface todavía, ver Backend.md §4)
└── Services/                      # lógica de negocio y orquestación — AI/, Auth/, CapturaIA/, Audit/
```

Esta es la misma estructura que Módulo Captura IA fijó primero (`Architecture.md`, "Organización backend") y que Auth/RBAC replicó — es la convención de facto del proyecto, no solo la de un módulo.

## 3. Clean Architecture aplicada aquí

Flujo real de una request (ver `CapturaIAController` → `CapturaIAService` → Strategies → `AIProviderInterface` → Actions → `ProductService`/`InventoryService` → `CapturaIARepository`):

```
Http (Controller, FormRequest, Resource)
   ↓ solo llama
Service (orquesta, sin acceso a Eloquent directo salvo a través de Repository)
   ↓ solo conoce
Contracts (interfaces — AIProviderInterface, RefreshTokenServiceInterface, CaptureStrategyInterface)
   ↓ implementadas por
Infrastructure (OpenAIProvider, RefreshTokenService, PhotoCaptureStrategy, Repositories)
   ↓ persiste vía
Models (Eloquent, con TenantScope aplicado automáticamente)
```

Regla verificada en código: **ningún Controller llama directamente a un proveedor externo o a Eloquent para lógica de negocio** — `CapturaIAController` no conoce `OpenAIProvider`, solo `CapturaIAService`; `AuthController` (no incluido arriba, ver `Architecture.md`) no genera tokens, delega en `AuthenticationService` → `RefreshTokenServiceInterface`.

Ver `docs/08_ADR/ADR-001-clean-architecture.md` para el razonamiento completo.

## 4. Repository Pattern — estado real vs. aspiracional

Existen dos repositorios reales: `app/Repositories/ProductRepository.php` y `app/Repositories/CapturaIARepository.php`. **Ninguno de los dos implementa una interfaz `*RepositoryInterface` todavía** — son clases concretas inyectadas directamente (`ProductService` type-hints `ProductRepository`, no una interfaz). Esto es una simplificación real y deliberada para el tamaño actual del proyecto (un solo proveedor de persistencia, MySQL/SQLite vía Eloquent, sin necesidad de sustituir la implementación en tests — los tests reales usan una base SQLite en memoria, no un fake de repositorio).

`ProductRepository::buscarPorNombreMarcaPresentacion()` es el ejemplo de referencia: encapsula una regla de consulta no trivial (comparación case-insensitive con manejo de `NULL` en marca/presentación) para que `ProductService` no conozca SQL. Ver `docs/08_ADR/ADR-002-repository-pattern.md` para el trade-off de por qué no hay interfaz todavía y cuándo se justificaría introducirla.

## 5. Service Layer

Cada Service tiene una única responsabilidad de dominio (Alta Cohesión, master spec §73):

- `ProductService` — solo alta y búsqueda de identidad de producto. **Nunca** toca `stock_actual`.
- `InventoryService` — única puerta de escritura de stock (`registrarMovimiento()`).
- `CapturaIAService` — orquestador del pipeline de Captura IA; no contiene reglas de negocio de Productos/Inventario, solo coordina Strategy → Actions → Repository → AuditLogger.
- `AuthenticationService` — login/logout/refresh/forzar reset; delega la generación de tokens en `RefreshTokenServiceInterface`, nunca genera un JWT directamente.
- `RefreshTokenService` — implementa `RefreshTokenServiceInterface`; único lugar que llama `JWTAuth::fromUser()` y gestiona `AuthSession`.
- `TenantContext` — no es un Service de negocio, es infraestructura transversal (singleton, ver `Security.md`).
- `AuditLogger` (`Services/Audit/`) — un método por tipo de evento auditable (`registrarCapturaIA()`); nunca se llama desde un Controller, solo desde el Service que orquesta la operación.

Ver `docs/08_ADR/ADR-003-service-layer.md`.

## 6. DTO Pattern

Todos los DTOs son `final readonly class` (PHP 8.2 `readonly` properties), inmutables una vez construidos:

- `CaptureInputDTO` — entrada normalizada al pipeline de Captura IA, independiente del modo (foto/voz/combinado).
- `AIExtractionResultDTO`, `StructuredExtractionDTO`, `DetectedProductDTO` — contrato provider-agnostic entre `AIProviderInterface` y el resto del sistema; ningún Service conoce el formato crudo de OpenAI.
- `AuthResultDTO`, `TokenPairDTO` — resultado de operaciones de autenticación, nunca se expone el modelo `User` de Eloquent directamente en la capa de tokens.

Regla verificada: los DTOs de `DTO/AI/*` son el límite de traducción entre el proveedor externo y el dominio — `StructuredExtractionDTO::fromArray()` normaliza incluso una respuesta malformada del proveedor (objeto suelto en vez de arreglo) antes de que cualquier Service la vea. Ver `docs/08_ADR/ADR-004-dto-pattern.md`.

## 7. JWT (`config/jwt.php`, `tymon/jwt-auth`)

- Guard `api`, algoritmo simétrico por defecto (`JWT_SECRET` en `.env`, generado con `php artisan jwt:secret`).
- TTL configurable vía `JWT_TTL` (`.env.example`: `15` minutos) — `RefreshTokenService::issueFor()` lee `config('jwt.ttl')` para calcular `accessTokenExpiresInSeconds`.
- Claims custom: `User::getJWTCustomClaims()` agrega `empresa_id` al payload — permite identificar el tenant sin una query adicional en casos de solo-lectura del token (aunque `TenantContext`/`IdentifyTenant` siguen siendo la fuente autoritativa vía el modelo cargado, no el claim, ver `Security.md`).
- Blacklist nativa de `tymon/jwt-auth` usada en logout (`auth('api')->invalidate()` en `AuthenticationService::logout()`).
- El refresh token **no es JWT** — es un string opaco (`Str::random(64)`), hasheado con SHA-256 antes de persistirse en `auth_sessions.refresh_token_hash`. Ver `docs/08_ADR/ADR-006-jwt-authentication.md` y `ADR-007-refresh-tokens.md` para el porqué de esta combinación.

## 8. CORS (`config/cors.php`)

- `allowed_origins` viene de `FRONTEND_URL` (`.env`, default `http://localhost:3000`) — **nunca `*`**, porque `supports_credentials = true` (obligatorio para que el navegador acepte la cookie httpOnly del refresh token) y el spec CORS prohíbe combinar wildcard de origen con credenciales.
- `paths: ['api/*', 'sanctum/csrf-cookie']` — el segundo path es un remanente del scaffold de Laravel (Sanctum no se usa en este proyecto, la autenticación es JWT vía `tymon/jwt-auth`); no genera ningún efecto porque no hay rutas Sanctum registradas, pero se documenta aquí para no confundirlo con un uso real de Sanctum.

## 9. Tenant scoping — mecánica en capa de infraestructura

Ver `Security.md` para el detalle completo de las dos capas de defensa. Resumen de responsabilidad por capa de Backend.md:

- `Http/Middleware/IdentifyTenant` — único punto de la request que fija `TenantContext` y el team-id de Spatie.
- `Models/Scopes/TenantScope` + `Models/Concerns/BelongsToEmpresa` — aplican el filtro automáticamente a nivel Eloquent para todo modelo que use el trait.
- `Providers/AppServiceProvider` — registra `TenantContext` como singleton **a propósito**: sin esto, cada `app(TenantContext::class)` devolvería una instancia nueva y vacía, y todo terminaría fail-closed permanentemente (comentario explícito en el archivo).

## 10. Gestión de errores

`Http/Support/ApiResponse.php` es el único envoltorio de respuesta (ver `API.md`, "Formato de Respuesta"). Las excepciones de dominio (`AIProviderException`, `IdempotencyConflictException`, `StockInsuficienteException`, `InvalidCredentialsException`, `AccountNotAvailableException`, `InvalidRefreshTokenException`, `CapturaIAEstadoInvalidoException`) viven en `app/Exceptions/` y se traducen a códigos HTTP específicos — nunca se filtra una excepción cruda de Laravel/Eloquent al cliente (consistente con master spec §73, "Gestión de Errores").

## 11. Brechas conocidas frente a `Architecture.md` (Módulo Auth, aspiracional)

`Architecture.md` describe una estructura de carpetas más amplia para Auth/RBAC (`Services/Auth/TenantService`, `InvitationService`, `PasswordResetService`, `EmailVerificationService`, `SessionService`, `RoleService`, `UserService`, `ProfileService`; `Policies/UserPolicy`, `RolePolicy`; `Http/Controllers/Api/Auth/UserController`, `InvitationController`, etc.) que **todavía no existe en el código** — corresponde a los Módulos 3-9, no construidos. Lo que sí existe hoy: `AuthenticationService`, `RefreshTokenService`, `TenantContext`, `AuthController`, `PasswordResetController`, `ProductoPolicy`, `MovimientoPolicy`, `CapturaIAPolicy`. Este documento describe el código real; `Architecture.md` describe la decisión de producto ya tomada para cuando esos módulos se construyan.
