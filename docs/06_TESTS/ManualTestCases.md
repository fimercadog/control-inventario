# Casos de Prueba Manual

> Reconstrucción de las verificaciones de frontend/end-to-end realizadas ad hoc durante la sesión de RC1 (walkthrough, revisión responsive, verificación de login real), formalizadas ahora en formato ID/Objetivo/Precondiciones/Pasos/Resultado Esperado/Resultado Real/Estado, según `docs/SDD_MIGRATION_PLAN.md` §1.13. Estas escenas se ejecutaron en su momento vía navegador real; no existía, ni existe hoy, ninguna automatización que las reemplace (ver `MasterTestPlan.md`). "Resultado Real" y "Estado" reflejan lo reportado por esa sesión de verificación; deben re-ejecutarse y actualizarse en cada regresión (ver `RegressionPlan.md`).

## MTC-001 — Levantar el proyecto desde cero (crítico)

- **Objetivo:** confirmar que los pasos documentados en `DEMO.md` §2 realmente levantan el sistema.
- **Precondiciones:** PHP 8.2+, Composer, Node 20+, SQLite disponibles.
- **Pasos:** `cd backend && composer install && cp .env.example .env && php artisan key:generate && touch database/database.sqlite && php artisan migrate --seed && php artisan serve`; en paralelo, `cd frontend && npm install && cp .env.example .env.local && npm run dev`.
- **Resultado esperado:** backend responde en `http://localhost:8000`, frontend en `http://localhost:3000`, el seeder crea la empresa demo (`Fidel OS Demo`, id 1).
- **Resultado real:** Backend y frontend levantan correctamente; seeder crea la empresa demo como se documenta.
- **Estado:** Pasa.

## MTC-002 — Login real con credenciales válidas (crítico)

- **Objetivo:** verificar el flujo de login del Auth Módulo 1 en un navegador real, no solo vía test HTTP.
- **Precondiciones:** backend y frontend corriendo; un usuario existente (seeder o creado a mano).
- **Pasos:** ir a `/login`; ingresar email/password válidos; enviar.
- **Resultado esperado:** redirección al Dashboard; sesión persistida (access token en memoria, refresh token en cookie httpOnly).
- **Resultado real:** login exitoso; cookie `refresh_token` confirmada como httpOnly (no accesible desde `document.cookie` en la consola del navegador).
- **Estado:** Pasa.

## MTC-003 — Sesión sobrevive un reload duro (crítico)

- **Objetivo:** confirmar que el refresh silencioso realmente reestablece la sesión tras perder el estado de memoria (access token).
- **Precondiciones:** sesión iniciada (MTC-002).
- **Pasos:** con sesión activa en el Dashboard, hacer un hard reload (Ctrl+Shift+R / limpiar cache de la pestaña).
- **Resultado esperado:** el interceptor de Axios detecta la ausencia de access token, dispara `refresh` usando la cookie httpOnly, y la sesión se restablece sin pedir login de nuevo.
- **Resultado real:** confirmado — la sesión se restablece automáticamente tras el reload.
- **Estado:** Pasa.

## MTC-004 — "Remember Me" extiende la expiración de la sesión

- **Objetivo:** verificar que marcar "Remember Me" en login efectivamente cambia la duración de la sesión en base de datos.
- **Pasos:** login con "Remember Me" activado; inspeccionar `auth_sessions.expires_at` del registro creado.
- **Resultado esperado:** `expires_at` refleja ~30 días desde el login, en vez de la duración corta por defecto.
- **Resultado real:** confirmado en base de datos.
- **Estado:** Pasa.

## MTC-005 — Walkthrough completo de Captura IA: Foto + Voz (crítico, "la joya de la demo")

- **Objetivo:** validar el flujo completo descrito en `DEMO.md` §6, punto 4-6, de punta a punta en UI real.
- **Precondiciones:** sesión iniciada; `OPENAI_API_KEY` válida y con saldo configurada en `backend/.env` (sin ella, este caso falla en el paso de análisis con un error amigable — ver MTC-006 para ese escenario).
- **Pasos:** ir a la pantalla de Captura IA; elegir "Foto + Voz"; tomar/subir una foto de un producto; grabar un audio corto (ej. "Entraron cinco bolsas de Dog Chow"); presionar "Analizar foto + voz"; observar los estados de carga (Subiendo → Analizando → Transcribiendo → Combinando → Guardando); en la pantalla de revisión, confirmar el resultado.
- **Resultado esperado:** tarjetas de producto detectado con nombre/cantidad/badge de confianza; si la confianza es baja, queda editable y marcada para revisión; al confirmar, el Dashboard refleja el nuevo movimiento y stock actualizado.
- **Resultado real:** flujo completo verificado exitoso durante la sesión RC1, incluyendo los estados de carga conversacionales.
- **Estado:** Pasa.

## MTC-006 — Captura IA sin `OPENAI_API_KEY` configurada (crítico — límite conocido)

- **Objetivo:** confirmar que la ausencia de la API key falla de forma amigable, no con un error crudo.
- **Precondiciones:** `OPENAI_API_KEY` vacía o inválida en `backend/.env`.
- **Pasos:** intentar el flujo de MTC-005.
- **Resultado esperado:** el resto de la app funciona con normalidad (Dashboard, Productos, Movimientos con datos de ejemplo); solo el paso de análisis final falla con un mensaje de error amigable.
- **Resultado real:** confirmado según `DEMO.md` §5 — comportamiento documentado y verificado.
- **Estado:** Pasa.

## MTC-007 — Producto de baja confianza marcado para revisión manual

- **Objetivo:** verificar en UI (no solo en el test HTTP) que una detección de baja confianza se distingue visualmente y es editable.
- **Pasos:** capturar una foto de un producto ambiguo o con mala iluminación (o forzar baja confianza si el modo demo lo permite); revisar la pantalla de resultados.
- **Resultado esperado:** badge de confianza en rojo (< 0.85); campos (nombre, cantidad, categoría) editables antes de confirmar.
- **Resultado real:** confirmado durante RC1.
- **Estado:** Pasa.

## MTC-008 — Dashboard refleja la captura recién confirmada

- **Objetivo:** verificar actualización en tiempo real (post-confirmación) de las tarjetas de resumen y del feed de movimientos recientes.
- **Pasos:** completar MTC-005; regresar al Dashboard.
- **Resultado esperado:** tarjetas de resumen (productos totales, stock, stock bajo, entradas/salidas de hoy) y movimientos recientes reflejan la captura recién confirmada.
- **Resultado real:** confirmado.
- **Estado:** Pasa.

## MTC-009 — Tabla de Productos: búsqueda y filtro

- **Objetivo:** validar la interacción básica de la tabla de productos (con datos mock, según límites conocidos del MVP).
- **Pasos:** ir a Productos; usar el campo de búsqueda; aplicar un filtro.
- **Resultado esperado:** la tabla filtra correctamente sobre los datos mostrados.
- **Resultado real:** confirmado durante RC1 (nota: los datos de Productos/Movimientos siguen siendo mock del lado del frontend salvo lo escrito realmente por Captura IA — ver `docs/07_RELEASE/KnownIssues.md`).
- **Estado:** Pasa.

## MTC-010 — Línea de tiempo de Movimientos: colores por tipo

- **Objetivo:** confirmar la convención visual (entradas en verde, salidas en rojo) descrita en `DEMO.md` §6, punto 7.
- **Pasos:** ir a Movimientos; observar el feed.
- **Resultado esperado:** entradas en verde, salidas en rojo, orden cronológico correcto.
- **Resultado real:** confirmado.
- **Estado:** Pasa.

## MTC-011 — Revisión responsive (mobile/tablet/desktop)

- **Objetivo:** confirmar que las pantallas construidas (Login, Dashboard, Captura IA, Productos, Movimientos) son usables en los tres tamaños de referencia, dado que la Captura IA está explícitamente optimizada mobile/tablet-first.
- **Pasos:** revisar cada pantalla en viewport mobile (~375px), tablet (~768px) y desktop (~1440px).
- **Resultado esperado:** sin overflow horizontal, controles táctiles accesibles en mobile/tablet, layout coherente en desktop.
- **Resultado real:** revisión responsive realizada durante RC1, reportada sin hallazgos bloqueantes.
- **Estado:** Pasa.

## MTC-012 — Estados de carga/vacío/error presentes en las pantallas principales

- **Objetivo:** confirmar la regla de `AGENTS.md` ("Loading/Empty/Error states are mandatory") en las pantallas construidas.
- **Pasos:** provocar cada estado (ej. desconectar backend para ver error, entrar sin capturas previas para ver vacío, observar el estado de carga durante una captura).
- **Resultado esperado:** cada pantalla principal muestra un estado dedicado, no una pantalla en blanco ni un error crudo.
- **Resultado real:** verificado como parte de la suite de verificación RC1 mencionada en el roadmap.
- **Estado:** Pasa.

## Gaps de este documento

- Estos casos fueron ejecutados una vez, durante la sesión de RC1; no hay evidencia (screenshots, grabaciones) archivada junto a este documento, solo el reporte narrativo de esa sesión.
- Ninguno de estos casos se ha vuelto a ejecutar desde entonces como parte de un proceso de regresión formal — la próxima vez que cualquiera de las áreas cubiertas cambie, este documento debe re-ejecutarse y sus resultados actualizarse (ver `RegressionPlan.md`).
- No cubren navegadores más allá del usado durante la verificación (no se probó cross-browser explícitamente).
