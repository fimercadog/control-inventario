# Changelog

Formato libre, orden cronológico inverso (más reciente arriba). Referenciado por `docs/10_GOVERNANCE/DefinitionOfDone.md` y `docs/10_GOVERNANCE/ReleaseWorkflow.md` — toda entrada de release debe tener una línea aquí.

## [Unreleased]

### Feature — Módulo Unidades de Medida completo (RC1, 2026-07-30) — cierra Fase 1
- Implementación completa del módulo Unidades de Medida al mismo nivel funcional que Productos/Proveedores/Categorías/Marcas, reemplazando la página stub "pendiente de implementación". Con esto se cierra por completo la **Fase 1 (Catalog Normalization)** del roadmap RC1 de 8 fases.
- Backend: `UnidadMedidaController` (List/View/Create/Edit/Activar/Desactivar, borrado siempre lógico), reutilizando `UnidadMedida`/`UnidadMedidaPolicy`/`StoreUnidadMedidaRequest`/`UpdateUnidadMedidaRequest` ya existentes desde la Fase 1 de catálogos. Nuevo endpoint `GET /unidades-medida/{id}/productos` para la pestaña de relación.
- Frontend: listado con búsqueda por nombre/abreviatura, filtro de estado/badge de color, diálogo de creación (nombre + abreviatura), ficha con edición inline + pestaña "Productos" (relación bidireccional con Productos, verificada), Logical Delete/Activar-Desactivar con `ConfirmDialog`, refresco automático vía `useCrudList`.
- Integridad referencial: deshabilitar una unidad de medida nunca rompe `productos.unidad_medida_id` (verificado por test dedicado) — mismo principio ya aplicado a Categorías/Marcas/Proveedores.
- Tests: 13 casos nuevos en `UnidadMedidaControllerTest`, suite completa 179/179 en verde. Verificación real en navegador: CRUD completo, filtros, confirmación, relación con Productos (unidad "Kilogramo", 40 productos), responsive.
- Gap conocido y documentado, no cerrado por esta unidad: el formulario de creación/edición de Producto solo tiene un input de texto libre para Unidad de Medida (`unidad_medida_nuevo`, find-or-create), no un selector real de catálogo (ver `docs/03_FUNCTIONAL_SPEC/UnitsOfMeasure.md`) — mismo tipo de gap ya documentado para Categoría/Marca.

### Feature — Módulo Marcas completo (RC1, 2026-07-30)
- Implementación completa del módulo Marcas al mismo nivel funcional que Productos/Proveedores/Categorías, reemplazando la página stub "pendiente de implementación".
- Backend: `MarcaController` (List/View/Create/Edit/Activar/Desactivar, borrado siempre lógico), reutilizando `Marca`/`MarcaPolicy`/`StoreMarcaRequest`/`UpdateMarcaRequest` ya existentes desde la Fase 1 de catálogos. Nuevo endpoint `GET /marcas/{id}/productos` para la pestaña de relación.
- Frontend: listado con búsqueda/filtro de estado/badge de color, diálogo de creación, ficha con edición inline + pestaña "Productos" (relación bidireccional con Productos, verificada), Logical Delete/Activar-Desactivar con `ConfirmDialog`, refresco automático vía `useCrudList`.
- Integridad referencial: deshabilitar una marca nunca rompe `productos.marca_id` (verificado por test dedicado) — mismo principio ya aplicado a Categorías/Proveedores.
- Tests: 13 casos nuevos en `MarcaControllerTest`, suite completa 167/167 en verde. Verificación real en navegador: CRUD completo, filtros, confirmación, relación con Productos (marca "Orijen", 23 productos), responsive.
- Gap conocido y documentado, no cerrado por esta unidad: el formulario de creación/edición de Producto solo tiene un input de texto libre para Marca (`marca_nuevo`, find-or-create), no un selector real de catálogo (ver `docs/03_FUNCTIONAL_SPEC/Brands.md`).

### Feature — Módulo Categorías completo (RC1, 2026-07-30)
- Implementación completa del módulo Categorías al mismo nivel funcional que Productos/Proveedores, reemplazando la página stub "pendiente de implementación".
- Backend: `CategoriaController` (List/View/Create/Edit/Activar/Desactivar, borrado siempre lógico), reutilizando `Categoria`/`CategoriaPolicy`/`StoreCategoriaRequest`/`UpdateCategoriaRequest` ya existentes desde la Fase 1 de catálogos. Nuevo endpoint `GET /categorias/{id}/productos` para la pestaña de relación.
- Frontend: listado con búsqueda/filtro de estado/badge de color, diálogo de creación, ficha con edición inline + pestaña "Productos" (relación bidireccional con Productos, verificada), Logical Delete/Activar-Desactivar con `ConfirmDialog`, refresco automático vía `useCrudList`.
- Integridad referencial: deshabilitar una categoría nunca rompe `productos.categoria_id` (verificado por test dedicado) — mismo principio ya aplicado a Proveedores.
- Tests: 12 casos nuevos en `CategoriaControllerTest`, suite completa 155/155 en verde. Verificación real en navegador: CRUD completo, filtros, confirmación, relación con Productos, responsive.
- Gap conocido y documentado, no cerrado por esta unidad: el formulario de creación/edición de Producto todavía no tiene un selector de Categoría (ver `docs/03_FUNCTIONAL_SPEC/Categories.md`).

### Corrección — Módulo Productos: Logical Delete y badge de Estado (2026-07-30)
- **Productos era el único módulo construido sin Logical Delete ni columna Estado visible**, detectado por auditoría funcional (`docs/06_TESTS/DemoDataAudit.md`, `docs/03_FUNCTIONAL_SPEC/RC1_FUNCTIONAL_MODULE_AUDIT.md`). Corregido con el mismo patrón ya usado en Proveedores.
- Backend: `ProductoController::disable()`/`enable()` (borrado siempre lógico, nunca DELETE físico, auditado), filtro `estado` en `index()`.
- Frontend: columna Estado (badge verde/rojo) y filtro de Estado en `/productos`; acción Eliminar/Habilitar con confirmación obligatoria (`components/confirm-dialog.tsx`, nuevo componente reutilizable); refresco automático vía `hooks/use-crud-list.ts` (primer consumidor real de ese hook); mismo botón en la ficha de producto.
- Corrección adicional encontrada en el mismo trabajo: los formularios de Crear/Editar Producto seguían enviando `marca`/`unidad_medida` como texto libre — claves que el backend ya no acepta desde la normalización de catálogos (RC1 Fase 1) y descartaba en silencio. Corregido a `marca_nuevo`/`unidad_medida_nuevo`.
- Campo Stock ahora visible pero deshabilitado (mostrando 0 en creación, el valor real en edición) en ambos formularios — nunca se envía desde el frontend, el backend lo asigna/protege siempre.
- Tests: 22 casos en `ProductoControllerTest` (antes 17), suite completa 143/143 en verde. Verificación real en navegador de todo el flujo (badge, filtro, confirmación, refresco automático, campo Stock deshabilitado).

### Datos de prueba — Demo Data RC1 (2026-07-30)
- Factory por modelo implementado + seeder independiente por módulo, orquestados en `DatabaseSeeder` sobre dos empresas (una a volumen completo, otra al 15% para probar aislamiento multi-tenant con datos reales). Comando único: `php artisan migrate:fresh --seed`.
- Volumen generado: 575 productos, 115 proveedores, 1.410 asociaciones producto-proveedor, 10.783 movimientos (generados exclusivamente vía `InventoryService::registrarMovimiento()`, nunca un insert directo), 5.750 registros de auditoría, entre otros. Ver `docs/06_TESTS/DemoDataAudit.md` para el detalle completo, incluyendo 3 errores reales encontrados y corregidos durante el seeding, y 2 bugs de paginación pre-existentes (Productos/Proveedores) encontrados por tener volumen real de datos, documentados para su propia corrección futura.

### RC1 — Sidebar oficial, catálogos y auditoría funcional (2026-07-29/30)
- Gap analysis y auditoría funcional completa de los 17 módulos del sistema (`docs/03_FUNCTIONAL_SPEC/RC1_GAP_ANALYSIS.md`, `RC1_FUNCTIONAL_MODULE_AUDIT.md`), aprobados por el propietario del proyecto como base del roadmap de 8 fases de RC1.
- Normalización de catálogo (Fase 1): `Marca`/`UnidadMedida` como entidades reales reemplazando texto libre en `productos`, con migración de datos que preserva cada valor existente.
- Sidebar oficial reestructurado en grupos (Inventario/Terceros/Administración), con páginas reales de "pendiente de implementación" para todo módulo sin backend/frontend completo (nunca datos mock), bloque de usuario con rol/email y menú desplegable, breadcrumb en el header.
- Suppliers (FEATURE-003), creación manual de producto e ingreso manual (FEATURE-001/002), y asociación Producto-Proveedor (FEATURE-005) — construidos en sesiones previas, comiteados formalmente en esta unidad de trabajo junto con el resto del backlog acumulado.

### Documentación — Auditoría final y consolidación definitiva (Documentation Baseline v1.0, segunda pasada)
- **Cierre de los dos últimos gaps de organización** dejados abiertos deliberadamente por la auditoría anterior (`docs/DOCUMENTATION_BASELINE_REPORT.md`), sin tocar `backend/` ni `frontend/`.
  - `docs/ArchitectureWorkflow.md`, `docs/ReleaseWorkflow.md`, `docs/SessionWorkflow.md` **movidos** a `docs/10_GOVERNANCE/` — los 10 documentos de gobernanza de proceso viven ahora en una única carpeta. 14 referencias activas actualizadas en 8 documentos (`AGENTS.md`, `README.md`, `CLAUDE.md`, `docs/README.md`, `docs/10_GOVERNANCE/EngineeringManual.md`, `docs/10_GOVERNANCE/MandatoryDevelopmentWorkflow.md`, `docs/07_RELEASE/README.md`, este changelog). Contenido de los 3 archivos: sin cambios.
  - `docs/10_GOVERNANCE/README.md` **creado**: índice de navegación puro de la carpeta, sin duplicar el contenido razonado de `EngineeringManual.md` (que sigue siendo la puerta de entrada real). Cierra el gap de que 1 de 13 carpetas principales no tenía `README.md` propio.
  - Verificación independiente completa: 0 enlaces rotos reales, 0 duplicados por hash, 0 huérfanos, banners de deprecación intactos.
  - Ver `docs/DOCUMENTATION_BASELINE_REPORT.md`, sección "Segunda pasada", para el detalle completo y el checklist con 100% de cumplimiento.

### Documentación — Consolidación de gobernanza
- **Reorganización de la documentación de gobernanza para eliminar duplicados y establecer una única fuente de verdad**, sin tocar `backend/` ni `frontend/`.
  - `docs/README.md` creado como índice maestro de toda la documentación (no existía).
  - `docs/10_GOVERNANCE/EngineeringManual.md` creado como documento maestro de gobernanza: no duplica contenido, indexa y explica cuándo usar cada documento de proceso.
  - `docs/10_GOVERNANCE/DevelopmentWorkflow.md` y el documento previamente llamado `ENGINEERING_WORKFLOW.md` (título interno "Mandatory Development Workflow", el mismo que `AGENTS.md` citaba antes como `MANDATORY_DEVELOPMENT_WORKFLOW.md`) se solapaban al describir el mismo proceso con estructuras distintas — **fusionados** en `docs/10_GOVERNANCE/MandatoryDevelopmentWorkflow.md`, ahora la única autoridad sobre el flujo de desarrollo (12 fases, cada una con Objetivo/Entradas/Salidas/Checklist/Criterios de aprobación). Ambos originales archivados en `docs/_ARCHIVE/` con nota de reemplazo, sin pérdida de contenido útil.
  - `docs/10_GOVERNANCE/QualityGates.md` creado (no existía): reglas de bloqueo puras, independientes del workflow, extraídas de `AGENTS.md`, `DefinitionOfReady.md`, y la sección "Estados de aprobación de módulo" que antes vivía en `DefinitionOfDone.md`.
  - `docs/10_GOVERNANCE/DefinitionOfDone.md` depurado: ahora contiene únicamente criterios objetivos de "cuándo está terminado"; el contenido de proceso/gates se movió a `QualityGates.md`.
  - `docs/06_TESTS/TestingGuide.md` creado (no existía): guía por tipo de prueba (Unit/Functional/Integration/Regression/Performance/Security/UAT), enlaza los planes existentes sin duplicarlos.
  - `docs/10_GOVERNANCE/GOVERNANCE.md` (stub de 6 líneas sin contenido navegable) archivado, reemplazado por `EngineeringManual.md`.
  - Referencia rota corregida: `README.md` (raíz) listaba `MilestoneWorkflow.md`, un documento que no existe (eliminado por vacío durante la migración anterior) — se retiró la mención y se documentó el gap abierto (`AI_OPERATING_PROCEDURE.md` sigue refiriéndolo en su "Milestone Policy").
  - `AGENTS.md`, `README.md` (raíz), `CLAUDE.md`, `docs/ArchitectureWorkflow.md` actualizados para apuntar a los documentos fusionados/nuevos.
  - Ver `docs/POST_MIGRATION_AUDIT.md` §7bis y `docs/MIGRATION_REPORT.md` §6 para el origen del solapamiento (actividad concurrente de otro proceso sobre el mismo árbol de `docs/`).

### Documentación — Migración SDD original
- **Migración completa a Specification-Driven Development (SDD).** El repositorio pasa de un `docs/00_MASTER_SPECIFICATION.md` monolítico (74 secciones, mezcla de spec aspiracional pre-implementación y documentación real) a la estructura `00_VISION/` … `09_TEMPLATES/` + `_ARCHIVE/`.
  - Todo el contenido fue auditado, reconciliado contra el código real y redistribuido — ver `docs/SDD_MIGRATION_PLAN.md` para el detalle completo de la auditoría y mapeo.
  - Cada requisito funcional y cada spec de módulo quedó marcado `[BUILT]` o `[PLANNED]` según evidencia verificada en `backend/` y `frontend/`, no según lo que el borrador original asumía.
  - Los módulos nunca construidos (Compras, Proveedores, Ventas, Clientes, Kardex, Reportes) se mantienen como specs futuras en `03_FUNCTIONAL_SPEC/FUTURE/`, no se descartaron — decisión explícita del producto.
  - Se crearon 13 ADRs (`08_ADR/`) documentando decisiones arquitectónicas que antes solo existían de forma narrativa o implícita en el código.
  - Se crearon 7 plantillas reutilizables (`09_TEMPLATES/`) derivadas de los documentos reales ya escritos.
  - `AGENTS.md` se mantiene en la raíz como constitución corta; el detalle de Definition of Ready/Done y los distintos workflows se extrajo a `docs/10_GOVERNANCE/DefinitionOfReady.md`, `docs/10_GOVERNANCE/DefinitionOfDone.md`, `docs/10_GOVERNANCE/DevelopmentWorkflow.md`, `docs/10_GOVERNANCE/DocumentationWorkflow.md`, `docs/ArchitectureWorkflow.md`, `docs/ReleaseWorkflow.md`.
  - Brechas reales detectadas y documentadas explícitamente (no ocultadas): sin tests automatizados de frontend, sin pipeline CI/CD, sin auditoría de accesibilidad, sin pruebas de rendimiento ejecutadas, sin rollback probado en la práctica.

### Sin cambios de código
Esta migración es exclusivamente documental. No se modificó `backend/` ni `frontend/`.

---

*Entradas anteriores a esta migración no fueron registradas en este archivo porque no existía. El historial de fases (Captura IA, Auth Módulos 0–2) está documentado retroactivamente en `docs/05_IMPLEMENTATION/` y `docs/00_VISION/Roadmap.md`.*
