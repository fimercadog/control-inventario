# Plan Maestro de Pruebas

## Objetivo

Describir honestamente qué se prueba hoy, cómo, y qué no se prueba todavía, para que ningún lector (humano o agente) asuma cobertura que no existe.

## Estrategia general

| Capa | Automatizado | Manual | Estado |
|---|---|---|---|
| Backend (Laravel) | Sí — PHPUnit, 94 tests / 19 archivos | — | Completo para el alcance construido (Captura IA, Auth Módulos 0-2) |
| Frontend (Next.js) | **No** — cero tests automatizados | Sí — walkthroughs ad hoc vía navegador real | Gap real; ver `ManualTestCases.md` |
| Integración end-to-end | Parcial — `Feature/*` de Laravel llega hasta HTTP, pero nunca cruza al frontend real | Sí — verificaciones puntuales de login/RC1 vía navegador | No hay Playwright/Cypress ni equivalente |
| Performance/carga | No | No | Gap real; ver `PerformanceTests.md` |
| Accesibilidad | No | No | Gap real — ni siquiera un checklist manual existe todavía |
| Seguridad (aislamiento multi-tenant) | Sí — 25 tests adversariales | Complementado por verificación en vivo mencionada en el roadmap | Ver `SecurityTests.md` |

## Backend: lo que sí existe

94 tests PHPUnit, todos pasando, en `backend/tests/{Feature,Unit}/**`, cubriendo:
- Autenticación (login/logout/refresh/reset de contraseña).
- Captura IA (los 8 endpoints REST, deduplicación, umbral de confianza, idempotencia, transacciones, eventos de dominio).
- Aislamiento multi-tenant (Módulo 2), con suite adversarial dedicada.

Ver `AutomatedTests.md` para el índice archivo por archivo. Ver `docs/05_IMPLEMENTATION/*.md` para el contexto de cada módulo.

Comando: `composer test` desde `backend/`. Sin cobertura de código medida (`--coverage` no configurado ni corrido en este proyecto — otro gap, menor).

## Frontend: lo que NO existe

No hay ningún framework de test de frontend instalado (`package.json` no incluye Jest, React Testing Library, Playwright, Cypress ni Vitest). Toda verificación de frontend hecha hasta ahora (RC1, responsive, real-login) fue manual, vía navegador, y nunca se capturó como un test reproducible. Este es un gap real, reconocido explícitamente en `docs/SDD_MIGRATION_PLAN.md` §1.13.

Mitigación parcial: `ManualTestCases.md` reconstruye esas verificaciones como casos de prueba manual formales, para que al menos queden documentadas y sean repetibles por una persona, aunque no por una máquina.

## Qué probar antes de cada módulo nuevo (regla, no automatización)

Por `AGENTS.md`: todo módulo nuevo requiere Unit Tests + Integration Tests + Manual Acceptance Tests + Regression Tests antes de considerarse terminado (Definition of Done). Para el frontend, "Manual Acceptance Tests" es, hoy, la única red de seguridad real — ver `ManualTestCases.md` y `RegressionPlan.md`.

## Prioridad de cierre de gaps (orden sugerido)

1. Tests de frontend automatizados mínimos (al menos smoke tests de las pantallas reales: login, dashboard, captura, revisión) — el mayor gap de riesgo hoy, porque el frontend es lo único que un usuario real toca.
2. CI/CD que corra la suite backend en cada cambio — sencillo de configurar (GitHub Actions + `composer test`), alto valor, cero excusa técnica para no hacerlo.
3. Performance tests mínimos sobre el pipeline de Captura IA (el endpoint más costoso del sistema, por la llamada a OpenAI).
4. Accesibilidad — empezar por un checklist manual antes de herramientas automatizadas.

## No objetivos de este plan

Este documento no promete fechas ni compromisos de cobertura porcentual. Es honesto sobre el estado actual, no aspiracional.
