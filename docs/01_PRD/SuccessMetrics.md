# Métricas de Éxito

Documento nuevo — no existía en ninguna forma (ni en el master spec, ni en ningún otro doc). No se inventan cifras actuales; se define qué se debería medir y por qué, en función de los objetivos declarados en `00_VISION/BusinessGoals.md`.

## Principio

Ninguna métrica de este documento tiene un valor actual reportado. Son métricas a instrumentar, no resultados ya alcanzados. Donde el sistema no tenga instrumentación para capturarlas hoy, se marca explícitamente.

## Métricas de adopción del producto

- **Tiempo promedio para registrar un movimiento de inventario** (comparando el flujo manual/CRUD contra Captura IA). Objetivo direccional: Captura IA debe ser sustancialmente más rápido que el registro manual — es la hipótesis central del producto (ver `01_PRD/ProblemStatement.md`). No instrumentado todavía.
- **% de movimientos registrados vía Captura IA vs. formulario manual**, una vez el formulario manual de Productos exista (hoy no existe — ver `01_PRD/OutOfScope.md`/`UserStories.md`).
- **Tasa de confirmación de capturas IA** (`capturas_ia` confirmadas / total generadas) — señal de si la extracción por IA es lo suficientemente precisa como para no requerir corrección manual constante.

## Métricas de confiabilidad de datos

- **Discrepancia entre stock del sistema y conteo físico**, medida en auditorías periódicas — es la métrica más directamente ligada al objetivo "reducir pérdidas por errores de inventario" (`BusinessGoals.md`). Requiere que el cliente reporte conteos físicos; no instrumentable solo desde el sistema.
- **% de movimientos con trazabilidad completa** (usuario, fecha, motivo) — hoy debería ser 100% por diseño (RN-002, RN-008), pero vale la pena medir como verificación continua, no solo como regla de negocio asumida.

## Métricas de plataforma (seguridad y disponibilidad)

- **Incidentes de fuga de datos entre empresas (cross-tenant)** — objetivo: cero, siempre. Ya cubierto por la suite de tests adversariales del Módulo 2 (ver `06_TESTS/AutomatedTests.md`); debería seguir midiéndose en cada release, no solo una vez.
- **Tiempo de respuesta de operaciones CRUD** — objetivo declarado en el master spec (§63): menor a 500 ms. No instrumentado con monitoreo continuo todavía (no hay APM configurado).
- **Disponibilidad del sistema** — objetivo declarado: operar 24/7. No hay SLA formal ni monitoreo de uptime configurado todavía.

## Métricas de negocio (para el cliente final, la PyME)

- **Reducción de tiempo dedicado a conteos manuales de inventario** — métrica cualitativa a validar con clientes piloto una vez el producto tenga usuarios reales.
- **Reducción de quiebres de stock no detectados a tiempo** — depende de que el módulo de alertas de bajo stock (RF-018) esté en uso activo.

## Gap explícito

No existe hoy ningún dashboard de producto/analítica que capture estas métricas automáticamente. Instrumentarlas es trabajo pendiente, no algo que ya esté ocurriendo en segundo plano. Este documento define el *qué* medir; el *cómo* (instrumentación, dashboards internos) es una decisión técnica futura, fuera del alcance de este documento de producto.
