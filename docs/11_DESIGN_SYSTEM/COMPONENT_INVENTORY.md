# Component Inventory

Antes de crear un componente nuevo, buscar aquí primero — Regla de Oro (`DESIGN_SYSTEM.md`). Conteos verificados con `grep` contra `frontend/` el 2026-08-03, no estimados. Cuando este documento se vuelva a auditar, re-contar en vez de confiar en los números aquí — un componente nuevo puede sumar consumidores en cualquier momento.

## Leyenda de estado

| Símbolo | Significado |
| --- | --- |
| ✅ Verified | El componente está construido, tiene consumidores reales verificados, y su documentación (si aplica) está actualizada contra el código. |
| 🟡 Partial | El componente existe y se usa, pero tiene inconsistencias conocidas entre consumidores (ver columna Notas) todavía sin resolver. |
| ⚪ Planned | Mencionado como candidato en algún documento de este Design System, pero no existe en el código todavía. |

## Shells compartidos (CRUD en Modal)

| Componente | Estado | Ubicación | Usado por |
| --- | --- | --- | --- |
| `CrudModal` | ✅ | `frontend/components/crud-modal.tsx` | 7 módulos (Categorías, Marcas, Unidades de Medida, Proveedores, Clientes, Productos, Roles) vía sus `<X>FormModal` — Usuarios no tiene, por diseño (ver `docs/05_IMPLEMENTATION/ModalCrudStandard.md`) |
| `DetailModal` | ✅ | `frontend/components/detail-modal.tsx` | 8 módulos vía sus `<X>ViewModal` (los 7 de arriba + Usuarios) |
| `Field` | ✅ | `frontend/components/crud-modal.tsx` (mismo archivo que `CrudModal`) | Los mismos 7 `<X>FormModal` — adopción 100%, ninguno declara su propio `Field` local |
| `InfoRow` | ✅ | `frontend/components/detail-modal.tsx` (mismo archivo que `DetailModal`) | Los mismos 8 `<X>ViewModal` — adopción 100% (corregido 2026-08-03: `usuario-view-modal.tsx` tenía una copia local, ver auditoría de reutilización de componentes) |

## Modales y confirmaciones

| Componente | Estado | Ubicación | Usado por |
| --- | --- | --- | --- |
| `Dialog`/`DialogContent`/`DialogHeader`/`DialogFooter`/`DialogTitle`/`DialogDescription`/`DialogTrigger`/`DialogClose` | ✅ | `frontend/components/ui/dialog.tsx` | Todo modal de la aplicación, directa o indirectamente vía `CrudModal`/`DetailModal`/`ConfirmDialog` — primitivo base, nunca se reimplementa |
| `MODAL_SIZES` / `MODAL_SCROLL_CLASS` | ✅ | `frontend/components/ui/modal.ts` | `CrudModal`, `DetailModal`, y los 6 diálogos independientes (`ConfirmDialog`, `AsignarRolDialog`, `InvitarUsuarioDialog`, `NewMovimientoDialog`, `ProductSupplierDialog`, `RegistrarIngresoDialog`) — ver `MODALS.md` / `ADR-014` |
| `ConfirmDialog` | ✅ | `frontend/components/confirm-dialog.tsx` | 18 archivos (9 páginas de listado + 9 componentes de vista/detalle), incluye Stock y Auditoría — módulos que esta sesión nunca tocó, confirma que el patrón ya era transversal antes del Global UI Standard "CRUD en Modal" |
| `AsignarRolDialog` | ✅ | `frontend/components/asignar-rol-dialog.tsx` | `usuario-view-modal.tsx` únicamente — mecanismo exclusivo de "editar" en Usuarios |
| `InvitarUsuarioDialog` | ✅ | `frontend/components/invitar-usuario-dialog.tsx` | `app/(app)/usuarios/page.tsx` únicamente — mecanismo exclusivo de "crear" en Usuarios |
| `RegistrarIngresoDialog` | ✅ | `frontend/components/registrar-ingreso-dialog.tsx` | `producto-view-modal.tsx` únicamente |
| `ProductSupplierDialog` | ✅ | `frontend/components/product-supplier-dialog.tsx` | `producto-view-modal.tsx` únicamente (pestaña Proveedores) |
| `NewMovimientoDialog` | ✅ | `frontend/components/new-movimiento-dialog.tsx` | `app/(app)/movimientos/page.tsx` únicamente |

## Primitivos de UI (`components/ui/`)

| Componente | Estado | Usado por (archivos) |
| --- | --- | --- |
| `Button` | ✅ | 46 |
| `Card`/`CardContent`/`CardHeader` | ✅ | 38 |
| `Badge` | ✅ | 27 |
| `Input` | ✅ | 34 |
| `Select`/`SelectContent`/`SelectItem`/`SelectTrigger`/`SelectValue` | ✅ | 18 |
| `Table`/`TableHeader`/`TableBody`/`TableRow`/`TableCell` | ✅ | 12 (los 8 módulos CRUD con listado tabular + Auditoría + Stock + 2 vistas de Reportes) |
| `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` | ✅ | 2 directos (`DetailModal`, que lo reexpone a los 6 `<X>ViewModal` con pestañas — Categorías/Marcas/Unidades/Proveedores/Productos/Roles) |
| `Toaster` | ✅ | `frontend/app/providers.tsx` (montado una sola vez); llamadas individuales vía `import { toast } from "sonner"` directo, sin wrapper propio — no existe un `ToastProvider` (ver corrección en `COMPONENTS.md`) |

## Componentes de negocio compartidos

| Componente | Estado | Ubicación | Usado por | Notas |
| --- | --- | --- | --- | --- |
| `EmptyState` | ✅ | `frontend/components/empty-state.tsx` | 26 archivos | |
| `MovementTypeBadge` | ✅ | `frontend/components/movement-type-badge.tsx` | 4 (Dashboard, Movimientos, Producto→pestaña Movimientos, Captura IA→review-screen) | Único punto de color-coding por tipo de movimiento (Entrada/Salida/Ajuste/Conteo/Transferencia) — no reimplementar este mapeo en otro lugar |

## Candidatos mencionados pero inexistentes

| Nombre mencionado | Estado | Nota |
| --- | --- | --- |
| `DataTable` | ⚪ | Mencionado en un borrador anterior de este Design System (ver `COMPONENTS.md`). No existe — cada listado compone `Table`/`TableHeader`/`TableRow`/`TableCell` directamente. Candidato real a construir si se decide factorizar el patrón repetido de columnas + `DropdownMenu` de acciones + `EmptyState`, pero no está aprobado todavía (requeriría un ADR). |
| `ToastProvider` | ⚪ | Mismo borrador anterior. El componente real es `Toaster` (ver tabla de arriba) — nombre corregido, no hace falta construir nada nuevo. |

## Inconsistencias conocidas (🟡 Partial, pendientes de resolver)

- **Color de badge de estado activo/inactivo**: la mayoría de módulos usa la clase literal `bg-emerald-600 text-white dark:bg-emerald-500` / `bg-red-600 text-white dark:bg-red-500` directamente en vez de los tokens semánticos `success`/`destructive` ya definidos en `globals.css` y ya usados por `MovementTypeBadge`. Proveedores es una excepción adicional: usa `variant="outline"`/`variant="secondary"` en vez de cualquiera de los dos patrones de color. Ver `COLORS.md` para el conteo exacto por archivo.
