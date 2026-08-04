# Tables

**Estado: Pendiente de auditar.** Este documento existe como parte de la estructura completa del Design System (ver `README.md`) pero todavía no tiene contenido verificado contra el código.

Nota parcial (no una auditoría formal): todo listado de la aplicación compone `Table`/`TableHeader`/`TableBody`/`TableRow`/`TableCell` (`frontend/components/ui/table.tsx`) directamente en su página, sin un componente `DataTable` de nivel superior — ver `COMPONENTS.md` §Tablas. Una auditoría real debería confirmar si el patrón (columnas, `DropdownMenu` de acciones por fila, `EmptyState`, paginación) es realmente idéntico en los 8+ listados del proyecto antes de declarar una regla.
