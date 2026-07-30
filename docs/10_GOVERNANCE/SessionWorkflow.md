# Session Workflow

## Objetivo

Garantizar que cada sesión de desarrollo deje el proyecto en un estado completamente documentado, trazable y sincronizado con Git.

Este procedimiento se ejecuta al finalizar cualquier sesión de trabajo que modifique el proyecto.

---

# 1. Revisar cambios

Analizar todos los archivos modificados durante la sesión.

Clasificarlos como:

- Código
- Documentación
- Configuración
- Tests
- Infraestructura

---

# 2. Actualizar documentación

Si hubo cambios funcionales:

Actualizar:

- PRD
- Functional Specification
- Technical Specification

Si hubo una decisión arquitectónica:

Crear un nuevo ADR.

Nunca modificar un ADR histórico.

---

# 3. Actualizar CHANGELOG

Agregar una nueva entrada bajo:

## [Unreleased]

Usar el formato:

### Added

Nuevas funcionalidades.

### Changed

Cambios importantes.

### Fixed

Correcciones.

### Documentation

Cambios únicamente documentales.

### Security

Cambios relacionados con seguridad.

---

# 4. Actualizar DEVELOPMENT_LOG

Agregar una entrada con:

- Fecha
- Objetivo
- Trabajo realizado
- Archivos modificados
- Decisiones tomadas
- Riesgos encontrados
- Próximo paso

---

# 5. Revisar ADR

Si apareció una decisión arquitectónica:

Crear un ADR nuevo.

Nunca sobrescribir uno existente.

---

# 6. Revisar Roadmap

Actualizar el estado de:

- Planned
- In Progress
- Completed

---

# 7. Revisar Gaps

Actualizar:

docs/GAPS.md

Si aparece una nueva limitación del proyecto.

---

# 8. Revisar Tests

Actualizar:

docs/TestIndex.md

Documentar:

- nuevos tests
- tests modificados
- cobertura

---

# 9. Commit

Generar un resumen para Git.

Ejemplo:

docs: update inventory functional specification

o

feat: implement OCR pipeline

o

fix: correct JWT refresh logic

---

# 10. Release

Si corresponde una versión:

Actualizar:

CHANGELOG

Crear Tag

Actualizar Release Notes

---

# Regla

Ninguna sesión de desarrollo puede darse por terminada sin completar este flujo.
