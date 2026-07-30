# Demo Data Audit — Unidad de Trabajo "Demo Data RC1"

**Fecha:** 2026-07-30
**Objetivo:** poblar todas las tablas implementadas con datos de prueba realistas para permitir pruebas funcionales completas del sistema (aprobado 2026-07-30, tras cierre de la Unidad de Trabajo "Sidebar RC1").

## Resumen

Se creó un factory por modelo implementado, un seeder independiente por módulo, y se reescribió `DatabaseSeeder` para orquestarlos sobre **dos empresas**: la empresa demo principal ("Fidel OS Demo", volumen completo — la misma que usa `test@example.com` para login real) y una segunda empresa ("Distribuidora Andina S.A.S.") a escala reducida (15%), solo para poder probar aislamiento multi-tenant con datos reales, no una fila vacía.

Comando único y reproducible, tal como pide el alcance: `php artisan migrate:fresh --seed`.

## Tablas pobladas y cantidad de registros

| Tabla | Empresa principal | Empresa secundaria | Total |
|---|---:|---:|---:|
| empresas | — | — | 2 |
| users | 15 | 2 | 17 |
| roles | 5 | 5 | 10 |
| categorias | 20 | 3 | 23 |
| marcas | 30 | 5 | 35 |
| unidades_medida | 10 | 2 | 12 |
| productos | 500 | 75 | 575 |
| proveedores | 100 | 15 | 115 |
| producto_proveedor | 1221 | 189 | 1410 |
| movimientos | 9359 | 1424 | 10783 |
| capturas_ia (+ detalle) | 100 (+~200) | 15 (+~34) | 115 (+234) |
| audit_logs | 5000 | 750 | 5750 |
| clientes | — | — | **N/A — módulo no implementado, tabla no existe (correcto no crearla en esta unidad)** |

Todos los volúmenes de la empresa principal coinciden exactamente con el objetivo aprobado (Usuarios 15, Categorías 20, Marcas 30, Unidades 10, Productos 500, Proveedores 100, Movimientos ~10.000, Capturas IA 100, Auditoría 5.000). "Stock" no es una tabla separada (decisión de arquitectura ya acordada: es una vista sobre `productos.stock_actual`) — su "población" es el resultado natural y verificado de los 10.783 movimientos generados, nunca escrito directo.

## Relaciones verificadas

Verificado por consulta directa tras el seed completo:

- ✅ 0 productos con `categoria_id`/`marca_id`/`unidad_medida_id` huérfano (apuntando a una fila inexistente).
- ✅ 0 productos con más de un proveedor "principal" en `producto_proveedor` (regla de negocio de FEATURE-005 respetada también en datos demo).
- ✅ `productos.stock_actual` coincide exactamente con `stock_nuevo` del último movimiento de cada producto (muestra verificada: 5 productos aleatorios, 5/5 OK).
- ✅ 0 movimientos con `stock_nuevo` negativo (la regla de `StockInsuficienteException` de `InventoryService` protegió el seeding igual que protegería una operación real — algunos intentos de Salida se omitieron por esta razón, no es un error).
- ✅ 0 roles sin `empresa_id`.
- ✅ 0 usuarios sin rol asignado.

## Tiempo de generación

`migrate:fresh --seed` completo: **3 min 15 s** (incluye recrear el esquema completo desde cero + poblar ambas empresas). El 90% del tiempo lo consume `MovimientoSeeder`, que crea cada movimiento vía `InventoryService::registrarMovimiento()` real (nunca un INSERT directo) para que `stock_actual` sea siempre resultado de la misma regla de negocio que usa producción.

## Errores encontrados y correcciones realizadas

1. **`SQLSTATE[HY000]: database is locked`** — el servidor de desarrollo (`php artisan serve`) seguía corriendo en segundo plano mientras se ejecutaba `migrate:fresh --seed`, compitiendo por el mismo archivo SQLite. **Corregido**: se detuvo el servidor antes de sembrar, se reinició después.
2. **`NOT NULL constraint failed: capturas_ia.uuid`** — el `uuid` de `CapturaIA` normalmente lo asigna un hook `creating` del modelo, pero `DatabaseSeeder` usa `WithoutModelEvents` (ningún evento Eloquent dispara durante el seeding) — el mismo tipo de gotcha ya visto con el rol demo "Administrador" en la Unidad de Trabajo anterior. **Corregido** fijando `uuid` explícito en `CapturaIAFactory`.
3. **Estado `procesando` generado para capturas demo** — ese estado es exclusivamente transitorio en el pipeline síncrono real (nunca debería aparecer en historial ya resuelto). **Corregido** excluyéndolo del pool aleatorio de `CapturaIAFactory`.

### Hallazgos que NO se corrigieron en esta unidad (fuera de alcance — pertenecen al módulo Productos/Proveedores, no a Demo Data)

Verificación real en navegador con el volumen ya poblado (575 productos, 115 proveedores) expuso **dos bugs reales, invisibles con datos mínimos**:

4. **`/productos` no tiene paginación en absoluto** — la tabla renderiza exactamente 100 filas (de 575 reales) sin ningún control de página ni indicador de que existen más. El texto del encabezado ("100 productos en tu catálogo") es internamente consistente con lo que se ve, pero no con el total real.
5. **`/proveedores` muestra un contador incorrecto** — renderiza solo 50 filas pero el encabezado dice "100 proveedores" (el total real es 115). El contador no coincide ni con lo renderizado ni con la base de datos — un bug de conteo real, no solo de paginación faltante.

Ambos quedan documentados aquí exactamente como lo pide el alcance ("Errores encontrados"), pero **no se corrigen en esta Unidad de Trabajo** — corregirlos implica tocar el frontend de Productos/Proveedores, un módulo ya cerrado y aprobado en una Unidad de Trabajo anterior. Corresponde abrirlos como su propia Unidad de Trabajo (paginación real de listados), no mezclarlos con Demo Data.

## Evidencias de pruebas

- Suite completa de backend: **138/138 passing** (418 assertions) tras el seeding completo — confirma que el nuevo volumen de datos no rompió ningún test existente.
- Verificación real en navegador (agent-browser): login con `test@example.com`, `/productos` y `/proveedores` cargan sin errores de consola ni requests fallidos, sin degradación de rendimiento perceptible con el nuevo volumen.
- Consultas de integridad referencial (sección "Relaciones verificadas" arriba), ejecutadas directamente contra la base de datos poblada.

## Cobertura

- **CRUD**: cubierto indirectamente por la suite existente (Productos/Proveedores/Producto-Proveedor/Captura IA) — no se agregaron tests nuevos específicos de "Demo Data" (es una tarea de generación de datos, no de lógica de negocio propia).
- **Búsquedas/Filtros/Ordenamiento**: no verificados exhaustivamente en esta unidad — el hallazgo de paginación (arriba) bloquea una verificación completa de "Productos"/"Proveedores" con el volumen real hasta que se corrija.
- **Rendimiento**: sin degradación observable en `/productos`/`/proveedores` ni en la suite de tests con el volumen actual (10.783 movimientos, 575 productos).
- **Integridad referencial/Foreign Keys**: verificada explícitamente (ver arriba), 0 inconsistencias.

## Problemas pendientes

- Bugs #4 y #5 (paginación de Productos/Proveedores) — requieren su propia Unidad de Trabajo.
- No se generaron datos para "Clientes" — el módulo no existe todavía (confirmado en `RC1_FUNCTIONAL_MODULE_AUDIT.md`), consistente con el alcance aprobado.
- El doble disparo de `GET /api/v1/productos`/`GET /api/v1/proveedores` por carga de página (observado durante la verificación en navegador) es una ineficiencia menor, no un error funcional — anotado para referencia futura, no bloqueante.

## Estado

☐ Pendiente
☐ Requiere correcciones
**☑ Aprobado — pendiente de confirmación del propietario del proyecto** (138/138 tests, integridad referencial 100% verificada, volumen objetivo alcanzado exactamente en la empresa principal, 3 errores reales encontrados y corregidos, 2 hallazgos reales documentados como fuera de alcance)
