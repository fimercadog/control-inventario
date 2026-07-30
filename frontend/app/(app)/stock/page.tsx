"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Warehouse,
  Search,
  SearchX,
  MoreHorizontal,
  Pencil,
  Ban,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useCrudList } from "@/hooks/use-crud-list";
import { listStock, disableStock, enableStock } from "@/lib/api/stock";
import type { Stock } from "@/lib/api/types";
import { formatNumber } from "@/lib/format";

const ESTADO_FILTROS: Record<string, string> = {
  activo: "Activos",
  todos: "Todos (incluye inactivos)",
};

/**
 * RC1 Fase 2 (docs/03_FUNCTIONAL_SPEC/Stock.md). Stock NO es una entidad
 * independiente — este listado muestra los Productos existentes con sus
 * campos de stock. Sin botón "Nuevo" a propósito (decisión confirmada
 * explícitamente por el propietario del proyecto): cada producto ya nace
 * con su propio stock desde su alta en el módulo Productos.
 */
export default function StockPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("activo");
  const [soloBajoMinimo, setSoloBajoMinimo] = useState(false);
  const [itemAConfirmar, setItemAConfirmar] = useState<Stock | null>(null);

  const {
    items: stock,
    meta,
    loading,
    refetch,
  } = useCrudList(
    () =>
      listStock({
        busqueda: search || undefined,
        estado: estadoFiltro,
        bajo_minimo: soloBajoMinimo || undefined,
      }),
    [search, estadoFiltro, soloBajoMinimo]
  );

  async function confirmarCambioEstado() {
    if (!itemAConfirmar) return;
    try {
      if (itemAConfirmar.estado === "activo") {
        await disableStock(itemAConfirmar.id);
        toast.success("Stock deshabilitado correctamente");
      } else {
        await enableStock(itemAConfirmar.id);
        toast.success("Stock habilitado correctamente");
      }
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos actualizar el estado.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stock</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Cargando..." : `${formatNumber(meta?.total ?? stock.length)} productos con stock.`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-55 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o código..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          items={ESTADO_FILTROS}
          value={estadoFiltro}
          onValueChange={(value) => setEstadoFiltro(value ?? "activo")}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ESTADO_FILTROS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={soloBajoMinimo} onCheckedChange={(v) => setSoloBajoMinimo(v === true)} />
          Solo bajo mínimo
        </label>
      </div>

      <Card className="border-border/60 py-0">
        <CardContent className="px-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Cargando stock...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead className="text-right">Máximo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/stock/${item.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Warehouse className="size-4" />
                        </div>
                        <div className="flex flex-col">
                          <Link
                            href={`/stock/${item.id}`}
                            className="font-medium hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {item.nombre}
                          </Link>
                          <span className="text-xs text-muted-foreground">{item.codigo ?? "—"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className="inline-flex items-center gap-1.5">
                        {item.bajo_minimo && <AlertTriangle className="size-3.5 text-amber-600" />}
                        {formatNumber(item.stock_actual)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatNumber(item.stock_minimo)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {item.stock_maximo !== null ? formatNumber(item.stock_maximo) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          item.estado === "activo"
                            ? "bg-emerald-600 text-white dark:bg-emerald-500"
                            : "bg-red-600 text-white dark:bg-red-500"
                        }
                      >
                        {item.estado === "activo" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon-sm" aria-label="Acciones">
                              <MoreHorizontal />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/stock/${item.id}?editar=1`)}>
                            <Pencil />
                            Editar umbrales
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setItemAConfirmar(item)}>
                            {item.estado === "activo" ? (
                              <>
                                <Ban />
                                Eliminar (deshabilitar)
                              </>
                            ) : (
                              <>
                                <CheckCircle2 />
                                Habilitar
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}

                {stock.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <EmptyState
                        icon={SearchX}
                        title="No encontramos productos con stock"
                        description="Prueba con otro nombre o código."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={itemAConfirmar !== null}
        onOpenChange={(open) => !open && setItemAConfirmar(null)}
        title={itemAConfirmar?.estado === "activo" ? "¿Eliminar este registro de Stock?" : "¿Habilitar este registro de Stock?"}
        description={
          itemAConfirmar?.estado === "activo"
            ? `"${itemAConfirmar?.nombre}" se ocultará del módulo Stock. Esto es puramente administrativo: no modifica la cantidad actual, no crea ningún movimiento, y el producto sigue siendo válido en Productos, Proveedores y Movimientos.`
            : `"${itemAConfirmar?.nombre}" volverá a aparecer en el listado de Stock.`
        }
        confirmLabel={itemAConfirmar?.estado === "activo" ? "Eliminar" : "Habilitar"}
        destructive={itemAConfirmar?.estado === "activo"}
        onConfirm={confirmarCambioEstado}
      />
    </div>
  );
}
