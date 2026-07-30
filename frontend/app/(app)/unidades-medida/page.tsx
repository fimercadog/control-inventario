"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ruler, Search, SearchX, MoreHorizontal, Pencil, Ban, CheckCircle2, Loader2 } from "lucide-react";
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
import { NewUnidadMedidaDialog } from "@/components/new-unidad-medida-dialog";
import { useCrudList } from "@/hooks/use-crud-list";
import { listUnidadesMedida, disableUnidadMedida, enableUnidadMedida } from "@/lib/api/unidades-medida";
import type { UnidadMedida } from "@/lib/api/types";
import { formatNumber } from "@/lib/format";

const ESTADO_FILTROS: Record<string, string> = {
  activo: "Activas",
  todos: "Todas (incluye inactivas)",
};

/**
 * RC1 (docs/03_FUNCTIONAL_SPEC/UnitsOfMeasure.md). Mismo nivel de
 * funcionalidad que Productos/Proveedores/Categorías/Marcas: búsqueda,
 * filtro de estado, Logical Delete con confirmación, refresco automático
 * vía `useCrudList`.
 */
export default function UnidadesMedidaPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("activo");
  const [unidadAConfirmar, setUnidadAConfirmar] = useState<UnidadMedida | null>(null);

  const {
    items: unidades,
    meta,
    loading,
    refetch,
  } = useCrudList(
    () => listUnidadesMedida({ busqueda: search || undefined, estado: estadoFiltro }),
    [search, estadoFiltro]
  );

  async function confirmarCambioEstado() {
    if (!unidadAConfirmar) return;
    try {
      if (unidadAConfirmar.estado === "activo") {
        await disableUnidadMedida(unidadAConfirmar.id);
        toast.success("Unidad de medida deshabilitada correctamente");
      } else {
        await enableUnidadMedida(unidadAConfirmar.id);
        toast.success("Unidad de medida habilitada correctamente");
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
          <h1 className="text-2xl font-semibold tracking-tight">Unidades de Medida</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Cargando..." : `${formatNumber(meta?.total ?? unidades.length)} unidades de medida.`}
          </p>
        </div>
        <NewUnidadMedidaDialog onCreated={() => refetch()} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-55 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o abreviatura..."
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
              Cargando unidades de medida...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidad de Medida</TableHead>
                  <TableHead>Abreviatura</TableHead>
                  <TableHead className="text-right">Productos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {unidades.map((unidad) => (
                  <TableRow
                    key={unidad.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/unidades-medida/${unidad.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Ruler className="size-4" />
                        </div>
                        <Link
                          href={`/unidades-medida/${unidad.id}`}
                          className="font-medium hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {unidad.nombre}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{unidad.abreviatura ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(unidad.productos_count ?? 0)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          unidad.estado === "activo"
                            ? "bg-emerald-600 text-white dark:bg-emerald-500"
                            : "bg-red-600 text-white dark:bg-red-500"
                        }
                      >
                        {unidad.estado === "activo" ? "Activa" : "Inactiva"}
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
                          <DropdownMenuItem
                            onClick={() => router.push(`/unidades-medida/${unidad.id}?editar=1`)}
                          >
                            <Pencil />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setUnidadAConfirmar(unidad)}>
                            {unidad.estado === "activo" ? (
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

                {unidades.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0">
                      <EmptyState
                        icon={SearchX}
                        title="No encontramos unidades de medida"
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
        open={unidadAConfirmar !== null}
        onOpenChange={(open) => !open && setUnidadAConfirmar(null)}
        title={
          unidadAConfirmar?.estado === "activo"
            ? "¿Eliminar esta unidad de medida?"
            : "¿Habilitar esta unidad de medida?"
        }
        description={
          unidadAConfirmar?.estado === "activo"
            ? `"${unidadAConfirmar?.nombre}" se marcará como inactiva. No se elimina físicamente ni afecta a los productos que ya la usan — puedes habilitarla de nuevo en cualquier momento.`
            : `"${unidadAConfirmar?.nombre}" volverá a estar activa y disponible.`
        }
        confirmLabel={unidadAConfirmar?.estado === "activo" ? "Eliminar" : "Habilitar"}
        destructive={unidadAConfirmar?.estado === "activo"}
        onConfirm={confirmarCambioEstado}
      />
    </div>
  );
}
