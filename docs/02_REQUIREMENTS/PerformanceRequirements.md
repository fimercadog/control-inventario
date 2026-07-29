# Requisitos de Rendimiento

Fuente: `_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` §11 (Rendimiento) y §63 (Rendimiento, detallado).

## Objetivos de tiempo de respuesta

| Operación | Objetivo |
|---|---|
| CRUD genérico | < 500 ms |
| Dashboard | < 2 segundos |
| Login | < 1 segundo |

Estos son objetivos declarados en el master spec original. **No existe monitoreo de rendimiento (APM) configurado hoy** que verifique estos tiempos en producción de forma continua — son metas de diseño, no SLAs medidos.

## Estrategias de optimización (declaradas)

- Lazy loading.
- Paginación en listados.
- Índices de base de datos en columnas de consulta frecuente (incluyendo `empresa_id`, dado que es el filtro aplicado en prácticamente toda consulta vía `TenantScope`).
- Cache (Redis, fase futura — no implementado hoy).
- Consultas optimizadas, evitando el problema N+1 en relaciones Eloquent.

## Estado real verificado

- El backend es stateless (JWT, sin sesión de servidor), lo cual es un prerrequisito de rendimiento bajo carga horizontal, ya cumplido por diseño.
- No se ha ejecutado ninguna prueba de carga o benchmark formal contra los endpoints reales (Auth, Captura IA) hasta la fecha de este documento. Es un gap de verificación, no solo de infraestructura — ver `06_TESTS/PerformanceTests.md` (pendiente de autoría, ver `docs/SDD_MIGRATION_PLAN.md`).

## Consideraciones específicas de Captura IA

- Las llamadas al proveedor de IA (OpenAI) son inherentemente más lentas que un CRUD estándar (segundos, no milisegundos) por la naturaleza de la inferencia. El objetivo de "<500 ms" del master spec no aplica directamente a los endpoints de Captura IA (`/captura-ia/foto`, `/voz`, `/foto-voz`) — deben tratarse con un presupuesto de rendimiento distinto, con estados de carga explícitos en frontend (ya implementados) en vez de intentar cumplir el mismo umbral que un CRUD simple.
