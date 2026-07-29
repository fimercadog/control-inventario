# Compras

**Status: Planned — not yet implemented**

> ⚠️ **No implementar sin aprobación previa.** Bajo la Golden Rule de `AGENTS.md` (spec antes que código), ningún trabajo de implementación de este módulo puede comenzar hasta que esta spec, un Technical Spec de detalle, y una Architecture Review estén aprobados. Este documento parte del borrador original (sección 25 del master spec) reencuadrado como spec prospectiva — no describe nada construido hoy. Verificado: no existe `Compra`/`CompraDetalle` en `backend/app/Models`, no existe tabla `compras` en `backend/database/migrations`, no existe ninguna pantalla de Compras en `frontend/app`. No está en el roadmap actual (`docs/00_VISION/Roadmap.md` solo cubre Captura IA y Auth & RBAC).

## Purpose

Administrar el abastecimiento del inventario: registrar órdenes de compra a proveedores, su recepción, y la actualización de stock resultante — siempre a través de `InventoryService` (ver `Inventory.md`), nunca como una segunda vía de escritura de stock.

## Business Flow (borrador original — a validar)

```
Proveedor → Orden de Compra → Recepción → Ingreso Inventario → Actualización Stock → Auditoría
```

## Actors (borrador — a validar)

- **Compras** (rol/stakeholder ya nombrado en la sección 7 del master spec, sin permisos concretos definidos todavía).
- **Proveedor** — no es un usuario del sistema, es la entidad con la que se relaciona una compra (ver `Suppliers.md`).

## Screens

**Ninguna existe.** El borrador original (sección 49 del master spec) describía un "Formulario Compras" nunca construido. Su forma exacta (campos, layout, validaciones en vivo) queda **a definir en la etapa de diseño/arquitectura**, no en esta spec.

## Fields (borrador original — a validar)

| Campo | Notas |
|---|---|
| Proveedor | FK a `proveedores` (ver `Suppliers.md`) |
| Fecha | |
| Número | número de orden/documento |
| Observaciones | |
| Subtotal, Impuestos, Descuentos, Total | calculados desde el detalle |
| Usuario, Empresa | auditoría estándar |

Detalle (por línea):

| Campo | Notas |
|---|---|
| Producto | FK a `productos` |
| Cantidad | |
| Costo | |
| IVA | |
| Subtotal, Total | |

## Validation Rules

**A validar en implementación** — el borrador original solo enuncia reglas de alto nivel (ver "Business Rules"), sin especificar mensajes de error, límites concretos, ni comportamiento de formulario.

## Permissions

**A validar en implementación.** No existen permisos `compras.*` en el catálogo actual (`PermissionSeeder`). Deberán definirse siguiendo la misma convención `recurso.accion` ya establecida (ej. `compras.ver`, `compras.crear`, `compras.aprobar`) antes de construir cualquier ruta.

## Loading States

**A validar en implementación.**

## Empty States

**A validar en implementación.**

## Error States

**A validar en implementación.** Deberá seguir el mismo formato de error estándar (`ApiResponse`) ya usado en el resto del backend (ver `04_TECHNICAL_SPEC/API.md`).

## Business Rules (borrador original — a validar)

- Toda compra incrementa el inventario.
- No se permiten compras sin detalle (al menos una línea).
- No se permiten cantidades negativas.
- Se debe registrar auditoría (siguiendo el patrón ya construido de `AuditLog` inmutable, ver `AI_Capture.md`).
- Estados propuestos: Borrador → Pendiente → Aprobada → Recibida (o Parcial) → (o Cancelada).
- **Regla de arquitectura ya vigente que este módulo deberá respetar**: cualquier actualización de stock derivada de una compra debe pasar por `InventoryService::registrarMovimiento()` — nunca escribir `productos.stock_actual` directamente desde un Service de Compras.

## Acceptance Criteria

- [ ] **A validar en implementación**: todos los criterios de aceptación de este módulo se definen en el Technical Spec correspondiente, antes de escribir código. El borrador original no incluye criterios verificables, solo intención de alto nivel.

## Edge Cases

- Recepción parcial de una orden de compra (estado "Parcial") — mencionado en el borrador, sin definir cómo se concilia con el estado "Recibida" ni cómo afecta el stock de forma incremental.
- Compra a un proveedor inactivo — comportamiento no definido.
- **A validar en implementación**: todos los edge cases reales, una vez exista un Technical Spec.

## Future Improvements

- Definir si el costeo de compras alimenta un método de costeo de inventario (PEPS/UEPS/Promedio, mencionado también en `Inventory.md` como pendiente de decisión).
- Definir relación con Kardex (ver `Kardex.md`) — el borrador original asume que toda compra "Registra Kardex", pero eso depende de que Kardex mismo se construya primero.
- Reportes de compras (ver `Reports.md`).
