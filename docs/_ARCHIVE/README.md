# _ARCHIVE

Este directorio contiene documentación histórica que **ya no es la fuente de verdad**. Se conserva por trazabilidad, no como referencia activa de producto, arquitectura o alcance.

**Regla de uso:** ningún documento activo (`00_VISION`…`09_TEMPLATES`) debe enlazar a este directorio como si fuera especificación vigente. Si un futuro lector — humano o agente de IA — encuentra contenido aquí, debe asumir que fue **superado** por la documentación en las carpetas numeradas.

## Contenido

### `00_MASTER_SPECIFICATION_ORIGINAL.md`
El documento monolítico original (74 secciones, ~5,700 líneas) que precedió esta migración a Specification-Driven Development. Mezclaba especificación aspiracional pre-implementación con documentación real mantenida durante el desarrollo (§74 Captura IA era la sección más precisa).

Todo su contenido fue auditado, dividido y redistribuido durante la migración SDD (ver `../SDD_MIGRATION_PLAN.md`):

- Visión, objetivos, reglas de negocio → `00_VISION/`, `01_PRD/`
- Requisitos funcionales/no funcionales → `02_REQUIREMENTS/` (reconciliados contra el código real: cada RF quedó marcado `[BUILT]` o `[PLANNED]`)
- Especificaciones de pantallas/módulos → `03_FUNCTIONAL_SPEC/` (reescritas para reflejar lo realmente construido; los módulos nunca construidos —Compras, Proveedores, Ventas, Clientes, Kardex, Reportes— se mantuvieron como **specs futuras**, no se descartaron, por decisión explícita del producto)
- Arquitectura, base de datos, API, frontend, seguridad, integraciones, despliegue, estándares, glosario → `04_TECHNICAL_SPEC/`
- Principios de arquitectura empresarial (§73) → `08_ADR/` (ADR-001 a ADR-004)
- Testing/CI-CD (§66-67) → `06_TESTS/` (reescrito: el borrador original no coincidía con la suite real de 94 tests, y no existe pipeline CI/CD)
- Roadmap original (§69) → superado por `00_VISION/Roadmap.md`, que refleja el historial real de fases

**No usar este archivo para tomar decisiones de implementación.** Cualquier sección que describa Compras/Ventas/Proveedores/Clientes/Kardex/Reportes como si ya existieran es incorrecta respecto al estado real del código — para el estado vigente de esos módulos (planeados, no construidos), ver `03_FUNCTIONAL_SPEC/FUTURE/Purchases.md`, `03_FUNCTIONAL_SPEC/FUTURE/Suppliers.md`, `03_FUNCTIONAL_SPEC/FUTURE/Sales.md`, `03_FUNCTIONAL_SPEC/FUTURE/Customers.md`, `03_FUNCTIONAL_SPEC/FUTURE/Kardex.md`, `03_FUNCTIONAL_SPEC/FUTURE/Reports.md`.

### `EMPTY_01_PRODUCT_VISION.md`, `EMPTY_02_REQUIREMENTS.md`, `EMPTY_03_USER_STORIES.md`
Scaffolds vacíos (solo encabezados y placeholders literales como "RF-001", "US-001") que nunca se llenaron. Reemplazados por contenido real y completo en `01_PRD/` y `02_REQUIREMENTS/`.

### `EMPTY_07_FRONTEND_DRAFT.md`
Borrador de 22 líneas, nunca desarrollado. Reemplazado por `04_TECHNICAL_SPEC/Frontend.md`, que documenta la estructura real de `frontend/`.
