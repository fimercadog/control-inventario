"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Box, Camera, Loader2, Mic, Package, Sparkles, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePermission, useSessionUser } from "@/hooks/use-permission";
import { fetchMovimientos } from "@/lib/api/movimientos";
import { fetchStock } from "@/lib/api/stock";
import { formatDateTime } from "@/lib/utils/format";
import type { Movimiento } from "@/types/movimiento";
import type { StockItem } from "@/types/stock";

const numberFormat = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });

function MetricCard({ icon: Icon, title, value, tone }: { icon: typeof Package; title: string; value: string; tone: string }) {
  return <Card className="border border-border/80 py-0 shadow-none"><CardContent className="flex items-center gap-3 px-4 py-4"><div className={`grid size-11 place-items-center rounded-2xl ${tone}`}><Icon className="size-5" /></div><div className="min-w-0"><p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p><p className="text-xs text-muted-foreground">{title}</p></div></CardContent></Card>;
}

export default function DashboardPage() {
  const user = useSessionUser();
  const canViewStock = usePermission("stock.ver");
  const canViewMovimientos = usePermission("movimientos.ver");
  const canUseCapture = usePermission("captura-ia.usar");
  const [stock, setStock] = useState<{ items: StockItem[]; total: number } | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (canViewStock) fetchStock({ estado: "activo", per_page: 100, page: 1 }).then((result) => !cancelled && setStock({ items: result.items, total: result.meta.total })).catch(() => !cancelled && setStock({ items: [], total: 0 }));
    if (canViewMovimientos) fetchMovimientos({ per_page: 10, page: 1 }).then((result) => !cancelled && setMovimientos(result.items)).catch(() => !cancelled && setMovimientos([]));
    return () => { cancelled = true; };
  }, [canViewMovimientos, canViewStock]);

  const summary = useMemo(() => {
    const items = stock?.items ?? [];
    const today = new Date().toDateString();
    const todayMovements = (movimientos ?? []).filter((item) => new Date(item.created_at).toDateString() === today);
    return {
      products: stock === null ? "—" : numberFormat.format(stock.total), stock: stock === null || stock.total > items.length ? "—" : numberFormat.format(items.reduce((total, item) => total + item.stock_actual, 0)), low: stock === null ? "—" : numberFormat.format(items.filter((item) => item.bajo_minimo).length), entries: movimientos === null ? "—" : numberFormat.format(todayMovements.filter((item) => item.delta > 0).length), exits: movimientos === null ? "—" : numberFormat.format(todayMovements.filter((item) => item.delta < 0).length),
    };
  }, [movimientos, stock]);

  return <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
    <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-2xl font-semibold tracking-tight text-foreground">Hola, {user?.name?.split(" ")[0] ?? ""} <span aria-hidden="true">👋</span></h1><p className="mt-1 text-sm text-muted-foreground">Este es el estado de tu inventario hoy.</p></div>{canUseCapture ? <Button className="h-10 bg-indigo-600 px-4 text-white shadow-sm hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400" nativeButton={false} render={<Link href="/captura-ia" />}><Sparkles className="size-4" /> Nueva captura</Button> : null}</section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><MetricCard icon={Package} title="Productos totales" value={summary.products} tone="bg-indigo-100 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-300" /><MetricCard icon={Box} title="Stock total" value={summary.stock} tone="bg-violet-100 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300" /><MetricCard icon={TriangleAlert} title="Stock bajo" value={summary.low} tone="bg-amber-100 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300" /><MetricCard icon={ArrowDownRight} title="Entradas hoy" value={summary.entries} tone="bg-emerald-100 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300" /><MetricCard icon={ArrowUpRight} title="Salidas hoy" value={summary.exits} tone="bg-rose-100 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300" /></section>

    <section className="grid gap-5 lg:grid-cols-[minmax(0,1.8fr)_minmax(18rem,0.9fr)]"><Card className="border border-border/80 py-0 shadow-none"><CardContent className="p-4 sm:p-5"><div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="font-semibold text-foreground">Movimientos recientes</h2><p className="text-sm text-muted-foreground">Últimas entradas y salidas registradas.</p></div>{canViewMovimientos ? <Link href="/movimientos" className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline">Ver todos <ArrowRight className="size-4" /></Link> : null}</div>{movimientos === null ? <div className="flex h-60 items-center justify-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div> : movimientos.length === 0 ? <p className="py-14 text-center text-sm text-muted-foreground">No hay movimientos recientes.</p> : <ul className="divide-y divide-border/80">{movimientos.slice(0, 5).map((movimiento) => { const entry = movimiento.delta >= 0; return <li key={movimiento.id} className="flex items-center gap-3 py-3"><div className="grid size-9 place-items-center rounded-xl bg-muted text-muted-foreground"><Package className="size-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-foreground">{movimiento.producto ?? "Producto sin nombre"}</p><p className="truncate text-xs text-muted-foreground">{formatDateTime(movimiento.created_at)}{movimiento.usuario ? ` · ${movimiento.usuario}` : ""}</p></div><div className="text-right"><span className={`rounded-full px-2 py-1 text-xs font-medium ${entry ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{entry ? "↙ Entrada" : "↗ Salida"}</span><p className="mt-1 text-xs font-medium text-muted-foreground">{movimiento.delta > 0 ? "+" : ""}{movimiento.delta}</p></div></li>; })}</ul>}</CardContent></Card>
      <div className="flex flex-col gap-4">{canUseCapture ? <Card className="border-0 bg-indigo-600 py-0 text-white shadow-sm dark:bg-indigo-500"><CardContent className="p-5"><div className="mb-5 grid size-10 place-items-center rounded-xl bg-white/15"><Sparkles className="size-5" /></div><h2 className="font-semibold">Registra inventario en segundos</h2><p className="mt-1 text-sm text-indigo-100">Toma una foto, habla o ambos — nosotros actualizamos el stock.</p><Button className="mt-5 w-full justify-between bg-white text-indigo-700 hover:bg-indigo-50" nativeButton={false} render={<Link href="/captura-ia" />}>Ir a Captura IA <ArrowRight className="size-4" /></Button></CardContent></Card> : null}<Card className="border border-border/80 py-0 shadow-none"><CardContent className="p-4"><h2 className="mb-4 font-semibold text-foreground">Acciones rápidas</h2><div className="flex flex-col gap-2"><Button variant="outline" className="h-11 justify-start" nativeButton={false} render={<Link href="/captura-ia" />}><Camera className="size-4" /> Capturar por foto</Button><Button variant="outline" className="h-11 justify-start" nativeButton={false} render={<Link href="/captura-ia" />}><Mic className="size-4" /> Capturar por voz</Button></div></CardContent></Card></div>
    </section>
  </div>;
}
