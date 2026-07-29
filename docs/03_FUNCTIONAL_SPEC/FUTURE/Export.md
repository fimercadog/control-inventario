# Exportación de Documentos (PDF / Excel / CSV)

**Status: Planned — not yet implemented**

> ⚠️ **No implementar sin aprobación previa.** Bajo la Golden Rule de `AGENTS.md`, ningún trabajo de implementación de esta capacidad puede comenzar hasta que esta spec, un Technical Spec de detalle, y una Architecture Review estén aprobados.
>
> **Origen:** requisito de producto entregado directamente por el product owner (sesión 2026-07-29, "FASE 12 — Documentación y Exportación PDF"), no proviene del master spec original.
>
> **Verificado contra código real:** no existe ningún mecanismo de generación de PDF/Excel/CSV en `backend/` ni `frontend/` hoy. Es una capacidad enteramente nueva.
>
> Esta spec describe una **capacidad compartida y transversal**, no un módulo con pantalla propia — se documenta una sola vez aquí (mismo principio que `AI_Capture.md` centraliza el pipeline de captura una sola vez en vez de repetirlo por pantalla) y cada módulo que la use la referencia desde su propia spec, en vez de redefinirla.

## Purpose

Permitir que cualquier módulo del sistema genere documentación de su información principal en formato PDF, Excel o CSV, con un formato profesional consistente listo para impresión — sin que cada módulo implemente su propia lógica de exportación por separado (evita duplicación, ver `CLAUDE.md` — "No duplicar código", "Priorizar componentes reutilizables").

## Business Flow

1. El usuario, en cualquier pantalla de un módulo soportado, presiona el botón "📄 Descargar PDF" (o el control equivalente de Excel/CSV donde aplique).
2. El sistema recopila la información principal del módulo en su estado actual (filtros/rango aplicados, si corresponde).
3. El sistema genera el documento con el layout estándar (ver "Contenido estándar del PDF") y lo entrega para descarga.

## Actors

Cualquier usuario autenticado con permiso de lectura sobre el módulo correspondiente — la exportación no otorga acceso a información que el usuario no podría ya consultar en pantalla.

## Screens

Botón "📄 Descargar PDF" (y, donde aplique, "Exportar Excel" / "Exportar CSV") embebido en la pantalla principal de cada módulo soportado — no es una pantalla propia.

## Módulos que deben soportar exportación (mínimo)

Inventario, Productos, Compras, Ventas, Clientes, Proveedores, Kardex, Movimientos, Reportes, Configuración, Usuarios, Roles, Auditoría, Dashboard (resumen).

**Nota de reconciliación con el estado real del producto:** de estos 14, hoy están construidos (aunque sea parcialmente) Productos, Movimientos, Dashboard y Configuración (`Settings.md`); Usuarios y Roles tienen infraestructura de datos pero no UI de gestión (Módulos 4-5, pendientes); Compras, Ventas, Clientes, Proveedores, Kardex, Reportes son specs planificadas sin ningún código (ver `03_FUNCTIONAL_SPEC/FUTURE/`); Auditoría es la spec nueva en `FUTURE/Auditoria.md`. Esta capacidad de exportación debe añadirse a cada módulo **cuando ese módulo se construya o se le dé mantenimiento**, no requiere que los 14 existan primero — pero ningún módulo debe darse por "terminado" (Definition of Done) si le falta su exportación, una vez que esta capacidad esté aprobada e implementada como componente compartido.

## Contenido estándar del PDF

Todo PDF generado por el sistema debe incluir, como mínimo:

- Título del módulo
- Fecha de generación
- Usuario que generó el documento (identificador de cuenta — nunca nombre propio, mismo principio de privacidad que `FUTURE/Auditoria.md`)
- Información principal del módulo
- Tablas de datos
- Totales, cuando aplique
- Observaciones
- Número de página / total de páginas
- Logo de la empresa
- Pie de página con fecha y hora de generación

Formato profesional, listo para impresión (tamaño de página estándar, márgenes consistentes — detalle exacto a definir en Technical Spec).

## Validation Rules

No aplica en el sentido de formulario — la validación relevante es que el usuario tenga permiso de lectura sobre los datos que está exportando (no se exporta información a la que no tendría acceso en pantalla).

## Permissions

Reutiliza el permiso de lectura ya existente de cada módulo (ej. `productos.ver`, `movimientos.ver`, `auditoria.ver`) — a confirmar en Technical Spec si se requiere un permiso adicional de exportación por módulo o si el de lectura basta.

## Loading States

**A validar en implementación** — generación de PDF/Excel puede no ser instantánea con datasets grandes; considerar generación asíncrona (cola), consistente con el patrón ya existente pero sin usar de `ProcesarCapturaIAJob` (ver `docs/07_RELEASE/KnownIssues.md` punto 13 — Captura IA procesa síncrono hoy pese a tener un Job queueable sin usar; no repetir ese mismo gap aquí sin decidirlo explícitamente).

## Empty States

**A validar en implementación** — módulo sin datos que exportar.

## Error States

**A validar en implementación.**

## Business Rules

- La exportación nunca expone más información de la que el usuario ya puede ver en pantalla.
- El formato del encabezado/pie de página es el mismo en todos los módulos — un solo componente compartido, no una implementación por módulo.
- Nunca se muestra el nombre real de una persona en un documento exportado — mismo principio que `FUTURE/Auditoria.md`.

## Acceptance Criteria

- [ ] **A validar en implementación**: se definen en el Technical Spec correspondiente, antes de escribir código.
- [ ] El componente de exportación es compartido entre módulos (no una implementación duplicada por módulo) — verificable por revisión de arquitectura.

## Edge Cases

- Datasets muy grandes (ej. historial completo de movimientos de una empresa con mucha actividad) — paginación del PDF, límite de filas, o generación asíncrona. A definir en Technical Spec.
- Producto sin imagen (para el caso específico de exportación de historial/Kardex por producto, ver `FUTURE/Kardex.md`) — el PDF debe generarse igual, sin la imagen.
- **A validar en implementación**: el resto de los edge cases reales.

## Future Improvements

- Plantillas de PDF personalizables por empresa (logo propio ya está contemplado en el mínimo; colores/formato adicional quedaría para una iteración posterior).
