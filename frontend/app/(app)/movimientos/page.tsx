"use client";

import { useMemo, useState } from "react";
import { Search, SearchX, ArrowDownLeft, ArrowUpRight, RefreshCw, ClipboardList, ArrowLeftRight } from "lucide-react";
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
import { MOCK_MOVEMENTS } from "@/lib/mock/data";
import { formatNumber } from "@/lib/format";
import type { MovementType } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_FILTERS: { value: MovementType | "todos"; label: string }[] = [
  { value: "todos", label: "Todos los tipos" },
  { value: "entrada", label: "Entradas" },
  { value: "salida", label: "Salidas" },
  { value: "ajuste", label: "Ajustes" },
  { value: "conteo", label: "Conteos" },
  { value: "transferencia", label: "Transferencias" },
];

const TYPE_ICON: Record<MovementType, React.ElementType> = {
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

export default function MovementsPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<MovementType | "todos">("todos");

  const filtered = useMemo(() => {
    return [...MOCK_MOVEMENTS]
      .filter((m) => {
        const matchesSearch =
          search.trim() === "" || m.producto.toLowerCase().includes(search.toLowerCase());
        const matchesType = type === "todos" || m.tipo === type;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [search, type]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const movement of filtered) {
      const label = dayLabel(movement.fecha);
      map.set(label, [...(map.get(label) ?? []), movement]);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Movimientos</h1>
        <p className="text-sm text-muted-foreground">
          {formatNumber(filtered.length)} movimientos registrados.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-55 max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por producto..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          items={Object.fromEntries(TYPE_FILTERS.map((option) => [option.value, option.label]))}
          value={type}
          onValueChange={(value) => setType((value as MovementType | "todos") ?? "todos")}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_FILTERS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {groups.length === 0 ? (
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
                    setType("todos");
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
          {groups.map(([label, movements]) => (
            <div key={label} className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-muted-foreground">{label}</h2>
              <ol className="relative flex flex-col gap-5 border-l border-border pl-6">
                {movements.map((movement) => {
                  const Icon = TYPE_ICON[movement.tipo];
                  const isEntry = movement.tipo === "entrada";
                  const isExit = movement.tipo === "salida";

                  return (
                    <li key={movement.id} className="relative">
                      <span
                        className={cn(
                          "absolute -left-[1.85rem] flex size-8 items-center justify-center rounded-full ring-4 ring-background",
                          isEntry && "bg-success/15 text-success",
                          isExit && "bg-destructive/10 text-destructive",
                          !isEntry && !isExit && "bg-muted text-muted-foreground"
                        )}
                      >
                        <Icon className="size-4" />
                      </span>

                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-card p-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="size-9 shrink-0 rounded-lg"
                            style={{ backgroundColor: movement.productoImagenColor }}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{movement.producto}</span>
                            <span className="text-xs text-muted-foreground">
                              {timeLabel(movement.fecha)} &middot; {movement.usuario}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-muted-foreground">
                            {movement.origen}
                          </Badge>
                          <span
                            className={cn(
                              "text-lg font-semibold tabular-nums",
                              isEntry && "text-success",
                              isExit && "text-destructive"
                            )}
                          >
                            {isExit ? "-" : "+"}
                            {movement.cantidad}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
