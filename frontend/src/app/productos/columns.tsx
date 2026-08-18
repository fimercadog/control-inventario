"use client";

import Link from "next/link";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Loader2, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Producto } from "@/types/producto";

interface BuildColumnsOptions {
  /** Gates Habilitar — ProductoPolicy::update() (productos.editar). */
  canEdit: boolean;
  /** Gates Deshabilitar only — ProductoPolicy::delete() (productos.gestionar), stricter. */
  canDisable: boolean;
  togglingId: number | null;
  onToggleEstado: (producto: Producto) => void;
}

export function buildProductoColumns({
  canEdit,
  canDisable,
  togglingId,
  onToggleEstado,
}: BuildColumnsOptions): ColumnDef<Producto, unknown>[] {
  const columns: ColumnDef<Producto, unknown>[] = [
    {
      accessorKey: "nombre",
      header: "Nombre",
      cell: ({ row }) => (
        <Link href={`/productos/${row.original.id}`} className="font-medium text-foreground hover:underline">
          {row.original.nombre}
        </Link>
      ),
    },
    { accessorKey: "codigo", header: "Código", cell: ({ row }) => row.original.codigo ?? "—" },
    { accessorKey: "marca", header: "Marca", cell: ({ row }) => row.original.marca ?? "—" },
    { accessorKey: "categoria", header: "Categoría", cell: ({ row }) => row.original.categoria ?? "—" },
    {
      accessorKey: "precio",
      header: "Precio",
      cell: ({ row }) => row.original.precio.toLocaleString("es-CO", { style: "currency", currency: "COP" }),
    },
    {
      accessorKey: "stock_actual",
      header: "Stock",
      cell: ({ row }) => {
        const p = row.original;
        const bajo = p.stock_actual <= p.stock_minimo;
        return (
          <span className={bajo ? "font-semibold text-warning" : "text-foreground"}>
            {p.stock_actual}
          </span>
        );
      },
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) =>
        row.original.estado === "activo" ? (
          <Badge variant="success">Activo</Badge>
        ) : (
          <Badge variant="outline">Inactivo</Badge>
        ),
    },
  ];

  if (canEdit || canDisable) {
    columns.push({
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => {
        const producto = row.original;
        const isToggling = togglingId === producto.id;
        const isActive = producto.estado === "activo";
        const canToggleThisWay = isActive ? canDisable : canEdit;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="icon-sm" disabled={isToggling} aria-label="Acciones" />}>
              {isToggling ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem render={<Link href={`/productos/${producto.id}`} />}>Ver ficha</DropdownMenuItem>
              {canToggleThisWay ? (
                <DropdownMenuItem
                  variant={isActive ? "destructive" : "default"}
                  onClick={() => onToggleEstado(producto)}
                >
                  {isActive ? "Deshabilitar" : "Habilitar"}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    });
  }

  return columns;
}
