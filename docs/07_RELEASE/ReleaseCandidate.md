# Release Candidate — RC1

## Resumen

RC1 es la primera versión declarada "feature-complete" para el alcance del MVP construido hasta el momento de esta migración: Módulo Captura IA (completo, frontend + backend) y Auth Módulos 0-2 (Fundamentos, Authentication, Company Isolation). Reconstruido a partir de `docs/00_VISION/Roadmap.md` y `DEMO.md`, ambos escritos durante esta misma sesión de desarrollo.

## Alcance de RC1

- **Módulo Captura IA**: MVP declarado feature-complete. Pasó verificación RC1 (suite de verificación, estados de carga/vacíos/error, walkthrough completo, responsive, animaciones, performance informal, Demo Mode, `DEMO.md`). `OPENAI_API_KEY` configurada durante la verificación.
- **Auth Módulo 0 — Fundamentos**: completo. Verificado: Teams aísla roles por empresa correctamente.
- **Auth Módulo 1 — Authentication**: completo. Verificado por navegador real (login/logout, cookie httpOnly invisible a JS, sesión sobrevive reload duro, "Remember Me" a 30 días). Un bug real encontrado y corregido durante esta fase (ver `docs/05_IMPLEMENTATION/Auth_Module1_Authentication.md`, sección Security).
- **Auth Módulo 2 — Company Isolation**: completo. 25 tests adversariales (HTTP + Eloquent/Policy) más verificación en vivo contra el servidor real. Un bug real encontrado y corregido (orden de middleware, ver `docs/05_IMPLEMENTATION/Auth_Module2_CompanyIsolation.md`).

## Fuera de alcance de RC1

- Auth Módulos 3-9 (Authorization/RBAC, User Management, Role Management, Invitaciones, Active Sessions, Security Logs UI, User Profile) — no iniciados a la fecha de RC1.
- CRUD real de Productos/Movimientos (siguen siendo mock en frontend, salvo lo escrito por Captura IA).
- Compras, Proveedores, Ventas, Clientes, Kardex, Reportes — nunca construidos, archivados como alcance pre-pivote (ver `docs/_ARCHIVE/`).

## Criterios de salida verificados

| Criterio | Estado |
|---|---|
| 94 tests backend pasando | Sí |
| Suite de verificación de Captura IA (walkthrough, estados, responsive, animaciones) | Sí |
| Login real verificado por navegador | Sí |
| Aislamiento multi-tenant verificado (automatizado + en vivo) | Sí |
| Sin excepciones crudas expuestas en ninguna respuesta de API | Sí (`ErrorHandlingTest`) |
| Tests de frontend automatizados | **No — gap conocido, no bloqueante para RC1 por decisión implícita, sí para releases futuros** |
| CI/CD configurado | **No — gap conocido** |

## Bugs reales encontrados y corregidos durante el camino a RC1

1. **Auth Módulo 1**: sin header `Accept: application/json`, una request no autenticada intentaba redirigir a `route('login')` (inexistente) y devolvía 500 en vez de 401. Corregido con `redirectGuestsTo(fn () => null)` en `bootstrap/app.php`.
2. **Auth Módulo 2**: `SubstituteBindings` (route-model-binding) corría antes que `IdentifyTenant` por la prioridad de middleware por defecto de Laravel, permitiendo potencialmente resolver un binding de otra empresa antes de que el contexto de tenant estuviera fijado. Corregido con `appendToPriorityList`.

Ninguno de los dos llegó a producción — ambos se encontraron y corrigieron durante la verificación previa a declarar RC1.

## Estado de esta migración de documentación respecto a RC1

Este documento se escribe **retroactivamente**, como parte de la migración a Specification-Driven Development (ver `docs/SDD_MIGRATION_PLAN.md`). RC1, como pase de verificación, ya había ocurrido antes de esta migración; este documento formaliza lo que ya se sabía de esa sesión, no describe una nueva verificación.

## Siguiente paso

Auth Módulo 3 (Authorization/RBAC) es el primer módulo que debe pasar por el flujo completo PRD → Functional Spec → Technical Spec → Architecture Review → Approval **antes** de escribir código, bajo las reglas ya vigentes de `AGENTS.md` — es el "live test" del proceso SDD recién formalizado (ver `docs/SDD_MIGRATION_PLAN.md` §8, recomendación 4).
