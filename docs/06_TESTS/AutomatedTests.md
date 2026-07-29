# Tests Automatizados — Índice

> Documentación *sobre* la suite de tests real en `backend/tests/**`. No duplica código de test — solo indexa qué existe, qué cubre cada archivo, y su estado. Cero cambios de código fueron hechos a los tests durante esta migración de documentación.

## Resumen

- **19 archivos**, **94 tests**, todos pasando (backend, PHPUnit/Laravel).
- **0 archivos de test de frontend** — gap real, ver `MasterTestPlan.md`.
- Comando: `composer test` (equivalente a `php artisan config:clear && php artisan test`) desde `backend/`.
- Sin integración en CI/CD — no existe pipeline (`.github/workflows` no existe en este repo). Los 94 tests solo corren cuando alguien los ejecuta localmente.

## Feature (`backend/tests/Feature/`)

| Archivo | Tests | Cubre |
|---|---|---|
| `Auth/AuthenticationTest.php` | 11 | Login, logout, refresh (rotación de token), `/me`, protección de rutas de negocio contra anónimos, registro en `security_logs`/`auth_sessions`. |
| `Auth/PasswordResetTest.php` | 4 | Flujo completo de "olvidé mi contraseña": respuesta genérica anti-enumeración, envío real de notificación, reset válido con revocación de sesiones, token inválido. |
| `CapturaIA/CapturaIAControllerTest.php` | 8 | Los 8 endpoints REST de Captura IA: foto, voz, foto-voz (con validación de ambos archivos requeridos), confirmación manual de detección de baja confianza, corrección de un detalle antes de confirmar, descarte, listado/detalle scopeados por empresa, idempotencia vía header repetido. |
| `Security/CompanyIsolationHttpTest.php` | 10 | Suite adversarial de Company Isolation (Módulo 2) vía HTTP real: acceso cruzado a captura ajena, UUID adivinado, confirmar/descartar/corregir captura ajena, `empresa_id` forjado en body y en query string, paginación nunca cuenta filas ajenas, replay de `Idempotency-Key` ajena, Platform Admin sin empresa falla limpio. |
| `ErrorHandlingTest.php` | 5 | Ninguna respuesta de API filtra excepciones crudas, stack traces, ni mensajes de vendor (OpenAI) — ruta inexistente, 401 sin header `Accept`, método HTTP no permitido, validación en español, error de proveedor de IA nunca expone el mensaje/status del vendor. |
| `ExampleTest.php` | 1 | Test scaffold de Laravel (`/` responde 200). No relacionado a lógica de negocio. |

## Unit (`backend/tests/Unit/`)

| Archivo | Tests | Cubre |
|---|---|---|
| `Auth/RbacFoundationTest.php` | 3 | Catálogo de permisos sembrado globalmente; un rol otorgado en una empresa no se filtra a otra (Teams de Spatie); roles homónimos coexisten independientemente por empresa. |
| `Auth/UserModelTest.php` | 5 | `User` pertenece a una empresa y no es platform admin por defecto; un Platform Super Admin puede existir sin empresa; `User` implementa `JWTSubject` con claim `empresa_id`; columnas de 2FA/actividad con defaults seguros; `two_factor_secret` nunca se serializa. |
| `CapturaIA/ApplyInventoryMovementActionTest.php` | 5 | Alta confianza aplica producto+movimiento automáticamente; baja confianza va a revisión sin tocar stock; confianza exactamente en el umbral aplica; producto existente se reutiliza en vez de duplicarse; `entrada` suma y `salida` resta stock. |
| `CapturaIA/ArchitectureReviewTest.php` | 5 | Un fallo a mitad de una captura revierte TODO lo ya escrito (transacción atómica); eventos de dominio se disparan tras éxito; eventos NO se disparan si hubo rollback; procesar la misma `Idempotency-Key` dos veces no duplica inventario; claves de idempotencia distintas se procesan de forma independiente. |
| `CapturaIA/CapturaIAServiceTest.php` | 6 | Foto con productos idénticos suma en un solo producto/movimiento; foto con productos distintos genera una entrada por producto; confianza mixta deja la captura en `parcial`; captura solo-voz registra movimiento para el producto nombrado; foto+voz usa identidad de la foto y cantidad de la voz; toda captura obtiene un `uuid` y una entrada en `audit_logs`. |
| `CapturaIA/InventoryServiceTest.php` | 4 | `registrarMovimiento` incrementa stock y registra antes/después; `salida` decrementa desde una cantidad positiva; una cantidad negativa se trata como su magnitud; lanza excepción si el stock resultante sería negativo. |
| `CapturaIA/MergeDuplicateDetectionsActionTest.php` | 4 | Suma cantidades de productos idénticos en vez de duplicar filas; mantiene productos distintos como entradas separadas; promedia la confianza de duplicados fusionados; el matching ignora mayúsculas/espacios. |
| `CapturaIA/ProductServiceMatchingTest.php` | 3 | Encuentra producto existente por nombre+marca+presentación; devuelve `null` si nada coincide; nunca hace match con productos de otra empresa. |
| `CapturaIA/StructuredExtractionDTOTest.php` | 4 | `products` siempre es un arreglo aun con un solo elemento; un objeto suelto del proveedor se envuelve en un arreglo de un elemento; falta la clave `products` por defecto en arreglo vacío; `toArray()` hace round-trip fiel del contrato. |
| `Security/TenantScopeTest.php` | 15 | Suite adversarial de Company Isolation a nivel Eloquent/Policy (ver detalle en `SecurityTests.md` y en `05_IMPLEMENTATION/Auth_Module2_CompanyIsolation.md`). |
| `ExampleTest.php` | 1 | Test scaffold de Laravel. No relacionado a lógica de negocio. |

## Support (`backend/tests/Support/`)

| Archivo | Propósito |
|---|---|
| `Fakes/FakeAIProvider.php` | Implementación de `AIProviderInterface` para tests — permite fijar resultados de imagen/texto/transcripción sin llamar a OpenAI real. Usado por prácticamente todos los tests de Captura IA y de aislamiento HTTP. También sirve como prueba viva de que el sistema soporta múltiples proveedores de IA sin tocar Strategies/Controllers/Services (ver `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` §74, "Revisión final de arquitectura", punto 7). |

## Cómo correr la suite

```bash
cd backend
php artisan config:clear
php artisan test
# o, equivalente:
composer test
```

Requiere `database/database.sqlite` existente (o el driver de test configurado en `phpunit.xml`) — no requiere `OPENAI_API_KEY`: todos los tests que tocan IA usan `FakeAIProvider`, nunca llaman a OpenAI real.

## Lo que esta suite NO cubre (gaps reales)

- Frontend: cero tests automatizados (Jest/RTL/Playwright/Cypress — ninguno configurado). Ver `MasterTestPlan.md` y `ManualTestCases.md`.
- Performance/carga: cero tests. Ver `PerformanceTests.md`.
- Accesibilidad: sin auditoría, automatizada o manual.
- CI/CD: la suite no corre automáticamente en ningún pipeline; depende de ejecución manual local.
