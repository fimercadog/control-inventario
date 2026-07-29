# ADR-005: `AIProviderInterface` como abstracción sobre el proveedor de IA (implementación actual: OpenAI)

## Estado
Accepted (Verified) para la decisión de construir una abstracción. **Pending Validation** para la sub-decisión de por qué OpenAI específicamente fue el proveedor inicial (ver "Información Faltante").

## Fecha
No verificable con fecha exacta (ver ADR-001). Proxy: migraciones del módulo Captura IA, `2026-07-28`.

## Contexto
Captura IA depende de un proveedor externo de IA para analizar imágenes, transcribir audio y extraer datos estructurados. El proyecto anticipa que ese proveedor pueda cambiar o coexistir con otros (Claude, Gemini, Ollama, OpenRouter se mencionan explícitamente como candidatos futuros).

## Problema
¿Cómo evitar que Controllers, Services y Strategies de Captura IA queden acoplados a la SDK/API específica de un proveedor de IA concreto?

## Alternativas evaluadas
**Para la decisión de abstraer (documentada):** la alternativa implícita descartada es instanciar el SDK de OpenAI directamente dentro de las Strategies o Services de Captura IA. Está descartada explícitamente por la fuente citada abajo ("Ninguna clase de Captura IA instancia ni conoce OpenAI... directamente").

**Para la elección de OpenAI como proveedor inicial (NO documentada):** no se encontró ninguna fuente que explique por qué se eligió OpenAI en particular sobre Claude, Gemini u otro proveedor como implementación inicial — solo se documenta que la abstracción permite cambiarlo después.

## Decisión
Toda la Captura IA depende de una única interfaz, `App\Contracts\AI\AIProviderInterface` (`analyzeImage()`, `transcribeAudio()`, `extractStructured()`, `name()`). Ninguna `CaptureStrategy` conoce OpenAI ni ningún otro proveedor directamente. `OpenAIProvider` es la implementación actual, compuesta de tres colaboradores internos detrás de sus propias interfaces (`VisionAnalyzerInterface`, `SpeechTranscriberInterface`, `StructuredExtractorInterface`).

**Fuentes verificadas:**
- `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md`, línea 5125: *"Bajo Acoplamiento — Captura IA (Controllers, Services, Strategies) consume un único `AIProviderInterface`. Ninguna clase de Captura IA instancia ni conoce OpenAI, Claude, Gemini, Ollama u OpenRouter directamente."*
- `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md`, línea 5139: *"Toda la captura IA depende de una única interfaz, `App\Contracts\AI\AIProviderInterface`, con tres métodos: `analyzeImage()`, `transcribeAudio()`, `extractStructured()`, más `name()` para trazabilidad."*
- `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md`, línea 5141: *"`OpenAIProvider` es la implementación actual: compone tres colaboradores internos (`VisionAnalyzerInterface`, `SpeechTranscriberInterface`, `StructuredExtractorInterface`...)."*
- `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md`, línea 5651 (§74, punto 7, verificado por inspección de tests): *"Multi-proveedor de IA a futuro — confirmado: los tests ya vinculan `AIProviderInterface` a una implementación completamente distinta (`FakeAIProvider`, ni siquiera relacionada con OpenAI) sin tocar Strategies, Controllers ni Services."*

## Consecuencias
- Sustituir OpenAI por otro proveedor es, según la fuente citada, cambiar un binding en `AppServiceProvider` sin tocar Strategies, Controllers ni Actions — verificado en tests reales con `FakeAIProvider`.
- Dependencia actual real de un único proveedor (OpenAI) en producción; la interfaz reduce el costo de cambiarlo, pero no elimina el riesgo de que el esquema JSON forzado (`CaptureJsonSchema`) esté implícitamente diseñado alrededor de las capacidades de OpenAI (structured outputs/function calling).

## Impacto
Medio — acotado al módulo Captura IA; no bloquea otros módulos, pero es el patrón de referencia para cualquier integración externa futura.

## Referencias
- `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` §74 (líneas 5125–5651 aprox.)
- `docs/04_TECHNICAL_SPEC/Integrations.md`
- Código: `backend/app/Contracts/AI/AIProviderInterface.php`, `backend/app/Services/AI/*`

## Estado de implementación
Implementado y verificado en código y en tests (`FakeAIProvider` vinculado en tests sin tocar Strategies/Controllers/Services).

## Información Faltante
No se documentó por qué OpenAI fue el proveedor elegido para la implementación inicial (costo, capacidades de structured outputs, disponibilidad, decisión de producto) — solo se documentó la arquitectura que permite reemplazarlo. Esta sub-decisión queda marcada como no verificable con las fuentes disponibles; no se reconstruye por inferencia.

## Decision Provenance

**Verified From**
- Código: `backend/app/Contracts/AI/AIProviderInterface.php`, `backend/app/Services/AI/OpenAIProvider.php` y colaboradores (`VisionAnalyzerInterface`, `SpeechTranscriberInterface`, `StructuredExtractorInterface`); tests con `FakeAIProvider` vinculado sin tocar Strategies/Controllers/Services.
- Documentación: `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` §74 (líneas 5125, 5139, 5141, 5651); `docs/04_TECHNICAL_SPEC/Integrations.md`.
- AGENTS.md: no menciona el proveedor de IA específicamente; respalda el principio general de interface-first/bajo acoplamiento en el que se apoya esta abstracción.

**Not Verifiable**
- Motivo de seleccionar OpenAI como primer proveedor (costo, capacidades, disponibilidad, u otra razón de producto) — ninguna fuente disponible lo registra.

**Pending Historical Validation**
Este apartado deberá completarse únicamente si en el futuro aparece evidencia documental o histórica (por ejemplo, una nota de decisión, un hilo de conversación registrado, o confirmación directa del autor original) que explique por qué OpenAI fue el proveedor inicial. Hasta entonces, permanece vacío — no se rellena con una justificación plausible.
