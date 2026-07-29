# Dashboard

**Status: Built (con datos simulados / mock data)**

> Verificado contra `frontend/app/(app)/dashboard/page.tsx`, `frontend/lib/mock/dashboard.ts`, `frontend/components/stat-card.tsx`, `frontend/components/movement-type-badge.tsx`, `frontend/components/empty-state.tsx`. Construido en la Fase 4 (Captura IA) como pantalla de aterrizaje post-login. **No existe ningún endpoint backend de dashboard/estadísticas** (`GET /dashboard`, `/estadisticas`, etc. no existen en `backend/routes/api.php`) — todos los números y la lista de movimientos recientes vienen de `lib/mock/dashboard.ts`, no de la base de datos real. Reemplaza el borrador de la sección 20 del master spec, que asumía KPIs de Compras/Ventas que no existen en el sistema construido.

## Purpose

Dar al usuario, apenas inicia sesión, una vista rápida del estado de su inventario (totales, alertas de stock bajo, actividad reciente) y accesos directos a las acciones más frecuentes (Captura IA, ver productos, ver movimientos).

## Business Flow

1. El usuario aterriza en `/dashboard` tras el login (o navega ahí desde el sidebar).
2. Se calculan/leen (hoy: se generan desde mocks) 5 métricas resumen, la lista de los 6 movimientos más recientes, y los productos con stock por debajo del mínimo.
3. El usuario puede saltar directo a `/captura`, `/captura/foto`, `/captura/voz`, `/productos` o `/movimientos` desde los accesos rápidos.

## Actors

- **Usuario autenticado** de cualquier rol — esta pantalla no tiene ninguna restricción por permiso hoy (no hay `usePermission` ni gating condicional en el código).

## Screens

- **`/dashboard`** (`frontend/app/(app)/dashboard/page.tsx`):
  - Encabezado con saludo personalizado (`Hola, {nombre}`) y botón "Nueva captura".
  - Fila de 5 `StatCard`: Productos totales, Stock total, Stock bajo, Entradas hoy, Salidas hoy — con animación de entrada escalonada (`framer-motion`).
  - Columna principal: "Movimientos recientes" (hasta 6), cada fila con ícono de color de producto, nombre, tiempo relativo, usuario, badge de tipo de movimiento y cantidad con signo (+/-). Enlace "Ver todos" a `/movimientos`.
  - Columna lateral: tarjeta destacada de Captura IA (enlace a `/captura`), tarjeta de "Acciones rápidas" (foto, voz, ver productos), y tarjeta de "Stock bajo" (hasta 3 productos) que solo se muestra si hay productos bajo el mínimo.

## Fields

Las tarjetas de estadísticas muestran valores agregados, no campos editables:

| Campo | Fuente | Notas |
|---|---|---|
| Productos totales | `getDashboardStats()` (mock) | sin endpoint real |
| Stock total | `getDashboardStats()` (mock) | sin endpoint real |
| Stock bajo | `getDashboardStats()` (mock) | sin endpoint real |
| Entradas hoy / Salidas hoy | `getDashboardStats()` (mock) | sin endpoint real |
| Movimientos recientes | `getRecentMovements(6)` (mock) | producto, tipo, cantidad, usuario, fecha |
| Productos con stock bajo | `getLowStockProducts()` (mock) | nombre, stock actual, unidad |

## Validation Rules

No aplica — pantalla de solo lectura, sin formularios.

## Permissions

Ninguno declarado. No hay `usePermission()` ni ocultamiento condicional de tarjetas o accesos según rol/permiso en el código actual (el `PermissionContext` descrito en `04_TECHNICAL_SPEC/Architecture.md` para el Módulo 3 aún no existe).

## Loading States

No implementado explícitamente: al ser datos mock síncronos, no hay estado de carga observable. Cuando esta pantalla se conecte a un endpoint real, deberá introducirse un estado de carga (skeletons, ya existe `components/ui/skeleton.tsx` reutilizable en el proyecto).

## Empty States

- "Movimientos recientes" vacío: `EmptyState` con ícono `ArrowLeftRight`, título "Aún no hay movimientos", descripción "Cuando registres una entrada o salida, aparecerá aquí."
- "Stock bajo": la tarjeta completa no se renderiza si `lowStockProducts.length === 0` (en vez de mostrar un estado vacío dedicado).

## Error States

No implementado — al no haber una llamada de red real, no hay manejo de error de API en esta pantalla todavía.

## Business Rules

- Ninguna regla de negocio vive en esta pantalla; es puramente de lectura/navegación.
- El signo del número mostrado en cada movimiento (`+`/`-`) depende de `tipo === "salida"`.
- La tarjeta de stock bajo solo aparece con datos, nunca vacía.

## Acceptance Criteria

- [x] La pantalla renderiza sin errores tras un login exitoso.
- [x] Las 5 `StatCard` muestran valores formateados con `formatNumber`.
- [x] El enlace "Ver todos" navega a `/movimientos`.
- [x] Los accesos rápidos navegan a las rutas correctas de Captura IA/Productos.
- [ ] **Pendiente de validar en implementación real**: exactitud de los números cuando se conecte a datos reales — hoy no puede fallar ni acertar porque son mocks.

## Edge Cases

- Usuario sin `name` en el estado de Redux — el saludo cae a "bienvenido" (`user?.name?.split(" ")[0] ?? "bienvenido"`).
- Cero movimientos y cero productos con stock bajo simultáneamente — cubierto por el empty state de movimientos; la tarjeta de stock bajo simplemente no se renderiza.
- Con datos reales de una empresa nueva (sin productos aún) — comportamiento no verificado todavía, a validar cuando exista el endpoint real.

## Future Improvements

- Construir un endpoint real de estadísticas (`GET /dashboard` o equivalente) respaldado por consultas agregadas sobre `productos`/`movimientos`, reemplazando `lib/mock/dashboard.ts`.
- Agregar estados de carga (skeleton) y error una vez que la pantalla dependa de una llamada de red real.
- Filtrar accesos rápidos y tarjetas según permisos del usuario (`captura-ia.usar`, `productos.ver`, `movimientos.ver`) una vez exista el Módulo 3 (Authorization/RBAC) en el frontend.
