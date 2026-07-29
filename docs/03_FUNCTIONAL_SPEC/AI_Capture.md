# Captura IA (AI Inventory Agent)

**Status: Built**

> Fuente principal: sección 74 de `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` — la sección más precisa y mantenida al día del documento original, descrita en el propio plan de migración como escrita *durante* la implementación. Verificado contra `backend/app/Http/Controllers/Api/CapturaIAController.php`, `backend/app/Models/CapturaIA.php`, `CapturaIADetalle.php`, `backend/app/Services/CapturaIA/*`, `backend/app/Services/AI/*`, `backend/routes/api.php`, `frontend/app/(app)/captura/**`, `frontend/components/review-screen.tsx`, `review-product-card.tsx`, `ai-processing-state.tsx`, `voice-wave.tsx`. Una diferencia real respecto al texto original de §74: en ese momento el módulo no exigía JWT (recibía `empresa_id` explícito en el request); hoy, tras el Módulo 1 (Authentication) y Módulo 2 (Company Isolation), **todas** las rutas de Captura IA exigen `auth:api` + `tenant`, y `empresa_id`/`usuario_id` se toman siempre del usuario autenticado — nunca del body/query.

## Purpose

Permitir registrar inventario (altas de producto y movimientos de stock) mediante tres modos de captura — foto, voz, o foto + voz — donde un proveedor de IA propone los productos y el movimiento, y el usuario confirma antes de que se escriba en las tablas oficiales (salvo alta confianza). Es una capa de entrada adicional sobre los dominios ya existentes de Productos e Inventario: nunca una fuente de datos paralela.

## Business Flow

1. Usuario elige un modo de captura (`/captura/foto`, `/captura/voz`, `/captura/foto-voz`) y aporta una imagen y/o audio.
2. El frontend envía el archivo al backend (`POST /api/v1/captura-ia/foto|voz|foto-voz`), con `Idempotency-Key` opcional para proteger contra reintentos.
3. El backend guarda el archivo original, invoca al proveedor de IA (hoy OpenAI, detrás de `AIProviderInterface`) y obtiene un contrato estructurado `{ products: [...], movement }`.
4. Se funden duplicados de la misma extracción (mismo nombre+marca+presentación → se suma cantidad).
5. Para cada detección: si `confidence >= 0.85`, se aplica automáticamente (crea/actualiza producto vía `ProductService`, registra movimiento vía `InventoryService`); si `confidence < 0.85`, queda `pendiente_revision` — no se toca `productos` ni `movimientos`.
6. El usuario revisa la cola de pendientes en `/captura/revisar/[uuid]`, puede corregir campos (`PATCH .../detalle/{detalleId}`) y luego confirmar (`POST .../confirmar`) o descartar (`POST .../descartar`).
7. Cada captura procesada genera exactamente un `AuditLog` inmutable.

## Actors

- **Usuario de empresa** con permiso implícito de captura (`captura-ia.usar`, `captura-ia.revisar`, `captura-ia.confirmar` — existen en el catálogo de permisos sembrado, pero **no están enforced todavía** por ningún middleware: el Módulo 3/Authorization que aplicaría estos permisos a las rutas de Captura IA sigue pendiente en el roadmap).
- **Proveedor de IA** (actor técnico, no humano): OpenAI hoy, intercambiable por Claude/Gemini/Ollama/OpenRouter sin tocar Controllers/Services/Actions de Captura IA.

## Screens

- **`/captura`**: selector de modo (Foto / Voz / Foto+Voz).
- **`/captura/foto`**: captura o carga de imagen, muestra `ai-processing-state` mientras el backend procesa.
- **`/captura/voz`**: grabación de audio con `voice-wave.tsx` (visualización de onda), envío y procesamiento.
- **`/captura/foto-voz`**: combina ambos flujos en una sola captura.
- **`/captura/revisar/[uuid]`**: pantalla de revisión (`review-screen.tsx` + `review-product-card.tsx`) — lista los productos detectados de una captura con su `confidence` (`confidence-badge.tsx`), permite editar campos de los que quedaron `pendiente_revision`/`corregido`, y confirmar o descartar.

## Fields

Por cada producto detectado (`capturas_ia_detalle`, expuesto también en la API):

| Campo | Origen | Editable en revisión |
|---|---|---|
| name / nombre_detectado | IA | Sí |
| brand / marca_detectado | IA | Sí |
| category / categoria_detectado | IA | Sí |
| presentation / presentacion_detectado | IA | Sí |
| unit / unidad_detectado | IA | Sí |
| quantity / cantidad_detectada | IA | Sí |
| confidence / confianza | IA | No (informativo) |
| movement (a nivel de captura) | IA (por defecto `entrada` en modo solo foto) | No editable por detalle, es de la captura completa |

## Validation Rules

- `StoreFotoRequest`/`StoreVozRequest`/`StoreFotoVozRequest` validan tipo/tamaño de archivo antes de procesar.
- `UpdateDetalleRequest` valida los campos corregibles antes de aplicar una corrección manual.
- `PATCH .../detalle/{detalleId}` solo es válido si el detalle sigue en `pendiente_revision` o `corregido`; si no, responde `409`.
- El esquema de respuesta de la IA se fuerza vía structured outputs/function calling — nunca se parsea texto libre; si el proveedor no cumple el esquema, se trata como error `502` (`AIProviderException`) y la captura queda `pendiente_revision`.

## Permissions

Catálogo sembrado (`PermissionSeeder`): `captura-ia.usar`, `captura-ia.revisar`, `captura-ia.confirmar`. **No aplicados todavía** a nivel de middleware/ruta — hoy basta con estar autenticado y pertenecer a una empresa (`auth:api` + `tenant`) para usar cualquier endpoint de este módulo. La aplicación real de estos tres permisos específicos es trabajo del Módulo 3 (Authorization/RBAC), pendiente.

## Loading States

- `ai-processing-state.tsx`: pantalla/estado dedicado mientras el backend procesa la captura (llamada síncrona; hoy no hay polling porque el pipeline no es asíncrono — ver "Future Improvements").
- Grabación de voz: `voice-wave.tsx` da feedback visual en tiempo real durante la captura de audio (antes de enviar).

## Empty States

- Cola de revisión sin capturas pendientes: pantalla debe mostrar un estado vacío (componente reutilizable `components/empty-state.tsx`); comportamiento exacto de copy a confirmar contra la UI real en QA.
- `GET /api/v1/captura-ia` sin resultados: lista paginada vacía.

## Error States

- `AIProviderException` → `502` (fallo del proveedor de IA; captura queda `pendiente_revision`).
- `StockInsuficienteException` / `CapturaIAEstadoInvalidoException` → `409`.
- Validación de request → `422`.
- Reintento con la misma `Idempotency-Key` → no es un error: devuelve `200` con la captura ya procesada, sin volver a llamar a la IA ni guardar archivos duplicados.
- Todos los errores siguen el formato estándar de `04_TECHNICAL_SPEC/API.md` (`ApiResponse`), nunca una excepción cruda de Laravel.

## Business Rules

- **Nunca inventar**: bajo el umbral de confianza (0.85, configurable por empresa a futuro), el detalle queda pendiente de revisión humana; no se crea ni actualiza stock automáticamente.
- **Propiedad exclusiva del stock**: `stock_actual` en `productos` solo lo modifica `InventoryService::registrarMovimiento()`. Ningún componente de Captura IA escribe stock directamente.
- **Deduplicación**: N detecciones del mismo producto (mismo name+brand+presentation) dentro de una misma captura generan un único producto y un único movimiento con la cantidad sumada — nunca un registro por unidad física detectada.
- **Idempotencia**: header `Idempotency-Key` opcional; con la misma clave + `empresa_id`, un reintento no vuelve a tocar inventario ni a llamar al proveedor de IA.
- **Transaccionalidad**: todo el pipeline de escritura de una captura corre en una única transacción; si algo falla a mitad de una captura con varios productos, todo se revierte — nunca queda un producto o movimiento a medias.
- **Confirmar no revalida el umbral**: `POST .../confirmar` aplica todo lo pendiente/corregido sin volver a evaluar `confidence`, porque un humano ya lo revisó.
- **Descartar no hace rollback**: lo que ya se había aplicado automáticamente antes de descartar permanece; solo se descarta lo pendiente/corregido.
- **Auditoría obligatoria**: cada llamada a `CapturaIAService::procesar()` termina escribiendo exactamente un `AuditLog` inmutable (tipo, proveedor, confianza, tiempo de procesamiento, usuario, empresa, IP, user agent, resultado).

## Acceptance Criteria

- [x] Captura por foto de un solo producto se aplica automáticamente si `confidence >= 0.85`.
- [x] Captura con confianza baja queda en `pendiente_revision` y no toca `productos`/`movimientos`.
- [x] Una imagen con varios productos genera un `capturas_ia_detalle` por producto distinto.
- [x] Reintentar la misma request con la misma `Idempotency-Key` no duplica producto ni movimiento.
- [x] Un fallo a mitad de una captura de dos productos revierte ambos (probado con fallo forzado).
- [x] `PATCH .../detalle/{detalleId}` sobre un detalle ya `aplicado` responde `409`.
- [x] Cada captura procesada genera exactamente un `AuditLog`.

## Edge Cases

- Captura con productos que superan el umbral y productos que no, en la misma imagen: el estado de la captura completa refleja el peor caso (`parcial` si al menos un detalle quedó pendiente).
- Dos requests simultáneas con la misma `Idempotency-Key`: la segunda pierde la carrera contra el índice único `(empresa_id, idempotency_key)`, hace rollback de lo que alcanzó a escribir, y `CapturaIAService` recupera y devuelve la captura que sí ganó.
- Proveedor de IA devuelve un objeto suelto en vez de un arreglo en `products`: se envuelve automáticamente en un arreglo de un elemento (`StructuredExtractionDTO::fromArray()`).
- Usuario sin `empresa_id` (Platform Super Admin) intenta capturar: rechazado explícitamente (`AuthorizationException`, "Esta acción requiere pertenecer a una empresa").

## Future Improvements

- Procesamiento asíncrono real: `App\Jobs\ProcesarCapturaIAJob` ya existe y es queueable, pero el Controller todavía lo invoca de forma síncrona. Pasar a async requiere un worker activo, `QUEUE_CONNECTION` real, y que el frontend haga poll sobre `GET .../{uuid}` mientras el estado es `procesando`.
- Aplicar los permisos `captura-ia.usar`/`.revisar`/`.confirmar` a nivel de middleware una vez se construya el Módulo 3 (Authorization/RBAC) — hoy solo se exige sesión + tenant.
- Umbral de confianza configurable por empresa vía tabla `configuraciones` (mencionado en el diseño original, no confirmado como implementado — a verificar).
- Extensibilidad futura ya contemplada en las interfaces reservadas (`BarcodeDecoderInterface`, `QRDecoderInterface`, `OCRExtractorInterface`, `DocumentParserInterface`, `VideoFrameExtractorInterface`) — no implementadas, solo el contrato queda referenciado para no romper el patrón cuando se construyan.
- Listeners de dominio: los eventos (`ProductCreated`, `StockUpdated`, `InventoryMovementRegistered`, `AICaptureCompleted`) ya se disparan tras cada commit, pero deliberadamente no tienen listeners todavía (alertas de stock, notificaciones en tiempo real, sincronización externa quedan como trabajo futuro).
