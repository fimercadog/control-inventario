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
import type { Categoria } from "@/types/categoria";

interface BuildColumnsOptions {
  /** Gates Editar AND Habilitar — CategoriaPolicy::update() covers both (categorias.editar). */
  canEdit: boolean;
  /** Gates Deshabilitar only — CategoriaPolicy::delete() (categorias.gestionar), stricter. */
  canDisable: boolean;
  togglingId: number | null;
  onView: (categoria: Categoria) => void;
  onEdit: (categoria: Categoria) => void;
  onToggleEstado: (categoria: Categoria) => void;
}

export function buildCategoriaColumns({
  canEdit,
  canDisable,
  togglingId,
  onView,
  onEdit,
  onToggleEstado,
}: BuildColumnsOptions): ColumnDef<Categoria, unknown>[] {
  const columns: ColumnDef<Categoria, unknown>[] = [
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
        const categoria = row.original;
        const isToggling = togglingId === categoria.id;
        const isActive = categoria.estado === "activo";
        const canToggleThisWay = isActive ? canDisable : canEdit;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" disabled={isToggling} />}>
              {isToggling ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
              Acciones
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(categoria)}>
                <Eye className="size-4" />
                Ver
              </DropdownMenuItem>
              {canEdit ? (
                <DropdownMenuItem onClick={() => onEdit(categoria)}>
                  <Pencil className="size-4" />
                  Editar
                </DropdownMenuItem>
              ) : null}
              {canToggleThisWay ? (
                <DropdownMenuItem
                  variant={isActive ? "destructive" : "default"}
                  onClick={() => onToggleEstado(categoria)}
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
