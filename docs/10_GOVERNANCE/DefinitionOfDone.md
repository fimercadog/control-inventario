# Definition of Done

Extraído de `AGENTS.md` (que ahora es un documento corto que apunta aquí) y reconciliado con `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` §70 (única versión vigente desde esta migración).

Un módulo o feature **NO está terminado** hasta que TODO lo siguiente se cumple:

- [ ] Código implementado siguiendo `04_TECHNICAL_SPEC/CodingStandards.md`.
- [ ] Unit Tests escritos y en verde.
- [ ] Integration/Feature Tests escritos y en verde.
- [ ] QA manual ejecutado — casos relevantes de `06_TESTS/ManualTestCases.md` o `AcceptanceCriteria.md` marcados `Pass`.
- [ ] Lint limpio (backend y frontend).
- [ ] Type check limpio (TypeScript estricto en frontend, PHP con tipos estrictos en backend).
- [ ] Build exitoso (`npm run build`, `composer install --no-dev` sin errores).
- [ ] Documentación actualizada: la Functional Spec, Technical Spec y `05_IMPLEMENTATION/<Modulo>.md` correspondientes reflejan lo que realmente se construyó (no lo que se planeó originalmente si hubo desviación).
- [ ] `CHANGELOG.md` actualizado con una entrada real.
- [ ] `07_RELEASE/ReleaseNotes.md` actualizado si el módulo sale en la siguiente release.
- [ ] Sin bugs críticos abiertos contra el módulo.
- [ ] Permisos verificados: cada endpoint/pantalla nueva usa `$user->can('recurso.accion')`, nunca `$user->hasRole()`.
- [ ] Aislamiento multi-tenant verificado si el módulo toca datos de empresa (ver `04_TECHNICAL_SPEC/Security.md`).
- [ ] Auditoría: toda mutación exitosa escribe una entrada real vía `AuditLogger`, con el diff real de lo que cambió — no una lista de campos fija (ver `docs/11_DESIGN_SYSTEM/QUALITY_CHECKLIST.md`, sección Backend/Datos).
- [ ] **Design System**: la pantalla nueva sigue `docs/11_DESIGN_SYSTEM/` (Crear/Editar/Ver vía modal salvo excepción documentada, componentes compartidos reutilizados en vez de duplicados, tamaños de modal desde `MODAL_SIZES`) — añadido 2026-08-03, ver `docs/10_GOVERNANCE/AI_OPERATING_PROCEDURE.md` §"Design System Compliance".
- [ ] **`docs/11_DESIGN_SYSTEM/QUALITY_CHECKLIST.md` completada** — añadido 2026-08-03, con evidencia por ítem, no solo casillas marcadas.
- [ ] **Cobertura funcional reportada** — añadido 2026-08-04, ver `docs/10_GOVERNANCE/AI_OPERATING_PROCEDURE.md` §"Functional Verification Evidence". Cada funcionalidad del módulo (no solo el conjunto CRUD genérico) verificada individualmente en navegador, con su resultado esperado, método y evidencia — un test automatizado en verde no es sustituto, ambos son obligatorios. Cualquier funcionalidad fallida se reporta explícitamente, nunca se oculta.

## Estados de aprobación de módulo

Un módulo solo puede pasar de **"En Desarrollo"** a **"Aprobado"** / **"Aprobado con observaciones"** / **"Requiere correcciones"** cuando cumple, además de todo lo anterior, los gates específicos de esa transición. **Esos gates (qué bloquea el paso de un estado a otro, y qué hacer cuando un criterio depende de una capacidad no construida todavía) viven en `docs/10_GOVERNANCE/QualityGates.md`, no aquí** — este documento define únicamente *cuándo un desarrollo está terminado*; QualityGates.md define *qué lo bloquea de estarlo*. El estado exacto de cada módulo y su justificación viven en el informe de pruebas de ese módulo (`docs/09_TEMPLATES/Template_TestReport.md`), no en este documento.

## Nota sobre honestidad documental

Esta migración encontró documentación desactualizada (el master spec original quedó congelado después de Captura IA y nunca se actualizó para Auth/RBAC). La Definition of Done existe precisamente para que eso no vuelva a pasar: **"documentación actualizada" es un criterio de cierre, no una tarea opcional de limpieza.**
