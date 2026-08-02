"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, SearchX, ArrowDownLeft, ArrowUpRight, RefreshCw, ClipboardList, ArrowLeftRight, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { NewMovimientoDialog } from "@/components/new-movimiento-dialog";
import { useCrudList } from "@/hooks/use-crud-list";
import { listMovimientos } from "@/lib/api/movimientos";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const TYPE_FILTERS: Record<string, string> = {
  todos: "Todos los tipos",
  entrada: "Entradas",
  salida: "Salidas",
  ajuste: "Ajustes",
  conteo: "Conteos",
  transferencia: "Transferencias",
};

const TYPE_ICON: Record<string, React.ElementType> = {
  entrada: ArrowDownLeft,
  salida: ArrowUpRight,
  ajuste: RefreshCw,
  conteo: ClipboardList,
  transferencia: ArrowLeftRight,
};

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) /
      86_400_000
  );

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  return date.toLocaleDateString("es-CO", { day: "numeric", month: "long" });
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
}

/**
 * RC1 Fase 3 (docs/03_FUNCTIONAL_SPEC/Movements.md). Módulo global real
 * (reemplaza `lib/mock/data.ts`/`MOCK_MOVEMENTS`) — línea de tiempo
 * agrupada por día, igual que el diseño original, ahora sobre
 * `GET /api/v1/movimientos`. Un movimiento nunca se elimina ni se anula:
 * sin acción "Eliminar" en ningún lugar de esta pantalla.
 */
export default function MovementsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState("todos");
  const [page, setPage] = useState(1);

  // Volver a la página 1 cada vez que cambian los filtros — una página 2
  // calculada sobre el filtro anterior no tiene sentido con el nuevo.
  useEffect(() => {
    setPage(1);
  }, [search, tipo]);

  const {
    items: movimientos,
    meta,
    loading,
    refetch,
  } = useCrudList(
    () =>
      listMovimientos({
        busqueda: search || undefined,
        tipo: tipo === "todos" ? undefined : tipo,
        page,
      }),
    [search, tipo, page]
  );

  function handleCreated() {
    // Si ya estamos en la página 1, el cambio de filtro/página no dispara
    // el refetch automático del hook (misma dependencia) — refrescamos a mano.
    // Si no, volver a página 1 ya dispara el refetch por su cuenta.
    if (page === 1) {
      refetch();
    } else {
      setPage(1);
    }
  }

  const groups = useMemo(() => {
    const map = new Map<string, typeof movimientos>();
    for (const movimiento of movimientos) {
      if (!movimiento.created_at) continue;
      const label = dayLabel(movimiento.created_at);
      map.set(label, [...(map.get(label) ?? []), movimiento]);
    }
    return Array.from(map.entries());
  }, [movimientos]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Movimientos</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "Cargando..." : `${formatNumber(meta?.total ?? movimientos.length)} movimientos registrados.`}
          </p>
        </div>
        <NewMovimientoDialog onCreated={handleCreated} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-55 max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por producto o documento..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select items={TYPE_FILTERS} value={tipo} onValueChange={(value) => setTipo(value ?? "todos")}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TYPE_FILTERS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Cargando movimientos...
        </div>
      ) : groups.length === 0 ? (
        <Card className="border-border/60 py-0">
          <CardContent className="px-0">
            <EmptyState
              icon={SearchX}
              title="No encontramos movimientos"
              description="Prueba con otro producto o tipo de movimiento."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setTipo("todos");
                  }}
                >
                  Limpiar filtros
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map(([label, items]) => (
            <div key={label} className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-muted-foreground">{label}</h2>
              <ol className="relative flex flex-col gap-5 border-l border-border pl-6">
                {items.map((movimiento) => {
                  const Icon = TYPE_ICON[movimiento.tipo] ?? ClipboardList;
                  const esPositivo = movimiento.delta >= 0;

                  return (
                    <li key={movimiento.id} className="relative">
                      <span
                        className={cn(
                          "absolute -left-[1.85rem] flex size-8 items-center justify-center rounded-full ring-4 ring-background",
                          esPositivo ? "bg-emerald-500/15 text-emerald-600" : "bg-red-500/10 text-red-600"
                        )}
                      >
                        <Icon className="size-4" />
                      </span>

                      <div
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-card p-3.5 cursor-pointer hover:bg-accent/50"
                        onClick={() => router.push(`/movimientos/${movimiento.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Icon className="size-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{movimiento.producto ?? `#${movimiento.producto_id}`}</span>
                            <span className="text-xs text-muted-foreground">
                              {movimiento.created_at ? timeLabel(movimiento.created_at) : "—"}
                              {movimiento.usuario ? ` · ${movimiento.usuario}` : ""}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-muted-foreground">
                            {movimiento.tipo}
                          </Badge>
                          <span
                            className={cn(
                              "text-lg font-semibold tabular-nums",
                              esPositivo ? "text-emerald-600" : "text-red-600"
                            )}
                          >
                            {esPositivo ? "+" : ""}
                            {formatNumber(movimiento.delta)}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}

          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-border/60 pt-4">
              <span className="text-sm text-muted-foreground">
                Página {meta.current_page} de {meta.last_page}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="size-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={page >= meta.last_page || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
