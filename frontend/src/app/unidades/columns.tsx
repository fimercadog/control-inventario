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
import type { UnidadMedida } from "@/types/unidad-medida";

interface BuildColumnsOptions {
  /** Gates Editar AND Habilitar — UnidadMedidaPolicy::update() covers both (unidades-medida.editar). */
  canEdit: boolean;
  /** Gates Deshabilitar only — UnidadMedidaPolicy::delete() (unidades-medida.gestionar), stricter. */
  canDisable: boolean;
  togglingId: number | null;
  onView: (unidad: UnidadMedida) => void;
  onEdit: (unidad: UnidadMedida) => void;
  onToggleEstado: (unidad: UnidadMedida) => void;
}

export function buildUnidadMedidaColumns({
  canEdit,
  canDisable,
  togglingId,
  onView,
  onEdit,
  onToggleEstado,
}: BuildColumnsOptions): ColumnDef<UnidadMedida, unknown>[] {
  const columns: ColumnDef<UnidadMedida, unknown>[] = [
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
      accessorKey: "abreviatura",
      header: "Abreviatura",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.abreviatura ?? "—"}</span>,
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
        const unidad = row.original;
        const isToggling = togglingId === unidad.id;
        const isActive = unidad.estado === "activo";
        const canToggleThisWay = isActive ? canDisable : canEdit;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" disabled={isToggling} />}>
              {isToggling ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
              Acciones
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(unidad)}>
                <Eye className="size-4" />
                Ver
              </DropdownMenuItem>
              {canEdit ? (
                <DropdownMenuItem onClick={() => onEdit(unidad)}>
                  <Pencil className="size-4" />
                  Editar
                </DropdownMenuItem>
              ) : null}
              {canToggleThisWay ? (
                <DropdownMenuItem
                  variant={isActive ? "destructive" : "default"}
                  onClick={() => onToggleEstado(unidad)}
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
