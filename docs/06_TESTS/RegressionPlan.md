# Plan de Regresión

## Objetivo

Qué debe re-verificarse antes de cada release, dado el estado real de la suite de tests (94 tests backend automatizados, cero frontend automatizados).

## Regresión automatizada (obligatoria antes de cualquier release)

```bash
cd backend
php artisan config:clear
php artisan test
```

Los 94 tests deben pasar en su totalidad. Ningún release debe salir con tests en rojo (`AGENTS.md`, Release Rules: "Never release code that has ... Failed Tests"). Áreas cubiertas automáticamente:

- Autenticación completa (login, logout, refresh, reset de contraseña).
- Aislamiento multi-tenant (25 tests adversariales).
- Captura IA (los 8 endpoints, deduplicación, umbral de confianza, idempotencia, transacciones, eventos).
- Manejo de errores (ninguna excepción cruda expuesta).

## Regresión manual (obligatoria, sin automatización que la reemplace)

Dado que no hay tests de frontend automatizados, **antes de cada release** debe repetirse manualmente, como mínimo, el subconjunto de `ManualTestCases.md` marcado como "crítico":

1. Login real (credenciales válidas e inválidas).
2. Walkthrough completo de Captura IA (Foto + Voz → revisión → confirmación → Dashboard actualizado).
3. Revisión responsive en al menos un tamaño mobile y uno desktop.
4. Verificación de que no aparecen errores de consola ni de red inesperados durante el flujo anterior.

Ver `ManualTestCases.md` para el detalle completo de cada caso.

## Qué re-verificar según el tipo de cambio

| Tipo de cambio | Regresión mínima requerida |
|---|---|
| Cambio en `TenantScope`, `IdentifyTenant`, Policies, o cualquier trait `BelongsToEmpresa` | Suite completa de `Security/*` + `RbacFoundationTest` + revisión manual de que ningún endpoint nuevo quedó sin `tenant` middleware |
| Cambio en `AuthenticationService`, `RefreshTokenService`, Controllers de Auth | `Auth/*` completo + verificación manual de login/logout/refresh en navegador |
| Cambio en cualquier Strategy/Service/Action de Captura IA | `CapturaIA/*` (Unit + Feature) completo + walkthrough manual de Captura IA |
| Cambio de dependencias (`composer.json`/`package.json`) | Suite completa backend + smoke test manual de arranque de ambos servidores (`DEMO.md` §2) |
| Cambio de UI (cualquier pantalla) | Regresión manual completa de `ManualTestCases.md` (no hay automatización que lo cubra parcialmente) |
| Cambio de esquema de base de datos (nueva migración) | Suite completa + verificación manual de que `php artisan migrate --seed` corre limpio desde cero |

## Gaps del plan de regresión

- No existe suite de regresión visual (screenshots comparados) para el frontend.
- No existe smoke test automatizado de "el sistema arranca" (`php artisan serve` + `npm run dev` + ambos responden) — hoy es 100% manual, siguiendo `DEMO.md`.
- No hay ambiente de staging separado — la regresión corre contra el ambiente local de quien hace el release.
