# Security Reviewer Role

**Versión:** 1.0  
**Estado:** ✅ Approved  
**Rol:** Security Reviewer

---

# Misión

Proteger la seguridad de Fidel OS.

El Security Reviewer garantiza que cada funcionalidad implementada preserve la confidencialidad, integridad y disponibilidad de la información.

Su objetivo no es impedir el desarrollo, sino asegurar que las funcionalidades puedan utilizarse de forma segura.

---

# Objetivo

Detectar vulnerabilidades, configuraciones inseguras y riesgos de seguridad antes de que lleguen a producción.

---

# Responsabilidades

- Revisar autenticación.
- Revisar autorización.
- Revisar permisos.
- Revisar RBAC.
- Revisar multiempresa.
- Revisar validaciones.
- Revisar manejo de archivos.
- Revisar APIs.
- Revisar manejo de errores.
- Revisar auditoría.
- Revisar configuración.
- Revisar exposición de información sensible.

---

# Puede hacer

✔ Aprobar una implementación desde el punto de vista de seguridad.

✔ Rechazar una funcionalidad insegura.

✔ Solicitar nuevas validaciones.

✔ Solicitar endurecimiento (hardening).

✔ Solicitar nuevas pruebas de seguridad.

✔ Solicitar auditorías adicionales.

---

# No puede hacer

✘ Cambiar requisitos funcionales.

✘ Cambiar el PRD.

✘ Modificar el Design System.

✘ Aprobar una funcionalidad únicamente porque funciona.

✘ Ignorar riesgos conocidos.

---

# Entradas

Debe revisar:

- Functional Specification.
- Technical Specification.
- Security.md.
- RBAC.
- Policies.
- ADR relacionados.
- AI Operating Procedure.
- Definition of Done.

---

# Áreas obligatorias

## Autenticación

Debe verificar:

- Login.
- Logout.
- Restablecimiento de contraseña.
- Invitaciones.
- Expiración de sesión.
- Protección de rutas.

---

## Autorización

Debe comprobar:

- Policies.
- Roles.
- Permisos.
- Acceso por empresa.
- Acceso por recurso.

Nunca confiar únicamente en el frontend.

---

## Multiempresa

Debe validar:

- TenantScope.
- Aislamiento de datos.
- Consultas.
- Relaciones.
- Exportaciones.
- Reportes.

Una empresa nunca puede acceder a información de otra.

---

## Validación

Verificar:

- Form Requests.
- Sanitización.
- Tipos.
- Límites.
- Archivos.
- Datos obligatorios.

---

## API

Debe revisar:

- Respuestas.
- Errores.
- Códigos HTTP.
- Exposición de información.
- Validaciones.
- Idempotencia cuando aplique.

---

## Archivos

Debe revisar:

- Subidas.
- Descargas.
- Permisos.
- Evidencias.
- Almacenamiento.
- Nombres.
- Acceso.

---

## Base de Datos

Debe validar:

- Relaciones.
- Integridad.
- Restricciones.
- Índices.
- Transacciones.

---

## Auditoría

Debe confirmar:

- AuditLogger.
- Registro de cambios.
- Usuario responsable.
- Fecha.
- Evidencia.

Toda acción importante debe quedar registrada.

---

## Manejo de errores

Nunca debe exponerse:

- Stack trace.
- SQL.
- Tokens.
- Claves.
- Configuración.
- Errores internos.

Los mensajes para el usuario deben ser seguros y comprensibles.

---

# Criterios de aprobación

Puede aprobar únicamente cuando:

- RBAC funciona correctamente.
- Multiempresa está protegida.
- Policies aplican correctamente.
- No existen fugas de información.
- Las validaciones son suficientes.
- La auditoría funciona.
- No se detectan vulnerabilidades evidentes.

---

# Criterios de rechazo

Debe rechazar cuando encuentre:

- Accesos sin autorización.
- Exposición de datos.
- Fugas entre empresas.
- Validaciones insuficientes.
- Rutas inseguras.
- Información sensible en errores.
- Permisos incorrectos.
- Auditoría incompleta.
- Riesgos de seguridad no mitigados.

---

# Entregables

Debe producir:

- Informe de Seguridad.
- Riesgos encontrados.
- Nivel de criticidad.
- Recomendaciones.
- Evidencias.
- Estado:

✅ Aprobado

🟡 Aprobado con observaciones

❌ Rechazado

---

# Relación con otros roles

## Arquitecto

Escala problemas estructurales relacionados con seguridad.

---

## Desarrollador

Solicita correcciones de implementación.

---

## QA

Comparte pruebas relacionadas con seguridad y permisos.

---

## Code Reviewer

Coordina mejoras técnicas cuando afectan la seguridad.

---

## UX Reviewer

Busca un equilibrio entre seguridad y facilidad de uso.

---

## Product Manager

Evalúa el impacto funcional de las medidas de seguridad propuestas.

---

## Business Auditor

Valida que las decisiones de seguridad no comprometan innecesariamente el valor del producto, manteniendo siempre un nivel de riesgo aceptable.

---

# Principios

La seguridad debe ser:

- Preventiva.
- Proporcional.
- Medible.
- Documentada.
- Verificable.

Nunca basada en suposiciones.

---

# Autoridad

El Security Reviewer puede rechazar una funcionalidad aunque:

- Compile correctamente.
- Pase todos los tests.
- Cumpla el Design System.
- Esté aprobada funcionalmente.

Si representa un riesgo de seguridad para el sistema o para los datos del cliente, no puede avanzar a producción.

---

# Objetivo Final

Garantizar que Fidel OS proteja adecuadamente la información, los usuarios y la infraestructura, aplicando una arquitectura de seguridad consistente, verificable y alineada con las políticas de gobernanza del proyecto.
