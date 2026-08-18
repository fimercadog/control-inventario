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
import type { Proveedor } from "@/types/proveedor";

interface BuildColumnsOptions {
  /** Gates Editar AND Habilitar — ProveedorPolicy::update() covers both (proveedores.editar). */
  canEdit: boolean;
  /** Gates Deshabilitar only — ProveedorPolicy::delete() (proveedores.gestionar), stricter. */
  canDisable: boolean;
  togglingId: number | null;
  onView: (proveedor: Proveedor) => void;
  onEdit: (proveedor: Proveedor) => void;
  onToggleEstado: (proveedor: Proveedor) => void;
}

export function buildProveedorColumns({
  canEdit,
  canDisable,
  togglingId,
  onView,
  onEdit,
  onToggleEstado,
}: BuildColumnsOptions): ColumnDef<Proveedor, unknown>[] {
  const columns: ColumnDef<Proveedor, unknown>[] = [
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
      accessorKey: "nit",
      header: "NIT",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.nit ?? "—"}</span>,
    },
    {
      accessorKey: "contacto",
      header: "Contacto",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.contacto ?? "—"}</span>,
    },
    {
      accessorKey: "telefono",
      header: "Teléfono",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.telefono ?? "—"}</span>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.email ?? "—"}</span>,
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
        const proveedor = row.original;
        const isToggling = togglingId === proveedor.id;
        const isActive = proveedor.estado === "activo";
        const canToggleThisWay = isActive ? canDisable : canEdit;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="icon-sm" disabled={isToggling} aria-label="Acciones" />}>
              {isToggling ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(proveedor)}>
                <Eye className="size-4" />
                Ver
              </DropdownMenuItem>
              {canEdit ? (
                <DropdownMenuItem onClick={() => onEdit(proveedor)}>
                  <Pencil className="size-4" />
                  Editar
                </DropdownMenuItem>
              ) : null}
              {canToggleThisWay ? (
                <DropdownMenuItem
                  variant={isActive ? "destructive" : "default"}
                  onClick={() => onToggleEstado(proveedor)}
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
