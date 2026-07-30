# Architecture Workflow

## Cuándo se requiere una Architecture Review

Cualquier cambio que:
- Introduzca una nueva tabla/relación de base de datos con impacto multi-tenant.
- Modifique el modelo de autenticación, autorización o aislamiento de datos.
- Agregue una dependencia externa nueva (proveedor de IA, servicio de pagos, etc.).
- Cambie un patrón ya establecido (Repository, Service Layer, DTO) o introduzca uno nuevo.
- Afecte a más de un módulo funcional a la vez.

## Proceso

1. Autor propone el cambio en `05_IMPLEMENTATION/<Modulo>.md` (sección Dependencies + Database Changes + API Changes) y, si aplica, un nuevo `08_ADR/ADR-0XX-titulo.md` en estado borrador.
2. Se revisa contra `04_TECHNICAL_SPEC/Architecture.md`, `Security.md` y los ADRs existentes — ¿es consistente? ¿contradice una decisión previa? Si contradice una decisión previa, esa decisión previa debe reconsiderarse explícitamente (ADR nuevo que reemplaza al anterior, referenciándolo), no ignorarse.
3. Aprobación: el ADR pasa a estado `Approved` (ver `09_TEMPLATES/Template_ADR.md`) antes de iniciar implementación.
4. Solo entonces el módulo puede pasar a `Implementation` según `10_GOVERNANCE/MandatoryDevelopmentWorkflow.md`.

## Principios no negociables (ver `AGENTS.md` y `08_ADR/ADR-001`–`ADR-004`)

- Clean Architecture, SOLID, Inyección de Dependencias.
- Repository Pattern para acceso a datos.
- Service Layer para lógica de negocio (nunca en Controllers, componentes React o Middleware).
- DTOs para transferencia de datos entre capas.
- Diseño interface-first.
- Eventos de dominio donde aplique.
- Multi-tenant fail-closed: sin contexto de tenant, cero registros — nunca confiar en `empresa_id` del request.
- Autorización por permiso (`$user->can('recurso.accion')`), nunca por nombre de rol (`$user->hasRole('Admin')`).

## Deriva detectada en esta migración

Esta migración encontró que `04_TECHNICAL_SPEC/Architecture.md` describe módulos (3–9) que aún no existen en código. Esto no es un error del documento — es diseño aprobado a futuro — pero cada spec y ADR debe declarar explícitamente si describe algo **implementado** o **diseñado pero pendiente**, para que esta ambigüedad no se repita.
