# Plan de Rollback

## Estado honesto

**Gap real: nunca se ha ejecutado un rollback formal en este proyecto**, ni se ha probado el procedimiento descrito abajo en la práctica. Este es un plan mínimo razonable dado el stack (Laravel + Next.js, con migraciones de base de datos versionadas y control de versiones Git), no un procedimiento validado.

## Principio general

Todo cambio debe poder revertirse en dos capas independientes: **código** (Git) y **esquema de base de datos** (migraciones de Laravel). Un rollback correcto revierte ambas capas de forma consistente, en el orden correcto.

## Rollback de código

1. Identificar el último commit/tag conocido como estable (idealmente, el que pasó por `docs/07_RELEASE/ReleaseChecklist.md` completo).
2. `git revert` de los commits del release problemático (preferido sobre `git reset --hard` en cualquier rama compartida, para no reescribir historia).
3. Redesplegar backend y frontend desde el commit revertido, siguiendo `DeploymentGuide.md`.
4. Verificar que `composer test` (94 tests) pasa contra el código revertido.

## Rollback de base de datos

Cada migración en `backend/database/migrations/**` tiene un método `down()` que revierte su propio cambio de esquema (verificado por inspección: todas las migraciones de Auth Módulos 0-2 y Captura IA implementan `down()` correctamente, incluyendo `dropConstrainedForeignId`/`dropForeign` en el orden inverso a como se agregaron las FKs).

```bash
cd backend
php artisan migrate:rollback --step=N   # N = número de migraciones a revertir, correspondiente al release que se revierte
```

**Riesgo real, no probado**: revertir migraciones que ya tienen datos de producción escritos (ej. revertir `add_auth_fields_to_users_table` con usuarios reales ya creados) puede perder datos irreversiblemente (columnas eliminadas se llevan su contenido). Este plan no cubre migración/exportación de datos antes de un rollback destructivo — **debe decidirse caso por caso**, y idealmente evitarse: preferir un "roll forward" (un fix nuevo) sobre un rollback de esquema una vez que hay datos reales en producción.

## Rollback específico por módulo

| Módulo | Consideración especial |
|---|---|
| Captura IA | Revertir el esquema (`capturas_ia`, `capturas_ia_detalle`) borra el historial de capturas — considerar exportar `respuesta_ia_json` y `audit_logs` relacionados antes de revertir, si hay datos reales. |
| Auth Módulo 0/1/2 | Revertir `auth_sessions`/`security_logs` es seguro (son logs, no fuente de verdad de negocio). Revertir columnas de `users` (`empresa_id`, `is_platform_admin`, etc.) es destructivo si hay usuarios reales — evaluar antes de ejecutar `down()` en esa migración específica. |

## Qué NO existe todavía (gap)

- Sin backups automatizados de base de datos antes de un deploy.
- Sin ambiente de staging donde probar un rollback antes de ejecutarlo en el ambiente real.
- Sin runbook probado — este documento es la primera versión escrita, nunca ensayada end-to-end.
- Sin monitoreo que dispare automáticamente la decisión de hacer rollback (todo es decisión humana, hoy sin alertas).

## Recomendación

Antes de que este proyecto tenga datos de producción reales con usuarios externos, este plan debe ejecutarse al menos una vez en un ambiente de prueba (rollback de código + rollback de una migración reciente) para validar que realmente funciona como se describe aquí.
