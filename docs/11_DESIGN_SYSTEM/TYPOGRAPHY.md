# Typography

**Estado: Pendiente de auditar.** Este documento existe como parte de la estructura completa del Design System (ver `README.md`) pero todavía no tiene contenido verificado contra el código.

Nota parcial (no una auditoría formal): `frontend/app/layout.tsx` configura `Geist` (sans) y `Geist_Mono` como variables de fuente vía `next/font/google`; `DialogTitle` (`frontend/components/ui/dialog.tsx`) usa una clase `font-heading` distinta del cuerpo de texto. Una auditoría real debería confirmar la escala completa de tamaños/pesos usada en títulos de página (`text-2xl font-semibold`), títulos de modal, y texto de cuerpo/metadata, y si `font-heading` está definida en `globals.css` con una fuente distinta a Geist Sans.
