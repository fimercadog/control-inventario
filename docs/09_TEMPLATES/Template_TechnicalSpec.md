# [Nombre del Área Técnica — ej. Architecture, Database, API]

> Plantilla extraída de `docs/04_TECHNICAL_SPEC/Architecture.md` y su tratamiento de "Módulo X" dentro de un documento técnico general. Un Technical Spec describe decisiones ya tomadas y su estado real de implementación — no es el lugar para explorar alternativas (eso vive en un ADR, ver `Template_ADR.md`).

## [Sección general del área — ej. Arquitectura General / Modelo de Datos / Convenciones de API]

[Diagrama o descripción de alto nivel, en el nivel de detalle mínimo necesario para orientar, no para enseñar el framework.]

## Decisiones

[Lista breve de las decisiones estructurales que definen esta área — cada una candidata a tener su propio ADR si no lo tiene ya.]

## Módulo [Nombre del Módulo]

[Para documentos técnicos que crecen por módulo (como `Architecture.md`): una subsección por módulo, con:]

### Decisiones de producto/técnicas confirmadas

[Lista de decisiones ya tomadas y en vigor, no propuestas.]

### [Sub-área relevante — ej. Paquetes, Flujo de tokens, Aislamiento por empresa]

[Detalle técnico verificable contra el código real — nombrar archivos/clases concretas cuando ayude a la trazabilidad.]

### Regla dura: [nombre de la regla, si aplica]

[Reglas no negociables de este módulo — ej. "nunca nombres de rol en lógica de negocio" — explicadas con el porqué, no solo el qué.]

## Estado de implementación

[Explícito: qué está construido, qué está pendiente, con referencia a `docs/05_IMPLEMENTATION/` si existe el documento retroactivo/prospectivo correspondiente.]

## Notas de seguridad

[Cualquier advertencia operacional — ej. "estos endpoints no son aptos para producción hasta que se construya X" — nunca omitir una advertencia real por quedar mejor en el documento.]
