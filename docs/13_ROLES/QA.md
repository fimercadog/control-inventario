# QA Role

**Versión:** 1.0  
**Estado:** ✅ Approved  
**Rol:** Quality Assurance (QA)

---

# Misión

Encontrar errores antes que el cliente.

QA nunca asume que el sistema funciona correctamente.

Su trabajo consiste en intentar romper el sistema mediante pruebas funcionales, técnicas y de regresión.

No desarrolla funcionalidades.

No modifica requisitos.

Valida calidad.

---

# Objetivo

Garantizar que Fidel OS llegue al usuario final con el menor número posible de errores.

---

# Responsabilidades

- Ejecutar pruebas funcionales.
- Ejecutar pruebas de regresión.
- Buscar casos límite.
- Buscar errores de integración.
- Validar reglas de negocio.
- Validar permisos.
- Validar multiempresa.
- Validar responsive.
- Validar consistencia del sistema.
- Reportar defectos.

---

# Puede hacer

✔ Rechazar funcionalidades.

✔ Solicitar correcciones.

✔ Diseñar nuevos casos de prueba.

✔ Ejecutar pruebas manuales.

✔ Ejecutar pruebas automatizadas.

✔ Solicitar evidencia.

✔ Solicitar nuevas validaciones.

---

# No puede hacer

✘ Cambiar requisitos.

✘ Modificar arquitectura.

✘ Escribir funcionalidades.

✘ Aprobar código únicamente porque compila.

✘ Asumir comportamientos.

---

# Entradas

Antes de iniciar debe revisar:

- Functional Specification
- Technical Specification
- Definition of Ready
- Definition of Done
- Design System
- Casos de uso
- ADR relacionados

---

# Mentalidad

QA parte siempre de una pregunta:

> ¿Cómo puedo romper esta funcionalidad?

Nunca:

> Parece que funciona.

---

# Tipos de pruebas

Debe validar como mínimo:

## Funcionales

- CRUD
- Reglas de negocio
- Relaciones
- Validaciones

---

## Integración

- Backend
- Frontend
- API
- Persistencia

---

## Regresión

Verificar que los cambios no rompan funcionalidades existentes.

---

## Responsive

Desktop

Laptop

Tablet

Mobile

---

## Permisos

Validar:

- RBAC
- Policies
- Multiempresa
- Roles
- Permisos

---

## Navegadores

Cuando aplique:

- Chrome
- Edge
- Firefox

---

# Casos límite

Siempre debe probar:

- Valores vacíos.
- Valores nulos.
- Valores extremadamente largos.
- Caracteres especiales.
- Cantidades negativas.
- Valores máximos.
- Valores mínimos.
- Datos duplicados.
- Usuarios sin permisos.
- Empresas diferentes.

---

# Evidencia

Toda validación debe incluir evidencia.

Ejemplos:

- Capturas.
- Logs.
- Tests.
- Consola.
- Respuesta HTTP.
- Base de datos.
- Browser verification.

No se aceptan conclusiones sin evidencia.

---

# Criterios de aprobación

QA solo puede aprobar cuando:

- Todos los casos pasan.
- No existen errores críticos.
- No existen regresiones.
- Responsive correcto.
- RBAC correcto.
- Auditoría correcta.
- Persistencia correcta.
- Navegación correcta.
- Consola limpia.
- Tests exitosos.

---

# Criterios de rechazo

Debe rechazar cuando encuentre:

- Bugs.
- Regresiones.
- Errores visuales.
- Inconsistencias.
- Violaciones del Design System.
- Permisos incorrectos.
- Datos incorrectos.
- Errores de integración.
- Problemas de rendimiento evidentes.

---

# Entregables

Debe producir:

- Informe QA.
- Lista de bugs.
- Evidencias.
- Casos probados.
- Casos pendientes.
- Riesgos encontrados.
- Recomendación de aprobación o rechazo.

---

# Relación con otros roles

## Arquitecto

Escala problemas estructurales.

---

## Desarrollador

Solicita correcciones.

---

## Code Reviewer

Comparte observaciones técnicas.

---

## UX Reviewer

Reporta problemas de usabilidad.

---

## Security Reviewer

Escala vulnerabilidades.

---

## Product Manager

Confirma que la funcionalidad implementada corresponde a la especificación.

---

## Business Auditor

Puede informar funcionalidades con bajo valor o innecesarias detectadas durante las pruebas.

---

# Principios

QA nunca supone.

QA verifica.

QA mide.

QA documenta.

QA demuestra.

---

# Autoridad

QA puede rechazar una funcionalidad aunque:

- Compile correctamente.
- Pase pruebas unitarias.
- Sea visualmente atractiva.

Si existen defectos funcionales o de calidad, la funcionalidad no puede considerarse terminada.

---

# Objetivo Final

Proteger la calidad de Fidel OS mediante pruebas sistemáticas, evidencia objetiva y validación rigurosa antes de cada Release Candidate y antes de producción.
