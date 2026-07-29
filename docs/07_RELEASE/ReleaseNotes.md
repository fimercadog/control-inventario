# Release Notes

## Como parte de esta migración a Specification-Driven Development

*(fecha de referencia: 2026-07-29 — fecha de esta migración de documentación; el trabajo descrito abajo fue construido en la sesión de desarrollo inmediatamente anterior)*

Esta es la primera entrada real de `ReleaseNotes.md` — el archivo no existía antes de esta migración (`docs/SDD_MIGRATION_PLAN.md` §4). Documenta lo que está efectivamente construido y probado en el repositorio a la fecha, correspondiente al pase de verificación **RC1** (ver `ReleaseCandidate.md`).

### Añadido

- **Módulo Captura IA** (backend + frontend, feature-complete): captura de inventario por Foto, Voz, o Foto + Voz combinada, vía `AIProviderInterface` (implementación actual: OpenAI). Deduplicación y suma automática de productos idénticos detectados en una misma captura. Umbral de confianza (0.85 por defecto): auto-aplica sobre el umbral, envía a cola de revisión por debajo. Idempotencia opt-in vía header `Idempotency-Key`. Transacciones atómicas (todo-o-nada por captura). Eventos de dominio (`ProductCreated`, `StockUpdated`, `InventoryMovementRegistered`, `AICaptureCompleted`) preparados, sin listeners todavía. Auditoría inmutable de cada captura.
- **Auth Módulo 0 — Fundamentos**: JWT (`tymon/jwt-auth`) + RBAC con Teams (`spatie/laravel-permission`, `team_foreign_key = empresa_id`). Catálogo global de permisos sembrado, incluyendo namespace `plataforma.*` para el Platform Super Admin. Tablas `auth_sessions`, `security_logs`, `invitations`.
- **Auth Módulo 1 — Authentication**: login/logout/refresh (con rotación de refresh token)/me, recuperación de contraseña, registro de intentos en `security_logs`. Access token en body de respuesta (memoria del cliente); refresh token exclusivamente en cookie httpOnly. Todas las rutas de negocio (Captura IA) cerradas detrás de autenticación — cero endpoints públicos de negocio.
- **Auth Módulo 2 — Company Isolation**: `TenantScope` global fail-closed, middleware `IdentifyTenant`, trait `BelongsToEmpresa`, Policies de ownership como defensa en profundidad. Bypass exclusivo para Platform Super Admin. 25 tests adversariales.

### Verificado

- 94 tests automatizados de backend, todos pasando (`docs/06_TESTS/AutomatedTests.md`).
- Walkthrough manual completo de Captura IA vía navegador real, incluyendo Foto+Voz.
- Login real vía navegador (cookie httpOnly, refresh silencioso tras reload duro, "Remember Me").
- Revisión responsive (mobile/tablet/desktop).

### Corregido

- Un 500 crudo en requests no autenticadas sin header `Accept: application/json` (Auth Módulo 1) — ahora responde 401 limpio.
- Una condición de carrera de orden de middleware que permitía que el route-model-binding resolviera antes de que el contexto de tenant estuviera fijado (Auth Módulo 2).

### Gaps conocidos en este release (no ocultos, ver `KnownIssues.md`)

- Sin tests de frontend automatizados.
- Sin CI/CD.
- Sin Auth Módulos 3-9 (Authorization, User Management, Role Management, Invitaciones, Active Sessions, Security Logs UI, User Profile).
- Sin CRUD real de Productos/Movimientos (mock en frontend salvo lo escrito por Captura IA).
- Requiere `OPENAI_API_KEY` con saldo para el análisis real de foto/voz.

### Documentación

- Migración completa de `docs/` a la estructura Specification-Driven Development declarada en `AGENTS.md` (`00_VISION` … `09_TEMPLATES`), ejecutada según `docs/SDD_MIGRATION_PLAN.md`.
