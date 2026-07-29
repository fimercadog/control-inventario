# Índice de Architecture Decision Records

Última actualización: reescritura completa bajo estándar estricto de verificabilidad (ver nota metodológica al final).

Fuentes permitidas para todo ADR de este índice: `AGENTS.md`, documentación existente en `docs/`, código fuente (`backend/`, `frontend/`), historial de commits del repositorio, y las conversaciones/documentos de proyecto ya registrados (`docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md`, `docs/SDD_MIGRATION_PLAN.md`). Ninguna decisión fue reconstruida por inferencia sin marcarlo explícitamente como tal.

| ADR | Título | Estado | Alternativas documentadas | Historical Confidence | Estado de implementación |
|---|---|---|---|---|---|
| [ADR-001](ADR-001-clean-architecture.md) | Clean Architecture como principio estructural | Accepted (Verified) | No | Partially Verified | Implementado (Captura IA); parcial en Auth/RBAC |
| [ADR-002](ADR-002-repository-pattern.md) | Repository Pattern sin interfaz explícita | Accepted (Verified) | **Sí** — único caso con comparación documentada | Verified | Implementado |
| [ADR-003](ADR-003-service-layer.md) | Service Layer como orquestador único | Accepted (Verified) | No | Partially Verified | Implementado |
| [ADR-004](ADR-004-dto-pattern.md) | DTOs como contrato entre capas | Accepted (Verified) | No | Partially Verified | Implementado (Captura IA); no confirmado en Auth |
| [ADR-005](ADR-005-openai-provider-abstraction.md) | `AIProviderInterface` sobre OpenAI | Accepted (Verified) / **Pending Validation** para la elección de OpenAI específicamente | Parcial | Pending Validation | Implementado y probado con `FakeAIProvider` |
| [ADR-006](ADR-006-jwt-authentication.md) | JWT (`tymon/jwt-auth`), no Sanctum | Accepted (Verified) / **Pending Validation** para el porqué sobre Sanctum | No | Pending Validation | Implementado |
| [ADR-007](ADR-007-refresh-tokens.md) | Refresh tokens opacos, rotados, en cookie httpOnly | Accepted (Verified) | No | Partially Verified | Implementado |
| [ADR-008](ADR-008-multi-tenant-isolation.md) | Aislamiento multi-tenant en dos capas (Scope + Policy) | Accepted (Verified) | No | Verified | Implementado |
| [ADR-009](ADR-009-tenantscope.md) | `TenantScope` fail-closed vía `TenantContext` | Accepted (Verified) | No | Verified | Implementado |
| [ADR-010](ADR-010-rbac-teams.md) | RBAC vía `spatie/laravel-permission` con Teams | Accepted (Verified) para el diseño | Parcial | Partially Verified | **Parcial** — infraestructura instalada, chequeo real (`$user->can()`) pendiente del Módulo 3 |
| [ADR-011](ADR-011-ai-capture-pipeline.md) | Captura IA como capa de entrada, no fuente paralela | Accepted (Verified) | No | Verified | Implementado y probado (35 tests reportados) |
| [ADR-012](ADR-012-idempotency.md) | Idempotencia vía `Idempotency-Key` + índice único | Accepted (Verified) | No | Verified | Implementado y probado |
| [ADR-013](ADR-013-domain-events.md) | Eventos de dominio post-commit (`DB::afterCommit`) | Accepted (Verified) | No | Verified | Implementado y probado; sin listeners (deliberado) |

**Criterio usado para `Historical Confidence`:**
- **Verified** — la decisión, su contexto y su mecanismo tienen cita directa y específica en al menos una fuente primaria (código y/o documentación), sin vacíos relevantes en el razonamiento. Incluye los casos con evidencia particularmente fuerte y multi-fuente (ADR-002, 008, 009, 011, 012, 013).
- **Partially Verified** — la decisión y su implementación están verificadas, pero el razonamiento comparativo (por qué esta opción y no otra) no está documentado en ninguna fuente disponible — el vacío es explícito en cada ADR, sección "Información Faltante" (ADR-001, 003, 004, 007, 010).
- **Pending Validation** — la decisión central está verificada, pero una sub-decisión concreta dentro de ella no tiene ninguna fuente que la respalde y queda formalmente abierta en la sección "Decision Provenance" (ADR-005, 006).

## Resumen por estado

- **Accepted (Verified) sin reservas:** ADR-001, 002, 003, 004, 007, 008, 009, 011, 012, 013 (10 de 13).
- **Accepted (Verified) con una sub-decisión en Pending Validation:** ADR-005 (elección de OpenAI específicamente), ADR-006 (elección de JWT sobre Sanctum específicamente). En ambos casos, **el hecho de qué se implementó SÍ está verificado** (código + documentación existente); lo que no está verificado es el razonamiento comparativo que llevó a esa elección sobre alternativas concretas.
- **Parcialmente implementado (diseño verificado, código incompleto):** ADR-010 — el diseño de RBAC con Teams está documentado y la infraestructura (paquete, migraciones, modelo `Role`) está instalada, pero el chequeo de permisos real en Policies de negocio depende del Módulo 3, no construido todavía.
- **Ningún ADR fue descartado por falta total de verificación.** Las 13 decisiones originalmente extraídas resultaron tener al menos el hecho central (qué se decidió e implementó) verificable en código y/o documentación existente. Ninguna requirió inventarse desde cero como "Pending Validation" completo.

## Hallazgo notable

`ADR-002-repository-pattern.md` es el único de los 13 donde `docs/04_TECHNICAL_SPEC/Backend.md` (línea 62) documenta explícitamente tanto la decisión como el motivo de descartar la alternativa obvia (interfaz `*RepositoryInterface` desde el día uno), citando además esta misma ADR por su nombre. En los otros 12 casos, lo verificable es **qué se decidió y por qué funciona así**, pero no un registro explícito de **qué otras opciones se compararon y se rechazaron** — esa comparación, cuando existió, no quedó documentada en ninguna fuente disponible en este repositorio.

## Brecha estructural que afecta a los 13 ADR por igual

El repositorio tiene un único commit (`057c3e2`, 2026-07-25, "commit inicial"), correspondiente solo al scaffold inicial de Laravel/Next.js. Todo el código de aplicación real (Captura IA completa, Auth Módulos 0–2) nunca fue commiteado de forma granular — existe únicamente como archivos untracked en el working tree al momento de esta migración. Esto significa que **no hay historial de commits que permita fechar con precisión cuándo se tomó cada decisión, ni quién la tomó, ni qué se discutió antes de adoptarla.** Todas las fechas en los 13 ADR usan como proxy la fecha de la migración de base de datos más cercana al módulo correspondiente (`2026-07-28` para Captura IA y Auth Módulos 0–2), explícitamente marcada como proxy, no como fecha de decisión verificada.

## Nota metodológica

Esta versión reemplaza dos artefactos anteriores:

1. Una primera extracción (misma numeración ADR-001 a ADR-013) que incluía secciones de "Alternativas consideradas" con razonamiento reconstruido por inferencia (p. ej. comparaciones hipotéticas entre MVC y Hexagonal, o trade-offs de JWT vs. Sanctum, sin cita a una fuente real).
2. Un archivo previo en esta misma ruta (`ADR_INDEX.md`) que en realidad contenía un único ADR de ejemplo (`ADR-006 — Autenticación con JWT`) con una comparación Sanctum-vs-JWT de ventajas/desventajas igualmente no verificable en ninguna fuente del proyecto (p. ej. "Menos flexible para clientes externos" atribuido a Sanctum, "API First. Escalable." atribuido a JWT) — se sobrescribió porque mezclaba el rol de índice con el de ADR individual y repetía el mismo problema de alternativas inventadas que esta reescritura busca eliminar. El contenido real y verificado sobre JWT vive en `ADR-006-jwt-authentication.md`.

Ambos fueron descartados por instrucción explícita del proyecto: la trazabilidad tiene prioridad sobre la completitud, y ningún ADR debe presentar como "decisión documentada" algo que en realidad es una reconstrucción plausible sin fuente. Esta versión cita, para cada afirmación de contexto/problema/decisión, el archivo y línea exactos de donde proviene, y declara explícitamente en "Información Faltante" cualquier parte del razonamiento (típicamente: alternativas rechazadas) que no pudo verificarse en ninguna fuente disponible.
