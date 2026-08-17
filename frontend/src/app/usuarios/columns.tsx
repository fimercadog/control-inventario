"use client";

import Link from "next/link";
import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Loader2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Usuario } from "@/types/user";
import { formatDateTime } from "@/lib/utils/format";

interface BuildColumnsOptions {
  canEdit: boolean;
  togglingId: number | null;
  onToggleActivo: (usuario: Usuario) => void;
  onEditUsuario: (usuario: Usuario) => void;
}

export function buildUsuarioColumns({
  canEdit,
  togglingId,
  onToggleActivo,
  onEditUsuario,
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
      cell: ({ row }) =>
        row.original.is_active ? (
          <Badge className="border-emerald-500/40 bg-emerald-500/15 text-emerald-400">Activo</Badge>
        ) : (
          <Badge className="border-slate-400/40 bg-slate-400/15 text-slate-300">Inactivo</Badge>
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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onEditUsuario(usuario)}>
              <Pencil className="size-4" />
              Actualizar
            </Button>
            <Button
              variant={usuario.is_active ? "destructive" : "outline"}
              className={
                usuario.is_active
                  ? undefined
                  : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
              }
              size="sm"
              disabled={isToggling}
              onClick={() => onToggleActivo(usuario)}
            >
              {isToggling ? <Loader2 className="size-4 animate-spin" /> : null}
              {usuario.is_active ? "Desactivar" : "Activar"}
            </Button>
          </div>
        );
      },
    });
  }

  return columns;
}
