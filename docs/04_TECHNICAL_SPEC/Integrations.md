# Integrations — Technical Spec

> Fuente: master spec §65 (Integraciones, aspiracional) + implementación real verificada en `backend/app/Contracts/AI/*`, `backend/app/Services/AI/*`, `backend/app/Providers/AppServiceProvider.php`.

## 1. Principio rector

"Toda integración será desacoplada mediante Services. Nunca desde Controllers." (master spec §65). Verificado en código: `CapturaIAController` nunca conoce `OpenAIProvider` — solo `CapturaIAService`, que a su vez solo conoce `AIProviderInterface` a través de una `CaptureStrategy`.

## 2. Integración real: proveedor de IA (Captura IA)

### 2.1 Abstracción — `App\Contracts\AI\AIProviderInterface`

Único contrato entre Captura IA y cualquier proveedor externo. Tres métodos: `analyzeImage(string $imagePath): AIExtractionResultDTO`, `transcribeAudio(string $audioPath): string`, `extractStructured(string $text, array $productosContexto = []): AIExtractionResultDTO`, más `name(): string` para trazabilidad (queda en `capturas_ia.proveedor_ia` y en el `AuditLog`).

Ninguna `CaptureStrategy` (`PhotoCaptureStrategy`, `VoiceCaptureStrategy`, `CombinedCaptureStrategy`) conoce OpenAI, Claude, Gemini, Ollama u OpenRouter directamente — cambiar de proveedor es cambiar un binding en `AppServiceProvider::register()`:

```php
$this->app->bind(AIProviderInterface::class, OpenAIProvider::class);
```

### 2.2 Implementación actual — `OpenAIProvider`

Única implementación real hoy. Compone tres colaboradores internos, cada uno detrás de su propia interfaz (por si en el futuro conviene mezclar proveedores a ese nivel — p. ej. Whisper de OpenAI para voz + un modelo de visión distinto):

- `VisionAnalyzerInterface` → `OpenAIVisionService` (análisis de imagen)
- `SpeechTranscriberInterface` → `OpenAISpeechService` (Whisper, transcripción)
- `StructuredExtractorInterface` → `OpenAIResponsesService` (extracción estructurada de texto)

`OpenAIProvider` mide el tiempo de cada llamada (`microtime(true)`) y siempre devuelve `AIExtractionResultDTO { data: StructuredExtractionDTO, provider, processingTimeMs }` — nunca expone la respuesta cruda de OpenAI a capas superiores.

### 2.3 Contrato de datos provider-agnostic

`StructuredExtractionDTO { products: DetectedProductDTO[], movement: string, transcript: ?string }` es la forma que **cualquier** proveedor futuro debe devolver. El esquema JSON forzado en las llamadas a OpenAI (`Services/AI/Support/CaptureJsonSchema.php`) es detalle interno de `Services/AI/*`, nunca hardcodeado en una `CaptureStrategy`. Ver `Database.md`/master spec §74 para el contrato completo `{name, brand, presentation, category, quantity, unit, confidence}`.

### 2.4 Configuración (`.env.example`)

```
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_VISION_MODEL=gpt-4o
OPENAI_SPEECH_MODEL=whisper-1
OPENAI_RESPONSES_MODEL=gpt-4o
OPENAI_TIMEOUT=30
CAPTURA_IA_CONFIDENCE_THRESHOLD=0.85
```

Ninguna clave ni modelo está hardcodeado en código (master spec §73, "Gestión de Configuración").

### 2.5 Manejo de errores del proveedor

Si el proveedor no puede cumplir el esquema forzado o falla la llamada, se lanza `AIProviderException` (mapeada a HTTP 502) y la captura queda en `pendiente_revision` — nunca se inventa un resultado ni se escribe stock especulativamente (master spec §74, "Nunca inventar").

Ver `docs/08_ADR/ADR-005-openai-provider-abstraction.md` para el razonamiento completo de esta abstracción.

## 3. Integraciones aspiracionales (master spec §65) — no implementadas

El master spec lista como "diseño preparado para integrar": WhatsApp, Telegram, Claude, Gemini, Google Drive, Google Sheets, correo transaccional genérico, SMS, Webhooks, ERP, CRM, Marketplace. **Ninguna de estas existe en el código hoy.** La única que tiene sustento real de "preparado para" es el propio proveedor de IA (Claude/Gemini/Ollama/OpenRouter son binding-compatibles con `AIProviderInterface`, aunque no se ha escrito ninguna implementación alternativa todavía).

Correo: existe `Notifications/Auth/ResetPasswordNotification.php` (notificación de Laravel, canal `mail`), que es infraestructura genérica de Laravel, no una "integración" en el sentido de una API de terceros nueva — se documenta aquí por completitud, no como evidencia de una integración de correo transaccional dedicada (SendGrid, SES, etc.); `.env.example` usa `MAIL_MAILER=log` en desarrollo.

## 4. Cuándo agregar una integración nueva

Siguiendo el patrón de `AIProviderInterface`: definir una interfaz en `app/Contracts/`, una implementación en `app/Services/`, un binding en `AppServiceProvider`, y consumirla solo desde un Service — nunca desde un Controller ni desde un componente de frontend directamente. Cualquier integración nueva que toque datos de negocio (Productos, Movimientos) debe seguir el mismo principio Single Source of Truth de Captura IA: escribir siempre a través de `ProductService`/`InventoryService`, nunca directamente a las tablas.
