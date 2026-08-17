# Fase 3 — Seguridad

**Estado: COMPLETA (heredada, verificada, no reconstruida).**

- **Usuarios** — ya existía, el módulo más maduro del proyecto, usado como plantilla base para el resto (spec.md sección 2, Fase 3). Sin cambios.
- **Roles** — ya existía, incluye el selector de permisos real (`GET /permisos`) dentro de su propio modal de Crear/Editar.
- **Permissions** — no es un módulo/página independiente. El backend solo expone un catálogo de solo lectura (`GET /v1/permisos`), consumido exclusivamente por el selector de permisos de Roles. No existe ni se construye una página `/permisos` separada — confirmado contra `routes/api.php` (una sola ruta, sin controlador CRUD propio) antes de asumir que faltaba construirse.

Sin incidentes. Sin cambios de código en esta fase.
