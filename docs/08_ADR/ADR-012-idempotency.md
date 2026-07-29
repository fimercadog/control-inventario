# ADR-012: Idempotencia opt-in vía header `Idempotency-Key` + índice único `(empresa_id, idempotency_key)`

## Estado
Accepted (Verified) — el caso mejor documentado junto con ADR-002 y ADR-013.

## Fecha
No verificable con fecha exacta (ver ADR-001). Corresponde a la "revisión final de arquitectura" de Fase 3 de Captura IA, posterior a la construcción inicial del módulo pero sin fecha propia registrada. Proxy: migraciones de Captura IA, `2026-07-28`.

## Contexto
Un reintento de red, de navegador o de app móvil sobre `POST .../foto`, `.../voz` o `.../foto-voz` no debe volver a tocar inventario (crear productos/movimientos duplicados) ni volver a llamar al proveedor de IA innecesariamente.

## Problema
¿Cómo proteger los endpoints de creación de Captura IA contra reintentos duplicados, sin forzar a todos los clientes a implementar esta protección?

## Alternativas evaluadas
No documentadas como comparación explícita de otras estrategias de idempotencia (por ejemplo, deduplicación por hash del contenido subido, o ventanas de tiempo). Se documenta el mecanismo elegido y su justificación funcional, no una comparación con alternativas descartadas.

## Decisión
Protección opt-in vía header `Idempotency-Key` opcional. El Controller busca primero una `capturas_ia` existente con la misma `(empresa_id, idempotency_key)` — si existe, la devuelve tal cual (`200`, no `201`) sin volver a guardar archivos ni llamar a la IA. `CapturaIAService::procesar()` repite el mismo chequeo (defensa en profundidad). La columna `idempotency_key` tiene un índice único `(empresa_id, idempotency_key)`; si dos requests con la misma clave llegan a la vez, la segunda falla ese índice, revierte por completo (rollback), y el servicio recupera y devuelve la captura que ganó la carrera (`IdempotencyConflictException`, capturada internamente).

**Fuentes verificadas (todas de `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md`, §74 "Idempotencia", líneas 5604–5612):**
- Línea 5606: *"Un reintento de red, de navegador o de app móvil no debe volver a tocar inventario. Protección: header `Idempotency-Key` (opcional) en `POST .../foto`, `.../voz` y `.../foto-voz`."*
- Línea 5608: *"Flujo: el Controller busca primero una `capturas_ia` existente con la misma `(empresa_id, idempotency_key)` (...). `CapturaIAService::procesar()` repite el mismo chequeo antes de invocar al proveedor (defensa en profundidad (...)). La columna `idempotency_key` en `capturas_ia` tiene un índice único `(empresa_id, idempotency_key)`; si dos requests con la misma clave llegan a la vez, la segunda falla ese índice, hace rollback completo (...), y `CapturaIAService` recupera y devuelve la captura que sí ganó la carrera (`IdempotencyConflictException`...)."*
- Línea 5610: *"Sin `Idempotency-Key`, la request se procesa siempre sin protección (...) — es opt-in; un cliente mobile/web debe generar una clave por acción lógica del usuario."*
- Línea 5612: *"`confirmar()`/`descartar()` no necesitan esta protección: ya son idempotentes por diseño."*
- Línea 5648 (verificación reportada): *"Idempotencia — implementada (ver arriba). Probada con reintento HTTP real (`Idempotency-Key`) y con dos llamadas directas a `CapturaIAService::procesar()`."*

## Consecuencias
- Un cliente que no envía `Idempotency-Key` no tiene protección (comportamiento por defecto sin cambios) — la responsabilidad de generar y reenviar la clave recae en el cliente.
- El chequeo duplicado (Controller y Service) es defensa en profundidad deliberada, no redundancia accidental.
- El índice único a nivel de base de datos es lo que realmente garantiza la propiedad (no la lógica de aplicación por sí sola), lo cual es correcto ante condiciones de carrera reales.

## Impacto
Medio-Alto — protege contra un modo de fallo real y común (reintentos de red/UI) en el único módulo de negocio completo del sistema.

## Referencias
- `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` §74 (líneas 5604–5648)
- `docs/03_FUNCTIONAL_SPEC/AI_Capture.md`
- `docs/05_IMPLEMENTATION/AI_Capture.md`

## Estado de implementación
Implementado y verificado en código: columna `idempotency_key` en `capturas_ia`, `IdempotencyConflictException` dedicada. Verificado con tests según la fuente citada (línea 5648).

## Información Faltante
No se documentó si se evaluaron estrategias alternativas (deduplicación por hash de contenido, ventana temporal de deduplicación automática sin header explícito) antes de elegir el mecanismo de `Idempotency-Key` opt-in. Se documenta el mecanismo implementado y su justificación funcional, no un proceso de comparación formal.
