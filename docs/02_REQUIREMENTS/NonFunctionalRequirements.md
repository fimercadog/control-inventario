# Requisitos No Funcionales

Fuente: `_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` §11. Los requisitos específicos de seguridad, rendimiento y accesibilidad se desglosan en documentos dedicados (`SecurityRequirements.md`, `PerformanceRequirements.md`, `AccessibilityRequirements.md`); este documento cubre lo que no encaja en ninguno de esos tres.

## Escalabilidad

- Arquitectura desacoplada: frontend (Next.js) y backend (Laravel) como aplicaciones independientes, comunicadas por API REST.
- Backend **stateless** — toda autenticación vía JWT, sin sesión de servidor. Habilita escalado horizontal y balanceadores sin pegajosidad de sesión.
- Base de datos preparada para índices y, en fase futura, particionado y réplicas (no implementado todavía — ver §64 del master spec).
- Cache (Redis) y colas (Laravel Queue / Redis / SQS) están contempladas para fase futura; **no están implementadas hoy**.

## Disponibilidad

- Objetivo declarado: el sistema debe operar 24/7.
- Estado real: no hay SLA formal ni monitoreo de uptime configurado todavía. Este es un objetivo aspiracional documentado, no una garantía verificada operacionalmente.

## Responsive / Compatibilidad de dispositivos

- El sistema debe ser compatible con: celulares, tablets, escritorio, monitores 4K.
- Verificado manualmente en la revisión RC1 de Captura IA (walkthrough responsive) — ver `06_TESTS/` para el detalle de qué se probó y cómo.

## Mantenibilidad

- Clean Architecture, Repository Pattern, Service Layer, DTO Pattern — ver `08_ADR/` para las decisiones formales y su justificación.
- Ningún módulo debe conocer la implementación interna de otro; solo interfaces.
- Documentación como parte del ciclo de vida del producto (`AGENTS.md`, regla dura: "nunca dejar documentación desactualizada").

## Integraciones (preparación arquitectónica)

Diseño preparado para integrar (§65 del master spec) — ninguna de estas, salvo OpenAI, está implementada hoy:

- WhatsApp, Telegram (no implementado).
- OpenAI (**implementado** — proveedor de IA de Captura IA, consumido vía `AIProviderInterface`, nunca acoplado directamente).
- Claude, Gemini (no implementado; la abstracción `AIProviderInterface` está diseñada para soportarlos sin reescritura).
- Google Drive, Google Sheets, correo, SMS, webhooks, ERP/CRM/Marketplace externos (no implementado).

Toda integración futura debe implementarse desacoplada mediante Services, nunca directamente desde Controllers.

## Auditoría (no funcional, transversal)

- Toda acción importante debe quedar auditada: login, logout, crear, editar, eliminar, importar, exportar, cambio de permisos, cambio de contraseña.
- `audit_logs` es inmutable — nunca se modifica ni se elimina.
- Estado real: los eventos de Auth (login/logout/cambios de sesión) sí generan entradas de auditoría (`LogAuthEventToAuditLog`). Los eventos de Captura IA quedan registrados en `capturas_ia`/`movimientos`, no necesariamente replicados en `audit_logs` con el mismo formato — pendiente de verificación exhaustiva al cerrar el Módulo 8 (Security Logs).
