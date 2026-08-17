"use client";

import Link from "next/link";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Usuario } from "@/types/user";
import { formatDateTime } from "@/lib/utils/format";

interface BuildColumnsOptions {
  canEdit: boolean;
  togglingId: number | null;
  onToggleActivo: (usuario: Usuario) => void;
}

export function buildUsuarioColumns({
  canEdit,
  togglingId,
  onToggleActivo,
}: BuildColumnsOptions): ColumnDef<Usuario, unknown>[] {
  const columns: ColumnDef<Usuario, unknown>[] = [
    {
      accessorKey: "name",
      header: "Usuario",
      cell: ({ row }) => (
        <Link href={`/usuarios/${row.original.id}`} className="font-medium text-foreground hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
    },
    {
      accessorKey: "role",
      header: "Rol",
      cell: ({ row }) => row.original.role ?? <span className="text-muted-foreground">Sin rol</span>,
    },
    {
      accessorKey: "is_active",
      header: "Estado",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "default" : "secondary"}>
          {row.original.is_active ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      accessorKey: "last_activity_at",
      header: "Última actividad",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatDateTime(row.original.last_activity_at)}</span>
      ),
    },
  ];

  if (canEdit) {
    columns.push({
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => {
        const usuario = row.original;
        const isToggling = togglingId === usuario.id;
        return (
          <Button
            variant="outline"
            size="sm"
            disabled={isToggling}
            onClick={() => onToggleActivo(usuario)}
          >
            {isToggling ? <Loader2 className="size-4 animate-spin" /> : null}
            {usuario.is_active ? "Desactivar" : "Activar"}
          </Button>
        );
      },
    });
  }

  return columns;
}
