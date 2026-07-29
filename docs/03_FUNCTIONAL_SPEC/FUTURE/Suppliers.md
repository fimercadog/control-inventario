# Proveedores

**Status: Planned — not yet implemented**

> ⚠️ **No implementar sin aprobación previa.** Bajo la Golden Rule de `AGENTS.md`, ningún trabajo de implementación de este módulo puede comenzar hasta que esta spec, un Technical Spec de detalle, y una Architecture Review estén aprobados. Parte del borrador original (sección 26 del master spec), reencuadrado como spec prospectiva. Verificado: no existe `Proveedor` en `backend/app/Models`, no existe tabla `proveedores` en las migraciones reales (aparece únicamente en el diccionario de datos aspiracional de la sección 30 del master spec), no existe ninguna pantalla en `frontend/app`.

## Purpose

Administrar la base de proveedores de cada empresa, como entidad relacionada de `Purchases.md`.

## Business Flow (borrador original — a validar)

Alta de proveedor → consulta/búsqueda → edición → (inactivación, nunca eliminación si tiene compras asociadas).

## Actors (borrador — a validar)

- **Compras** (mismo stakeholder que en `Purchases.md`).

## Screens

**Ninguna existe.** El borrador original (sección 55, "Pantalla Proveedores") describe una pantalla nunca construida; su forma real queda **a definir en la etapa de diseño**.

## Fields (borrador original — a validar)

| Campo | Notas |
|---|---|
| NIT | identificador fiscal |
| Nombre, Razón Social | |
| Dirección, Ciudad, Departamento, País | |
| Teléfono, Correo, Contacto | |
| Estado | activo/inactivo |
| Empresa | tenant, vía `TenantScope` como el resto del sistema |

Indicadores propuestos (sección 55): Compras Totales, Monto Comprado, Última Compra, Productos Suministrados — todos derivados de `Purchases.md`, no datos propios de este módulo.

## Validation Rules

**A validar en implementación.**

## Permissions

**A validar en implementación.** No existen permisos `proveedores.*` en el catálogo actual; deberán seguir la convención `recurso.accion` ya establecida.

## Loading States

**A validar en implementación.**

## Empty States

**A validar en implementación.**

## Error States

**A validar en implementación.**

## Business Rules (borrador original — a validar)

- No se permite eliminar un proveedor que tenga compras registradas (solo inactivar).
- Se debe conservar historial (auditoría) de cambios sobre un proveedor.

## Acceptance Criteria

- [ ] **A validar en implementación**: se definen en el Technical Spec correspondiente, antes de escribir código.

## Edge Cases

- Proveedor con NIT duplicado dentro de la misma empresa — regla de unicidad no confirmada en el borrador original.
- **A validar en implementación**: el resto de los edge cases reales.

## Future Improvements

- Historial de compras por proveedor, una vez exista `Purchases.md`.
- Reportes de proveedores (ver `Reports.md`).
