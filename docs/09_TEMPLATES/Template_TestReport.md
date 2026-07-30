# Plantilla — Informe de Pruebas de Módulo

> Requisito de producto entregado directamente por el product owner (sesión 2026-07-29, "FASE 17 — Validación Integral y Pruebas del Sistema"). Usar este formato al finalizar la validación de cualquier módulo, siguiendo el checklist de `docs/06_TESTS/IntegrationTestPlan.md`. No fabricar resultados: si un campo no se puede completar honestamente todavía, dejarlo como "Pendiente de ejecución", igual que exige `docs/09_TEMPLATES/Template_TestCase.md` para casos individuales.

## [Nombre del módulo] — Informe de Pruebas

- **Fecha de ejecución:**
- **Versión evaluada:**
- **Ambiente de pruebas:** [local / staging / etc.]
- **Responsable de la ejecución:**

## Resumen de ejecución

| Métrica | Valor |
|---|---|
| Total de casos ejecutados | |
| Casos aprobados | |
| Casos fallidos | |
| Casos bloqueados | |
| Cobertura funcional (%) | [proporción del checklist de `IntegrationTestPlan.md` efectivamente ejecutado, no una métrica de cobertura de código] |
| Tiempo total de ejecución | |

## Hallazgos

[Lista de hallazgos relevantes, no solo errores — incluir comportamiento inesperado aunque no sea un bug formal.]

## Errores encontrados

| Error | Severidad | Estado |
|---|---|---|
| [descripción] | Crítica / Alta / Media / Baja | Abierto / Corregido |

## Evidencias

[Capturas de pantalla u otra evidencia reproducible, cuando sea posible. Si no hay evidencia archivada, decirlo explícitamente — no dejarlo en blanco sin explicación (mismo principio que `docs/06_TESTS/ManualTestCases.md` ya declara sobre sus propios gaps de evidencia).]

## Recomendaciones

[Qué debería hacerse antes de la siguiente ejecución o antes de aprobar el módulo.]

## Estado final del módulo

- [ ] Aprobado
- [ ] Aprobado con observaciones
- [ ] Requiere correcciones

Ver criterio exacto de cada estado en `docs/10_GOVERNANCE/DefinitionOfDone.md`, sección "Estados de aprobación de módulo".

---

## Notas de uso

- Este informe se genera **al finalizar** la validación de un módulo, no durante — para el detalle caso por caso mientras se ejecuta, usar `docs/09_TEMPLATES/Template_TestCase.md`.
- "Generar automáticamente" (como pide el requisito original) es una capacidad de tooling, no de este documento en sí — hasta que exista esa automatización, este informe se completa manualmente siguiendo este formato, para que el criterio de aprobación de `DefinitionOfDone.md` tenga siempre un artefacto real que lo respalde.
