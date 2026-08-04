# Role-Based Development

**Versión:** 1.0  
**Estado:** ✅ Approved  
**Ubicación:** `docs/13_ROLES/`

---

# Objetivo

Este directorio define los roles oficiales utilizados durante el desarrollo de Fidel OS.

Cada rol representa una responsabilidad específica dentro del ciclo de desarrollo y tiene autoridad limitada a su área de especialización.

El objetivo es simular el trabajo de un equipo profesional multidisciplinario, donde cada participante toma decisiones únicamente desde su dominio de conocimiento.

Ningún rol puede asumir responsabilidades de otro sin una decisión explícita documentada.

---

# Principios

Todos los roles deben respetar las reglas definidas en:

- `docs/00_VISION/`
- `docs/01_PRD/`
- `docs/03_FUNCTIONAL_SPEC/`
- `docs/04_TECHNICAL_SPEC/`
- `docs/10_GOVERNANCE/`
- `docs/11_DESIGN_SYSTEM/`
- `docs/08_ADR/`

---

# Filosofía

Cada rol debe pensar únicamente desde su especialidad.

Ejemplos:

- El Arquitecto protege la arquitectura.
- El Desarrollador implementa.
- QA intenta romper el sistema.
- UX protege la experiencia de usuario.
- Seguridad protege la aplicación.
- Product Manager protege el valor del negocio.

No deben mezclarse responsabilidades.

---

# Roles Oficiales

## Arquitecto

Archivo:

ARCHITECT.md

Responsabilidad:

Diseñar y proteger la arquitectura del sistema.

---

## Desarrollador

Archivo:

DEVELOPER.md

Responsabilidad:

Implementar exactamente lo especificado.

---

## QA

Archivo:

QA.md

Responsabilidad:

Encontrar errores, regresiones y casos límite.

---

## Code Reviewer

Archivo:

CODE_REVIEWER.md

Responsabilidad:

Revisar el código antes de aprobar cambios.

---

## UX Reviewer

Archivo:

UX_REVIEWER.md

Responsabilidad:

Garantizar una experiencia de usuario consistente.

---

## Product Manager

Archivo:

PRODUCT_MANAGER.md

Responsabilidad:

Validar que el producto resuelva el problema del cliente.

---

## Security Reviewer

Archivo:

SECURITY_REVIEWER.md

Responsabilidad:

Proteger la seguridad del sistema.

---

## Business Auditor

Archivo:

BUSINESS_AUDITOR.md

Responsabilidad:

Evaluar continuamente si el desarrollo aporta valor real al negocio.

---

# Flujo Oficial

Todo desarrollo deberá seguir el siguiente flujo.

```text
Idea

↓

Vision

↓

PRD

↓

Functional Specification

↓

Technical Specification

↓

Architecture Review

↓

Development

↓

QA

↓

Code Review

↓

Security Review

↓

UX Review

↓

Business Audit

↓

Release Candidate

↓

Production
```

---

# Jerarquía

Los roles son independientes.

No existe un rol "superior".

Cada rol puede rechazar un cambio desde su propia perspectiva.

Ejemplo:

- QA puede rechazar una funcionalidad aunque compile.
- Arquitectura puede rechazar una solución aunque funcione.
- UX puede rechazar una interfaz aunque sea correcta técnicamente.
- Product Manager puede rechazar una funcionalidad aunque todos los tests pasen.

---

# Principios de Trabajo

Todos los roles deben:

- Basarse en evidencia.
- Leer la documentación antes de actuar.
- Respetar el Design System.
- Respetar los ADR.
- Respetar la Definition of Ready.
- Respetar la Definition of Done.
- Actualizar la documentación cuando corresponda.
- Evitar duplicación de código.
- Evitar duplicación de documentación.
- Justificar decisiones arquitectónicas.

---

# Comunicación

Los informes de cada rol deben indicar claramente:

- Qué se revisó.
- Qué evidencia se utilizó.
- Qué problemas se encontraron.
- Qué decisiones se tomaron.
- Qué riesgos permanecen.
- Qué aprobación se solicita.

No se permiten conclusiones sin evidencia.

---

# Objetivo Final

El propósito de este modelo de trabajo es garantizar que Fidel OS evolucione como un producto profesional, manteniendo:

- Arquitectura consistente.
- Código mantenible.
- Experiencia de usuario uniforme.
- Seguridad.
- Calidad.
- Valor para el cliente.
- Escalabilidad.

Todo nuevo desarrollo deberá respetar este modelo de trabajo.
