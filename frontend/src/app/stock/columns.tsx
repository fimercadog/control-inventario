"use client";

import Link from "next/link";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Eye, Loader2, MoreHorizontal, Pencil, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StockItem } from "@/types/stock";

interface BuildColumnsOptions {
  /** Gates Editar AND Habilitar — StockPolicy::update() covers both (stock.editar). */
  canEdit: boolean;
  /** Requires movimientos.crear because an adjustment is a real ledger movement. */
  canAdjust: boolean;
  /** Gates Deshabilitar only — StockPolicy::delete() (stock.gestionar), stricter. */
  canDisable: boolean;
  togglingId: number | null;
  onEdit: (item: StockItem) => void;
  onAdjust: (item: StockItem) => void;
  onToggleEstado: (item: StockItem) => void;
}

export function buildStockColumns({
  canEdit,
  canAdjust,
  canDisable,
  togglingId,
  onEdit,
  onAdjust,
  onToggleEstado,
}: BuildColumnsOptions): ColumnDef<StockItem, unknown>[] {
  const columns: ColumnDef<StockItem, unknown>[] = [
    {
      accessorKey: "nombre",
      header: "Producto",
      cell: ({ row }) => (
        <Link href={`/productos/${row.original.id}`} className="font-medium text-foreground hover:underline">
          {row.original.nombre}
        </Link>
      ),
    },
    { accessorKey: "codigo", header: "Código", cell: ({ row }) => row.original.codigo ?? "—" },
    {
      accessorKey: "stock_actual",
      header: "Stock actual",
      cell: ({ row }) => (
        <span className={row.original.bajo_minimo ? "font-semibold text-amber-500" : "text-foreground"}>
          {row.original.stock_actual}
          {row.original.bajo_minimo ? (
            <Badge className="ml-2 border-amber-500/40 bg-amber-500/15 text-amber-400">Bajo mínimo</Badge>
          ) : null}
        </span>
      ),
    },
    { accessorKey: "stock_minimo", header: "Mínimo" },
    {
      accessorKey: "stock_maximo",
      header: "Máximo",
      cell: ({ row }) => row.original.stock_maximo ?? "—",
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) =>
        row.original.estado === "activo" ? (
          <Badge className="border-emerald-500/40 bg-emerald-500/15 text-emerald-400">Activo</Badge>
        ) : (
          <Badge className="border-slate-400/40 bg-slate-400/15 text-slate-300">Inactivo</Badge>
        ),
    },
  ];

  columns.push({
    id: "acciones",
    header: "Acciones",
    cell: ({ row }) => {
      const item = row.original;
      const isToggling = togglingId === item.id;
      const isActive = item.estado === "activo";
      const canToggleThisWay = isActive ? canDisable : canEdit;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" disabled={isToggling} />}>
            {isToggling ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
            Acciones
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem render={<Link href={`/productos/${item.id}`} />}>
              <Eye className="size-4" />
              Ver producto
            </DropdownMenuItem>
            {canEdit ? (
              <DropdownMenuItem onClick={() => onEdit(item)}>
                <Pencil className="size-4" />
                Editar umbrales
              </DropdownMenuItem>
            ) : null}
            {canAdjust ? (
              <DropdownMenuItem onClick={() => onAdjust(item)}>
                <SlidersHorizontal className="size-4" />
                Ajustar stock
              </DropdownMenuItem>
            ) : null}
            {canToggleThisWay ? (
              <DropdownMenuItem variant={isActive ? "destructive" : "default"} onClick={() => onToggleEstado(item)}>
                {isActive ? "Deshabilitar" : "Habilitar"}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  });

  return columns;
}
