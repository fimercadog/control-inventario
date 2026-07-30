# Release Workflow

## Regla

Nunca se libera código con:
- Bugs críticos abiertos.
- Tests fallando.
- Build roto.
- Documentación desactualizada respecto a lo que realmente se libera.

## Proceso

1. Confirmar que cada módulo incluido en la release cumple `10_GOVERNANCE/DefinitionOfDone.md`.
2. Ejecutar `07_RELEASE/ReleaseChecklist.md` completo.
3. Actualizar `07_RELEASE/ReleaseNotes.md` con el contenido real de la release.
4. Revisar `07_RELEASE/KnownIssues.md` — toda limitación conocida debe estar documentada antes de liberar, no descubierta después.
5. Confirmar que `07_RELEASE/RollbackPlan.md` sigue siendo válido para los cambios de esta release (especialmente si hay migraciones de base de datos nuevas).
6. Actualizar `CHANGELOG.md` en la raíz del repositorio.
7. Marcar el/los módulo(s) como `Released` en su documento de `05_IMPLEMENTATION/`.

## Brecha actual (declarada, no oculta)

No existe pipeline de CI/CD (ver `04_TECHNICAL_SPEC/Deployment.md` y `07_RELEASE/DeploymentGuide.md`). Todo el checklist de este flujo se ejecuta manualmente hoy. Automatizarlo es una mejora futura, no un requisito bloqueante para operar bajo SDD — pero cada release debe declarar explícitamente que se validó manualmente.
