# Reportes (modulo funcional del producto - informes gerenciales)

**Status: Planned — not yet implemented**

> ⚠️ **No implementar sin aprobación previa.** Bajo la Golden Rule de `AGENTS.md`, ningún trabajo de implementación de este módulo puede comenzar hasta que esta spec, un Technical Spec de detalle, y una Architecture Review estén aprobados. Fuente: sección 56 ("Reportes") del master spec, reencuadrada como spec prospectiva. Verificado: no existe ningún endpoint ni pantalla de reportes en el sistema real. La mayoría de los reportes listados en el borrador original dependen de módulos que tampoco existen todavía (Compras, Ventas, Clientes, Proveedores — ver los documentos correspondientes en esta misma carpeta), por lo que este documento es, en la práctica, el más especulativo de los seis especificados como "Planned".

## Purpose

Centralizar la generación y exportación de reportes agregados sobre la operación de la empresa (ventas, compras, inventario, clientes, proveedores, productos, kardex, usuarios) para consumo gerencial dentro del producto Fidel OS.

## Business Flow (borrador original — a validar)

Usuario selecciona un reporte disponible dentro de la aplicación → aplica filtros (fecha, empresa) → visualiza en pantalla y/o exporta (Excel, CSV, PDF, impresión).

## Actors (borrador — a validar)

- Roles gerenciales (CEO, Administrador, Supervisor — ya nombrados en la sección 7 del master spec) — sin permisos concretos definidos todavía.

## Screens

**Ninguna existe.** El borrador original no detalla un layout de pantalla más allá de listar los reportes disponibles y sus filtros; la forma real queda **a definir en la etapa de diseño**.

## Fields (borrador original — a validar)

Reportes disponibles propuestos: Ventas, Compras, Inventario, Clientes, Proveedores, Productos, Kardex, Usuarios.

Filtros propuestos: Fecha, Empresa.

Formatos de exportación propuestos: Excel, CSV, PDF, Impresión.

## Validation Rules

**A validar en implementación.**

## Permissions

**A validar en implementación.** No existen permisos `reportes.*` en el catálogo actual; deberán seguir la convención `recurso.accion` ya establecida (ej. `reportes.ver`, posiblemente uno por tipo de reporte si el negocio lo requiere).

## Loading States

**A validar en implementación** — probablemente relevante desde el diseño, dado que reportes agregados sobre datos históricos pueden ser consultas costosas.

## Empty States

**A validar en implementación** — empresa sin datos suficientes para generar un reporte determinado (ej. reporte de Compras antes de que exista una sola compra).

## Error States

**A validar en implementación.**

## Business Rules

**A validar en implementación.** El borrador original no enuncia reglas de negocio propias más allá de listar qué reportes deberían existir dentro del producto — todas las reglas reales (quién puede ver qué, cómo se calculan los agregados, con qué frecuencia se refrescan) quedan pendientes de definición.

## Acceptance Criteria

- [ ] **A validar en implementación**: se definen en el Technical Spec correspondiente, antes de escribir código.

## Edge Cases

- Reporte solicitado sobre un módulo que todavía no existe (ej. reporte sobre ventas antes de que ese módulo esté implementado) — este módulo no debería construirse antes que los módulos de los que depende.
- Volumen de datos grande en un reporte de rango de fechas amplio — necesidad de paginación/streaming en la exportación, no definida.
- **A validar en implementación**: el resto de los edge cases reales.

## Future Improvements

- Priorizar qué informes construir primero según qué módulos base ya existan: hoy, el único candidato remotamente viable es un informe sobre Productos/Movimientos/Kardex (ver documentos correspondientes) — Ventas, Compras, Clientes y Proveedores dependen de módulos que ni siquiera están aprobados para construirse.
- Definir si los reportes se generan on-demand o se pre-calculan (jobs programados) — decisión de arquitectura pendiente, relevante para rendimiento a escala.
