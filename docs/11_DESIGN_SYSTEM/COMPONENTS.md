# Components

Catálogo de qué reutilizar por categoría, aplicando la Regla de Oro (`DESIGN_SYSTEM.md`). Nombres y rutas verificados contra `frontend/` — dos correcciones respecto al borrador original de este documento: no existe un `DataTable` (cada listado compone `Table`/`TableHeader`/`TableBody`/`TableRow`/`TableCell` de `components/ui/table.tsx` directamente), y el componente real de toasts se llama `Toaster` (`components/ui/sonner.tsx`), no `ToastProvider` — las llamadas individuales usan `import { toast } from "sonner"` directo, sin wrapper propio.

## Componentes

Reutilizar antes de crear — ver `DESIGN_SYSTEM.md` §1.1 y el catálogo completo en `frontend/components/ui/`.

## Hooks

Reutilizar antes de crear. `hooks/use-crud-list.ts` es el hook de listado compartido por 5 de los 8 módulos CRUD (ver `docs/05_IMPLEMENTATION/ModalCrudStandard.md` para los otros 2 mecanismos de datos en uso, Redux y estado local con debounce, y por qué no se forzó una unificación de esa capa).

## Redux

Reutilizar slices existentes (`frontend/store/slices/`) antes de crear uno nuevo. No todo módulo necesita Redux — `clientes-slice.ts` y `roles-slice.ts` son los únicos dos hoy; el resto usa `useCrudList` o estado local (decisión explícita, no una migración pendiente).

## Formularios

Usar el mismo patrón: `Field` (`frontend/components/crud-modal.tsx`) para la etiqueta + input, agrupado en `grid grid-cols-2 gap-3` cuando hay más de un campo relacionado por fila.

## CRUD

Usar `CrudModal` (`frontend/components/crud-modal.tsx`) para Crear/Editar y `DetailModal` (`frontend/components/detail-modal.tsx`) para Ver — Global UI Standard "CRUD en Modal" (`docs/05_IMPLEMENTATION/ModalCrudStandard.md`). Ningún módulo nuevo debe navegar a una página completa para estas tres acciones salvo que califique para una de las excepciones documentadas ahí (Dashboard, Captura IA, Reportes, Configuración, flujos multi-paso, formularios demasiado grandes para un modal).

## Tablas

Componer `Table`/`TableHeader`/`TableBody`/`TableRow`/`TableCell` (`frontend/components/ui/table.tsx`) directamente en la página de listado. No existe (todavía) un componente `DataTable` de nivel superior — cada listado repite el mismo patrón de columnas + `DropdownMenu` de acciones por fila + `EmptyState`, pero no está factorizado en un componente compartido. Candidato real a extraer si se vuelve a auditar este documento.

## Botones

Usar `Button` (`frontend/components/ui/button.tsx`), variantes `default`/`outline`/`destructive`/`ghost`/`secondary` ya definidas — no crear un botón con estilos inline.

## Badges

Usar `Badge` (`frontend/components/ui/badge.tsx`) para estado genérico; usar `MovementTypeBadge` (`frontend/components/movement-type-badge.tsx`) específicamente para tipo de movimiento de inventario — ya trae color-coding e ícono por tipo (Entrada/Salida/Ajuste/Conteo/Transferencia), no reimplementar ese mapeo en otro lugar.

## Cards

Usar `Card`/`CardContent`/`CardHeader` (`frontend/components/ui/card.tsx`).

## Inputs

Usar `Input` (`frontend/components/ui/input.tsx`) y `Textarea` (`frontend/components/ui/textarea.tsx`) según corresponda.

## Select

Usar `Select`/`SelectContent`/`SelectItem`/`SelectTrigger`/`SelectValue` (`frontend/components/ui/select.tsx`). Inicializar siempre el valor controlado en `""`, nunca `undefined` — evita la advertencia de React de "uncontrolled to controlled" en el primer render (lección aprendida documentada en `docs/05_IMPLEMENTATION/UsersModule.md`, ampliación 2026-08-03).

## Confirmaciones

Usar `ConfirmDialog` (`frontend/components/confirm-dialog.tsx`) para toda acción de Eliminar/Deshabilitar/Activar-Desactivar — Global UI Standard, ningún módulo debe mutar un estado destructivo sin pasar por este componente primero.

## Toasts

Usar `import { toast } from "sonner"` directo (`success`/`error`) — el `Toaster` global (`frontend/components/ui/sonner.tsx`) ya está montado una sola vez en el árbol de la aplicación.
