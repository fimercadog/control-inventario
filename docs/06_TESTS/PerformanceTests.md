# Tests de Performance

## Estado actual

**Gap real. Ningún test de performance/carga existe ni se ha ejecutado nunca sobre este sistema**, ni en backend ni en frontend. Este documento es un plan mínimo propuesto, no un reporte de resultados — no se debe leer como si algo aquí ya se hubiera medido.

## Por qué importa especialmente aquí

El endpoint más costoso del sistema es, por lejos, el pipeline de Captura IA (`POST /captura-ia/{foto,voz,foto-voz}`): sube un archivo, lo persiste, y hace una o más llamadas de red a OpenAI (Vision + Responses API, o Speech to Text) antes de responder. Hoy el procesamiento es **síncrono** — el Job queueable (`ProcesarCapturaIAJob`) existe pero no está activo — así que la latencia de OpenAI se traduce directamente en latencia de la API. No hay ningún dato real sobre cuánto tarda esto bajo carga.

## Plan mínimo propuesto (no ejecutado)

### Backend

1. **Latencia del pipeline de Captura IA bajo carga simulada.** Medir tiempo de respuesta de `POST /captura-ia/foto` con el proveedor de IA mockeado a una latencia fija (ej. 2s), bajo distintas concurrencias (1, 10, 50 requests simultáneas). Objetivo: entender si el servidor Laravel (`php artisan serve`, sin ajuste de workers) se satura antes que el proveedor de IA.
2. **Tiempo de respuesta de los endpoints de solo-lectura de Captura IA** (`index`, `show`) con un volumen realista de capturas por empresa (ej. 1,000, 10,000 registros) — verificar que la paginación no degrada linealmente sin límite.
3. **Comportamiento bajo timeout del proveedor de IA.** Verificar que `OPENAI_TIMEOUT` (30s por defecto, `DEMO.md`) efectivamente corta la espera y no dejan requests colgadas indefinidamente.
4. **Tamaño máximo de archivo aceptado** (imagen/audio) y su efecto en tiempo de subida — hoy sin límite documentado explícitamente en código, más allá de las validaciones de los FormRequests.

### Frontend

1. **Tiempo de carga inicial** del Dashboard y de la pantalla de Captura IA (Lighthouse/Web Vitals) — nunca medido.
2. **Comportamiento de `CameraCapture`/`AudioRecorder`** en dispositivos de gama baja — nunca probado fuera del navegador de desarrollo.

### Herramientas sugeridas (no instaladas todavía)

- Backend: `k6` o `Apache Bench` contra endpoints con el proveedor de IA mockeado (nunca contra OpenAI real, por costo y por no meter variabilidad de red externa en la medición).
- Frontend: Lighthouse CI.

## Qué NO se debe hacer

No ejecutar pruebas de carga contra la API real de OpenAI — cuesta dinero y mide la latencia de un tercero, no la del sistema propio. Cualquier prueba de carga del pipeline de Captura IA debe mockear `AIProviderInterface` (como ya hacen los tests funcionales, vía `FakeAIProvider`).

## Definition of Done de este documento

Este documento cumple su propósito (existir y ser honesto sobre el gap) pero **no** cumple la Definition of Done de "performance verificada" — eso requiere ejecutar el plan de arriba, medir, y reemplazar esta sección por resultados reales con fecha y ambiente de medición.
