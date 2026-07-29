# Ventas

**Status: Planned — not yet implemented**

> ⚠️ **No implementar sin aprobación previa.** Bajo la Golden Rule de `AGENTS.md`, ningún trabajo de implementación de este módulo puede comenzar hasta que esta spec, un Technical Spec de detalle, y una Architecture Review estén aprobados. Parte del borrador original (sección 27 del master spec), reencuadrado como spec prospectiva. Verificado: no existe `Venta`/`VentaDetalle` en `backend/app/Models`, no existe tabla `ventas` en las migraciones reales, no existe ninguna pantalla en `frontend/app`. No está en el roadmap actual.

## Purpose

Controlar todas las ventas realizadas por una empresa, generando salida de inventario y, eventualmente, facturación — siempre a través de `InventoryService` (ver `Inventory.md`) para el descuento de stock, nunca como una segunda vía de escritura.

## Business Flow (borrador original — a validar)

```
Cliente → Venta → Detalle → Salida Inventario → Factura → Dashboard
```

## Actors (borrador — a validar)

- **Ventas** (rol/stakeholder ya nombrado en la sección 7 del master spec, sin permisos concretos definidos todavía).
- **Cliente** — no es un usuario del sistema, es la entidad con la que se relaciona una venta (ver `Customers.md`).

## Screens

**Ninguna existe.** El borrador original (sección 50 del master spec, implícito en la lista de formularios nunca construidos) no llegó a detallar un formulario de Ventas específico; su forma real queda **a definir en la etapa de diseño**.

## Fields (borrador original — a validar)

| Campo | Notas |
|---|---|
| Cliente | FK a `clientes` (ver `Customers.md`) |
| Fecha | |
| Número | número de factura/documento |
| Observaciones | |
| Subtotal, IVA, Descuento, Total | calculados desde el detalle |
| Usuario, Empresa | auditoría estándar |

Estados propuestos: Borrador, Pendiente, Facturada, Pagada, Anulada.

Dashboard de Ventas propuesto (sección 27): Ventas Hoy, Ventas Mes, Ventas Año, Top Clientes, Top Productos, Margen, Ticket Promedio — todo **a validar** si sigue siendo relevante para el negocio real antes de construirlo.

## Validation Rules

**A validar en implementación.**

## Permissions

**A validar en implementación.** No existen permisos `ventas.*` en el catálogo actual; deberán seguir la convención `recurso.accion` ya establecida.

## Loading States

**A validar en implementación.**

## Empty States

**A validar en implementación.**

## Error States

**A validar en implementación.**

## Business Rules (borrador original — a validar)

- No se permite vender sin stock disponible.
- No se permiten cantidades negativas.
- El inventario se actualiza automáticamente (vía `InventoryService`, consistente con el resto del sistema).
- Se debe registrar Kardex (ver `Kardex.md`, también pendiente).
- Se debe registrar auditoría.

## Acceptance Criteria

- [ ] **A validar en implementación**: se definen en el Technical Spec correspondiente, antes de escribir código.

## Edge Cases

- Venta que excede el stock disponible en el momento exacto de confirmar (condición de carrera con otra venta simultánea) — deberá resolverse con el mismo mecanismo de `lockForUpdate()` ya usado en `InventoryService`.
- Anulación de una venta ya facturada — ¿revierte el movimiento de inventario? El borrador original no lo especifica.
- **A validar en implementación**: el resto de los edge cases reales.

## Future Improvements

- Definir si "Ventas" es prerequisito o independiente de "Facturación" formal (impuestos, numeración legal) — el borrador original los trata como parte del mismo flujo sin separarlos.
- Reportes de ventas (ver `Reports.md`).
- Relación con Clientes (ver `Customers.md`) para historial de compras y clasificación.
