"use client";

import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Eye, Loader2, MoreHorizontal, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Marca } from "@/types/marca";

interface BuildColumnsOptions {
  /** Gates Editar AND Habilitar — MarcaPolicy::update() covers both (marcas.editar). */
  canEdit: boolean;
  /** Gates Deshabilitar only — MarcaPolicy::delete() (marcas.gestionar), stricter. */
  canDisable: boolean;
  togglingId: number | null;
  onView: (marca: Marca) => void;
  onEdit: (marca: Marca) => void;
  onToggleEstado: (marca: Marca) => void;
}

export function buildMarcaColumns({
  canEdit,
  canDisable,
  togglingId,
  onView,
  onEdit,
  onToggleEstado,
}: BuildColumnsOptions): ColumnDef<Marca, unknown>[] {
  const columns: ColumnDef<Marca, unknown>[] = [
    {
      accessorKey: "nombre",
      header: "Nombre",
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => onView(row.original)}
          className="text-left font-medium text-foreground hover:underline"
        >
          {row.original.nombre}
        </button>
      ),
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
    {
      accessorKey: "productos_count",
      header: "Productos",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.productos_count ?? 0}</span>,
    },
  ];

  if (canEdit || canDisable) {
    columns.push({
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => {
        const marca = row.original;
        const isToggling = togglingId === marca.id;
        const isActive = marca.estado === "activo";
        const canToggleThisWay = isActive ? canDisable : canEdit;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" disabled={isToggling} />}>
              {isToggling ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
              Acciones
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(marca)}>
                <Eye className="size-4" />
                Ver
              </DropdownMenuItem>
              {canEdit ? (
                <DropdownMenuItem onClick={() => onEdit(marca)}>
                  <Pencil className="size-4" />
                  Editar
                </DropdownMenuItem>
              ) : null}
              {canToggleThisWay ? (
                <DropdownMenuItem
                  variant={isActive ? "destructive" : "default"}
                  onClick={() => onToggleEstado(marca)}
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
