> ⚠️ **DOCUMENTO HISTÓRICO — SUPERADO.** Fusionado junto con `DevelopmentWorkflow_SUPERSEDED.md` en `docs/10_GOVERNANCE/MandatoryDevelopmentWorkflow.md`, que es hoy la única autoridad sobre el flujo de desarrollo. Este archivo es el mismo documento que `AGENTS.md` citaba antes bajo el nombre `MANDATORY_DEVELOPMENT_WORKFLOW.md` (fue renombrado a `ENGINEERING_WORKFLOW.md` por un proceso concurrente sin actualizar esa referencia — ver `docs/POST_MIGRATION_AUDIT.md` §7bis). No usar este archivo como referencia activa.

# Mandatory Development Workflow (histórico)

**Status:** Superseded — ver banner arriba

**Version:** 1.0

**Applies To:**

- Todo desarrollo nuevo.
- Corrección de errores.
- Refactorización.
- Nuevos módulos.
- Mejoras.
- Integraciones.
- APIs.
- Frontend.
- Backend.
- Base de datos.
- Automatizaciones.
- Documentación.

---

# Regla Principal

Ningún cambio podrá implementarse sin seguir este flujo completo.

No se permite omitir pasos.

Si un paso no aplica, deberá justificarse explícitamente en el informe final.

---

# FASE 1 - Comprensión

Antes de escribir código se debe:

- [ ] Leer el PRD.
- [ ] Leer los Functional Requirements.
- [ ] Leer la Functional Specification.
- [ ] Leer la Technical Specification.
- [ ] Leer la Architecture Specification.
- [ ] Revisar diagramas.
- [ ] Revisar dependencias.
- [ ] Revisar módulos relacionados.
- [ ] Revisar restricciones.
- [ ] Identificar riesgos.

No escribir código en esta fase.

---

# FASE 2 - Análisis

- [ ] Identificar impacto.
- [ ] Identificar módulos afectados.
- [ ] Identificar tablas afectadas.
- [ ] Identificar APIs afectadas.
- [ ] Identificar componentes afectados.
- [ ] Identificar riesgos.

Generar un pequeño informe antes de continuar.

---

# FASE 3 - Plan Técnico

Definir:

- [ ] Archivos nuevos.
- [ ] Archivos modificados.
- [ ] Migraciones.
- [ ] Endpoints.
- [ ] Componentes.
- [ ] Modelos.
- [ ] Validaciones.
- [ ] Pruebas necesarias.

No comenzar implementación hasta finalizar el plan.

---

# FASE 4 - Implementación

Desarrollar siguiendo las especificaciones.

No improvisar funcionalidades.

No modificar requisitos sin aprobación.

---

# FASE 5 - Datos Demo

Crear datos realistas para pruebas.

Ejemplos:

- Productos
- Clientes
- Proveedores
- Compras
- Ventas
- Movimientos
- Usuarios
- Roles
- Auditoría

Nunca probar con datos mínimos.

---

# FASE 6 - Pruebas

Ejecutar pruebas:

## Unitarias

- [ ] Modelos
- [ ] Servicios
- [ ] Controladores

## Funcionales

- [ ] Crear
- [ ] Editar
- [ ] Consultar
- [ ] Buscar
- [ ] Filtrar
- [ ] Eliminar
- [ ] Restaurar

## Integración

- [ ] Backend ↔ Frontend
- [ ] APIs
- [ ] Base de datos
- [ ] Auditoría
- [ ] Exportaciones

## Seguridad

- [ ] Roles
- [ ] Permisos
- [ ] Autenticación
- [ ] Validaciones

## Rendimiento

- [ ] Grandes volúmenes
- [ ] Consultas
- [ ] Exportaciones

---

# FASE 7 - Auditoría

Verificar que todas las operaciones generan registros.

Validar:

- Usuario
- Rol
- Fecha
- Hora
- Acción
- Registro afectado

---

# FASE 8 - Exportaciones

Validar:

- PDF
- Excel
- CSV

Comprobar formato y contenido.

---

# FASE 9 - Informe de Pruebas

Generar automáticamente un informe con:

## Información general

- Fecha
- Versión
- Ambiente
- Responsable

## Casos ejecutados

- Total
- Aprobados
- Fallidos
- Bloqueados

## Cobertura

- Backend
- Frontend
- Base de datos
- APIs

## Hallazgos

- Errores encontrados
- Severidad
- Recomendaciones

## Evidencias

- Capturas
- Logs
- Resultados

## Estado final

- Aprobado
- Aprobado con observaciones
- Requiere correcciones

---

# FASE 10 - Documentación

Actualizar obligatoriamente:

- CHANGELOG
- Functional Specification
- Technical Specification
- API Documentation
- Diagramas
- Manual Técnico
- Manual de Usuario

---

# FASE 11 - Revisión Final

Antes de cerrar el desarrollo validar:

- [ ] Código limpio.
- [ ] Sin errores críticos.
- [ ] Sin advertencias importantes.
- [ ] Documentación actualizada.
- [ ] Auditoría funcionando.
- [ ] Exportaciones funcionando.
- [ ] Datos demo disponibles.
- [ ] Informe de pruebas generado.

---

# Criterios de Aprobación

Un desarrollo solo podrá marcarse como **Completado** cuando:

- Todas las pruebas obligatorias hayan sido aprobadas.
- No existan errores críticos.
- La documentación esté sincronizada con el código.
- El informe de pruebas haya sido generado.
- La revisión técnica haya sido aprobada.

---

# Prohibiciones

No está permitido:

- Implementar funcionalidades sin especificación.
- Omitir pruebas.
- Omitir datos demo.
- Omitir la auditoría.
- Omitir la documentación.
- Actualizar código sin actualizar la documentación correspondiente.
- Marcar un desarrollo como terminado sin generar el informe final de pruebas.

---

# Regla Permanente

Este flujo es obligatorio para cualquier desarrollo futuro.

Se aplica independientemente del tamaño del cambio.

Ninguna Inteligencia Artificial, desarrollador o colaborador podrá omitir este procedimiento sin una aprobación explícita del propietario del proyecto.

El incumplimiento de este flujo implica que el desarrollo no podrá considerarse finalizado ni apto para integración o despliegue.
