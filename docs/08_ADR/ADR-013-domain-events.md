# ADR-013: Eventos de dominio despachados post-commit (`DB::afterCommit`), sin listeners todavía

## Estado
Accepted (Verified)

## Fecha
No verificable con fecha exacta (ver ADR-001). Corresponde a la "revisión final de arquitectura" de Fase 3 de Captura IA. Proxy: migraciones de Captura IA, `2026-07-28`.

## Contexto
El sistema necesita poder reaccionar en el futuro a hechos de negocio (stock actualizado, captura completada, movimiento registrado) — por ejemplo, para alertas de stock mínimo, notificaciones en tiempo real, o sincronización externa — sin acoplar esa reacción futura a la transacción que escribe el dato.

## Problema
¿Cómo emitir eventos de dominio de forma que nunca se disparen si la transacción que los originó termina en rollback, y sin bloquear la escritura principal mientras un listener (aún no escrito) se ejecuta?

## Alternativas evaluadas
No documentadas como comparación explícita con otras estrategias (por ejemplo, un event bus externo, o disparar eventos sin esperar el commit). La alternativa implícita descartada (`event()` directo, dentro de la transacción, antes del commit) está descartada explícitamente por el mecanismo documentado.

## Decisión
Cada Service llama a `DB::afterCommit(fn () => event(new Xxx(...)))` en vez de `event()` directo. Como las operaciones normalmente corren dentro de la transacción exterior de `procesar()`, Laravel difiere automáticamente esos `afterCommit()` hasta que la transacción MÁS externa hace commit — si la captura completa falla, ninguno de estos eventos se dispara, ni siquiera los de detecciones que sí se habían "aplicado" antes del fallo. Deliberadamente, todavía no hay listeners: solo la arquitectura de eventos queda lista.

**Fuentes verificadas (todas de `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md`, §74 "Eventos de dominio", líneas 5626–5637):**
- Línea 5628: *"Después de que la transacción completa hace commit, se disparan eventos — nunca antes, y nunca si hubo rollback."*
- Línea 5635: *"Mecanismo: cada Service llama a `DB::afterCommit(fn () => event(new Xxx(...)))` en vez de `event()` directo. Como `registrarMovimiento()`/`crear()` normalmente corren DENTRO de la transacción exterior de `procesar()`, Laravel difiere automáticamente esos `afterCommit()` hasta que la transacción MÁS externa hace commit."*
- Línea 5637: *"Sin listeners todavía (a propósito, sección 74 punto 6): solo la arquitectura de eventos queda lista. Casos de uso futuros obvios: alertas de stock mínimo/máximo (`StockUpdated`), notificaciones en tiempo real al frontend (`AICaptureCompleted`), sincronización con sistemas externos (`InventoryMovementRegistered`)."*
- Línea 5650 (verificación reportada): *"Eventos de dominio — implementados (ver arriba), sin listeners. Probado que se disparan tras éxito y que NO se disparan tras un rollback."*
- `AGENTS.md` §"Architecture Principles": *"event-driven where appropriate"* — principio general, consistente con esta implementación específica.
- Código real: `backend/app/Events/{AICaptureCompleted.php, InventoryMovementRegistered.php, ProductCreated.php, StockUpdated.php}` y `backend/app/Events/Auth/{PasswordWasReset.php, UserLoggedIn.php, UserLoggedOut.php}` — existencia verificada.

## Consecuencias
- Garantía verificada: un evento nunca se dispara si la transacción que lo originó falla — probado explícitamente según la fuente.
- Sin listeners activos, estos eventos hoy no tienen ningún efecto observable en el sistema — es infraestructura preparada, no funcionalidad entregada al usuario.
- Riesgo a vigilar: si en el futuro se agregan listeners síncronos pesados, podrían alargar la respuesta HTTP inmediatamente después del commit (los eventos se disparan dentro del mismo ciclo de request, no en una cola, salvo que se decida lo contrario al implementar los listeners).

## Impacto
Medio — no afecta el comportamiento actual observable por el usuario (sin listeners), pero es la base sobre la que se construirán features de notificación/alertas futuras.

## Referencias
- `docs/_ARCHIVE/00_MASTER_SPECIFICATION_ORIGINAL.md` §74 (líneas 5626–5650)
- `AGENTS.md`
- `backend/app/Events/*`

## Estado de implementación
Implementado y verificado en código (clases de evento existen) y probado según la fuente citada (se disparan tras éxito, no tras rollback). **Sin listeners** — confirmado como estado deliberado, no como trabajo pendiente sin documentar.

## Información Faltante
No se documentó si se evaluó un event bus externo (colas, sistemas de mensajería) como alternativa a los eventos síncronos de Laravel, ni cuándo se planea escribir los primeros listeners. Se documenta el mecanismo de despacho y su garantía transaccional, no una hoja de ruta de los listeners futuros.
