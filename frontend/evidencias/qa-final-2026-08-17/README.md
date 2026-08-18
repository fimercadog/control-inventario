# Evidencias QA final — 2026-08-17

## Alcance

Ejecución de regresión Playwright contra el frontend en `http://localhost:3000`
y el backend real en `http://localhost:8000`.

La suite descubierta contiene **131 pruebas Chromium en 7 archivos**:

- autenticación y recuperación de contraseña;
- Captura IA;
- categorías;
- roles;
- proveedores;
- usuarios;
- RBAC, aislamiento multiempresa y responsive.

## Ejecución 1 — interrumpida

- Preparación: `php artisan e2e:seed` completado correctamente.
- Comando: `npx playwright test` desde `frontend/`.
- Resultado: interrumpido por el límite externo de 6 minutos, sin resumen final.
- Evidencia: `artefactos-ejecucion-interrumpida/` contiene los 10 contextos de error que Playwright alcanzó a generar.
- Hallazgo: los contextos muestran pantallas en `Cargando`; con cuatro workers la suite competía por el servidor PHP de desarrollo, que atiende las solicitudes de forma serial.

## Ejecución 2 — serial, bloqueada

Se configuró `workers: 1` para eliminar la contención de solicitudes. La
repetición quedó bloqueada en el primer worker durante más de ocho minutos, sin
emitir salida, artefactos ni reporte HTML. El árbol de procesos de Playwright se
detuvo de forma controlada; los servidores de aplicación en 3000 y 8000
permanecieron disponibles. Ver `INC-QA-001`.

## Calidad estática

- TypeScript: `npx tsc --noEmit` correcto antes de la ejecución.
- ESLint: sin errores en los componentes modificados.

Ver [errores-e-incidencias.md](errores-e-incidencias.md) para el detalle y el
estado de cada hallazgo.
