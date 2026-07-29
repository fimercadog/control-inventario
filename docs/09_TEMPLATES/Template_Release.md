# Release Notes — [Versión o fecha]

> Plantilla extraída de `docs/07_RELEASE/ReleaseNotes.md` (primera entrada real de este proyecto). Cada release nuevo agrega una entrada con este formato al principio del archivo; no reemplaza entradas anteriores.

## [Versión o nombre del release] — [fecha]

### Añadido

- [Funcionalidad nueva, en términos de usuario/negocio, con referencia al módulo en `05_IMPLEMENTATION/` si existe.]

### Cambiado

- [Comportamiento existente que cambió — incluir el "antes" si ayuda a entender el impacto.]

### Verificado

- [Qué se corrió/probó antes de este release — tests automatizados (con conteo real), verificación manual (referenciar `06_TESTS/ManualTestCases.md`).]

### Corregido

- [Bugs reales corregidos, con una frase de causa raíz si se conoce — no solo "se arregló X".]

### Gaps conocidos en este release

- [Ser explícito sobre lo que NO está cubierto por este release — no dejar que el lector asuma cobertura completa. Referenciar `docs/07_RELEASE/KnownIssues.md`.]

### Documentación

- [Qué documentos se actualizaron como parte de este release — por la Definition of Done de `AGENTS.md`, todo release requiere documentación actualizada.]

---

## Notas de uso

- Usar fecha real o "como parte de esta migración/sesión" si no hay un número de versión formal todavía (este proyecto no usa versionado semántico a la fecha de creación de esta plantilla).
- La sección "Gaps conocidos" es obligatoria, no opcional — un release sin gaps declarados invita a asumir que no los tiene.
- No fabricar una sección si no aplica (ej. si no hubo bugs corregidos en este release, omitir "Corregido" en vez de dejarlo vacío con un placeholder).
