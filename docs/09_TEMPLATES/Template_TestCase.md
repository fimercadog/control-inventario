# Plantilla — Caso de Prueba

> Extraída de `docs/06_TESTS/ManualTestCases.md` y `docs/06_TESTS/SecurityTests.md`. Usar este formato para cualquier caso de prueba manual nuevo (frontend, seguridad, aceptación).

## [ID] — [Título breve y descriptivo] ([crítico], si aplica)

- **Objetivo:** [qué comportamiento específico verifica este caso — una frase.]
- **Precondiciones:** [estado del sistema/datos que debe existir antes de ejecutar el caso.]
- **Pasos:**
  1. [paso concreto y reproducible]
  2. [...]
- **Resultado esperado:** [qué debe observarse si el sistema se comporta correctamente.]
- **Resultado real:** [qué se observó al ejecutar — dejar en blanco o "Pendiente de ejecución" si aún no se ha corrido.]
- **Estado:** [Pasa / Falla / Pendiente de ejecución / Bloqueado — con motivo si falla o está bloqueado]

---

## Notas de uso

- IDs deben ser únicos y estables dentro de su documento (ej. `MTC-001`, `SEC-001`) — no reordenar ni reutilizar un ID para un caso distinto.
- "Resultado real" y "Estado" deben actualizarse en cada re-ejecución (ver `docs/06_TESTS/RegressionPlan.md`) — no dejar un "Pasa" desactualizado de una versión anterior del sistema.
- Marcar "(crítico)" en el título solo para casos que forman parte del subconjunto mínimo de regresión antes de cada release.
