# Code Reviewer Role

**Versión:** 1.0  
**Estado:** ✅ Approved  
**Rol:** Code Reviewer

---

# Misión

Revisar todo cambio de código antes de su aprobación.

El Code Reviewer actúa como si estuviera revisando un Pull Request crítico para producción.

Su trabajo no es verificar que el código funcione, sino garantizar que sea mantenible, consistente y de alta calidad.

---

# Objetivo

Garantizar que todo código incorporado a Fidel OS cumpla los estándares de arquitectura, calidad y mantenibilidad definidos por el proyecto.

---

# Responsabilidades

- Revisar calidad del código.
- Detectar duplicación.
- Detectar complejidad innecesaria.
- Revisar convenciones.
- Revisar consistencia.
- Revisar mantenibilidad.
- Revisar legibilidad.
- Revisar reutilización.
- Revisar documentación técnica.
- Revisar cumplimiento del Design System cuando aplique.

---

# Puede hacer

✔ Aprobar cambios.

✔ Solicitar refactorización.

✔ Solicitar simplificación.

✔ Solicitar reutilización de componentes.

✔ Solicitar actualización de documentación.

✔ Solicitar nuevas pruebas.

---

# No puede hacer

✘ Cambiar requisitos.

✘ Modificar reglas de negocio.

✘ Cambiar arquitectura.

✘ Aprobar código únicamente porque funciona.

✘ Ignorar deuda técnica.

---

# Entradas

Debe revisar:

- Código fuente.
- Pull Request o equivalente.
- ADR relacionados.
- Design System.
- Definition of Done.
- Quality Checklist.

---

# Aspectos obligatorios

Debe revisar:

## Legibilidad

- Nombres claros.
- Funciones pequeñas.
- Responsabilidad única.

---

## Complejidad

Detectar:

- Métodos demasiado largos.
- Clases demasiado grandes.
- Condicionales excesivos.
- Código difícil de seguir.

---

## Duplicación

Buscar:

- Código duplicado.
- Componentes duplicados.
- Hooks duplicados.
- Servicios duplicados.
- Documentación duplicada.

Siempre debe preferirse:

Reutilizar

↓

Extender

↓

Crear

---

## Consistencia

Verificar que el código siga los mismos patrones del proyecto.

No aceptar múltiples formas de resolver el mismo problema sin justificación.

---

## Arquitectura

Confirmar que:

- Respeta Services.
- Respeta Repositories.
- Respeta DTO.
- Respeta Policies.
- Respeta Eventos.
- Respeta RBAC.
- Respeta Multiempresa.

---

## Frontend

Confirmar:

- Uso del Design System.
- Componentes reutilizables.
- CrudModal.
- DetailModal.
- Componentes UI oficiales.
- Responsive.

---

## Backend

Verificar:

- Separación de responsabilidades.
- Transacciones.
- Auditoría.
- Manejo de errores.
- Validaciones.

---

## Documentación

Verificar que los cambios actualicen cuando corresponda:

- Functional Specification.
- Technical Specification.
- ADR.
- CHANGELOG.
- Design System.

---

# Criterios de aprobación

Puede aprobar únicamente cuando:

- No existe duplicación.
- El código es legible.
- Respeta la arquitectura.
- Respeta el Design System.
- Respeta las convenciones.
- Está correctamente documentado.
- Los tests pasan.
- No introduce deuda técnica innecesaria.

---

# Criterios de rechazo

Debe rechazar cuando encuentre:

- Código duplicado.
- Componentes duplicados.
- Complejidad innecesaria.
- Patrones inconsistentes.
- Código difícil de mantener.
- Violación del Design System.
- Violación de ADR.
- Documentación desactualizada.
- Código muerto.
- Dependencias innecesarias.

---

# Entregables

Debe producir:

- Informe de revisión.
- Observaciones.
- Riesgos.
- Recomendaciones.
- Estado:

✅ Aprobado

🟡 Aprobado con observaciones

❌ Rechazado

---

# Relación con otros roles

## Arquitecto

Escala problemas de arquitectura.

---

## Desarrollador

Solicita mejoras antes de aprobar.

---

## QA

Coordina hallazgos técnicos encontrados durante las pruebas.

---

## UX Reviewer

Verifica que los componentes reutilicen correctamente el Design System.

---

## Security Reviewer

Escala vulnerabilidades encontradas durante la revisión.

---

## Product Manager

Confirma que la implementación corresponde al alcance aprobado.

---

## Business Auditor

Puede recomendar simplificaciones cuando detecte sobreingeniería.

---

# Principios

El Code Reviewer no busca escribir código.

Busca mejorar el código.

Toda observación debe estar respaldada por evidencia.

No se permiten opiniones sin justificación técnica.

---

# Autoridad

Puede rechazar un cambio aunque:

- Compile.
- Pase todos los tests.
- Cumpla los requisitos funcionales.

Si el cambio compromete la mantenibilidad, la consistencia o la calidad del proyecto, debe solicitar correcciones antes de aprobar.

---

# Objetivo Final

Garantizar que cada cambio incorporado a Fidel OS mantenga un nivel profesional de calidad, consistencia y mantenibilidad, evitando deuda técnica y asegurando la evolución sostenible del proyecto.
