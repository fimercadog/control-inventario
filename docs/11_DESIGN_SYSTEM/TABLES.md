# Tables

**STATUS: 🟡 Partial** — auditadas las 14 pantallas de listado/tabla de la aplicación (2026-08-03) contra `frontend/`. Los primitivos y el patrón de búsqueda están genuinamente unificados; paginación, filtrado servidor-vs-cliente, y el vocabulario de color de los badges de Estado NO lo están — documentado explícitamente como inconsistencia real, no ocultado.

## Verified

- **Primitivos**: todo listado compone `Table`/`TableHeader`/`TableBody`/`TableRow`/`TableCell` (`frontend/components/ui/table.tsx`) directamente — no existe un `DataTable` de nivel superior (ver `COMPONENT_INVENTORY.md`).
- **`EmptyState` — ícono**: `icon={SearchX}` en las 13 pantallas de listado/búsqueda auditadas, sin excepción. Los 3 mini-`EmptyState` de las tarjetas de Reportes/Resumen usan íconos contextuales (`ArrowLeftRight`/`Package`/`Truck`) en vez de `SearchX` — correcto, porque comunican "sin datos en el rango" en vez de "sin resultados de búsqueda", un sub-patrón distinto, no una inconsistencia.
- **Barra de búsqueda — estructura**: `<div className="flex flex-wrap items-center gap-3">` entre el header de página y el `Card`, con `<div className="relative flex-1 min-w-55 max-w-sm">` envolviendo un `Input` con ícono `Search` (`pl-9`) — idéntico en las 11 pantallas que tienen búsqueda.
- **Campo requerido / acción de fila**: menú `DropdownMenu` con `Editar` + `Eliminar`/`Deshabilitar`/`Activar-Desactivar` en la columna final `w-10`, presente en 8 de los 8 módulos CRUD.

## Partial — inconsistencias reales, sin resolver

- **Paginación real vs. lista completa cargada**: Clientes, Roles, Auditoría, Reportes/Historial, Reportes/Preview y Movimientos tienen controles reales "Anterior/Siguiente" (`ChevronLeft`/`ChevronRight` + `meta.current_page`/`meta.last_page`). Productos, Categorías, Marcas, Unidades de Medida, Proveedores y Stock **no muestran ningún control de paginación**, aunque varios de ellos sí reciben un objeto `meta` con `last_page` del backend y simplemente no lo usan (`stock/page.tsx` lee `meta?.total` para el contador del header pero nunca revisa `meta.last_page`).
- **Envoltorio del bloque de paginación**: la mayoría lo coloca dentro del `Card`/`CardContent` con `border-t border-border/60 px-4 pt-4`. Usuarios es la excepción — su bloque de paginación vive **fuera** del `Card`, como un `<div>` hermano sin ese wrapper.
- **Búsqueda servidor vs. cliente**: Productos es el único módulo cuyo endpoint de listado no acepta `busqueda` — el filtro de texto y de categoría se aplican con un `.filter()` sobre el arreglo ya cargado completo, mientras que el filtro de Estado sí va al backend. Todos los demás módulos envían `busqueda` al servidor.
- **Debounce de búsqueda**: solo Proveedores tiene un debounce explícito (`setTimeout(cargar, 300)`); el resto dispara una petición nueva en cada tecla vía la dependencia de `useCrudList`/Redux/`useEffect`.
- **Vocabulario de color de los badges de Estado**: tres sistemas conviven — (1) clases literales `bg-emerald-600 .../bg-red-600 ...` (mayoría de módulos), (2) tokens semánticos `success`/`destructive`/`warning` vía `variant="outline"` (`MovementTypeBadge`, y el estado "exitoso" de Auditoría solo parcialmente — su estado negativo usa `bg-muted`, no rojo), y (3) el prop `variant="outline"/"secondary"` de `Badge` sin clases propias (único uso: Proveedores). Ver `COLORS.md` para el detalle completo.
- **Stock navega en vez de usar modal**: `app/(app)/stock/page.tsx`, acción "Editar umbrales", hace `router.push('/stock/{id}?editar=1')` — el único listado que todavía navega a una página completa para editar, en vez de seguir el Global UI Standard "CRUD en Modal" que los 8 módulos CRUD ya siguen. Fuera de alcance de esa migración (Stock nunca estuvo en la lista de 8 módulos), documentado aquí como una divergencia conocida, no como algo a corregir sin aprobación explícita.
- **Auditoría y Reportes/Historial son de solo lectura**: sin columna de acciones, sin `DropdownMenu` — correcto por diseño (ver sus propios specs), no una omisión.

## No corregido en esta auditoría

Ninguna de las inconsistencias de arriba se corrigió como parte de esta unidad de trabajo — son hallazgos de una auditoría de documentación, no un mandato de refactor. Cualquier unificación (por ejemplo, llevar Productos/Categorías/Marcas/Unidades/Proveedores/Stock a paginación real, o reconciliar el vocabulario de color) requiere su propio ADR antes de tocar código, siguiendo la misma disciplina que `ADR-014`.

## Ejemplo visual

`examples/table.png` — listado de Productos (búsqueda, filtros, columnas, badges de estado).
