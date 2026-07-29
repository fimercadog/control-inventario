# Definition of Done

Extraído de `AGENTS.md` (que ahora es un documento corto que apunta aquí) y reconciliado con `docs/00_MASTER_SPECIFICATION_ORIGINAL.md` §70 (única versión vigente desde esta migración).

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

## Nota sobre honestidad documental

Esta migración encontró documentación desactualizada (el master spec original quedó congelado después de Captura IA y nunca se actualizó para Auth/RBAC). La Definition of Done existe precisamente para que eso no vuelva a pasar: **"documentación actualizada" es un criterio de cierre, no una tarea opcional de limpieza.**
