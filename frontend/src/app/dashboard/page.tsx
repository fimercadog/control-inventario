"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Box, BriefcaseBusiness, Camera, CheckSquare, Loader2, Mic, Package, Sparkles, TriangleAlert, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePermission, useSessionUser } from "@/hooks/use-permission";
import { fetchDashboard } from "@/lib/api/dashboard";
import { formatDateTime } from "@/lib/utils/format";
import type { DashboardSummary } from "@/types/dashboard";

const numberFormat = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });

const EMPTY_DASHBOARD: DashboardSummary = {
  total_productos: 0,
  total_stock: 0,
  productos_stock_bajo: 0,
  entradas_hoy: 0,
  salidas_hoy: 0,
  movimientos_recientes: [],
  productos_con_stock_bajo: [],
  crm: { contactos: 0, oportunidades_abiertas: 0, valor_pipeline: 0, actividades_pendientes: 0, actividades_vencidas: 0 },
};

function MetricCard({ icon: Icon, label, value, tone }: { icon: typeof Package; label: string; value: number; tone: string }) {
  return (
    <Card className="rounded-3xl border-border bg-card py-0">
      <CardContent className="flex items-center gap-4 px-4 py-4">
        <span className={`grid size-11 place-items-center rounded-full ${tone}`}><Icon className="size-5" /></span>
        <div><p className="text-2xl font-semibold leading-none tracking-tight text-foreground">{numberFormat.format(value)}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p></div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const user = useSessionUser();
  const canUseCapture = usePermission("captura-ia.usar");
  const canViewProducts = usePermission("productos.ver");
  const canViewMovements = usePermission("movimientos.ver");
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDashboard().then((data) => !cancelled && setDashboard(data)).catch(() => !cancelled && setDashboard(EMPTY_DASHBOARD));
    return () => { cancelled = true; };
  }, []);

  if (!dashboard) return <div className="flex min-h-80 items-center justify-center"><Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Cargando dashboard" /></div>;

  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-6 pb-4">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div><h1 className="text-2xl font-semibold tracking-tight text-foreground">Hola, {firstName} <span aria-hidden="true">👋</span></h1><p className="mt-1 text-sm text-muted-foreground">Este es el pulso comercial y operativo de hoy.</p></div>
        {canUseCapture ? <Button className="h-10 rounded-xl px-4" nativeButton={false} render={<Link href="/captura-ia" />}><Sparkles className="size-4" />Nueva captura</Button> : null}
      </section>

      <section><div className="mb-3"><h2 className="font-semibold text-foreground">CRM comercial</h2><p className="text-sm text-muted-foreground">Prioriza oportunidades y seguimientos.</p></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard icon={UsersRound} label="Contactos" value={dashboard.crm.contactos} tone="bg-sky-100 text-sky-600" /><MetricCard icon={BriefcaseBusiness} label="Oportunidades abiertas" value={dashboard.crm.oportunidades_abiertas} tone="bg-violet-100 text-violet-600" /><MetricCard icon={CheckSquare} label="Seguimientos pendientes" value={dashboard.crm.actividades_pendientes} tone="bg-amber-100 text-amber-600" /><MetricCard icon={TriangleAlert} label="Seguimientos vencidos" value={dashboard.crm.actividades_vencidas} tone="bg-rose-100 text-rose-600" /></div><p className="mt-3 text-sm text-muted-foreground">Valor actual del embudo: <span className="font-semibold text-foreground">${numberFormat.format(dashboard.crm.valor_pipeline)}</span></p></section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard icon={Package} label="Productos totales" value={dashboard.total_productos} tone="bg-indigo-100 text-indigo-600" />
        <MetricCard icon={Box} label="Stock total" value={dashboard.total_stock} tone="bg-violet-100 text-violet-600" />
        <MetricCard icon={TriangleAlert} label="Stock bajo" value={dashboard.productos_stock_bajo} tone="bg-amber-100 text-amber-600" />
        <MetricCard icon={ArrowDownLeft} label="Entradas hoy" value={dashboard.entradas_hoy} tone="bg-emerald-100 text-emerald-600" />
        <MetricCard icon={ArrowUpRight} label="Salidas hoy" value={dashboard.salidas_hoy} tone="bg-rose-100 text-rose-600" />
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.8fr)_minmax(18rem,0.9fr)]">
        <Card className="min-h-[32rem] rounded-3xl border-border py-0">
          <CardContent className="p-4 sm:p-5">
            <div className="mb-4"><h2 className="font-semibold text-foreground">Movimientos recientes</h2><p className="text-sm text-muted-foreground">Últimas entradas y salidas registradas.</p>{canViewMovements ? <Link href="/movimientos" className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">Ver todos <ArrowRight className="size-4" /></Link> : null}</div>
            {dashboard.movimientos_recientes.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">No hay movimientos recientes.</p> : <ul className="divide-y divide-border">{dashboard.movimientos_recientes.map((movement) => { const isEntry = movement.delta >= 0; return <li key={movement.id} className="flex items-center gap-3 py-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"><Package className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-foreground">{movement.producto ?? "Producto"}</p><p className="truncate text-xs text-muted-foreground">{formatDateTime(movement.created_at)}{movement.usuario ? ` · ${movement.usuario}` : ""}</p></div><div className="text-right"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${isEntry ? "bg-success-container text-success-container-foreground" : "bg-destructive-container text-destructive-container-foreground"}`}>{isEntry ? "↙ Entrada" : "↗ Salida"}</span><p className="mt-1 text-xs text-muted-foreground">{movement.delta > 0 ? "+" : ""}{numberFormat.format(movement.delta)}</p></div></li>; })}</ul>}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          {canUseCapture ? <Card className="rounded-3xl border-0 bg-primary py-0 text-primary-foreground shadow-[0_18px_36px_rgb(79_70_229/0.3)]"><CardContent className="p-5"><span className="mb-5 grid size-10 place-items-center rounded-2xl bg-white/15 shadow-inner"><Sparkles className="size-5" /></span><h2 className="font-semibold">Registra inventario en segundos</h2><p className="mt-1 text-sm text-primary-foreground/80">Toma una foto, habla, o ambos — nosotros actualizamos el stock.</p><Button className="mt-5 w-full justify-between rounded-xl bg-white text-primary shadow-[0_4px_12px_rgb(15_23_42/0.16)] hover:bg-secondary-container" nativeButton={false} render={<Link href="/captura-ia" />}>Ir a Captura IA <ArrowRight className="size-4" /></Button></CardContent></Card> : null}
          <Card className="rounded-3xl border-border py-0"><CardContent className="p-4"><h2 className="mb-4 font-semibold text-foreground">Acciones rápidas</h2><div className="flex flex-col gap-2">{canUseCapture ? <><Button variant="outline" className="h-11 justify-start rounded-xl" nativeButton={false} render={<Link href="/captura-ia" />}><Camera className="size-4" />Capturar por foto</Button><Button variant="outline" className="h-11 justify-start rounded-xl" nativeButton={false} render={<Link href="/captura-ia" />}><Mic className="size-4" />Capturar por voz</Button></> : null}{canViewProducts ? <Button variant="outline" className="h-11 justify-start rounded-xl" nativeButton={false} render={<Link href="/productos" />}><Package className="size-4" />Ver productos</Button> : null}</div></CardContent></Card>
          <Card className="rounded-3xl border-warning/40 bg-warning-container py-0"><CardContent className="p-4"><div className="mb-3 flex items-center gap-2 text-warning-container-foreground"><TriangleAlert className="size-4" /><h2 className="font-semibold">Stock bajo</h2></div>{dashboard.productos_con_stock_bajo.length === 0 ? <p className="text-sm text-warning-container-foreground/70">No hay productos bajo el mínimo.</p> : <ul className="flex flex-col gap-2">{dashboard.productos_con_stock_bajo.slice(0, 4).map((product) => <li key={product.id} className="flex items-center justify-between gap-3 text-sm"><span className="truncate text-foreground">{product.nombre}</span><span className="shrink-0 font-medium text-warning-container-foreground">{numberFormat.format(product.stock_actual)} {product.unidad_medida ?? ""}</span></li>)}</ul>}</CardContent></Card>
        </div>
      </section>
    </div>
  );
}
