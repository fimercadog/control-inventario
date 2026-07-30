"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Award, Search, SearchX, MoreHorizontal, Pencil, Ban, CheckCircle2, Loader2 } from "lucide-react";
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
import { ConfirmDialog } from "@/components/confirm-dialog";
import { NewMarcaDialog } from "@/components/new-marca-dialog";
import { useCrudList } from "@/hooks/use-crud-list";
import { listMarcas, disableMarca, enableMarca } from "@/lib/api/marcas";
import type { Marca } from "@/lib/api/types";
import { formatNumber } from "@/lib/format";

const ESTADO_FILTROS: Record<string, string> = {
  activo: "Activas",
  todos: "Todas (incluye inactivas)",
};

/**
 * RC1 (docs/03_FUNCTIONAL_SPEC/Brands.md). Mismo nivel de funcionalidad
 * que Productos/Proveedores/Categorías: búsqueda, filtro de estado,
 * Logical Delete con confirmación, refresco automático vía `useCrudList`.
 */
export default function MarcasPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("activo");
  const [marcaAConfirmar, setMarcaAConfirmar] = useState<Marca | null>(null);

  const {
    items: marcas,
    meta,
    loading,
    refetch,
  } = useCrudList(
    () => listMarcas({ busqueda: search || undefined, estado: estadoFiltro }),
    [search, estadoFiltro]
  );

  async function confirmarCambioEstado() {
    if (!marcaAConfirmar) return;
    try {
      if (marcaAConfirmar.estado === "activo") {
        await disableMarca(marcaAConfirmar.id);
        toast.success("Marca deshabilitada correctamente");
      } else {
        await enableMarca(marcaAConfirmar.id);
        toast.success("Marca habilitada correctamente");
      }
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos actualizar el estado.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Marcas</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Cargando..." : `${formatNumber(meta?.total ?? marcas.length)} marcas.`}
          </p>
        </div>
        <NewMarcaDialog onCreated={() => refetch()} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-55 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
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
              Cargando marcas...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marca</TableHead>
                  <TableHead className="text-right">Productos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {marcas.map((marca) => (
                  <TableRow
                    key={marca.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/marcas/${marca.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Award className="size-4" />
                        </div>
                        <Link
                          href={`/marcas/${marca.id}`}
                          className="font-medium hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {marca.nombre}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(marca.productos_count ?? 0)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          marca.estado === "activo"
                            ? "bg-emerald-600 text-white dark:bg-emerald-500"
                            : "bg-red-600 text-white dark:bg-red-500"
                        }
                      >
                        {marca.estado === "activo" ? "Activa" : "Inactiva"}
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
                          <DropdownMenuItem onClick={() => router.push(`/marcas/${marca.id}?editar=1`)}>
                            <Pencil />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setMarcaAConfirmar(marca)}>
                            {marca.estado === "activo" ? (
                              <>
                                <Ban />
                                Eliminar (deshabilitar)
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

                {marcas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="p-0">
                      <EmptyState
                        icon={SearchX}
                        title="No encontramos marcas"
                        description="Prueba con otro nombre, o crea la primera."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={marcaAConfirmar !== null}
        onOpenChange={(open) => !open && setMarcaAConfirmar(null)}
        title={marcaAConfirmar?.estado === "activo" ? "¿Eliminar esta marca?" : "¿Habilitar esta marca?"}
        description={
          marcaAConfirmar?.estado === "activo"
            ? `"${marcaAConfirmar?.nombre}" se marcará como inactiva. No se elimina físicamente ni afecta a los productos que ya la usan — puedes habilitarla de nuevo en cualquier momento.`
            : `"${marcaAConfirmar?.nombre}" volverá a estar activa y disponible.`
        }
        confirmLabel={marcaAConfirmar?.estado === "activo" ? "Eliminar" : "Habilitar"}
        destructive={marcaAConfirmar?.estado === "activo"}
        onConfirm={confirmarCambioEstado}
      />
    </div>
  );
}
