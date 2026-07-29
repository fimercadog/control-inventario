# Changelog

Formato libre, orden cronológico inverso (más reciente arriba). Referenciado por `docs/DefinitionOfDone.md` y `docs/ReleaseWorkflow.md` — toda entrada de release debe tener una línea aquí.

## [Unreleased]

### Documentación
- **Migración completa a Specification-Driven Development (SDD).** El repositorio pasa de un `docs/00_MASTER_SPECIFICATION.md` monolítico (74 secciones, mezcla de spec aspiracional pre-implementación y documentación real) a la estructura `00_VISION/` … `09_TEMPLATES/` + `_ARCHIVE/`.
  - Todo el contenido fue auditado, reconciliado contra el código real y redistribuido — ver `docs/SDD_MIGRATION_PLAN.md` para el detalle completo de la auditoría y mapeo.
  - Cada requisito funcional y cada spec de módulo quedó marcado `[BUILT]` o `[PLANNED]` según evidencia verificada en `backend/` y `frontend/`, no según lo que el borrador original asumía.
  - Los módulos nunca construidos (Compras, Proveedores, Ventas, Clientes, Kardex, Reportes) se mantienen como specs futuras en `03_FUNCTIONAL_SPEC/`, no se descartaron — decisión explícita del producto.
  - Se crearon 13 ADRs (`08_ADR/`) documentando decisiones arquitectónicas que antes solo existían de forma narrativa o implícita en el código.
  - Se crearon 7 plantillas reutilizables (`09_TEMPLATES/`) derivadas de los documentos reales ya escritos.
  - `AGENTS.md` se mantiene en la raíz como constitución corta; el detalle de Definition of Ready/Done y los distintos workflows se extrajo a `docs/DefinitionOfReady.md`, `docs/DefinitionOfDone.md`, `docs/DevelopmentWorkflow.md`, `docs/DocumentationWorkflow.md`, `docs/ArchitectureWorkflow.md`, `docs/ReleaseWorkflow.md`.
  - Brechas reales detectadas y documentadas explícitamente (no ocultadas): sin tests automatizados de frontend, sin pipeline CI/CD, sin auditoría de accesibilidad, sin pruebas de rendimiento ejecutadas, sin rollback probado en la práctica.

### Sin cambios de código
Esta migración es exclusivamente documental. No se modificó `backend/` ni `frontend/`.

---

*Entradas anteriores a esta migración no fueron registradas en este archivo porque no existía. El historial de fases (Captura IA, Auth Módulos 0–2) está documentado retroactivamente en `docs/05_IMPLEMENTATION/` y `docs/00_VISION/Roadmap.md`.*
