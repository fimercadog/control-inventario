"use client";

import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Eye, Loader2, MoreHorizontal, Shield, UserRoundCog } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Usuario } from "@/types/user";
import { formatDateTime, initialsFor } from "@/lib/utils/format";

interface BuildColumnsOptions {
  canEdit: boolean;
  togglingId: number | null;
  onToggleActivo: (usuario: Usuario) => void;
  onChangeRole: (usuario: Usuario) => void;
  onEditAvatar: (usuario: Usuario) => void;
  onViewUsuario: (usuario: Usuario) => void;
}

export function buildUsuarioColumns({
  canEdit,
  togglingId,
  onToggleActivo,
  onChangeRole,
  onEditAvatar,
  onViewUsuario,
}: BuildColumnsOptions): ColumnDef<Usuario, unknown>[] {
  const columns: ColumnDef<Usuario, unknown>[] = [
    {
      accessorKey: "name",
      header: "Usuario",
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => onViewUsuario(row.original)}
          className="flex items-center gap-2.5 text-left hover:underline"
        >
          <Avatar size="sm">
            {row.original.avatar_url ? <AvatarImage src={row.original.avatar_url} alt="" /> : null}
            <AvatarFallback>{initialsFor(row.original.name)}</AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground">{row.original.name}</span>
        </button>
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
          <Badge variant="success">Activo</Badge>
        ) : (
          <Badge variant="outline">Inactivo</Badge>
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
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="icon-sm" disabled={isToggling} aria-label="Acciones" />}
            >
              {isToggling ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewUsuario(usuario)}>
                <Eye className="size-4" />
                Ver
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onChangeRole(usuario)}>
                <Shield className="size-4" />
                Cambiar rol
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditAvatar(usuario)}>
                <UserRoundCog className="size-4" />
                Editar avatar
              </DropdownMenuItem>
              <DropdownMenuItem
                variant={usuario.is_active ? "destructive" : "default"}
                onClick={() => onToggleActivo(usuario)}
              >
                {usuario.is_active ? "Desactivar" : "Activar"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    });
  }

  return columns;
}
