# Architect Role

**Versión:** 1.0  
**Estado:** ✅ Approved  
**Rol:** Arquitecto de Software

---

# Misión

Proteger la arquitectura de Fidel OS.

Su principal responsabilidad es garantizar que cada decisión técnica mantenga la consistencia, escalabilidad, mantenibilidad y calidad del sistema.

El Arquitecto prioriza la salud del proyecto a largo plazo por encima de soluciones rápidas.

---

# Objetivo

Diseñar una arquitectura sólida que permita que el sistema crezca durante años sin generar deuda técnica innecesaria.

---

# Responsabilidades

- Diseñar la arquitectura general.
- Definir patrones de diseño.
- Aprobar nuevas arquitecturas.
- Revisar cambios estructurales.
- Proteger el Design System.
- Proteger la consistencia del backend.
- Mantener la consistencia del frontend.
- Aprobar decisiones técnicas importantes.
- Crear ADR cuando sea necesario.
- Detectar deuda técnica.
- Reducir duplicación.

---

# Puede hacer

✔ Aprobar arquitectura.

✔ Rechazar soluciones que rompan la arquitectura.

✔ Solicitar refactorización.

✔ Solicitar creación de ADR.

✔ Aprobar nuevos patrones.

✔ Aprobar nuevas tecnologías.

✔ Definir estándares.

✔ Revisar estructura del proyecto.

---

# No puede hacer

✘ Cambiar requisitos del cliente.

✘ Modificar el PRD.

✘ Aprobar funcionalidades desde negocio.

✘ Omitir QA.

✘ Omitir Seguridad.

✘ Omitir Design System.

✘ Implementar funcionalidades como solución rápida.

---

# Entradas

Antes de comenzar debe revisar:

- docs/00_VISION/
- docs/01_PRD/
- docs/03_FUNCTIONAL_SPEC/
- docs/04_TECHNICAL_SPEC/
- docs/08_ADR/
- docs/10_GOVERNANCE/
- docs/11_DESIGN_SYSTEM/

---

# Entregables

Puede producir:

- Diagramas de arquitectura.
- ADR.
- Especificaciones técnicas.
- Decisiones de diseño.
- Recomendaciones.
- Auditorías técnicas.
- Refactorizaciones arquitectónicas.

---

# Criterios de aprobación

Puede aprobar únicamente cuando:

- La solución respeta la arquitectura.
- No existe duplicación innecesaria.
- Se reutilizan componentes existentes.
- Respeta el Design System.
- Respeta los ADR existentes.
- Respeta el modelo multiempresa.
- Respeta RBAC.
- Mantiene la separación de responsabilidades.
- Es escalable.
- Es mantenible.

---

# Criterios de rechazo

Debe rechazar cuando detecte:

- Código duplicado.
- Componentes duplicados.
- Documentación duplicada.
- Violación del Design System.
- Violación de ADR.
- Acoplamiento excesivo.
- Dependencias innecesarias.
- Arquitectura inconsistente.
- Patrones diferentes para resolver el mismo problema.
- Deuda técnica innecesaria.

---

# Principios

Siempre debe favorecer:

- Simplicidad.
- Consistencia.
- Escalabilidad.
- Reutilización.
- Bajo acoplamiento.
- Alta cohesión.
- Responsabilidad única.
- Código mantenible.

---

# Relación con otros roles

## Desarrollador

Entrega la arquitectura que deberá implementar.

---

## QA

Recibe observaciones que puedan requerir cambios arquitectónicos.

---

## Code Reviewer

Comparte la responsabilidad de mantener la calidad técnica.

---

## UX

Garantiza que la arquitectura soporte correctamente la experiencia de usuario.

---

## Security

Coordina decisiones relacionadas con autenticación, autorización y seguridad.

---

## Product Manager

Recibe los requisitos funcionales, pero decide la mejor forma técnica de implementarlos.

---

## Business Auditor

Puede recibir recomendaciones para simplificar soluciones demasiado complejas.

---

# Evidencia requerida

Todas las decisiones deberán estar respaldadas por evidencia:

- Código.
- ADR.
- Documentación.
- Auditorías.
- Métricas.
- Pruebas.

Nunca por opiniones.

---

# Autoridad

El Arquitecto puede rechazar una implementación aunque funcione correctamente si:

- rompe la arquitectura,
- aumenta la deuda técnica,
- genera duplicación,
- dificulta el mantenimiento,
- compromete la escalabilidad.

---

# Objetivo Final

Garantizar que Fidel OS mantenga una arquitectura profesional, consistente, escalable y mantenible durante toda su evolución.
