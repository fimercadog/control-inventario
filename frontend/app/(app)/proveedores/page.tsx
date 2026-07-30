"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Truck, Search, SearchX, MoreHorizontal, Pencil, Ban, CheckCircle2, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { NewSupplierDialog } from "@/components/new-supplier-dialog";
import { listProveedores, disableProveedor, enableProveedor } from "@/lib/api/proveedores";
import type { Proveedor } from "@/lib/api/types";
import { formatNumber } from "@/lib/format";

const ESTADO_FILTROS: Record<string, string> = {
  activo: "Activos",
  todos: "Todos (incluye inactivos)",
};

/**
 * FEATURE-003 (docs/03_FUNCTIONAL_SPEC/Suppliers.md). GLOBAL UI STANDARD:
 * proveedores inactivos (deshabilitados) quedan ocultos del listado por
 * defecto — visibles solo con el filtro "Todos".
 */
export default function SuppliersPage() {
  const router = useRouter();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("activo");

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      listProveedores({ busqueda: search || undefined, estado: estadoFiltro })
        .then((result) => {
          setProveedores(result.items);
          setTotal(result.meta.total);
        })
        .catch((error) =>
          toast.error(error instanceof Error ? error.message : "No pudimos cargar los proveedores.")
        )
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, estadoFiltro]);

  async function handleToggleEstado(proveedor: Proveedor) {
    try {
      const nuevoEstado = proveedor.estado === "activo" ? "inactivo" : "activo";
      if (proveedor.estado === "activo") {
        await disableProveedor(proveedor.id);
        toast.success("Proveedor deshabilitado");
      } else {
        await enableProveedor(proveedor.id);
        toast.success("Proveedor habilitado");
      }
      // GLOBAL UI STANDARD: deshabilitado desaparece del listado "Activos"
      // por defecto; con el listado "Activos" solo se retira la fila.
      if (estadoFiltro !== "todos") {
        setProveedores((prev) => prev.filter((p) => p.id !== proveedor.id));
        setTotal((t) => t - 1);
      } else {
        setProveedores((prev) =>
          prev.map((p) => (p.id === proveedor.id ? { ...p, estado: nuevoEstado } : p))
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos actualizar el proveedor.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Proveedores</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Cargando..." : `${formatNumber(total)} proveedores.`}
          </p>
        </div>
        <NewSupplierDialog
          onCreated={(nuevo) => {
            setProveedores((prev) => [nuevo, ...prev]);
            setTotal((t) => t + 1);
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-55 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, NIT o contacto..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          items={ESTADO_FILTROS}
          value={estadoFiltro}
          onValueChange={(value) => setEstadoFiltro(value ?? "activo")}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ESTADO_FILTROS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/60 py-0">
        <CardContent className="px-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Cargando proveedores...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>NIT</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Ciudad / País</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {proveedores.map((proveedor) => (
                  <TableRow
                    key={proveedor.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/proveedores/${proveedor.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Truck className="size-4" />
                        </div>
                        <Link
                          href={`/proveedores/${proveedor.id}`}
                          className="font-medium hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {proveedor.nombre}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{proveedor.nit ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{proveedor.contacto ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {[proveedor.ciudad, proveedor.pais].filter(Boolean).join(", ") || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={proveedor.estado === "activo" ? "outline" : "secondary"}>
                        {proveedor.estado === "activo" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon-sm" aria-label="Acciones">
                              <MoreHorizontal />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/proveedores/${proveedor.id}?editar=1`)}>
                            <Pencil />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleEstado(proveedor)}>
                            {proveedor.estado === "activo" ? (
                              <>
                                <Ban />
                                Deshabilitar
                              </>
                            ) : (
                              <>
                                <CheckCircle2 />
                                Habilitar
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}

                {proveedores.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <EmptyState
                        icon={SearchX}
                        title="No encontramos proveedores"
                        description="Prueba con otro nombre, NIT o contacto, o crea el primero."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
