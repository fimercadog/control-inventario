# Migration Report — Specification-Driven Development

**Fecha del reporte:** 2026-07-29
**Alcance:** Migración documental de `docs/00_MASTER_SPECIFICATION.md` (documento monolítico) a la estructura Specification-Driven Development declarada en `AGENTS.md` (`docs/00_VISION/` … `09_TEMPLATES/`, más `10_GOVERNANCE/` y `_ARCHIVE/`).
**Restricción de ejecución:** Migración exclusivamente documental. Ningún archivo de `backend/` o `frontend/` (código o tests) fue modificado.

---

## 1. Resumen ejecutivo

El proyecto tenía un único documento fuente (`docs/00_MASTER_SPECIFICATION.md`, 74 secciones) que mezclaba especificación aspiracional pre-implementación (un ERP completo: Compras, Ventas, Clientes, Proveedores, Kardex, Reportes — nunca construido) con documentación real y mantenida al día de lo efectivamente implementado (Captura IA completo; Auth Módulos 0-2 — Foundations, Authentication, Company Isolation). Esa mezcla hacía imposible saber, sin leer 5.700+ líneas, qué del documento describía código real y qué era aspiración de producto.

Esta migración auditó ese documento completo, lo dividió por audiencia y estado de implementación, y lo redistribuyó en 101 archivos Markdown bajo una estructura SDD de 13 carpetas numeradas (`00_VISION` a `10_GOVERNANCE`, más `_ARCHIVE`). El documento original se conservó íntegro como referencia histórica, no se descartó.

Se ejecutó bajo 7 decisiones definitivas aprobadas explícitamente por el product owner del proyecto (ver §2 de este reporte para el detalle de cada una). Ninguna de las 7 decisiones quedó sin aplicar. El trabajo de esta sesión, específicamente, se concentró en verificar la calidad de una migración ya ejecutada en gran parte (por un proceso previo, de origen no documentado en esta conversación) y en cerrar los huecos concretos que esa verificación encontró — detallados en §5.

**Estado final: migración completa, con dos gaps estructurales corregidos en esta sesión y un riesgo de proceso documentado (ver §6).**

---

## 2. Decisiones aplicadas (las 7 aprobadas)

| # | Decisión | Estado |
|---|---|---|
| 1 | Compras/Ventas/Clientes/Proveedores/Kardex/Reportes no se descartan — se mueven a `03_FUNCTIONAL_SPEC/FUTURE/` con `Status: Planned` | **Aplicada en esta sesión.** Los 6 archivos ya tenían el contenido y el header `Status: Planned — not yet implemented`, pero vivían sueltos en `03_FUNCTIONAL_SPEC/`, no en el subdirectorio `FUTURE/` que la decisión exige textualmente. Se movieron y se corrigieron las 8 referencias cruzadas que apuntaban a la ruta antigua (ver §5.1). |
| 2 | Los ADR ya extraídos son la referencia oficial; trazabilidad con nivel de confianza histórica explícito, nada inventado | **Verificada.** Los 13 ADR + `ADR_INDEX.md` usan consistentemente el esquema Verified / Partially Verified / Pending Validation, citan archivo y línea exactos, y documentan explícitamente en "Información Faltante" lo que no pudo verificarse (p. ej. por qué JWT sobre Sanctum). El índice registra además que una primera extracción con razonamiento inventado fue detectada y descartada — la disciplina de la decisión #2 ya se había aplicado sobre sí misma. |
| 3 | `00_MASTER_SPECIFICATION.md` deja de ser el documento principal; se archiva con advertencia | **Completada en esta sesión.** El archivo ya estaba renombrado a `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` y `_ARCHIVE/README.md` ya explicaba la deprecación — pero el archivo mismo no tenía ninguna advertencia en su propio contenido. Se agregó un banner de advertencia directamente al inicio del archivo (ver §5.2). |
| 4 | `04_ARCHITECTURE.md`, `05_DATABASE.md`, `06_API.md` son la fuente técnica oficial; reutilizar sin reescribir | **Verificada.** `Architecture.md` es copia fiel del contenido original (confirmado línea por línea contra lo redactado en esta misma sesión, en un turno anterior). `Database.md` está registrado en git como rename (`RM docs/05_DATABASE.md -> docs/04_TECHNICAL_SPEC/Database.md`), preservando historial. Se encontraron y corrigieron 19 referencias cruzadas obsoletas al nombre antiguo del master spec, más 3 referencias a un archivo (`_ARCHIVE/pre-pivot-erp-scope.md`) que el plan original contemplaba pero que la decisión #1 volvió innecesario — nunca llegó a crearse, y `DomainModel.md` seguía citándolo (ver §5.3). |
| 5 | Los 94 tests permanecen intactos; solo documentar, no modificar código | **Confirmada.** `backend/tests/` contiene 19 archivos de test (69 tests base + 25 adversariales de Módulo 2, según `docs/06_TESTS/`), el mismo conteo verificado antes y después de esta sesión. Cero archivos de `backend/` o `frontend/` fueron tocados. |
| 6 | Documentar gaps reales explícitamente (frontend sin tests, sin CI/CD, sin perf, sin accesibilidad) | **Verificada.** `docs/07_RELEASE/KnownIssues.md` documenta los 7 límites originales del MVP (con anotación Vigente/Desactualizado respecto a `DEMO.md`) más 7 gaps adicionales encontrados durante la migración (sin tests de frontend, sin CI/CD, sin tests de performance, sin accesibilidad, sin rate limiting documentado, Captura IA síncrona no asíncrona, sin CHANGELOG previo). |
| 7 | Generar `docs/MIGRATION_REPORT.md` | **Este documento.** |

---

## 3. Documentos creados

La estructura completa (101 archivos `.md` bajo `docs/`) fue creada por la migración. Resumen por carpeta:

| Carpeta | Archivos | Contenido |
|---|---|---|
| `00_VISION/` | 4 | Visión, objetivos de negocio, estrategia de producto, roadmap real |
| `01_PRD/` | 8 | Reglas de negocio, fuera de alcance, problema, requisitos de producto, métricas de éxito, usuarios objetivo, personas, historias de usuario |
| `02_REQUIREMENTS/` | 5 | Requisitos funcionales (`[BUILT]`/`[PLANNED]` por RF), no funcionales, performance, seguridad, accesibilidad |
| `03_FUNCTIONAL_SPEC/` | 9 (+ 6 en `FUTURE/`) | Specs de módulos construidos (AI Capture, Auth, Dashboard, Inventory, Movements, Products, Roles, Settings, Users) |
| `03_FUNCTIONAL_SPEC/FUTURE/` | 6 | Specs de módulos planificados no construidos (Customers, Kardex, Purchases, Reports, Sales, Suppliers) — movidos aquí en esta sesión |
| `04_TECHNICAL_SPEC/` | 11 | Arquitectura, API, backend, estándares de código, base de datos, deployment, modelo de dominio, frontend, glosario, integraciones, seguridad |
| `05_IMPLEMENTATION/` | 4 | Documentación retroactiva de módulos ya construidos (AI Capture, Auth Módulos 0-2) |
| `06_TESTS/` | 7 | Plan maestro, criterios de aceptación, tests automatizados/manuales, performance, regresión, seguridad |
| `07_RELEASE/` | 6 | Guía de deployment, known issues, release candidate/checklist/notes, rollback |
| `08_ADR/` | 14 | 13 ADR + índice, con esquema de confianza histórica |
| `09_TEMPLATES/` | 7 | Plantillas para ADR, functional spec, módulo, PRD, release, technical spec, test case |
| `10_GOVERNANCE/` | 6 | Gobernanza del proceso SDD, Definition of Ready/Done, workflows de desarrollo/documentación |
| Raíz `docs/` | 4 | `ArchitectureWorkflow.md`, `ReleaseWorkflow.md`, `SessionWorkflow.md`, `SDD_MIGRATION_PLAN.md` (el plan de auditoría original de esta migración) |

**Nota sobre `10_GOVERNANCE/`:** esta carpeta no está en la lista de carpetas que `AGENTS.md` declara explícitamente (`00_VISION` … `09_TEMPLATES`). Es una extensión razonable (agrupa gobernanza y Definition of Ready/Done, que de otro modo quedarían sueltos en la raíz de `docs/`), pero no fue una de las 7 decisiones aprobadas — se documenta aquí como nota, no como desviación a corregir unilateralmente.

---

## 4. Documentos movidos

| Origen | Destino | Mecanismo git |
|---|---|---|
| `docs/05_DATABASE.md` | `docs/04_TECHNICAL_SPEC/Database.md` | Rename registrado (`RM`), preserva historial |
| `docs/03_FUNCTIONAL_SPEC/{Purchases,Sales,Customers,Suppliers,Kardex,Reports}.md` | `docs/03_FUNCTIONAL_SPEC/FUTURE/{mismo nombre}` | Movimiento de filesystem (archivos no trackeados aún — sin historial git que preservar); aplicado en esta sesión |
| `docs/00_MASTER_SPECIFICATION.md` | `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` | Ya aplicado antes de esta sesión |
| `docs/GOVERNANCE.md`, `DefinitionOfReady.md`, `DefinitionOfDone.md`, `DevelopmentWorkflow.md`, `DocumentationWorkflow.md` | `docs/10_GOVERNANCE/` | Ya aplicado antes/durante esta sesión (ver §6, nota de concurrencia) |

---

## 5. Gaps encontrados y corregidos en esta sesión

### 5.1 Módulos futuros fuera de `FUTURE/` + referencias rotas

Los 6 specs de módulos planificados (Purchases, Sales, Customers, Suppliers, Kardex, Reports) ya tenían contenido excelente y el header `Status: Planned` correcto, pero vivían directamente en `03_FUNCTIONAL_SPEC/` en vez de `03_FUNCTIONAL_SPEC/FUTURE/`, incumpliendo la ruta textual de la decisión #1.

**Corregido:** movidos a `FUTURE/`. Se actualizaron 3 archivos con referencias a la ruta antigua: `docs/_ARCHIVE/README.md`, `docs/03_FUNCTIONAL_SPEC/Movements.md`, `docs/03_FUNCTIONAL_SPEC/Inventory.md`. Las referencias mutuas entre los propios 6 archivos (p. ej. `Sales.md` → `Customers.md`) no necesitaron cambio porque se mueven juntos como hermanos dentro de `FUTURE/`.

### 5.2 Master spec archivado sin advertencia en el propio archivo

`docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` no tenía ninguna advertencia de deprecación en su propio contenido — solo `_ARCHIVE/README.md` (un archivo distinto) explicaba que estaba superado. Un lector que abriera directamente el archivo archivado no tenía forma de saberlo sin ver el README del directorio.

**Corregido:** se agregó un banner de advertencia (⚠️ DOCUMENTO HISTÓRICO) directamente después del título del archivo, cumpliendo literalmente la instrucción de la decisión #3 ("Agrega una advertencia").

### 5.3 19 referencias cruzadas rotas al nombre antiguo del master spec

Al renombrar `00_MASTER_SPECIFICATION.md` → `_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md`, ningún otro documento de la estructura nueva actualizó su referencia. 19 archivos activos (Vision.md, Roadmap.md, BusinessGoals.md, FunctionalRequirements.md, BusinessRules.md, ProblemStatement.md, SecurityRequirements.md, TargetUsers.md, NonFunctionalRequirements.md, OutOfScope.md, AI_Capture.md ×2, PerformanceRequirements.md, AutomatedTests.md, API.md, Architecture.md, Database.md, DomainModel.md, EMPTY_07_FRONTEND_DRAFT.md) seguían citando `00_MASTER_SPECIFICATION.md` como si el archivo siguiera existiendo con ese nombre en esa ubicación.

**Corregido:** las 19 referencias se actualizaron a `_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md`. Se dejaron intactas, deliberadamente, las referencias en `docs/SDD_MIGRATION_PLAN.md` (describe el estado *antes* de la migración, como registro histórico del audit) y el título propio del archivo archivado (`# 00_MASTER_SPECIFICATION.md`, su nombre original, no una referencia cruzada).

Adicionalmente, `docs/04_TECHNICAL_SPEC/DomainModel.md` citaba 3 veces un archivo (`docs/_ARCHIVE/pre-pivot-erp-scope.md`) contemplado en el plan de migración original pero que la decisión #1 volvió innecesario — nunca se creó, porque los módulos correspondientes no se descartan, se planifican. Se corrigieron las 3 citas para apuntar a `03_FUNCTIONAL_SPEC/FUTURE/` con el framing correcto ("no descartado, planificado"), no "archivado".

### 5.4 Dos archivos huérfanos vacíos (0 bytes)

Se encontraron y eliminaron dos archivos vacíos sin ninguna referencia en el resto del repositorio: `docs/AI_OPERATING_PROCEDURE.md` (root, luego reapareció con contenido real en `10_GOVERNANCE/` — ver §6) y `docs/10_GOVERNANCE/MilestoneWorkflow.md`. Ambos eran, aparentemente, artefactos intermedios de un proceso de reorganización en curso (ver §6), no contenido perdido.

### 5.5 Carpetas vacías heredadas

`docs/assets/`, `docs/decisions/`, `docs/diagrams/`, `docs/meeting-notes/` (vacías desde antes de la migración) ya tenían, al momento de esta verificación, un `README.md` explicando que son carpetas obsoletas y dónde colocar contenido nuevo en su lugar. No requirieron acción adicional.

---

## 6. Riesgos

- **Riesgo de proceso — actividad concurrente detectada durante esta sesión.** Mientras se verificaba y corregía esta migración, se observó que archivos de `docs/10_GOVERNANCE/` cambiaban de estado entre una revisión y la siguiente dentro de la misma sesión (aparición de `MilestoneWorkflow.md` vacío, reaparición de `AI_OPERATING_PROCEDURE.md` con contenido después de haber sido eliminado por vacío, desaparición de `DefinitionOfDone.md`/`DefinitionOfReady.md` de la raíz de `docs/`). Esto indica que otro proceso o sesión estuvo escribiendo sobre el mismo árbol de documentación en paralelo a esta verificación. El snapshot final usado para este reporte (§3) se tomó inmediatamente antes de escribir este documento, pero **no hay garantía de que sea el estado definitivo** si ese otro proceso sigue activo después de este reporte. Se recomienda una verificación de árbol completo (`find docs -name "*.md"` + revisión de huérfanos vacíos) antes de dar la migración por cerrada de forma definitiva.
- **Ausencia de historial de commits granular.** Un único commit (`057c3e2`, "commit inicial") cubre todo el repositorio. Todo el código real (Captura IA, Auth Módulos 0-2) y toda esta migración documental existen como archivos sin commitear individualmente. Esto significa que no hay forma de fechar con precisión ni auditar quién tomó cada decisión — riesgo ya documentado explícitamente en `ADR_INDEX.md` y heredado por este reporte.
- **`10_GOVERNANCE/` no está en la estructura que `AGENTS.md` declara.** No es un riesgo funcional, pero sí una divergencia entre lo que el documento de gobernanza raíz promete y lo que existe en disco; si no se actualiza `AGENTS.md` en algún momento, un lector nuevo puede no saber que esa carpeta existe.
- **Gaps de producto ya conocidos y sin mitigar** (documentados en `KnownIssues.md`, no nuevos de esta sesión): sin tests de frontend, sin CI/CD, sin tests de performance, sin auditoría de accesibilidad, sin rate limiting confirmado en login, Captura IA procesa de forma síncrona pese a tener un Job queueable sin usar.

---

## 7. Recomendaciones

1. Antes de considerar esta migración "cerrada" de forma definitiva, volver a listar `docs/**/*.md` y confirmar que no hay archivos de 0 bytes ni carpetas nuevas no contempladas — dado el riesgo de concurrencia de §6.
2. Actualizar `AGENTS.md` para que su árbol de carpetas declarado incluya `10_GOVERNANCE/` (o mover su contenido a una de las carpetas ya declaradas), para que la documentación de gobernanza no diverja de la raíz que la describe.
3. Tratar `docs/SDD_MIGRATION_PLAN.md` y este mismo `MIGRATION_REPORT.md` como documentos de auditoría histórica una vez cerrada la migración — no como fuente activa de arquitectura (ese rol ya lo cumplen `04_TECHNICAL_SPEC/*` y los ADR).
4. Para el Módulo 3 en adelante (Authorization/RBAC completo, User Management, Role Management, Invitations, Sessions, Security Logs, Profile): escribir el Functional/Technical Spec correspondiente **antes** del código, como ya señala `docs/05_IMPLEMENTATION/AI_Capture.md` — este es el primer módulo donde el proceso SDD completo (spec → aprobación → implementación) se pondría a prueba de verdad.
5. Cerrar al menos los gaps 8-9 de `KnownIssues.md` (tests de frontend, CI/CD) antes de exponer el producto a usuarios reales fuera de una demo controlada — son los que representan riesgo creciente según ese mismo documento.

---

## 8. Estado final de la migración

**Completa**, con las 7 decisiones aprobadas aplicadas y verificadas, y los 5 gaps de §5 corregidos en esta sesión. Ningún archivo de `backend/` o `frontend/` fue modificado — 19 archivos de test intactos, confirmado antes y después. El único punto abierto no resuelto en esta sesión es el riesgo de concurrencia documentado en §6, que requiere una verificación de cierre posterior, no una acción de esta migración en sí.
