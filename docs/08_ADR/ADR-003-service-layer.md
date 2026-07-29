# ADR-003: Service Layer como orquestador único de lógica de negocio

## Estado
Accepted (Verified)

## Fecha
No verificable con fecha exacta (ver ADR-001). Proxy: migraciones del módulo Captura IA, `2026-07-28`.

## Contexto
La lógica de negocio de Captura IA (matching de productos, dirección de movimientos de stock, orquestación del pipeline de IA) necesita un lugar único donde vivir, separado de los Controllers HTTP y de los Repositories de acceso a datos.

## Problema
¿Dónde debe vivir la lógica que decide, por ejemplo, si un producto detectado por IA coincide con uno existente, o cómo se actualiza el stock tras un movimiento?

## Alternativas evaluadas
No documentadas explícitamente como comparación. `AGENTS.md` prohíbe las alternativas obvias (lógica en Controllers o en componentes de React) de forma directa, sin registrar que se hayan probado o descartado en la práctica.

## Decisión
Toda regla de negocio vive en una clase Service dedicada por responsabilidad (Alta Cohesión). Los Controllers solo orquestan HTTP → Service → Resource; nunca contienen reglas de negocio.

**Fuentes verificadas:**
- `AGENTS.md` §"Architecture Principles": *"Service Layer"* listado explícitamente; §"Frontend Rules": *"Business logic belongs in services."*
- `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md`, línea 5735 (§74, revisión de arquitectura de Fase 3): *"Captura IA sin reglas de negocio — matching movido a `ProductService::buscarCoincidencia()`, dirección de movimiento movida a `InventoryService::registrarMovimiento()`."* Esto confirma que hubo una refactorización deliberada para sacar lógica de negocio de Captura IA hacia Services de dominio.
- `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md`, línea 4658 (§73, principio 7 "Alta Cohesión"): ejemplos explícitos `PurchaseService` (solo compras), `InventoryService` (solo inventario), `DashboardService` (solo dashboard).
- `docs/04_TECHNICAL_SPEC/Backend.md`, línea 72: *"`CapturaIAService` — orquestador del pipeline de Captura IA; no contiene reglas de negocio de Productos/Inventario, solo coordina Strategy → Actions → Repository → AuditLogger."*

## Consecuencias
- Cada Service tiene una responsabilidad acotada (Alta Cohesión) — evita un "God Service" que conozca todo el dominio.
- Verificado en la práctica: hubo una refactorización real que movió lógica fuera de `CapturaIAService` hacia `ProductService`/`InventoryService` — es decir, el principio no solo se declaró, se aplicó correctivamente sobre código ya escrito.
- Riesgo (no verificado si ocurrió): que `CapturaIAService` vuelva a acumular lógica de dominio ajena si no se revisa en cada nueva feature de IA.

## Impacto
Alto — determina dónde debe ubicarse toda lógica de negocio nueva en el backend, para todos los módulos futuros.

## Referencias
- `AGENTS.md`
- `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` §73 (línea 4658) y §74 (línea 5735)
- `docs/04_TECHNICAL_SPEC/Backend.md`

## Estado de implementación
Implementado y verificado en código: `ProductService::buscarCoincidencia()`, `InventoryService::registrarMovimiento()`, `CapturaIAService` (orquestador, sin lógica de dominio ajena).

## Información Faltante
No hay registro de alternativas evaluadas antes de refactorizar (por ejemplo, si se consideró dejar la lógica en `CapturaIAService` de forma permanente). Se documenta el resultado de la refactorización, no el proceso de decisión que la motivó más allá de "sin reglas de negocio" como objetivo declarado.
