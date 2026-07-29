# Problem Statement

Fuente: `_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` §5 (Problema), detallado con contexto de `Vision.md`.

## El problema

Muchas pequeñas y medianas empresas administran su inventario mediante hojas de cálculo o procesos manuales. Esto provoca, de forma consistente:

- **Errores de digitación.** Cada movimiento registrado a mano es una oportunidad de error.
- **Duplicación de información.** Sin una única fuente de verdad, el mismo dato termina en varios lugares y se desincroniza.
- **Pérdida de productos.** Sin trazabilidad confiable, faltantes de stock se detectan tarde o nunca.
- **Falta de trazabilidad.** No hay forma sistemática de responder "¿quién movió qué, cuándo y por qué?".
- **Reportes poco confiables.** Los reportes construidos sobre datos manuales heredan sus errores.
- **Procesos manuales.** El registro de cada entrada/salida consume tiempo operativo que podría evitarse.
- **Dificultad para auditar movimientos.** Sin un historial inmutable, una auditoría de inventario es lenta y propensa a disputas.

## Por qué importa ahora

El costo de este problema no es solo el tiempo perdido registrando datos — es la pérdida de confianza en los números del negocio. Un dueño de PyME que no confía en su reporte de stock termina tomando decisiones de compra y venta a ciegas, o duplicando el trabajo con conteos físicos frecuentes.

## Causa raíz que el producto ataca

La fricción de registrar cada movimiento a mano es, en la práctica, la razón principal por la que la trazabilidad se rompe: no es que las empresas no *quieran* registrar todo, es que hacerlo manualmente es lento y se posterga. Por eso Captura IA (fotografía y voz para registrar movimientos) no es una funcionalidad secundaria — ataca directamente la causa raíz del problema descrito arriba, no solo un síntoma.

Ver `00_VISION/Vision.md` y `00_VISION/ProductStrategy.md` para cómo esta priorización se refleja en el orden de construcción del producto.
