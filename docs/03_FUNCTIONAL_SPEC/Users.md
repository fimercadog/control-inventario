# Gestión de Usuarios

**Status: Planned — not yet implemented**

> Corresponde al Módulo 4 (User Management) del roadmap Auth & RBAC, marcado como pendiente (`[ ]`) en `docs/00_VISION/Roadmap.md`. Verificado: no existe `UserController` en `backend/app/Http/Controllers`, no hay rutas `GET/PATCH /usuarios` en `backend/routes/api.php` (solo están documentadas como diseño en `04_TECHNICAL_SPEC/API.md`), y no existe ninguna pantalla `/usuarios` en `frontend/app`. Lo único construido hoy es la base de datos (`users` con los campos que este módulo necesitará: `is_active`, `last_activity_at`, `last_login_ip`, `last_user_agent`, `invited_at`, `invited_by`) y el modelo `App\Models\User`. Esta spec reemplaza el borrador de la sección 18 del master spec (que asumía registro propio y un modelo de roles distinto) con el diseño real ya decidido en `04_TECHNICAL_SPEC/Architecture.md`, pero sigue siendo una especificación **prospectiva**: gatea el inicio de la implementación, no la describe retroactivamente.

## Purpose

Permitir que un usuario con permiso de gestión (`usuarios.ver`/`usuarios.editar`) vea el listado de usuarios de su propia empresa, consulte su actividad reciente, y pueda activar/desactivar una cuenta — sin exponer nunca usuarios de otra empresa.

## Business Flow (propuesto)

1. Un usuario con `usuarios.ver` navega a `/usuarios` y ve la lista de usuarios de su empresa (nunca de otra, por `TenantScope`).
2. Puede ver detalle de un usuario: `last_activity_at`, `last_login_ip`, `last_user_agent`, rol(es) asignado(s), estado (`is_active`).
3. Un usuario con `usuarios.editar` puede activar o desactivar una cuenta (`PATCH /usuarios/{id}/activar|desactivar`).
4. La creación de usuarios **no ocurre aquí** — es responsabilidad del Módulo 6 (Invitaciones, ver `04_TECHNICAL_SPEC/API.md`), fuera del alcance de esta spec.

## Actors

- **Usuario con `usuarios.ver`**: puede listar y ver detalle.
- **Usuario con `usuarios.editar`**: además puede activar/desactivar.
- **Platform Super Admin**: fuera del alcance de esta pantalla — su superficie equivalente es `GET /plataforma/empresas/{id}/usuarios` (namespace `plataforma.*`, ver `Roles.md`).

## Screens (propuesto)

- **`/usuarios`**: tabla de usuarios de la empresa actual — nombre, email, rol, estado, última actividad. Acción de fila para activar/desactivar.
- **`/usuarios/{id}`** (o modal/drawer): detalle de un usuario — actividad, sesiones (si se integra con Módulo 7), rol asignado.

## Fields (propuesto)

| Campo | Fuente (ya existe en `users`) | Notas |
|---|---|---|
| name, email | `users` | |
| empresa_id | `users` | siempre el de la empresa del usuario que consulta |
| is_active | `users` | toggle activar/desactivar |
| last_activity_at, last_login_ip, last_user_agent | `users` | ya se actualizan desde el Módulo 1 (login/refresh) |
| rol asignado | `model_has_roles` (Spatie) | ver `Roles.md` |
| invited_at, invited_by | `users` | trazabilidad de cómo se creó la cuenta |

## Validation Rules (propuesto)

- **A definir en implementación**: reglas exactas de qué campos son editables desde esta pantalla (probablemente solo estado y rol; nombre/email podrían ser responsabilidad del propio usuario vía `Perfil`, ver `Settings.md`).

## Permissions

Catálogo ya sembrado (`PermissionSeeder`): `usuarios.ver`, `usuarios.editar`, `usuarios.invitar`. Ninguno enforced todavía porque no hay rutas que los consuman.

## Loading States (propuesto)

**A validar en implementación**: skeleton de tabla mientras carga el listado, siguiendo el patrón ya usado en el resto del sistema (`components/ui/skeleton.tsx`).

## Empty States (propuesto)

**A validar en implementación**: estado vacío si una empresa nueva solo tiene al usuario actual (ningún usuario invitado todavía) — probablemente con una llamada a la acción hacia el flujo de invitación del Módulo 6.

## Error States (propuesto)

**A validar en implementación**: manejo de 403 (usuario sin `usuarios.ver` navega directo a la URL), manejo de error al desactivar la propia cuenta (¿se permite? — decisión de producto pendiente).

## Business Rules

- `TenantScope` garantiza que este listado nunca cruza el límite de empresa, salvo para el Platform Super Admin (que usa una superficie distinta, `plataforma.*`).
- Un usuario normal (`empresa_id` no nulo) nunca puede volverse `is_platform_admin = true` desde esta pantalla ni desde ninguna otra — se valida a nivel de aplicación (`UserPolicy`/`RoleService`, según `04_TECHNICAL_SPEC/Architecture.md`).
- **A definir**: ¿puede un usuario desactivarse a sí mismo? ¿Puede desactivar al último usuario con `usuarios.editar` de la empresa, dejándola sin administrador? — riesgo real, sin decisión de producto tomada todavía.

## Acceptance Criteria

- [ ] **A validar en implementación**: listado muestra únicamente usuarios de la empresa del usuario autenticado.
- [ ] **A validar en implementación**: activar/desactivar requiere `usuarios.editar` y responde 403 sin él.
- [ ] **A validar en implementación**: desactivar un usuario revoca sus `auth_sessions` activas (consistencia con el comportamiento ya implementado en reset de contraseña).
- [ ] **A validar en implementación**: un Platform Super Admin nunca aparece en este listado (no tiene `empresa_id`).

## Edge Cases

- Última cuenta con `usuarios.editar` de una empresa intenta desactivarse a sí misma — **a validar en implementación**, riesgo de empresa sin administrador.
- Usuario invitado que nunca completó la invitación (sin contraseña definida) — ¿aparece en este listado o solo en el de invitaciones pendientes del Módulo 6? **a validar en implementación**.

## Future Improvements

- Integración con Módulo 7 (Active Sessions): ver/revocar sesiones de otro usuario de la misma empresa desde su ficha de detalle.
- Integración con Módulo 8 (Security Logs): ver intentos de login de un usuario específico desde su ficha.
- Exportar listado de usuarios.

---

**Nota de gobernanza (AGENTS.md, Golden Rule):** ninguna línea de código de este módulo puede escribirse hasta que esta spec, un Technical Spec de detalle, y una Architecture Review estén aprobados. Las secciones marcadas "propuesto" o "a validar en implementación" son intencionalmente el punto de partida de esa conversación, no una autorización para construir.
