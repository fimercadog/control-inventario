# 05_IMPLEMENTATION/

Plan de implementación por módulo concreto (Dependencies, Database Changes, API Changes, Tests, Definition of Done). Los 4 documentos actuales son **retroactivos** — reconstruidos contra código ya existente porque este tipo de documento no existía antes de la migración a SDD. Para todo módulo futuro (Módulo 3 en adelante), debe escribirse **antes** del código, no después (`AGENTS.md`, Golden Rule).

| Documento | Módulo |
|---|---|
| [`AI_Capture.md`](AI_Capture.md) | Captura IA — foto, voz, foto+voz. |
| [`Auth_Module0_Foundations.md`](Auth_Module0_Foundations.md) | Auth Módulo 0: catálogo de permisos, roles por empresa (Teams), fundamentos. |
| [`Auth_Module1_Authentication.md`](Auth_Module1_Authentication.md) | Auth Módulo 1: login, logout, refresh, recuperación de contraseña (JWT). |
| [`Auth_Module2_CompanyIsolation.md`](Auth_Module2_CompanyIsolation.md) | Auth Módulo 2: aislamiento multi-tenant fail-closed. |

Módulos 3-9 (Authorization, User Management, Role Management, Invitations, Sessions, Security Logs, Profile) no construidos todavía — no tienen documento aquí hasta que se apruebe su especificación, siguiendo el proceso de [`../10_GOVERNANCE/MandatoryDevelopmentWorkflow.md`](../10_GOVERNANCE/MandatoryDevelopmentWorkflow.md).

Ver también: [`../09_TEMPLATES/Template_Module.md`](../09_TEMPLATES/Template_Module.md) (formato a usar para el próximo módulo).
