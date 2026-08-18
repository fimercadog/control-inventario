# Errores e incidencias — QA final 2026-08-17

## INC-QA-001 — Contención del servidor durante la suite paralela

**Estado:** bloqueado; requiere diagnóstico adicional de la infraestructura E2E.

**Severidad:** alta para la confiabilidad de QA, no clasificada todavía como
defecto funcional.

**Evidencia:**

- `artefactos-ejecucion-interrumpida/categorias-Categorías-list-navigates-to-the-next-page-chromium/error-context.md`
- `artefactos-ejecucion-interrumpida/roles-Roles-list-with-enou-f6017-e-size-and-resets-to-page-1-chromium/error-context.md`
- `artefactos-ejecucion-interrumpida/captura-ia-Captura-IA-conf-011f8-tado-and-the-recientes-list-chromium/error-context.md`

**Reproducción:** ejecutar `npx playwright test` con cuatro workers contra
`php artisan serve`.

**Resultado observado:** varias pruebas expiran esperando contenido mientras la
pantalla conserva solo el indicador `Cargando`; la ejecución global alcanza el
límite de seis minutos y no emite resumen final.

**Causa probable:** el servidor PHP de desarrollo procesa solicitudes de forma
serial, mientras la configuración iniciaba cuatro workers de Playwright en
paralelo.

**Mitigación aplicada:** `frontend/playwright.config.ts` ahora usa `workers: 1`.
La repetición serial también quedó bloqueada en el primer worker durante más de
ocho minutos, sin salida ni artefactos. El siguiente paso es ejecutar los tests
por archivo con trazas habilitadas y revisar los logs del servidor Laravel para
identificar la primera solicitud que no termina.

## INC-QA-002 — Cobertura incompleta de Modo Contingencia

**Estado:** pendiente.

**Severidad:** media.

La suite actual enumera 131 pruebas pero no contiene un archivo Playwright
dedicado a Modo Contingencia. Deben añadirse escenarios de activación,
persistencia local, edición offline, sincronización manual, bloqueo global y
conflictos antes de cerrar el proyecto según `spec.md`.

## INC-QA-003 — Cobertura E2E de módulos no presente en la suite actual

**Estado:** pendiente.

**Severidad:** media.

No hay archivos Playwright dedicados para marcas, unidades de medida, clientes,
productos, stock, movimientos, reportes, auditoría, perfil y configuración.
La orden de cierre incluida en `spec.md` exige cubrir todos estos módulos y
funcionalidades antes de declarar terminado el desarrollo.
