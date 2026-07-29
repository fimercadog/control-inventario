# Domain Model

> Deriva de `Database.md` y de los modelos Eloquent reales en `backend/app/Models/*`. Donde este documento y el código difieran, el código gana (ver `AGENTS.md`, "Single Source of Truth").

## 1. Bounded contexts actuales

El backend real hoy cubre dos bounded contexts, no los siete descritos aspiracionalmente en `_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` §16 (Empresa, Usuarios, Productos, Inventario, Compras, Ventas — de los cuales Compras y Ventas todavía no se construyeron; permanecen como specs planificadas, no descartadas, en `03_FUNCTIONAL_SPEC/FUTURE/`):

1. **Identity & Access (Auth/RBAC)** — Empresa, User, Role/Permission (Spatie+Teams), AuthSession, SecurityLog, AuditLog. Módulos 0-2 completos (Foundations, Authentication, Company Isolation); Módulos 3-9 (Authorization/RBAC completo, User Management, Role Management, Invitations, Sessions UI, Security/Audit UI, Profile) **no están implementados** — solo lo que soporta Captura IA y aislamiento por empresa.
2. **Inventory Capture** — Categoria, Producto, Movimiento, CapturaIA, CapturaIADetalle. Un esqueleto delgado construido ad hoc para soportar Captura IA, no un módulo CRUD de Productos/Inventario completo (sin endpoints REST propios de Productos/Categorías/Movimientos todavía — ver `Architecture.md` y `API.md`).

No existen los dominios Compras, Proveedores, Ventas, Clientes, Kardex ni Reportes en el código. No están descartados — permanecen como specs planificadas (Status: Planned) en `03_FUNCTIONAL_SPEC/FUTURE/`.

## 2. Entidades y agregados

### 2.1 Empresa (tenant raíz)

`app/Models/Empresa.php` — raíz de aislamiento multi-tenant. No usa `BelongsToEmpresa` (es la propia empresa). Campos: `nombre`, `estado`. Relaciones `hasMany`: `categorias`, `productos`, `movimientos`.

### 2.2 User (agregado Identity)

`app/Models/User.php` — implementa `JWTSubject`, usa `HasRoles` (Spatie). `empresa_id` nullable (obligatorio salvo Platform Super Admin, `is_platform_admin = true`). Campos preparados sin lógica activa: `two_factor_enabled/secret/confirmed_at` (MFA futuro). Relaciones: `empresa()`, `invitedBy()` (self-referencial).

Entidades satélite de sesión/seguridad (no son parte del agregado User, tienen su propio ciclo de vida):
- **AuthSession** (`app/Models/AuthSession.php`) — refresh tokens opacos, hasheados, con expiración y revocación individual.
- **SecurityLog** (`app/Models/SecurityLog.php`) — intentos de login, éxito o fallo, de solo-inserción (`UPDATED_AT = null`).
- **AuditLog** (`app/Models/AuditLog.php`) — bitácora inmutable y genérica (relación polimórfica `auditable`), `update()`/`delete()` lanzan `LogicException` a propósito.

### 2.3 Role / Permission (Spatie + Teams)

`app/Models/Role.php` extiende `Spatie\Permission\Models\Role` únicamente para agregarle `BelongsToEmpresa` — sin esta subclase, consultas Eloquent directas (`Role::all()`) no quedarían aisladas por empresa; el team-scoping nativo de Spatie solo protege `hasRole()/can()`. `Permission` es el modelo Spatie sin modificar (catálogo global, no `empresa_id`-scoped).

### 2.4 Categoria (agregado Inventory Capture)

`app/Models/Categoria.php` — `empresa_id`-scoped (`BelongsToEmpresa`). Campos: `nombre`, `descripcion`, `estado`. `hasMany` Producto.

### 2.5 Producto (agregado Inventory Capture)

`app/Models/Producto.php` — `empresa_id`-scoped. Campos de catálogo: `codigo`, `codigo_barras`, `nombre`, `marca`, `descripcion`, `presentacion`, `costo`, `precio`, `unidad_medida`, `stock_minimo`, `stock_maximo`, `imagen`, `estado`. **`stock_actual` está deliberadamente fuera de `$fillable`**: es propiedad exclusiva de `InventoryService` (Single Source of Truth para el stock, master spec §74). `hasMany` Movimiento.

### 2.6 Movimiento (entidad, no agregado propio — pertenece a Producto)

`app/Models/Movimiento.php` — `empresa_id`-scoped. `tipo` (`entrada|salida|ajuste|conteo|transferencia`, `App\Enums\TipoMovimiento`), `cantidad`, `stock_anterior`, `stock_nuevo`, `costo`, `precio`, `observacion`, `documento`. Cada movimiento es inmutable una vez creado (append-only, propio de un kardex simplificado); no hay endpoint de edición.

### 2.7 CapturaIA / CapturaIADetalle (agregado Captura IA)

`app/Models/CapturaIA.php` — raíz del agregado, `empresa_id`-scoped, route key `uuid` (nunca expone el id numérico). `idempotency_key` + `empresa_id` único evita procesar dos veces la misma captura ante reintentos de red (ver ADR-012). `respuesta_ia_json` guarda el contrato crudo de IA para auditoría/reentrenamiento futuro. `hasMany` `CapturaIADetalle`, `morphMany` `AuditLog`.

`app/Models/CapturaIADetalle.php` (no leído en detalle aquí, ver `Database.md` §74 para el diccionario completo) — una fila por producto detectado dentro de una captura; `producto_id`/`movimiento_id` nullable hasta que se aplican.

## 3. Relaciones (resumen ER)

```
Empresa 1──N User (nullable; null solo para Platform Super Admin)
Empresa 1──N Role (Spatie Teams, team_foreign_key = empresa_id)
Empresa 1──N Categoria
Empresa 1──N Producto
Empresa 1──N Movimiento
Empresa 1──N CapturaIA
Empresa 1──N AuditLog / SecurityLog (vía usuario)

Categoria 1──N Producto
Producto 1──N Movimiento
Producto 1──N CapturaIADetalle (0..1 efectivo: nullable hasta aplicar)

CapturaIA 1──N CapturaIADetalle
CapturaIA 1──N AuditLog (polimórfico, auditable_type=CapturaIA)

User 1──N AuthSession
User 1──N SecurityLog (nullable user_id — intentos con email inexistente)
User 1──N CapturaIA (usuario_id)
User 1──N Movimiento (usuario_id)
User N──N Role (model_has_roles, Spatie Teams)
Role N──N Permission (role_has_permissions; Permission es catálogo global, no empresa-owned)
```

## 4. Invariantes de dominio (verificadas en código)

- **Stock nunca se escribe fuera de `InventoryService`** — `Producto::stock_actual` fuera de `$fillable`; `ProductService::crear()` siempre inicializa en 0 (comentario explícito en `Producto.php`).
- **`AuditLog` es append-only** — `update()`/`delete()` sobreescritos para lanzar excepción, no solo por convención.
- **`SecurityLog` es append-only** — `UPDATED_AT = null`, sin soft deletes, sin endpoint de edición.
- **Todo modelo `empresa_id`-scoped fuerza el tenant en `creating`** — `BelongsToEmpresa::bootBelongsToEmpresa()` sobreescribe cualquier `empresa_id` que llegue por mass-assignment, salvo que `TenantContext` esté en modo `bypass()` (Platform Super Admin). Ver `Security.md`.
- **`CapturaIA` usa `uuid` como identificador externo**, nunca el id autoincremental, para no filtrar volumen de capturas ni permitir enumeración.

## 5. Brechas frente al modelo aspiracional del Master Spec

| Entidad/relación del master spec §16, §29-33 | Estado real |
|---|---|
| `proveedores`, `clientes`, `compras`, `compras_detalle`, `ventas`, `ventas_detalle` | No existen todavía — no descartados, especificados como planeados en `03_FUNCTIONAL_SPEC/FUTURE/` |
| `invitations` | No existe todavía (Módulo 6, pendiente) |
| `configuraciones` (umbral de confianza por empresa) | No existe todavía; el umbral vive hardcoded en config (`.env` `CAPTURA_IA_CONFIDENCE_THRESHOLD`), no por empresa |
| Relación `RolePolicy`/`UserPolicy` completas | Solo existen `ProductoPolicy`, `MovimientoPolicy`, `CapturaIAPolicy` — todas verifican únicamente pertenencia a empresa, ninguna aún usa permisos Spatie reales en el `Gate` (Módulo 3 pendiente) |

Este documento se debe actualizar en cada módulo nuevo (Módulos 3-9) como parte de su Definition of Done.
