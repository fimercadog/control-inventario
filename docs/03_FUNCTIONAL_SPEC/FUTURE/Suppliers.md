# Proveedores

**Status: Planned — not yet implemented** ⚠️ **DESACTUALIZADO — el módulo ya está construido**, ver la nota de amendment inmediatamente abajo. El resto de este documento (Screens/Fields/Validation Rules/Permissions/etc.) describe el borrador original, no el código real — no usarlo como referencia de comportamiento actual. Pendiente de graduar a `docs/03_FUNCTIONAL_SPEC/Suppliers.md`, mismo tratamiento que ya recibieron Clientes/Auditoría/Reportes (ver `docs/03_FUNCTIONAL_SPEC/FUTURE/README.md`).

> ⚠️ **Amendment (2026-08-04, auditoría de campos editables de Clientes/Proveedores/Usuarios).** Verificado contra código real (no contra este documento): `Proveedor` existe (`backend/app/Models/Proveedor.php`), la tabla `proveedores` existe, y `frontend/app/(app)/proveedores` es una pantalla real — 🟢 COMPLETE per `docs/03_FUNCTIONAL_SPEC/RC1_FUNCTIONAL_MODULE_AUDIT.md`. Campos reales, bajo el modelo de identidad ERP (`docs/08_ADR/ADR-015-identity-field-model.md`, mismo día): **Identity** — `email`/`nit` (inmutables tras la creación desde ADR-015; antes editables, deshabilitados en `ProveedorFormModal` en modo edición), `empresa_id`/`id`/`created_at`/`updated_at` (read-only, estructural). **Operational** — `nombre` (no puede vaciarse en un PATCH, `filled` en `UpdateProveedorRequest`), `contacto`/`telefono`/`direccion`/`ciudad`/`pais`/`notas`. **Controlled** — `estado`, solo vía `/habilitar`/`/deshabilitar` (antes también aceptado por el PATCH genérico con el permiso más laxo `proveedores.editar` en vez de `proveedores.gestionar`). Permisos reales: `proveedores.ver`/`proveedores.crear`/`proveedores.editar`/`proveedores.gestionar` sí existen y se aplican vía `ProveedorPolicy`. No hay Service/Repository dedicado — el Controller opera directo sobre el Model (`RC1_FUNCTIONAL_MODULE_AUDIT.md:51`).
>
> ⚠️ **Actualización (mismo día).** `nit` único por empresa desde ahora — cerrado a pedido explícito del propietario del proyecto, ver ADR-015: constraint real de base de datos (migración `2026_08_04_140000_add_unique_nit_to_clientes_and_proveedores`), validación en `StoreProveedorRequest`, mensaje específico (`nit.unique`). Verificado contra datos reales antes de la migración: cero duplicados existentes.
>
> ⚠️ **Riesgo real, aún no corregido**: no existe todavía ningún flujo de corrección para un typo real en `email`/`nit` al crear el registro — la regla arquitectónica "Identity Correction" que lo resolvería está formalmente definida en ADR-015 pero deliberadamente no construida en esta unidad de trabajo (requiere además cerrar primero un prerrequisito técnico: `AuditLogger` no captura `valores_anteriores`).

**Status original (borrador, no vigente): Planned — not yet implemented**

> ⚠️ **No implementar sin aprobación previa.** Bajo la Golden Rule de `AGENTS.md`, ningún trabajo de implementación de este módulo puede comenzar hasta que esta spec, un Technical Spec de detalle, y una Architecture Review estén aprobados. Parte del borrador original (sección 26 del master spec), reencuadrado como spec prospectiva. Verificado: no existe `Proveedor` en `backend/app/Models`, no existe tabla `proveedores` en las migraciones reales (aparece únicamente en el diccionario de datos aspiracional de la sección 30 del master spec), no existe ninguna pantalla en `frontend/app`. **(Este párrafo es el borrador original citado tal cual, ver el amendment arriba para el estado real.)**

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
