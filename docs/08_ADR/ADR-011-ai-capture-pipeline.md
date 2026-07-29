# ADR-011: Captura IA como capa de entrada de datos, nunca fuente paralela de verdad

## Estado
Accepted (Verified)

## Fecha
No verificable con fecha exacta (ver ADR-001). Proxy verificable: migraciones `2026_07_28_015313_create_capturas_ia_table.php` y `2026_07_28_015314_create_capturas_ia_detalle_table.php`.

## Contexto
Captura IA permite registrar productos/movimientos a partir de foto, voz o foto+voz, usando un proveedor de IA para extraer datos estructurados. El sistema necesita decidir si esos datos extraídos se tratan como una fuente de verdad paralela, o si terminan escribiendo en las mismas tablas (`productos`, `movimientos`) que cualquier otro flujo del sistema.

## Problema
¿Cómo integrar un pipeline de IA (con incertidumbre inherente: confianza, revisión humana) sin crear un modelo de datos paralelo al resto del sistema (Single Source of Truth)?

## Alternativas evaluadas
No documentadas como comparación explícita. La alternativa implícita descartada (que `capturas_ia`/`capturas_ia_detalle` fueran la fuente de verdad del inventario, en vez de un registro de auditoría de la captura) está descartada por el principio "Single Source of Truth" del master spec §73 y por el diseño verificado: el pipeline termina escribiendo en `productos`/`movimientos` a través de `ProductService`/`InventoryService` (ver ADR-003).

## Decisión
Captura IA es una capa de entrada: el proveedor de IA extrae datos → el usuario revisa/corrige (`pendiente_revision`/`corregido`) → al confirmar, `ProductService`/`InventoryService` aplican el resultado a las tablas de dominio reales (`productos`, `movimientos`) dentro de una única transacción. `capturas_ia`/`capturas_ia_detalle` quedan como registro histórico/de auditoría de la captura, no como fuente de verdad del inventario.

**Fuentes verificadas:**
- `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md`, línea 4726 (§73, principio 1 "Single Source of Truth"): *"Toda información tendrá una única fuente oficial (...). No se permitirá duplicar información."*
- `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md`, línea 5618 (§74, "Transacciones"): *"Todo el pipeline de escritura de una captura corre dentro de una única transacción (...): creación de producto, creación de movimiento, actualización de `stock_actual`, persistencia de `capturas_ia`/`capturas_ia_detalle`, y el `AuditLog`. Si cualquiera falla (...) todo se revierte."*
- `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md`, línea 5735 (Fase 3, ajuste 1): *"Captura IA sin reglas de negocio — matching movido a `ProductService::buscarCoincidencia()`, dirección de movimiento movida a `InventoryService::registrarMovimiento()`."*
- `docs/03_FUNCTIONAL_SPEC/AI_Capture.md` (spec funcional del módulo, ya verificada contra el código real por otro agente de esta misma migración).

## Consecuencias
- No hay dos "verdades" de inventario que puedan divergir (una vía Captura IA, otra vía flujo manual) — ambas terminan en las mismas tablas de dominio.
- El estado `pendiente_revision`/`corregido` en `capturas_ia_detalle` funciona como una cola de revisión humana antes de que el dato "cuente" como inventario real.
- Costo: la transacción única que cubre creación de producto + movimiento + captura + auditoría es más compleja de razonar (y de testear) que escrituras independientes, pero es lo que garantiza atomicidad ante un fallo a mitad de captura.

## Impacto
Alto — es el único módulo de negocio completo del sistema; su diseño de "capa de entrada, no fuente paralela" es el precedente que cualquier módulo futuro con entrada asistida por IA debería seguir, aunque esto no está exigido explícitamente fuera de Captura IA.

## Referencias
- `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` §73 (línea 4726) y §74 (líneas 5618, 5735)
- `docs/03_FUNCTIONAL_SPEC/AI_Capture.md`
- `docs/05_IMPLEMENTATION/AI_Capture.md`

## Estado de implementación
Implementado y verificado en código y tests, según `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` línea 5749: *"Backend completo y revisado (Fases 1-3 + revisión final de arquitectura: idempotencia, transacciones, eventos de dominio)."* 35 tests reportados (23 unitarios + 12 de integración HTTP) según la misma fuente, línea 5735.

## Información Faltante
No se documentó si se evaluó un modelo alternativo donde Captura IA mantuviera su propio inventario "sugerido" separado del inventario confirmado, en vez de escribir directamente sobre `productos`/`movimientos` tras la revisión. Se documenta la decisión tomada (capa de entrada única), no un proceso de comparación de diseños alternativos.
