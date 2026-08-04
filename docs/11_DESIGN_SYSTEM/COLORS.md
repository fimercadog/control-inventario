# Colors

**Estado: Pendiente de auditar.** Este documento existe como parte de la estructura completa del Design System (ver `README.md`) pero todavía no tiene contenido verificado contra el código.

Nota parcial (no una auditoría formal): existe un patrón semántico repetido para estado activo/inactivo (`bg-emerald-600 text-white dark:bg-emerald-500` / `bg-red-600 text-white dark:bg-red-500`) usado de forma consistente en los 8 módulos CRUD, y tokens semánticos propios (`success`/`warning`/`destructive`) usados por `MovementTypeBadge` (`frontend/components/movement-type-badge.tsx`) — los dos sistemas de color no están reconciliados en un único vocabulario todavía. Una auditoría real debería revisar `frontend/app/globals.css` (tokens de tema, variantes claro/oscuro) y decidir si el patrón `bg-emerald-600`/`bg-red-600` debería migrar a los tokens semánticos `success`/`destructive` en vez de coexistir con ellos.
