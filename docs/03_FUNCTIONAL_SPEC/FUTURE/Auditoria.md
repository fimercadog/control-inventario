# Auditoría y Trazabilidad

**Status: Planned — not yet implemented**

> ⚠️ **No implementar sin aprobación previa.** Bajo la Golden Rule de `AGENTS.md`, ningún trabajo de implementación de este módulo puede comenzar hasta que esta spec, un Technical Spec de detalle, y una Architecture Review estén aprobados.
>
> **Origen:** requisito de producto entregado directamente por el product owner (sesión 2026-07-29), no proviene del master spec original. Reconciliado contra dos versiones sucesivas del mismo requisito que el product owner entregó en la misma sesión — la primera versión usaba nombres propios como ejemplo ("Juan Pérez"); la segunda corrigió explícitamente esa regla ("El sistema nunca debe registrar nombres propios de personas... Siempre debe utilizar: Usuario autenticado / Rol asignado"). Esta spec usa la segunda versión como autoritativa, por decisión explícita del product owner al confirmarla.
>
> **Verificado contra código real:** ya existe infraestructura de datos parcial. `App\Models\AuditLog` (ver `docs/04_TECHNICAL_SPEC/Security.md` línea 81 y `docs/04_TECHNICAL_SPEC/DomainModel.md`) es una bitácora inmutable y genérica (`update()`/`delete()` lanzan `LogicException` a propósito), con relación polimórfica `auditable_type`/`auditable_id`. Hoy solo `Services/Audit/AuditLogger::registrarCapturaIA()` escribe en esta tabla — un registro por captura de IA. Los eventos de Login/Logout van a `SecurityLog`, un modelo distinto con propósito distinto (intentos de acceso, incluyendo no autenticados), no a `AuditLog`. El permiso `auditoria.ver` **ya está sembrado** en el catálogo global (`PermissionSeeder`, ver `docs/03_FUNCTIONAL_SPEC/Roles.md` línea 48), aunque no hay ninguna pantalla ni middleware que lo use todavía.
>
> Este módulo, tal como se especifica aquí, es la generalización de `AuditLog` a **todos** los módulos de negocio (no solo Captura IA) más una UI dedicada — no una tabla ni un modelo nuevo.

## Purpose

Ser el registro único, centralizado y de solo lectura de toda acción relevante realizada en el sistema, para que ninguna operación de negocio quede sin trazabilidad. Ningún módulo mantiene su propia auditoría aislada — todos escriben al mismo registro central.

## Business Flow

1. Un usuario autenticado ejecuta una acción relevante en cualquier módulo (crear, editar, eliminar, iniciar/cerrar sesión, mover inventario, generar un reporte, descargar un PDF/Excel, cambiar configuración, etc.).
2. El sistema, de forma automática y transparente al usuario, registra un evento de auditoría — el usuario nunca interactúa directamente con este registro al momento de generarlo.
3. Un usuario con permiso `auditoria.ver` accede al módulo de Auditoría y Trazabilidad, consulta/filtra/exporta el historial acumulado.

## Actors

- **Usuario con permiso `auditoria.ver`** — el catálogo global ya reserva este permiso (ver nota de verificación arriba); a confirmar en el Technical Spec qué rol(es) lo tendrán por defecto.
- **Cualquier usuario autenticado** — como generador implícito de eventos, no como actor que opera esta pantalla.
- **Platform Super Admin** (`is_platform_admin`) — a definir en Technical Spec si ve auditoría cross-empresa o si permanece aislado por `empresa_id` como el resto del sistema (regla por defecto: aislado, salvo excepción explícita — ver `docs/04_TECHNICAL_SPEC/Security.md`).

## Screens

- `/auditoria` — tabla principal con filtros y exportación.
- Panel de estadísticas (dashboard), como sección de la misma pantalla o pestaña separada — a definir en Technical Spec.

Ninguna existe todavía.

## Fields (registro de auditoría)

**Regla de privacidad, no negociable:** el sistema nunca registra ni muestra nombres propios de personas. Todo registro y toda pantalla muestran únicamente **usuario autenticado** (identificador de cuenta, ej. `admin01`, `inventario03`) y **rol asignado** (ej. Administrador, Auxiliar de Inventario, Vendedor, Regente de Farmacia, Bodeguero) — nunca el nombre real de la persona detrás de la cuenta.

| Campo | Notas |
|---|---|
| ID de auditoría | identificador único del registro |
| Fecha | |
| Hora | |
| Usuario | identificador de cuenta autenticada — **nunca nombre propio** |
| Rol | rol asignado al usuario en el momento de la acción (no el rol actual si cambió después — a confirmar en Technical Spec si se guarda como snapshot o se resuelve en vivo contra `model_has_roles`) |
| Módulo | módulo de negocio donde ocurrió la acción |
| Acción realizada | descripción de la acción (ej. "Creó un producto") |
| Tipo de operación | clasificación (creación/edición/eliminación/consulta/exportación/etc. — ver "Acciones registradas") |
| Registro afectado | tipo de entidad afectada |
| ID del registro afectado | identificador de la entidad afectada |
| Estado anterior | JSON, cuando aplique |
| Estado nuevo | JSON, cuando aplique |
| Dirección IP | si está disponible |
| Dispositivo / Navegador | si está disponible (user agent) |
| Observaciones | |

**Reconciliación con `AuditLog` actual:** la mayoría de estos campos ya existen en el modelo real (`usuario_id`, `empresa_id`, `modulo`, `accion`, `auditable_type`/`auditable_id`, `valores_anteriores`/`valores_nuevos`, `resultado`, `ip`, `user_agent`). Los campos genuinamente nuevos frente al modelo actual son: **Rol** (no se persiste hoy en ningún punto del registro de auditoría) y la garantía explícita, a nivel de contrato, de que ningún campo exponga el nombre real de la persona en ninguna capa (API, frontend, exportación). Ambos puntos deben resolverse en el Technical Spec antes de construirse.

## Validation Rules

No aplica en el sentido tradicional — el módulo es de solo lectura. No existe formulario de creación/edición manual de un registro de auditoría; todo registro se genera automáticamente por el sistema.

## Permissions

`auditoria.ver` (ya sembrado en el catálogo global, ver nota de verificación arriba) — a confirmar en Technical Spec si se necesita un segundo permiso para exportar (`auditoria.exportar`) o si `auditoria.ver` cubre también la exportación.

## Loading States

**A validar en implementación.**

## Empty States

**A validar en implementación** — empresa recién creada, sin eventos todavía.

## Error States

**A validar en implementación.**

## Business Rules

- Ningún módulo mantiene su propia auditoría aislada — todo evento relevante se centraliza en este registro único.
- Los registros de auditoría **nunca pueden modificarse ni eliminarse** — ya garantizado a nivel de modelo por `AuditLog::update()`/`delete()` (lanzan excepción), consistente con la regla general de este módulo.
- El módulo es estrictamente de solo lectura para sus usuarios.
- Nunca se registra ni se muestra el nombre real de una persona — solo usuario autenticado y rol asignado.
- Toda la información se conserva indefinidamente para mantener trazabilidad completa (a confirmar en Technical Spec si aplica alguna política de retención/archivado por volumen, dado que un registro por cada acción de cada módulo puede crecer rápido).

### Funciones del módulo

- Visualizar todos los eventos del sistema.
- Consultar el historial completo.
- Buscar cualquier operación realizada (texto libre).
- Filtrar información (ver "Filtros").
- Exportar reportes (PDF, Excel, CSV — ver `docs/03_FUNCTIONAL_SPEC/FUTURE/Export.md`, capacidad compartida con el resto del sistema).
- Revisar cambios realizados (estado anterior vs. estado nuevo).
- Consultar movimientos por usuario, por rol, por módulo, por producto, por documento.

### Filtros

- Fecha inicial / Fecha final
- Usuario
- Rol
- Módulo
- Acción
- Tipo de movimiento
- Producto
- Código del producto
- Documento
- Estado
- Texto libre

### Acciones registradas (mínimo)

Inicio de sesión, cierre de sesión, creación, edición, eliminación lógica, restauración, entradas de inventario, salidas de inventario, ajustes de inventario, transferencias, compras, ventas, devoluciones, creación de usuarios, cambio de contraseña, cambio de permisos, cambio de roles, generación de reportes, descarga de PDF, descarga de Excel, configuración del sistema.

**Nota de reconciliación:** varias de estas acciones pertenecen a módulos que hoy son `[PLANNED]` (Compras, Ventas — ver `03_FUNCTIONAL_SPEC/FUTURE/`) o a Auth Módulos 3-9 no construidos (cambio de roles/permisos). Este módulo debe registrar esas acciones **cuando esos módulos existan**, no antes — no se debe inventar un evento de auditoría para una acción que el sistema todavía no puede realizar.

### Tabla principal

Columnas: Fecha, Hora, Usuario, Rol, Módulo, Acción, Registro, Resultado, Observaciones.

Capacidades: ordenar por cualquier columna, búsqueda instantánea, paginación, exportación a PDF/Excel/CSV, impresión.

### Panel de estadísticas

- Total de eventos del día / del mes.
- Usuarios más activos.
- Roles con mayor actividad.
- Módulos con mayor actividad.
- Productos con más movimientos.
- Entradas vs. salidas.
- Últimos eventos registrados.
- Actividad por hora / por día / por usuario.

## Acceptance Criteria

- [ ] **A validar en implementación**: se definen en el Technical Spec correspondiente, antes de escribir código.
- [ ] Ningún registro ni ninguna pantalla expone el nombre real de una persona en ningún punto — verificable por test.
- [ ] Los registros de auditoría son inmutables (ya garantizado a nivel de modelo; el Technical Spec debe confirmar que ninguna ruta nueva lo bypassea).

## Edge Cases

- Volumen alto de eventos (una empresa con actividad intensa puede generar miles de registros por día) — necesidad de paginación e índices, a definir en Technical Spec.
- Usuario cuyo rol cambió después de una acción — ¿el registro histórico muestra el rol de ese momento o el rol actual? Marcado como pendiente de decisión arriba (campo Rol).
- **A validar en implementación**: el resto de los edge cases reales.

## Future Improvements

- Integración con `AuditLogger` existente para que todos los módulos nuevos (a partir del Módulo 3 de Auth/RBAC en adelante, y cualquier módulo de `03_FUNCTIONAL_SPEC/FUTURE/` que se construya) escriban aquí desde el día uno de su implementación, no de forma retroactiva.
- Política de retención/archivado si el volumen de registros lo justifica.
