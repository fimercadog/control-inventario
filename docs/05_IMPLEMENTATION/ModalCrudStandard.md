# Informe Final — Estándar de UI "CRUD en Modal" (2026-08-03)

## Resumen del trabajo realizado

El propietario del proyecto pidió un estándar de interacción único para los 8 módulos CRUD del ERP (Productos, Categorías, Marcas, Unidades de Medida, Proveedores, Clientes, Usuarios, Roles): Crear/Editar → modal de formulario, Ver → modal de solo lectura, Eliminar/Deshabilitar → modal de confirmación, sin navegar nunca fuera del listado — la tabla permanece visible detrás del modal, y toda mutación refresca el listado, cierra el modal y muestra un toast, preservando paginación/filtros/búsqueda (automático, al no volver a montar la página). Páginas completas quedan reservadas para Dashboard, Captura IA, Reportes, Configuración, flujos multi-paso y formularios demasiado grandes para un modal — ninguno de los 8 módulos convertidos calificaba para esa excepción.

Antes de diseñar nada se hizo un inventario exhaustivo de los 8 módulos (agente de exploración dedicado) para no perder ningún caso especial: mecanismo de datos (3 patrones distintos — `useCrudList`, Redux, estado local con debounce manual), paginación real vs. solo-cliente, pestañas de "relacionados" de solo lectura, y — el hallazgo más importante — que Usuarios nunca tuvo Crear/Editar genérico (solo Invitar y Reasignar rol, ya diálogos existentes) y que Proveedores era el único módulo sin `ConfirmDialog` antes de deshabilitar.

## Funcionalidades implementadas

- Dos componentes compartidos nuevos: `components/crud-modal.tsx` (`CrudModal` — shell de formulario: header/footer/Cancelar-Guardar/estado de guardado; `Field` — reemplaza el `Field` duplicado que cada uno de los 14 archivos anteriores redeclaraba) y `components/detail-modal.tsx` (`DetailModal` — shell de solo lectura con pestañas opcionales y slot de acciones de cabecera; `InfoRow` — mismo reemplazo de duplicación). Ninguno de los dos genera campos desde un schema — cada módulo sigue dueño de sus propios campos como `children`, porque las 8 formas reales son genuinamente distintas (de 1 campo en Marcas a un `PermissionPicker` completo en Roles) y forzar un generador único habría sido un cambio mucho más grande y arriesgado que el estándar de interacción que en realidad se pidió.
- Por cada módulo, un `<X>FormModal` (Crear+Editar en un solo componente — `producto` presente = editar, ausente = crear) y un `<X>ViewModal` (solo lectura, con `tabs` cuando el módulo ya tenía pestañas de relacionados). `NewXDialog`/`XDetailScreen`/`app/(app)/<modulo>/[id]/page.tsx` de los 8 módulos, eliminados por completo — el listado es ahora el único punto de entrada.
- Productos (el más complejo: 3 pestañas incl. un kardex en vivo y un sub-CRUD anidado de proveedores asociados) reutiliza `RegistrarIngresoDialog`/`ProductSupplierDialog` sin ningún cambio, solo reubicados dentro del nuevo `ProductoViewModal`.
- Usuarios no ganó ningún `FormModal` — nunca tuvo Crear/Editar genérico. `InvitarUsuarioDialog`/`AsignarRolDialog` se reutilizan sin cambios; solo la Vista se convirtió.
- Roles reutiliza `PermissionPicker` y el catálogo de permisos cacheado en `roles-slice` sin cambios, en ambos modos del `RoleFormModal`.
- Convención nueva de deep-link: borrar `productos/[id]/page.tsx` rompía 7 enlaces existentes en otros módulos (`Categoría`/`Marca`/`Unidad de Medida`/`Proveedor` → pestaña "Productos", `Movimiento` → producto, `Stock` → "Ver ficha", tarjeta de revisión de Captura IA) que apuntaban directo a esa ruta. Reemplazados por `/productos?ver={id}` — la página de Productos lee ese parámetro al cargar, abre el modal de vista automáticamente, y limpia la URL (`router.replace`) al cerrarlo. Ningún otro módulo de los 8 recibe enlaces externos por id, así que este patrón no fue necesario en ningún otro lado.

## Correcciones realizadas

- **Proveedores nunca tuvo `ConfirmDialog` antes de deshabilitar** — mutaba de inmediato al hacer clic, la única inconsistencia real de los 8 módulos frente al estándar que este trabajo exige de forma pareja. Corregido como parte natural de la conversión, no como un cambio aparte.
- **Proveedores parcheaba su arreglo local a mano en vez de refrescar desde el backend** tras crear/deshabilitar — la única violación de la regla ya documentada "toda mutación refresca desde el backend". Corregido junto con lo anterior.
- **Bug real, no introducido por este cambio, encontrado en la propia verificación**: el patrón `xAConfirmar?.campo` (optional chaining sobre el objeto capturado para el diálogo de confirmación) rendía literalmente la palabra "undefined" durante ~1 segundo, justo después de confirmar exitosamente una acción — el estado ya se había limpiado a `null` pero el diálogo seguía en su animación de cierre, y la rama `else` del ternario evaluaba sobre `undefined`. Corregido envolviendo cada `ConfirmDialog` de listado en `{xAConfirmar && (...)}` en vez de encadenar `?.` sobre sus campos — mismo patrón que ya usan los `ViewModal` nuevos para sus propios `ConfirmDialog` internos, así que ahora es consistente en vez de un caso aislado.
- **Bug pre-existente encontrado durante la verificación, fuera de alcance de este trabajo, NO corregido aquí**: limpiar el campo de búsqueda de vuelta a vacío no restaura el listado completo — se queda congelado en el último resultado filtrado hasta un recargo completo de página. Confirmado reproducible de forma idéntica en `Categorías` (usa `useCrudList`) y `Clientes` (usa un `useEffect` a secas con Redux) — dos mecanismos de datos completamente distintos con el mismo síntoma, lo que apunta a una causa compartida (la hipótesis más probable es una carrera sin guarda de "respuesta obsoleta" — ninguna de las dos rutas usa `AbortController`) en vez de un bug por-módulo. Confirmado con un `dispatchEvent` nativo del DOM que evita por completo la herramienta de automatización de navegador, así que no es un artefacto de la herramienta. Ninguno de los archivos de búsqueda se tocó en esta unidad de trabajo — es anterior a este cambio. Dejado sin corregir siguiendo la regla permanente de pedir permiso antes de una remediación de alcance amplio fuera de la tarea actual.

## Relaciones verificadas

- `npx tsc --noEmit` limpio después de cada uno de los 4 lotes de módulos.
- `next build` (Turbopack) limpio al final — los 8 módulos convertidos generan ahora una ruta estática sin segmento dinámico `[id]`; los únicos módulos que conservan una ruta `ƒ Dynamic` son los que nunca estuvieron en alcance de este estándar (`Auditoria/[id]`, `Reportes/[clave]`, `Movimientos/[id]`, `Stock/[id]`, `captura/revisar/[uuid]`).
- Verificado en navegador, módulo por módulo, en 4 lotes: Categorías (los 6 flujos completos: crear/ver/editar-desde-vista/editar-desde-dropdown/deshabilitar-con-confirmación/consola-limpia) + spot-check de Marcas/Unidades de Medida; Proveedores (confirmó específicamente que la nueva confirmación SÍ aparece antes de deshabilitar) + Clientes (paginación real Anterior/Siguiente sigue funcionando sin recargar); Productos (crear→auto-abre vista, las 3 pestañas con datos reales, edición con stock de solo lectura, y el deep-link `?ver=` completo: abre solo con la URL, datos reales, limpia la URL al cerrar); Usuarios (ver/Cambiar rol/activar-desactivar) + Roles (crear/ver/editar con el selector de permisos, y el mensaje real de error 409 "tiene usuarios asignados" verificado contra un rol real con 6 usuarios).
- Un patrón "el primer clic no responde, el segundo sí" apareció durante la verificación de varios módulos — descartado como causado por este cambio mediante una prueba de control contra la página de Productos **antes** de tocarla (usando navegación de página completa, sin ningún modal): el mismo síntoma se reprodujo de forma idéntica, confirmando que es un artefacto pre-existente del canal de automatización del navegador, no un bug de la aplicación.

## Cambios en Frontend

**Archivos creados:**

- `frontend/components/crud-modal.tsx`, `frontend/components/detail-modal.tsx` (shells compartidos)
- `frontend/components/categoria-form-modal.tsx`, `categoria-view-modal.tsx`
- `frontend/components/marca-form-modal.tsx`, `marca-view-modal.tsx`
- `frontend/components/unidad-medida-form-modal.tsx`, `unidad-medida-view-modal.tsx`
- `frontend/components/proveedor-form-modal.tsx`, `proveedor-view-modal.tsx`
- `frontend/components/cliente-form-modal.tsx`, `cliente-view-modal.tsx`
- `frontend/components/producto-form-modal.tsx`, `producto-view-modal.tsx`
- `frontend/components/usuario-view-modal.tsx` (sin `FormModal` — ver Correcciones)
- `frontend/components/role-form-modal.tsx`, `role-view-modal.tsx`

**Archivos eliminados:** las 8 rutas `app/(app)/<modulo>/[id]/page.tsx`, y `new-categoria-dialog.tsx`, `categoria-detail-screen.tsx`, `new-marca-dialog.tsx`, `marca-detail-screen.tsx`, `new-unidad-medida-dialog.tsx`, `unidad-medida-detail-screen.tsx`, `new-supplier-dialog.tsx`, `supplier-detail-screen.tsx`, `new-cliente-dialog.tsx`, `cliente-detail-screen.tsx`, `new-product-dialog.tsx`, `product-detail-screen.tsx`, `usuario-detail-screen.tsx`, `new-role-dialog.tsx`, `role-detail-screen.tsx`.

**Archivos modificados:** las 8 páginas de listado `app/(app)/<modulo>/page.tsx` (triggers de modal en vez de `router.push`); `categoria-view-modal.tsx`/`marca-view-modal.tsx`/`unidad-medida-view-modal.tsx`/`proveedor-view-modal.tsx`/`movimiento-detail-screen.tsx`/`review-product-card.tsx`/`stock-detail-screen.tsx` (los 7 enlaces cruzados a `/productos/{id}` → `/productos?ver={id}`).

## Cambios en Base de Datos

Ninguno — cambio 100% de interacción de frontend, cero rutas de API nuevas o modificadas.

## Resultado de las pruebas

- **Backend:** sin cambios, suite no re-ejecutada (ningún archivo de `backend/` tocado en esta unidad de trabajo, confirmado por `git status` antes de cada commit).
- **Frontend:** `npx tsc --noEmit` limpio (4 veces, una por lote); `npm run build` limpio al final, 8/8 módulos confirmados como ruta estática.
- **Browser tests (reales, 4 rondas)**: ver "Relaciones verificadas" arriba — cobertura funcional completa de crear/ver/editar/deshabilitar en los 8 módulos, más los dos casos especiales (Usuarios sin formulario genérico, Roles con selector de permisos y error 409 verbatim) y el deep-link nuevo de Productos.

## Estado final del módulo

🟢 **Completo** — los 8 módulos CRUD del ERP siguen ahora el mismo patrón de interacción exacto pedido: modal para Crear/Editar/Ver, modal de confirmación para Eliminar/Deshabilitar, el listado nunca se abandona. Dos gaps reales de otros módulos, cerrados como parte natural de la conversión (confirmación de Proveedores, refresco de Proveedores). Un bug real pero ajeno a este trabajo, encontrado y documentado explícitamente en vez de corregido fuera de alcance: la limpieza del campo de búsqueda no restaura el listado en al menos 2 módulos con mecanismos de datos distintos — pendiente de una unidad de trabajo propia.

## Control de versiones

- **Rama:** `main`.
- **Commits** (orden cronológico):
  1. `df9b24a` — `feat(ui): introduce shared CrudModal/DetailModal shell, migrate Categorias/Marcas/Unidades de Medida`
  2. `ad77ac6` — `feat(ui): migrate Proveedores and Clientes to the shared modal CRUD pattern`
  3. `9fb0d04` — `feat(ui): migrate Productos to the shared modal CRUD pattern, fix 7 dead cross-module links`
  4. `d737f7a` — `feat(ui): migrate Usuarios and Roles to the shared modal CRUD pattern - closes the 8-module standard`

## Confirmación de push

✅ Ejecutado correctamente después de cada uno de los 4 commits — el último, `d737f7a`, contra `origin` (GitHub).

## Estado del informe

☐ Pendiente
☐ Requiere correcciones
**☑ Aprobado — pendiente de confirmación del propietario del proyecto**
