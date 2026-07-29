# Problemas Conocidos

> Incorpora textualmente la sección "Límites conocidos del MVP" de `DEMO.md` (raíz del repo, sin modificar) más gaps adicionales identificados durante la migración a Specification-Driven Development. `DEMO.md` sigue siendo la fuente para la audiencia de demo/ventas; este documento es la versión de release engineering, con más detalle técnico donde aplica.

## Del MVP (fuente: `DEMO.md` §7, incorporado por referencia)

1. **No hay autenticación real (JWT) — DESACTUALIZADO en `DEMO.md`.** `DEMO.md` todavía describe el login como una sesión local de demo (cualquier email/password válido). **Esto ya no es cierto**: Auth Módulo 1 implementó login/logout/refresh reales con JWT, verificado por navegador. `DEMO.md` no se modifica como parte de esta migración (fuera de su alcance, ver `docs/SDD_MIGRATION_PLAN.md` §1.8), pero cualquier lector debe tratar esa sección de `DEMO.md` como desactualizada y confiar en `docs/05_IMPLEMENTATION/Auth_Module1_Authentication.md` en su lugar.
2. **Dashboard, Productos y Movimientos usan datos de ejemplo (mock) del lado del frontend** — no existen todavía endpoints REST de Empresas/Productos/Movimientos/Reportes en el backend. Solo el flujo de Captura IA (`/api/v1/captura-ia/*`) es 100% real, contra la base de datos y (si hay API key) contra OpenAI. **Vigente.**
3. **Requiere una `OPENAI_API_KEY` válida y con saldo** para que el análisis de foto/voz funcione de extremo a extremo; sin ella, el paso de análisis falla con un error amigable. **Vigente.**
4. **Una sola empresa de demo** (`Fidel OS Demo`, id `1`) — no hay selector de empresa ni multi-tenant real en la UI todavía (el backend sí aísla correctamente por empresa; lo que falta es la UI para operar con más de una). **Vigente.**
5. **Sin roles ni permisos aplicados en la UI** — el catálogo de permisos existe (Auth Módulo 0) y el mecanismo de Teams aísla correctamente por empresa, pero la aplicación fina de permisos a rutas/Componentes es Auth Módulo 3, todavía no construido. Cualquier sesión autenticada tiene acceso completo dentro de su empresa. **Vigente, parcialmente desactualizado**: ya no es cierto que "cualquier sesión de demo tiene acceso completo" en el sentido de `DEMO.md` (ya no es una sesión mock) — pero sí es cierto que no hay restricción fina de permisos todavía.
6. **Sin soporte todavía para código de barras, QR, OCR de PDF o video** — la arquitectura de Captura IA está preparada para estos tipos futuros (mismo pipeline, misma interfaz `AIProviderInterface`), pero no están implementados en este MVP. **Vigente.**
7. **Sin notificaciones/listeners sobre los eventos de dominio** (`ProductCreated`, `StockUpdated`, `InventoryMovementRegistered`, `AICaptureCompleted`) — los eventos se disparan correctamente pero aún no tienen listeners (email, webhooks, etc.), por diseño de esta fase. **Vigente.**

## Adicionales, identificados durante la migración SDD

8. **Sin tests de frontend automatizados.** Cero cobertura automatizada del frontend; toda verificación es manual (ver `docs/06_TESTS/ManualTestCases.md`). Riesgo real de regresión silenciosa en UI.
9. **Sin CI/CD.** No existe pipeline (`.github/workflows` no existe). Ningún chequeo (tests, lint, build) corre automáticamente ante un cambio.
10. **Sin tests de performance/carga.** Nunca se ha medido cuánto tarda el pipeline de Captura IA bajo concurrencia real (ver `docs/06_TESTS/PerformanceTests.md`).
11. **Sin auditoría ni requisitos de accesibilidad.** No existe ni siquiera un checklist manual de accesibilidad (ver `docs/02_REQUIREMENTS/AccessibilityRequirements.md`).
12. **Sin rate limiting documentado en `login`.** No verificado si existe protección contra fuerza bruta en el endpoint de login.
13. **Procesamiento de Captura IA es síncrono, no asíncrono.** `ProcesarCapturaIAJob` existe y es queueable, pero el Controller lo sigue llamando de forma síncrona — sin worker de cola corriendo por defecto. Una imagen grande o una llamada lenta de OpenAI se traduce directamente en latencia de la request HTTP.
14. **Sin CHANGELOG.md previo a esta migración.** El historial de cambios de Captura IA y Auth Módulos 0-2 no quedó registrado en un changelog formal en su momento; se reconstruye retroactivamente en `ReleaseNotes.md` de esta migración, pero el detalle día a día de esa sesión de desarrollo no existe como registro versionado.

## Severidad (informal, sin escala formal definida)

Ninguno de los puntos anteriores es, a la fecha de esta migración, un bug bloqueante para la demo o para el uso interno del MVP tal como está delimitado. Los puntos 8-11 sí representan riesgo creciente si el proyecto avanza sin cerrarlos antes de exponerse a usuarios reales fuera de una demo controlada.
