# Clientes

**Status: Planned — not yet implemented**

> ⚠️ **No implementar sin aprobación previa.** Bajo la Golden Rule de `AGENTS.md`, ningún trabajo de implementación de este módulo puede comenzar hasta que esta spec, un Technical Spec de detalle, y una Architecture Review estén aprobados. Parte del borrador original (sección 28 del master spec), reencuadrado como spec prospectiva. Verificado: no existe `Cliente` en `backend/app/Models`, no existe tabla `clientes` en las migraciones reales, no existe ninguna pantalla en `frontend/app`.

## Purpose

Administrar la base de clientes de cada empresa, como entidad relacionada de `Sales.md`.

## Business Flow (borrador original — a validar)

Alta de cliente → consulta/búsqueda → edición → (inactivación) → consulta de historial de compras.

## Actors (borrador — a validar)

- **Ventas** (mismo stakeholder que en `Sales.md`).

## Screens

**Ninguna existe.** El borrador original (sección 54, "Pantalla Clientes") describe una pantalla nunca construida; su forma real queda **a definir en la etapa de diseño**.

## Fields (borrador original — a validar)

| Campo | Notas |
|---|---|
| Documento, Tipo Documento | |
| Nombre, Apellido | |
| Correo, Teléfono | |
| Dirección, Ciudad, Departamento, País | |
| Fecha Nacimiento | |
| Estado | activo/inactivo |
| Empresa | tenant, vía `TenantScope` |

Clasificación propuesta: Cliente Nuevo, Cliente Frecuente, Cliente Premium, Cliente Inactivo — reglas de corte entre categorías **no definidas** en el borrador original.

## Validation Rules

**A validar en implementación.**

## Permissions

**A validar en implementación.** No existen permisos `clientes.*` en el catálogo actual; deberán seguir la convención `recurso.accion` ya establecida.

## Loading States

**A validar en implementación.**

## Empty States

**A validar en implementación.**

## Error States

**A validar en implementación.**

## Business Rules (borrador original — a validar)

- Historial de compras por cliente (monto, frecuencia, última compra) — depende enteramente de que `Sales.md` exista primero.
- Reportes propuestos: Clientes Nuevos, Clientes Activos, Clientes Inactivos, Top Compradores, Ventas por Cliente, Frecuencia de Compra.

## Acceptance Criteria

- [ ] **A validar en implementación**: se definen en el Technical Spec correspondiente, antes de escribir código.

## Edge Cases

- Cliente con documento duplicado dentro de la misma empresa — regla de unicidad no confirmada en el borrador original.
- **A validar en implementación**: el resto de los edge cases reales.

## Future Improvements

- Integraciones futuras mencionadas en el borrador original (sección 28): CRM, WhatsApp, correo electrónico, SMS, campañas, automatizaciones con IA — todas explícitamente fuera de alcance de este módulo base, y ninguna con decisión de producto tomada.
