# Iconography

**Estado: Pendiente de auditar.** Este documento existe como parte de la estructura completa del Design System (ver `README.md`) pero todavía no tiene contenido verificado contra el código.

Nota parcial (no una auditoría formal): toda la aplicación usa `lucide-react` como única librería de íconos, dimensionados con clases arbitrarias de Tailwind (`size-4`, `size-3.5`, etc.) en vez del prop `size` propio de la librería. `MovementTypeBadge` (`frontend/components/movement-type-badge.tsx`) es el único lugar donde el ícono está atado a un significado de negocio específico (tipo de movimiento). Una auditoría real debería confirmar si existe una convención de tamaño por contexto (ícono en botón vs. ícono en badge vs. ícono decorativo) o si el tamaño se elige caso por caso.
