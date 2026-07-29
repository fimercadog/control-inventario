# Kardex

**Status: Planned — not yet implemented**

> ⚠️ **No implementar sin aprobación previa.** Bajo la Golden Rule de `AGENTS.md`, ningún trabajo de implementación de este módulo puede comenzar hasta que esta spec, un Technical Spec de detalle, y una Architecture Review estén aprobados. Fuente: sección 53 ("Kardex") y menciones dentro de la sección 24 (Módulo Movimientos) del master spec, reencuadradas como spec prospectiva. Verificado: no existe una tabla `kardex` ni una pantalla dedicada en el sistema real. Lo que sí existe hoy es el historial de `movimientos` (ver `Movements.md`), que es la fuente de datos natural de la que este módulo debería derivarse — **nunca una tabla paralela**.

## Purpose

Ofrecer, por producto, una vista cronológica de entradas, salidas y saldo acumulado — la trazabilidad completa de un artículo del inventario, de solo lectura e inmutable.

## Business Flow (borrador original — a validar)

El borrador original (sección 24) dice: "Cada movimiento actualizará automáticamente el Kardex del producto. Nunca podrá modificarse manualmente." Esto sugiere fuertemente que Kardex debería ser una **vista derivada** de `movimientos` (ver `Movements.md`) filtrada por producto y ordenada cronológicamente con saldo corrido — no una tabla propia que haya que mantener sincronizada por separado. Esta interpretación debe confirmarse explícitamente en el Technical Spec antes de construirse, porque una tabla `kardex` paralela introduciría exactamente el riesgo de doble fuente de verdad que el resto del sistema (Captura IA, Inventario) evita deliberadamente.

## Actors (borrador — a validar)

- Cualquier usuario con `movimientos.ver` (permiso ya existente en el catálogo), consultando el historial de un producto específico.

## Screens

**Ninguna existe.** El borrador original (sección 52, "Acciones → Consultar Kardex", y sección 53) sugiere que Kardex se accede desde la ficha de un producto — consistente con el botón "Ver movimientos" ya presente (pero no conectado) en el menú de acciones de `/productos` (ver `Products.md`).

## Fields

Reconciliado con el requisito de producto entregado directamente por el product owner (sesión 2026-07-29) para "Historial de Movimientos", que sustituye y amplía el borrador original del master spec:

| Campo | Notas |
|---|---|
| Fecha | |
| Hora | |
| Usuario | identificador de cuenta autenticada — **nunca nombre propio** (mismo principio de privacidad que `FUTURE/Auditoria.md`) |
| Rol | rol del usuario al momento del movimiento — mismo campo nuevo (no persistido hoy) que `FUTURE/Auditoria.md` requiere; **no** existe todavía en `movimientos` |
| Tipo de movimiento | corresponde a `tipo` en `movimientos`, ya persistido hoy (`entrada\|salida\|ajuste\|conteo\|transferencia`) |
| Producto | |
| Código | código del producto (`Producto.codigo`, no un campo de `movimientos`) |
| Cantidad | corresponde a `cantidad`, ya persistido hoy |
| Stock antes | corresponde a `stock_anterior`, ya persistido hoy |
| Stock después | corresponde a `stock_nuevo`, ya persistido hoy |
| Documento relacionado | corresponde a `documento`, ya persistido hoy |
| Observaciones | corresponde a `observacion`, ya persistido hoy |

**Reconciliación con `movimientos` actual:** de estos 12 campos, 6 ya existen tal cual en el modelo real (`tipo`, `cantidad`, `stock_anterior`, `stock_nuevo`, `documento`, `observacion` — ver `docs/04_TECHNICAL_SPEC/DomainModel.md` §2.6). Producto y Código se resuelven vía la relación `Movimiento belongsTo Producto`, no requieren campo nuevo. El único campo genuinamente nuevo frente al modelo actual es **Rol** — igual que en `FUTURE/Auditoria.md`, queda pendiente de Technical Spec si se guarda como snapshot al momento del movimiento o se resuelve en vivo.

**Nota sobre versiones previas de este requisito:** el product owner entregó primero una lista más extensa (incluía `ID Movimiento`, `Lote`, `Unidad`, `Bodega`) y luego una versión más corta que la reemplaza (la de la tabla arriba). Se usa la versión corta como autoritativa por decisión explícita del product owner al confirmarla — `Lote`, `Unidad` y `Bodega` no forman parte de este alcance a menos que se reintroduzcan explícitamente en una futura revisión (el sistema hoy tampoco maneja lotes ni bodegas múltiples).

## Validation Rules

No aplica en el sentido tradicional — Kardex es de solo lectura por diseño. No se acepta edición manual de ningún registro.

## Permissions

Reutiliza `movimientos.ver` (ya existe en el catálogo) — a confirmar en el Technical Spec si amerita un permiso propio (`kardex.ver`) o si es exactamente el mismo alcance que ver movimientos.

## Loading States

**A validar en implementación.**

## Empty States

**A validar en implementación** — producto sin movimientos todavía (recién dado de alta, `stock_actual = 0`).

## Error States

**A validar en implementación.**

## Business Rules (borrador original — a validar)

- Nunca podrá editarse.
- Nunca podrá eliminarse.
- Si se implementa como vista derivada de `movimientos` (recomendado, ver "Business Flow"), estas dos reglas ya están garantizadas de forma gratuita porque `movimientos` mismo ya es inmutable (ver `Movements.md`).

## Acceptance Criteria

- [ ] **A validar en implementación**: se definen en el Technical Spec correspondiente, antes de escribir código. En particular, debe quedar explícito si Kardex es una vista/consulta sobre `movimientos` o una tabla nueva — y si es lo segundo, debe justificarse por qué no basta con la primera opción.

## Edge Cases

- Producto con miles de movimientos históricos — necesidad de paginación, igual que se anticipa para `Movements.md`.
- **A validar en implementación**: el resto de los edge cases reales.

## Export

Requisito de producto entregado directamente por el product owner (sesión 2026-07-29): todo el historial de un producto debe poder exportarse a **PDF, Excel y CSV**, usando la capacidad compartida de `docs/03_FUNCTIONAL_SPEC/FUTURE/Export.md`.

El PDF de historial por producto debe incluir, específicamente:

- Información del producto (nombre, descripción)
- Imagen del producto (si existe)
- Código
- Categoría
- Stock actual
- Tabla cronológica de movimientos (con los 12 campos de "Fields" arriba)
- Totales de entradas
- Totales de salidas
- Balance final
- Fecha de generación
- Usuario que generó el reporte (identificador de cuenta — nunca nombre propio)

Esto reemplaza la mención genérica que existía antes en esta sección ("exportación de Kardex, mencionada de forma general en el borrador de `Reports.md`") por un requisito concreto y verificado directamente con el product owner.

## Future Improvements

- Filtro de Kardex por rango de fechas.
