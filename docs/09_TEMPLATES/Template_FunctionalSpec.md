# [Nombre de la Pantalla o Módulo Funcional]

**Status: [Built / In Progress / Planned]**

> Plantilla extraída de `docs/03_FUNCTIONAL_SPEC/AI_Capture.md`. Citar siempre la fuente (sección del master spec, o "reconstruido contra código real") y los archivos concretos de backend/frontend verificados, en el encabezado.

## Purpose

[Qué problema de usuario resuelve esta pantalla/módulo, en una a tres frases. Cómo se relaciona con otros dominios ya existentes — nunca una fuente de datos paralela sin justificación.]

## Business Flow

[Numerado, paso a paso, del punto de vista del usuario y del sistema: qué hace el usuario, qué responde el sistema, en qué orden.]

## Actors

[Quién interactúa con esta pantalla/módulo — roles humanos y actores técnicos (ej. un proveedor externo). Marcar explícitamente si los permisos que los limitarían existen en el catálogo pero no están enforced todavía.]

## Screens

[Lista de rutas/pantallas concretas, con el componente principal que las implementa si se conoce.]

## Fields

[Tabla: Campo | Origen | Editable — para cada campo relevante mostrado o capturado.]

## Validation Rules

[Reglas de validación de request/formulario, incluyendo códigos de estado HTTP donde aplique.]

## Permissions

[Qué permisos del catálogo aplican. Ser explícito si existen en el catálogo pero no están aplicados a nivel de middleware/ruta todavía — no dar por hecho que "existe en el seeder" significa "está enforced".]

## Loading States

[Qué ve el usuario mientras el sistema procesa — componente o mecanismo específico si existe.]

## Empty States

[Qué ve el usuario cuando no hay datos — componente reutilizable si existe.]

## Error States

[Tabla o lista de excepción → código HTTP → comportamiento visible. Confirmar que seguir el formato estándar de error de `04_TECHNICAL_SPEC/API.md`.]

## Business Rules

[Reglas de negocio específicas de este dominio — nunca duplicar reglas que pertenecen a otro dominio (ej. matching de producto vive en Products.md, no aquí, si este documento es de otro módulo).]

## Acceptance Criteria

[Lista verificable, referenciando tests reales cuando existan (`docs/06_TESTS/AcceptanceCriteria.md`).]

## Edge Cases

[Casos límite conocidos y cómo se manejan, o marcados como no manejados todavía.]

## Future Improvements

[Mejoras identificadas pero explícitamente fuera del alcance actual — no confundir con roadmap comprometido.]
