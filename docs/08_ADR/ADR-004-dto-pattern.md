# ADR-004: DTOs como contrato entre capas (proveedor de IA ↔ dominio ↔ API)

## Estado
Accepted (Verified)

## Fecha
No verificable con fecha exacta (ver ADR-001). Proxy: migraciones del módulo Captura IA, `2026-07-28`.

## Contexto
El resultado de un proveedor de IA (detección de productos en foto/audio), el modelo de dominio interno, y el contrato HTTP expuesto a la API necesitan un vocabulario común sin acoplar las tres capas entre sí ni duplicar definiciones.

## Problema
¿Cómo pasar datos entre `AIProviderInterface`, los Services de dominio, y las respuestas HTTP sin que cada capa dependa de la estructura interna de la otra?

## Alternativas evaluadas
No documentadas como comparación. La alternativa implícita descartada (arrays asociativos sin tipo, o exponer directamente el modelo Eloquent en la respuesta HTTP) no aparece mencionada ni evaluada en ninguna fuente disponible.

## Decisión
Usar DTOs dedicados para cada frontera de capa: `StructuredExtractionDTO`/`AIExtractionResultDTO` (proveedor de IA → dominio) y `DetectedProductDTO` (dominio → persistencia/API), evitando mantener dos vocabularios distintos entre el contrato de IA y el contrato HTTP.

**Fuentes verificadas:**
- `AGENTS.md` §"Architecture Principles": *"DTO Pattern"* listado explícitamente entre los principios obligatorios.
- `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md`, línea 5178: *"Este mismo esquema (`name`, `brand`, `presentation`, `category`, `quantity`, `unit`, `confidence`) es el que usa `DetectedProductDTO` internamente y el que expone la API REST (...), para no mantener dos vocabularios distintos entre el contrato de IA y el contrato HTTP."*
- `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md`, línea 5735 (§74, ajuste arquitectónico 3 de Fase 3): *"`StructuredExtractionDTO`/`AIExtractionResultDTO` reutilizables por cualquier proveedor, esquema JSON fuera de las Strategies."*
- `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md`, línea 5325: *"`Repositories/CapturaIARepository` — persistencia de la captura y su detalle, y el mapeo DTO (inglés) ↔ columnas (español), para trazabilidad y reentrenamiento futuro."*

## Consecuencias
- El mapeo DTO ↔ columna vive únicamente en `CapturaIARepository` — un solo lugar responsable de traducir entre el vocabulario en inglés de los DTOs y las columnas en español de la base de datos.
- Sustituir OpenAI por otro proveedor no requiere cambiar el contrato HTTP, porque el DTO intermedio ya desacopla ambos lados (consecuencia directa, verificada: los tests usan `FakeAIProvider` sin tocar el contrato de API).
- Costo: una clase DTO adicional por cada frontera de datos nueva.

## Impacto
Medio-Alto — afecta el contrato entre el proveedor de IA, el dominio y la API; cualquier módulo futuro que integre un servicio externo debería seguir el mismo patrón por consistencia, aunque esto no está exigido explícitamente fuera de Captura IA.

## Referencias
- `AGENTS.md`
- `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` (líneas 5178, 5325, 5735)
- `docs/04_TECHNICAL_SPEC/Backend.md`

## Estado de implementación
Implementado y verificado en código para Captura IA (`StructuredExtractionDTO`, `AIExtractionResultDTO`, `DetectedProductDTO`). No hay evidencia de que otros módulos (Auth) usen DTOs de la misma forma — Auth expone directamente Resources sobre el modelo `User`, según lo verificado en `docs/04_TECHNICAL_SPEC/API.md`.

## Información Faltante
No se documentó si se evaluó usar arrays tipados (`array{}` de PHPStan) o Value Objects en lugar de clases DTO `readonly`. No hay registro de por qué se eligió DTO específicamente sobre esas alternativas, más allá de que `AGENTS.md` lo exige como principio general.
