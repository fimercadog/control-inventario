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

## Fields (borrador original — a validar)

| Campo | Notas |
|---|---|
| Fecha, Hora | |
| Documento | documento origen del movimiento |
| Movimiento | tipo (entrada/salida/ajuste/etc.) |
| Entrada | cantidad, si aplica |
| Salida | cantidad, si aplica |
| Saldo | saldo corrido tras este movimiento — corresponde a `stock_nuevo` en `movimientos`, ya persistido hoy |
| Usuario | |
| Observación | |

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

## Future Improvements

- Exportación de Kardex (Excel/CSV/PDF) — mencionada de forma general en el borrador de `Reports.md`.
- Filtro de Kardex por rango de fechas.
