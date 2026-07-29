# Implementación — Módulo Captura IA (AI Inventory Agent)

> Documento retroactivo. Reconstruido a partir de `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` §74 (la sección más precisa del master spec) y del código real en `backend/app/**`. Este tipo de documento (`05_IMPLEMENTATION/`) no existía antes de esta migración; para todo módulo futuro (Módulo 3 en adelante) debe escribirse **antes** del código, no después.

## Estado

**Backend completo** (Fases 1-3 + revisión final de arquitectura). **Frontend completo** (Fases 4-5, verificado en RC1). Sin JWT propio en su momento — desde Auth Módulo 1, todas las rutas de Captura IA quedaron detrás de `auth:api` + `tenant`.

## Goal

Permitir registrar inventario (alta de producto + movimiento de stock) mediante tres modos de captura asistidos por IA: Foto, Voz, y Foto + Voz combinada, sin que el usuario tenga que llenar formularios largos. La IA propone Productos y Movimientos; el usuario confirma (o el sistema aplica automáticamente si la confianza es alta).

## Scope

- Captura por foto (uno o varios productos por imagen, incluyendo estantería/pallet/bodega completos).
- Captura por voz (movimiento hablado en lenguaje natural, transcrito y estructurado).
- Captura combinada foto + voz.
- Deduplicación y suma de cantidades para productos iguales detectados en una misma captura.
- Umbral de confianza configurable (`0.85` por defecto) que decide aplicar automáticamente vs. enviar a cola de revisión.
- Corrección manual de un detalle pendiente antes de confirmar.
- Confirmar / descartar una captura.
- Historial y detalle de capturas (paginado, filtrado por empresa).
- Auditoría inmutable de cada captura (`audit_logs`).
- Idempotencia opt-in vía header `Idempotency-Key`.
- Transacciones atómicas: toda una captura se aplica o se revierte por completo.
- Eventos de dominio (`ProductCreated`, `StockUpdated`, `InventoryMovementRegistered`, `AICaptureCompleted`) disparados tras commit, sin listeners todavía.

## Out of Scope

- Reentrenamiento de modelos propios.
- Reconocimiento facial o biométrico.
- Procesamiento offline sin conexión a la API de IA.
- Código de barras, QR, OCR de facturas, PDF, video (arquitectura preparada vía `tipo` como enum de aplicación y `CaptureStrategyResolver` Open/Closed, pero no implementados en este MVP).
- Notificaciones/listeners sobre los eventos de dominio (arquitectura lista, sin consumidores).
- Procesamiento asíncrono real (`ProcesarCapturaIAJob` existe y es queueable, pero el Controller lo sigue llamando de forma síncrona; no hay worker corriendo por defecto).
- CRUD de Productos/Movimientos por fuera de Captura IA (no existe endpoint REST propio para Productos o Movimientos; esta es la única vía de escritura hoy).

## Dependencies

- Un módulo mínimo de Productos/Categorías/Movimientos (thin skeleton, construido ad hoc para soportar Captura IA, no como CRUD propio).
- `AIProviderInterface` con implementación `OpenAIProvider` (requiere `OPENAI_API_KEY` válida en `backend/.env`; sin ella, todo el resto de la app funciona pero el análisis de foto/voz falla con error amigable).
- Desde Auth Módulo 1: `auth:api` + middleware `tenant` (`IdentifyTenant`) en todas las rutas — Captura IA ya no acepta `empresa_id`/`usuario_id` como campos del request para producir efectos; se derivan del usuario autenticado (aunque `empresa_id` se sigue aceptando en el body/query, es ignorado — ver Security).

## Database Changes

Tablas (ver `docs/04_TECHNICAL_SPEC/Database.md` para el detalle completo): `capturas_ia`, `capturas_ia_detalle`, más el soporte mínimo de `empresas`, `categorias`, `productos`, `movimientos` del que este módulo depende, y `audit_logs` (genérica, no exclusiva de Captura IA).

Puntos clave:
- `capturas_ia.uuid` es el identificador externo estable y route key (`{uuid}` en la URL, nunca el id numérico).
- `tipo` y `estado` son `VARCHAR` validados por enums de PHP (`TipoCaptura`, `EstadoCaptura`, `EstadoCapturaDetalle`), no `ENUM` de MySQL — agregar un tipo de captura futuro es código, no migración.
- `capturas_ia.idempotency_key` con índice único `(empresa_id, idempotency_key)`.
- Ambas tablas son `empresa_id`-scoped (`BelongsToEmpresa` + `TenantScope`, agregado en Auth Módulo 2).

## API Changes

Prefijo `/api/v1/captura-ia`, todas las rutas bajo `['auth:api', 'tenant']` (desde Auth Módulo 1/2 — antes de eso, no exigían JWT y recibían `empresa_id` explícito, lo cual quedó documentado como brecha de seguridad hasta que se cerró):

```
POST   /api/v1/captura-ia/foto
POST   /api/v1/captura-ia/voz
POST   /api/v1/captura-ia/foto-voz
GET    /api/v1/captura-ia
GET    /api/v1/captura-ia/{uuid}
PATCH  /api/v1/captura-ia/{uuid}/detalle/{detalleId}
POST   /api/v1/captura-ia/{uuid}/confirmar
POST   /api/v1/captura-ia/{uuid}/descartar
```

Ver `docs/04_TECHNICAL_SPEC/API.md` para el contrato de request/response completo. Errores: `AIProviderException` → 502, `StockInsuficienteException`/`CapturaIAEstadoInvalidoException` → 409, validación → 422 — todos vía el manejador centralizado en `bootstrap/app.php`, nunca construidos a mano por un Controller.

## Frontend Changes

`src/modules/captura-ia/` (Next.js): `CaptureLauncher`, `CameraCapture`, `AudioRecorder`, `DetectionReviewList/Card`, `ConfidenceBadge`, `ConfirmationSheet`; páginas `captura/page.tsx` y `captura/historial/page.tsx`; hooks (`useCameraCapture`, `useAudioRecorder`, `useCapturaIA`); `capturaIAService.ts` (Axios); `capturaIASlice.ts` (Redux Toolkit); validación con Zod para corrección manual. Optimizado mobile/tablet-first (cámara/micrófono nativos vía `MediaDevices`). Estados de carga conversacionales (Subiendo → Analizando → Transcribiendo → Combinando → Guardando), verificados en el walkthrough RC1.

## Security

- La IA nunca escribe directamente en `productos` ni `movimientos` — solo vía `ProductService`/`InventoryService`, a través de `ApplyInventoryMovementAction` (única puerta).
- `empresa_id` en el body/query de un request de Captura IA es ignorado para efectos de escritura; el `empresa_id` real se deriva del usuario autenticado vía `TenantContext` (Auth Módulo 2) — probado explícitamente (`test_a_forged_empresa_id_in_the_payload_is_ignored_on_create`, `test_a_forged_empresa_id_in_the_query_string_is_ignored_on_index`).
- Ningún error de proveedor de IA (OpenAI) filtra el mensaje del vendor ni el status code al cliente (`test_an_ai_provider_failure_never_leaks_the_vendor_message_or_status_code`).
- Un Platform Admin sin `empresa_id` recibe un 403 limpio al intentar capturar, en vez de romper por constraint NOT NULL.
- Archivo original (imagen/audio) siempre se persiste ANTES de procesar, para auditoría, en el disco privado `local`.

## Permissions

Ninguna todavía a nivel de permiso fino (`captura-ia.revisar`, etc.) — eso es Auth Módulo 3 (Authorization/RBAC), pendiente. Hoy el único control de acceso es: usuario autenticado + pertenencia a la empresa (vía `CapturaIAPolicy`, defensa en profundidad detrás de `TenantScope`).

## Events

`ProductCreated`, `StockUpdated`, `InventoryMovementRegistered`, `AICaptureCompleted` — todos disparados vía `DB::afterCommit()`, nunca antes del commit de la transacción externa, y nunca si hubo rollback. Sin listeners todavía (a propósito): casos de uso futuros obvios son alertas de stock, notificaciones en tiempo real, sincronización externa.

## Tests

41 tests de arquitectura/unitarios reportados en el master spec durante el desarrollo (26 unitarios + 15 de integración/arquitectura en Fase 2; 35 adicionales en Fase 3 — 23 unitarios + 12 de integración HTTP). En el estado actual del repo, la cobertura de Captura IA vive en:

- `backend/tests/Unit/CapturaIA/StructuredExtractionDTOTest.php`
- `backend/tests/Unit/CapturaIA/ProductServiceMatchingTest.php`
- `backend/tests/Unit/CapturaIA/MergeDuplicateDetectionsActionTest.php`
- `backend/tests/Unit/CapturaIA/InventoryServiceTest.php`
- `backend/tests/Unit/CapturaIA/ApplyInventoryMovementActionTest.php`
- `backend/tests/Unit/CapturaIA/CapturaIAServiceTest.php`
- `backend/tests/Unit/CapturaIA/ArchitectureReviewTest.php`
- `backend/tests/Feature/CapturaIA/CapturaIAControllerTest.php`
- `backend/tests/Feature/Security/CompanyIsolationHttpTest.php` (Captura IA es la única superficie REST real hoy, así que los adversariales de aislamiento corren contra ella)
- `backend/tests/Feature/ErrorHandlingTest.php` (varios casos cubren rutas de Captura IA)

Ver `docs/06_TESTS/AutomatedTests.md` para el índice completo con propósito y estado de cada archivo. Sin tests de frontend automatizados (gap real, ver `docs/06_TESTS/MasterTestPlan.md`).

## Risks

- Sin `OPENAI_API_KEY` con saldo, el flujo de análisis falla de extremo a extremo (mitigado con mensaje de error amigable, nunca un 500 crudo).
- Procesamiento síncrono: una imagen grande puede alargar la respuesta HTTP; el Job queueable existe pero no está activo — riesgo de timeout en producción con archivos grandes hasta que se active el modo asíncrono.
- Umbral de confianza fijo por defecto (0.85); configurable por empresa vía tabla `configuraciones`, pero sin UI todavía para cambiarlo.
- No hay endpoint REST propio de Productos/Movimientos — cualquier corrección de catálogo fuera de Captura IA no tiene superficie API hoy.

## Checklist

- [x] Arquitectura, modelo de datos, contratos de API diseñados y aprobados (Fase 1).
- [x] Backend núcleo: migraciones, enums, `AIProviderInterface` + `OpenAIProvider`, Strategies, Services, Actions, Repository (Fase 2).
- [x] Backend API: Controllers, FormRequests, Resources, `ApiResponse`, rutas, manejo centralizado de excepciones (Fase 3).
- [x] Idempotencia implementada y probada.
- [x] Transacciones atómicas implementadas y probadas (rollback completo ante fallo parcial).
- [x] Eventos de dominio implementados y probados (se disparan tras éxito, no tras rollback).
- [x] Frontend de captura y de revisión/confirmación (Fases 4-5).
- [x] QA de integración (RC1: walkthrough completo, estados de carga/vacíos/error, responsive, real-login).
- [x] Documentación actualizada (`docs/04_TECHNICAL_SPEC/*`, este documento).
- [ ] Deploy formal con variables `.env` de producción, límites de tamaño de archivo documentados operacionalmente (ver `docs/07_RELEASE/DeploymentGuide.md` — gap: no hay pipeline de deploy).

## Definition of Done

Cumplida para el alcance descrito arriba: código implementado, tests unitarios/integración pasando, QA manual (RC1) realizada, documentación actualizada, sin bugs críticos abiertos. **No cumplida** en sentido estricto de `AGENTS.md`: no hay Changelog formal previo a esta migración (creado ahora, ver `CHANGELOG.md` en la raíz si existe) y no hay pipeline de CI/CD que verifique lint/type-check/build/tests automáticamente en cada cambio — ambos son gaps reales, no marcados como completos.
