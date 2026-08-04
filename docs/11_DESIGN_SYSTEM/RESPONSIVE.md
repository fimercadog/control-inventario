# Responsive

**Estado: Pendiente de auditar.** Este documento existe como parte de la estructura completa del Design System (ver `README.md`) pero todavía no tiene contenido verificado contra el código.

Nota parcial (no una auditoría formal): los modales usan el breakpoint `sm` (640px) de Tailwind como único punto de quiebre — por debajo de `sm`, `DialogContent` (`frontend/components/ui/dialog.tsx`) fuerza `w-full max-w-[calc(100%-2rem)]`, y `MODAL_SIZES` (`MODALS.md`) solo aplica desde `sm` hacia arriba. Verificado en navegador en el listado de Movimientos: `max-w-3xl` (768px) deja de aplicar por debajo de 768px de viewport, ocupando el ancho disponible sin overflow horizontal hasta 390px. Una auditoría real debería confirmar si el resto de la aplicación (sidebar, tablas de listado con muchas columnas) sigue la misma convención de un solo breakpoint o usa más de uno.
