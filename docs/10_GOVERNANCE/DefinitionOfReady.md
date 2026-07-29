# Definition of Ready

Extraído de `AGENTS.md` (que ahora es un documento corto que apunta aquí) para tener una única fuente de verdad.

Un módulo o feature **NO puede iniciar implementación** hasta que TODO lo siguiente esté aprobado:

- [ ] **Product Requirements** — sección relevante de `01_PRD/ProductRequirements.md` o `01_PRD/UserStories.md` actualizada.
- [ ] **Functional Specification** — documento en `03_FUNCTIONAL_SPEC/` con Purpose, Business Flow, Actors, Screens, Fields, Validation Rules, Permissions, Loading/Empty/Error States, Business Rules, Acceptance Criteria, Edge Cases, Future Improvements.
- [ ] **Technical Specification** — cambios necesarios documentados en `04_TECHNICAL_SPEC/` (Architecture, Database, API, Frontend, Backend, Security según aplique).
- [ ] **API Design** — endpoints nuevos o modificados documentados en `04_TECHNICAL_SPEC/API.md` antes de escribir el controlador.
- [ ] **Database Design** — migraciones planeadas documentadas en `04_TECHNICAL_SPEC/Database.md` / `DomainModel.md` antes de escribirlas.
- [ ] **UX** — pantallas, estados vacíos/carga/error definidos en la Functional Spec.
- [ ] **Test Cases** — casos de aceptación esbozados en `06_TESTS/AcceptanceCriteria.md` o el `05_IMPLEMENTATION/<Modulo>.md` correspondiente.
- [ ] **`05_IMPLEMENTATION/<Modulo>.md` creado** con Goal, Scope, Out of Scope, Dependencies, Database Changes, API Changes, Frontend Changes, Security, Permissions, Events, Tests, Risks, Checklist, Definition of Done — **antes** de escribir código.

Si falta cualquier ítem: **STOP.** No se escribe código. Se pregunta o se escribe la especificación faltante primero.

## Excepción explícita (proporcionalidad)

Un fix de una línea, una corrección de typo, o un cambio de configuración sin impacto en dominio/API/seguridad **no requiere** el ciclo completo. Usar criterio: si el cambio no altera contrato de API, modelo de datos, permisos o UX visible, basta con una nota en `CHANGELOG.md`. Ante la duda, tratarlo como si sí lo requiriera.

## Aprobación

El estado de cada documento de módulo sigue: `Draft → Review → Changes Requested → Approved → Implementation → Testing → Released`. Un módulo entra a Implementation solo cuando su Functional Spec + Technical Spec están en estado `Approved`.
