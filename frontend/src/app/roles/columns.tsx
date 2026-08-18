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
import type { Role } from "@/types/role";

interface BuildColumnsOptions {
  canManage: boolean;
  togglingId: number | null;
  onView: (role: Role) => void;
  onEdit: (role: Role) => void;
  onToggleEstado: (role: Role) => void;
}

export function buildRoleColumns({
  canManage,
  togglingId,
  onView,
  onEdit,
  onToggleEstado,
}: BuildColumnsOptions): ColumnDef<Role, unknown>[] {
  const columns: ColumnDef<Role, unknown>[] = [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => onView(row.original)}
          className="text-left font-medium text-foreground hover:underline"
        >
          {row.original.name}
        </button>
      ),
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
    {
      accessorKey: "permisos_count",
      header: "Permisos",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.permisos_count ?? 0}</span>,
    },
    {
      accessorKey: "usuarios_count",
      header: "Usuarios",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.usuarios_count ?? 0}</span>,
    },
  ];

  if (canManage) {
    columns.push({
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => {
        const role = row.original;
        const isToggling = togglingId === role.id;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="icon-sm" disabled={isToggling} aria-label="Acciones" />}>
              {isToggling ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(role)}>
                <Eye className="size-4" />
                Ver
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(role)}>
                <Pencil className="size-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                variant={role.estado === "activo" ? "destructive" : "default"}
                onClick={() => onToggleEstado(role)}
              >
                {role.estado === "activo" ? "Desactivar" : "Activar"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    });
  }

  return columns;
}
