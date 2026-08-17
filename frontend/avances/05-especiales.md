# Fase 5 — Especiales

**Estado: COMPLETA.**

## Auditoría — construido

Módulo 100% de solo lectura (confirmado: `AuditLogPolicy` no declara `create`/`update`/`delete`; `AuditLog::update()`/`delete()` lanzan `LogicException` en el propio modelo). Listado con búsqueda, filtro por módulo/acción (poblados dinámicamente desde `meta.modulos_disponibles`/`meta.acciones_disponibles` que el propio backend expone — nunca hardcodeados), rango de fechas, página 25/página (default real, no copiado de otro módulo). Detalle en diálogo: valores anteriores/nuevos en JSON crudo (formato técnico, tal como pide el manual). **Regla de privacidad respetada explícitamente**: el Resource real nunca expone `usuario.name`, solo email+roles — el tipo TypeScript lo documenta para que nadie lo agregue por error más adelante.

## Perfil — construido

Autoservicio sobre `$request->user()` (nunca opera sobre otro usuario). `name`/`email` son Identity (ADR-015, fijados al aceptar la invitación) — de solo lectura aquí. Editable: theme/language/timezone (persistidos honestamente; `language` no traduce ningún texto todavía — confirmado en el propio docblock del backend, no se inventa esa capacidad), avatar (subir/quitar — versión self-service del componente ya usado en Usuarios, endpoint distinto `/perfil/avatar` sin `{id}`), contraseña (exige la actual, revoca todas las sesiones al cambiar — redirige a `/login`). `store/slices/session-slice.ts` extendido con `updateUser` (reducer aditivo) para reflejar cambios sin round-trip completo.

## Configuración — construido, deliberadamente mínimo

No existe `EmpresaController` ni `ConfiguracionController` (INC-005). El propio manual lo confirma explícitamente ("Los campos de 'Empresa' en Configuración... no son editables... Este manual no describe una capacidad de edición que no existe"). Esta pantalla muestra únicamente el nombre de empresa (real, de `GET /auth/me`) — "zona horaria de empresa" y "umbral de Captura IA" NO se muestran: no existe ningún endpoint que exponga ninguno de los dos (confirmado — el umbral es una variable de entorno del backend, `CAPTURA_IA_CONFIDENCE_THRESHOLD`, nunca expuesta vía API). Mostrarlos habría sido inventar información.

**"Mi Perfil" y "Configuración" no están en el sidebar** — el manual (sección 5) es explícito: se acceden desde el menú del avatar en el header, junto a "Cerrar sesión". `header.tsx` extendido (aditivo) con esos dos enlaces.

## Reportes — construido

El más grande de esta fase: catálogo de 13 reportes reales, resumen, historial, y programación (con la salvedad honesta de abajo). En vez de 13 pantallas a medida, se construyó UNA UI genérica dirigida por el catálogo: `Reporte::filtrosDisponibles()` (backend) describe los filtros de cada reporte (`clave/etiqueta/tipo/requerido`) — el frontend los renderiza dinámicamente (`reporte-filtros-form.tsx`), resolviendo las opciones de cada `select` contra su fuente real (categoria_id→Categorías, marca_id→Marcas, producto_id→Productos, modulo/accion→las mismas listas dinámicas de Auditoría, tipo/estado→enums reales hardcodeados). Vocabulario de filtros confirmado cerrado leyendo las 13 clases de `app/Reports/*.php` una por una, no asumido.

- **Tabs**: Resumen / Catálogo / Historial / Programados.
- **Preview + exportación** (`/reportes/[clave]`): filtros → vista previa paginada → CSV/Excel/PDF, mismos filtros aplicados a la exportación.
- **Permisos reales, verificados contra `ReportePolicy`** (no asumidos del manual, que solo mencionaba `reportes.ver`): `reportes.ver` gatea lectura/preview/export/historial; `reportes.gestionar` — un permiso real distinto — gatea crear/eliminar programaciones. La UI de Programados usa `reportes.gestionar`, no `reportes.ver`.
- **Honestidad deliberada sobre Programados**: el propio modelo `ReporteProgramado` documenta ser "infraestructura future-ready... sin que exista todavía un motor que lo ejecute". La pantalla permite crear/listar/eliminar programaciones reales (la API las guarda de verdad), pero muestra una alerta explícita de que ningún motor las ejecuta todavía — nunca se insinúa un envío automático que no existe.

## Captura IA — construido

Tres modos (Foto/Voz/Foto+Voz) vía subida de archivo real (`<input type="file">`, con `capture="environment"` en el de imagen para cámara en móvil) — sin grabación en vivo con Web Audio API por alcance/tiempo, pero el contrato real del backend (multipart file upload) se respeta fielmente. Tras "Analizar", navega a la pantalla de revisión (`/captura-ia/[uuid]`, id público = uuid, nunca el id numérico interno — confirmado en el propio Resource).

- **Revisión**: cada producto detectado muestra confianza, y es corregible (`Corregir`) solo mientras su estado es `pendiente_revision`/`corregido` (`ESTADOS_EDITABLES`, confirmado contra `CapturaIAService`) — terminal en `aplicado`/`descartado`.
- **Confirmar/Descartar**: aplican sobre TODOS los detalles editables de la captura a la vez (no uno por uno) — así es como realmente funciona `CapturaIAService::confirmar()`/`descartar()`.
- **Permisos reales, tres separados** (confirmado contra `CapturaIAPolicy`, no asumidos del manual que los lista igual pero sin detallar el mapeo): `captura-ia.usar` → crear+ver; `captura-ia.revisar` → corregir un detalle; `captura-ia.confirmar` → confirmar/descartar. Existe un cuarto permiso, `captura-ia.gestionar`, sembrado para una futura pantalla de configuración que **no existe** — no se construyó nada para él, mismo criterio que Configuración.
- **Verificado con AI real** (hay una API key real de OpenAI configurada en `.env`): una imagen degenerada de prueba (1×1 px, para no gastar cuota real en una imagen sin contenido) fue rechazada por el pipeline real con el mensaje exacto que documenta `manual.html` sección 12 ("No pudimos analizar" → "El proveedor de IA no pudo procesar...") — confirma que la ruta de error real funciona palabra por palabra como la documentación oficial. La ruta de éxito se verificó contra capturas históricas reales ya existentes (20 capturas reales con estados variados: Aplicado/Pendiente/Parcial/Descartado), no forzando una nueva llamada de IA exitosa — mismo resultado de verificación, sin gasto adicional de cuota.

**Archivos nuevos:** `types/{audit-log,captura-ia,reporte}.ts`, `lib/api/{audit-log,captura-ia,reportes,perfil}.ts`, `components/forms/{cambiar-password,perfil-avatar,perfil-datos,movimiento}-form.tsx` (movimiento-form ya contado en Fase 4), `app/auditoria/*`, `app/perfil/*`, `app/configuracion/*`, `app/reportes/*` (incluye `[clave]/page.tsx`, `reporte-filtros-form.tsx`, `programados-tab.tsx`), `app/captura-ia/*` (incluye `[uuid]/page.tsx`). Modificados: `header.tsx` (enlaces Mi Perfil/Configuración), `store/slices/session-slice.ts` (`updateUser`).

**Verificación:** `tsc`/ESLint/build limpios (3 errores reales de `set-state-in-effect` encontrados y corregidos durante esta fase — mismo patrón recurrente de React Compiler ya documentado; ver commits). Smoke tests reales contra el backend real para los 5 módulos, incluyendo una llamada real al proveedor de IA configurado.

## Modo Contingencia — completado

Implementado contra el endpoint real `POST /v1/contingencia/productos/sincronizar`, sin cambios en backend ni base de datos. El control aparece arriba del sidebar y dentro del drawer móvil solo cuando el usuario tiene `productos.crear` o `productos.editar`; solicita confirmación, persiste el estado y la cola de operaciones en almacenamiento local, muestra un banner global y bloquea las escrituras normales desde el cliente mientras está activo. Crear se realiza como operación local de texto; editar desde la ficha de Producto guarda una operación con la versión base para que el backend detecte conflictos. La sincronización es manual, individual y ordenada; un error o conflicto conserva la operación para revisión o descarte explícito. El indicador de conectividad es solo informativo y nunca sincroniza por sí mismo.

Verificación: `npx tsc --noEmit`, ESLint (sin errores; advertencias preexistentes de React Hook Form) y `npm run build` correctos.
