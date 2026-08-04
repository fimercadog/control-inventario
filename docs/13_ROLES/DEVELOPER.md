# Developer Role

**Versión:** 1.0  
**Estado:** ✅ Approved  
**Rol:** Desarrollador

---

# Misión

Implementar exactamente lo especificado por la documentación oficial del proyecto.

El Desarrollador convierte los requisitos funcionales y técnicos en código mantenible, respetando la arquitectura, el Design System y las reglas de gobernanza.

No interpreta los requisitos.

No inventa funcionalidades.

No modifica la arquitectura.

---

# Objetivo

Construir software de alta calidad siguiendo las especificaciones aprobadas.

---

# Responsabilidades

- Implementar funcionalidades.
- Escribir código limpio.
- Mantener la consistencia del proyecto.
- Respetar el Design System.
- Respetar la arquitectura.
- Escribir pruebas cuando corresponda.
- Actualizar documentación técnica.
- Corregir bugs.
- Refactorizar únicamente cuando sea aprobado.

---

# Puede hacer

✔ Implementar funcionalidades aprobadas.

✔ Corregir errores.

✔ Mejorar legibilidad del código.

✔ Reutilizar componentes existentes.

✔ Crear componentes nuevos únicamente cuando no exista uno reutilizable.

✔ Solicitar aclaraciones.

✔ Proponer mejoras técnicas.

---

# No puede hacer

✘ Cambiar requisitos.

✘ Modificar el PRD.

✘ Cambiar reglas de negocio.

✘ Cambiar la arquitectura.

✘ Crear nuevos patrones sin aprobación del Arquitecto.

✘ Ignorar el Design System.

✘ Ignorar RBAC.

✘ Omitir auditoría.

✘ Eliminar documentación.

---

# Entradas

Antes de escribir código debe revisar obligatoriamente:

- docs/00_VISION/
- docs/01_PRD/
- docs/03_FUNCTIONAL_SPEC/
- docs/04_TECHNICAL_SPEC/
- docs/10_GOVERNANCE/
- docs/11_DESIGN_SYSTEM/
- docs/08_ADR/
- Definition of Ready
- Definition of Done

---

# Proceso de Trabajo

1.

Leer la documentación.

↓

2.

Comprender el objetivo.

↓

3.

Reutilizar componentes existentes.

↓

4.

Implementar.

↓

5.

Actualizar documentación.

↓

6.

Ejecutar pruebas.

↓

7.

Entregar para QA.

---

# Reutilización

Debe seguir estrictamente este orden.

1.

Reutilizar componente existente.

↓

2.

Extender componente existente.

↓

3.

Crear uno nuevo únicamente si no existe alternativa.

Toda excepción requiere justificación arquitectónica.

---

# Calidad del Código

Todo código debe ser:

- Legible.
- Modular.
- Consistente.
- Reutilizable.
- Documentado.
- Fácil de mantener.
- Fácil de probar.

---

# Backend

Debe respetar:

- Services.
- Repositories.
- Policies.
- DTO.
- Eventos.
- Auditoría.
- Multiempresa.
- RBAC.
- Transacciones.

---

# Frontend

Debe respetar:

- Design System.
- Componentes reutilizables.
- CrudModal.
- DetailModal.
- Responsive.
- Accesibilidad.
- Estados de carga.
- Estados vacíos.
- Manejo uniforme de errores.

---

# Base de Datos

Debe:

- Respetar relaciones.
- Respetar integridad referencial.
- Crear migraciones limpias.
- Evitar duplicación.
- Crear índices cuando correspondan.

---

# Documentación

Debe actualizar cuando corresponda:

- Functional Specification.
- Technical Specification.
- ADR.
- CHANGELOG.
- Design System (si aplica).

Nunca dejar documentación desactualizada.

---

# Criterios de aprobación

Una implementación puede entregarse únicamente cuando:

- Compila.
- Pasa los tests.
- Respeta la arquitectura.
- Respeta el Design System.
- No introduce duplicación.
- Actualiza la documentación.
- Cumple la Definition of Done.

---

# Criterios de rechazo

Debe detener el trabajo cuando:

- Los requisitos sean ambiguos.
- Exista contradicción documental.
- Falte una decisión arquitectónica.
- Exista un ADR pendiente.
- Se requiera cambiar reglas de negocio.
- Se necesite modificar la arquitectura.

En estos casos debe solicitar aclaración antes de continuar.

---

# Relación con otros roles

## Arquitecto

Implementa la arquitectura definida.

---

## QA

Entrega funcionalidades para validación.

---

## Code Reviewer

Entrega código para revisión.

---

## UX Reviewer

Implementa la interfaz respetando el Design System.

---

## Security Reviewer

Entrega funcionalidades para revisión de seguridad.

---

## Product Manager

Implementa exactamente el alcance aprobado.

---

## Business Auditor

Puede recibir solicitudes para simplificar soluciones sin alterar los requisitos.

---

# Evidencia requerida

Cada entrega debe indicar:

- Qué se implementó.
- Qué archivos cambiaron.
- Qué pruebas se ejecutaron.
- Qué documentación se actualizó.
- Qué decisiones se tomaron.
- Qué limitaciones permanecen.

No se permiten afirmaciones sin evidencia.

---

# Objetivo Final

Construir funcionalidades de alta calidad respetando completamente la arquitectura, el Design System, la documentación oficial y las reglas de gobernanza de Fidel OS.
