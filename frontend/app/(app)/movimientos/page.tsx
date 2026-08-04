"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  SearchX,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  ClipboardList,
  ArrowLeftRight,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Paperclip,
  ArrowRight,
  User,
  Clock,
} from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/empty-state";
import { NewMovimientoDialog } from "@/components/new-movimiento-dialog";
import { MovementTypeBadge } from "@/components/movement-type-badge";
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
    // Ancho acotado (2026-08-03): las tarjetas de movimiento no cargan
    // suficiente información para justificar el ancho completo del
    // contenido — `max-w-4xl` (896px, dentro del rango pedido 800-1000px)
    // + `mx-auto` centra la columna en monitores anchos sin afectar el
    // comportamiento responsive (en mobile/tablet el viewport ya es más
    // angosto que el máximo, así que simplemente ocupa el ancho disponible).
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
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
                  const unidad = movimiento.unidad_medida ? ` ${movimiento.unidad_medida}` : "";

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

                      {/**
                       * Jerarquía visual (pedido explícito 2026-08-03,
                       * "understand the movement in less than 2 seconds"):
                       * 1. Producto  2. Tipo  3. Cantidad  4. Stock antes→después
                       * 5. Usuario  6. Fecha  7. Origen. Dos columnas arriba
                       * (identidad izquierda, magnitud derecha) + una fila de
                       * metadata abajo, separada por un borde — no cambia
                       * ningún dato, solo cómo se agrupan y con qué peso.
                       */}
                      <div
                        className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 cursor-pointer hover:border-border hover:bg-accent/50 transition-colors"
                        onClick={() => router.push(`/movimientos/${movimiento.id}`)}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex min-w-0 flex-col gap-1.5">
                            <span className="truncate text-base font-semibold leading-tight">
                              {movimiento.producto ?? `#${movimiento.producto_id}`}
                            </span>
                            <MovementTypeBadge tipo={movimiento.tipo} className="w-fit" />
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-1.5">
                            <span
                              className={cn(
                                "text-2xl font-bold leading-none tabular-nums",
                                esPositivo ? "text-emerald-600" : "text-red-600"
                              )}
                            >
                              {esPositivo ? "+" : ""}
                              {formatNumber(movimiento.delta)}
                              {unidad}
                            </span>
                            {/* Stock antes → después, siempre visible con
                                énfasis fuerte — nadie debería tener que
                                calcular mentalmente el inventario a partir
                                del delta solo. */}
                            <div className="flex items-center gap-1.5 rounded-md bg-muted/70 px-2 py-1">
                              <span className="text-sm font-semibold tabular-nums">
                                {formatNumber(movimiento.stock_anterior)}
                              </span>
                              <ArrowRight className="size-3.5 text-muted-foreground" />
                              <span className="text-sm font-bold tabular-nums">
                                {formatNumber(movimiento.stock_nuevo)}
                                {unidad}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/50 pt-2.5 text-xs text-muted-foreground">
                          {movimiento.usuario && (
                            <span className="flex items-center gap-1">
                              <User className="size-3.5" />
                              {movimiento.usuario}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="size-3.5" />
                            {movimiento.created_at ? timeLabel(movimiento.created_at) : "—"}
                          </span>
                          {movimiento.origen === "captura_ia" ? (
                            <Badge variant="outline" className="gap-1 py-0 text-[10px] text-primary">
                              <Sparkles className="size-3" />
                              Captura IA
                            </Badge>
                          ) : (
                            <span>Manual</span>
                          )}
                          {movimiento.tiene_evidencia && (
                            <Tooltip>
                              <TooltipTrigger render={<Paperclip className="size-3.5" />} />
                              <TooltipContent>Tiene evidencia adjunta</TooltipContent>
                            </Tooltip>
                          )}
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
