# Checklist de Release

> Derivado de la Definition of Done de `AGENTS.md`, filtrado a lo que es real y verificable hoy en este proyecto. Los ítems marcados **(manual)** no tienen automatización que los respalde — deben verificarse a mano cada vez.

## Antes de cualquier release

- [ ] **Tests backend pasan al 100%.** `cd backend && composer test` — 94 tests, 0 fallas.
- [ ] **Lint backend limpio.** `cd backend && vendor/bin/pint --test` (Laravel Pint está en `require-dev`; confirmar que corre sin diffs pendientes).
- [ ] **Lint frontend limpio.** `cd frontend && npm run lint`.
- [ ] **Type check frontend limpio.** `cd frontend && npm run type-check`.
- [ ] **Build frontend exitoso.** `cd frontend && npm run build` (sin errores; revisar warnings nuevos).
- [ ] **Migraciones corren limpio desde cero.** `php artisan migrate:fresh --seed` en un ambiente limpio, sin errores.
- [ ] **Regresión manual ejecutada.** Ver `docs/06_TESTS/RegressionPlan.md` y `ManualTestCases.md` — al menos el subconjunto crítico (login, walkthrough de Captura IA, responsive). **(manual)**
- [ ] **Sin bugs críticos abiertos.** Revisar `docs/07_RELEASE/KnownIssues.md` — ningún ítem ahí debe ser "crítico y sin mitigación".
- [ ] **Documentación actualizada.** Cualquier cambio de comportamiento reflejado en `docs/03_FUNCTIONAL_SPEC/`, `docs/04_TECHNICAL_SPEC/`, y el `05_IMPLEMENTATION/*.md` del módulo correspondiente.
- [ ] **Changelog actualizado.** Entrada nueva en `CHANGELOG.md` (raíz) describiendo lo que cambia en este release.
- [ ] **Release Notes actualizadas.** Ver `docs/07_RELEASE/ReleaseNotes.md`.
- [ ] **Variables de entorno documentadas.** Cualquier variable nueva agregada a `.env.example` (backend y/o frontend) y a `DEMO.md`/`DeploymentGuide.md` si aplica.

## No automatizado todavía (honestidad, no aspiración)

Ninguno de los ítems de arriba corre automáticamente en un pipeline — **no existe CI/CD en este repositorio** (`.github/workflows` no existe). Todo este checklist depende hoy de que la persona (o agente) que prepara el release lo ejecute manualmente, en orden, sin saltarse pasos. Ver `docs/07_RELEASE/DeploymentGuide.md` para el estado honesto de esto.

## Qué NO bloquea un release (todavía, por decisión explícita, no por descuido)

- Cobertura de tests de frontend (no existe — ver `docs/06_TESTS/MasterTestPlan.md`). Bloquearía en un mundo ideal; hoy no puede bloquear porque no hay nada que correr.
- Tests de performance (no existen — ver `docs/06_TESTS/PerformanceTests.md`).
- Auditoría de accesibilidad (no existe — ver `docs/02_REQUIREMENTS/AccessibilityRequirements.md`).

Estos tres puntos son gaps activos, listados aquí para que no se lean como "aprobados", sino como "todavía no forman parte del gate porque el gate no existe".
