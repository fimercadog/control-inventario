"use client";

import { useEffect, useState } from "react";
import {
  Package,
  DollarSign,
  AlertTriangle,
  PackageX,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Users,
  UserPlus,
  Truck,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchReporteResumen } from "@/store/slices/reportes-slice";
import { formatCurrency, formatNumber } from "@/lib/format";

/**
 * Reportes (2026-08-02, docs/03_FUNCTIONAL_SPEC/Reports.md). Estadísticas
 * reales calculadas sobre Productos/Inventario/Movimientos/Clientes/
 * Proveedores — sin exportación ni panel de estadísticas históricas
 * (fuera de alcance, ver Future Improvements en el spec). El rango de
 * fechas solo afecta la sección Movimientos: Inventario/Clientes/
 * Proveedores son estado actual, no datos de un período.
 */
export default function ReportesPage() {
  const dispatch = useAppDispatch();
  const { resumen, loading } = useAppSelector((state) => state.reportes);

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  useEffect(() => {
    dispatch(fetchReporteResumen({ desde: desde || undefined, hasta: hasta || undefined }));
  }, [dispatch, desde, hasta]);

  if (loading && !resumen) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando reportes...
      </div>
    );
  }

  if (!resumen) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No pudimos cargar los reportes"
        description="Intenta recargar la página."
      />
    );
  }

  const maxMovimientoDia = Math.max(1, ...resumen.movimientos.por_dia.flatMap((d) => [d.entradas, d.salidas]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reportes</h1>
          <p className="text-sm text-muted-foreground">Estadísticas reales de tu operación.</p>
        </div>
        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Desde</Label>
            <Input type="date" className="w-40" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Hasta</Label>
            <Input type="date" className="w-40" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Inventario (estado actual)</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Productos activos" value={formatNumber(resumen.inventario.total_productos)} icon={Package} accent="primary" />
          <StatCard label="Valor total de inventario" value={formatCurrency(resumen.inventario.valor_total_inventario)} icon={DollarSign} accent="success" />
          <StatCard label="Stock bajo" value={formatNumber(resumen.inventario.productos_stock_bajo)} icon={AlertTriangle} accent="warning" />
          <StatCard label="Sin stock" value={formatNumber(resumen.inventario.productos_sin_stock)} icon={PackageX} accent="destructive" />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          Movimientos ({resumen.rango.desde} a {resumen.rango.hasta})
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Entradas"
            value={formatNumber(resumen.movimientos.entradas.total)}
            hint={`${formatNumber(resumen.movimientos.entradas.cantidad)} unidades`}
            icon={ArrowDownLeft}
            accent="success"
          />
          <StatCard
            label="Salidas"
            value={formatNumber(resumen.movimientos.salidas.total)}
            hint={`${formatNumber(resumen.movimientos.salidas.cantidad)} unidades`}
            icon={ArrowUpRight}
            accent="destructive"
          />
          <StatCard
            label="Ajustes"
            value={formatNumber(resumen.movimientos.ajustes.total)}
            hint={`${formatNumber(resumen.movimientos.ajustes.cantidad)} unidades`}
            icon={ArrowLeftRight}
            accent="warning"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Entradas vs. salidas por día</CardTitle>
            <CardDescription>Dentro del rango seleccionado.</CardDescription>
          </CardHeader>
          <CardContent>
            {resumen.movimientos.por_dia.length === 0 ? (
              <EmptyState icon={ArrowLeftRight} title="Sin movimientos" description="No hubo movimientos en este rango." />
            ) : (
              <div className="flex flex-col gap-2">
                {resumen.movimientos.por_dia.map((dia) => (
                  <div key={dia.fecha} className="flex items-center gap-3 text-xs">
                    <span className="w-20 shrink-0 text-muted-foreground">{dia.fecha}</span>
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="h-2 rounded-full bg-success" style={{ width: `${(dia.entradas / maxMovimientoDia) * 100}%`, minWidth: dia.entradas > 0 ? "4px" : 0 }} />
                        <span className="tabular-nums text-muted-foreground">{dia.entradas}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 rounded-full bg-destructive" style={{ width: `${(dia.salidas / maxMovimientoDia) * 100}%`, minWidth: dia.salidas > 0 ? "4px" : 0 }} />
                        <span className="tabular-nums text-muted-foreground">{dia.salidas}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Productos con más movimiento</CardTitle>
            <CardDescription>Top 10 dentro del rango seleccionado.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {resumen.movimientos.productos_mas_movidos.length === 0 ? (
              <EmptyState icon={Package} title="Sin datos" description="No hubo movimientos en este rango." />
            ) : (
              resumen.movimientos.productos_mas_movidos.map((p) => (
                <div key={p.producto_id} className="flex items-center justify-between border-b border-border/60 py-2 text-sm last:border-0">
                  <span className="truncate">{p.producto}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{formatNumber(p.total_movimientos)} mov.</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Productos por categoría</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {resumen.inventario.productos_por_categoria.length === 0 ? (
              <EmptyState icon={Package} title="Sin categorías" description="Ningún producto tiene categoría asignada." />
            ) : (
              resumen.inventario.productos_por_categoria.map((c) => (
                <div key={c.categoria_id} className="flex items-center justify-between border-b border-border/60 py-2 text-sm last:border-0">
                  <span className="truncate">{c.categoria}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{formatNumber(c.total)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Proveedores principales</CardTitle>
            <CardDescription>Por cantidad de productos asociados.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {resumen.proveedores.top_proveedores.length === 0 ? (
              <EmptyState icon={Truck} title="Sin datos" description="Ningún proveedor tiene productos asociados todavía." />
            ) : (
              resumen.proveedores.top_proveedores.map((p) => (
                <div key={p.proveedor_id} className="flex items-center justify-between border-b border-border/60 py-2 text-sm last:border-0">
                  <span className="truncate">{p.proveedor}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{formatNumber(p.total_productos)} productos</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Clientes activos" value={formatNumber(resumen.clientes.total_activos)} icon={Users} accent="primary" />
        <StatCard label="Clientes inactivos" value={formatNumber(resumen.clientes.total_inactivos)} icon={Users} accent="destructive" />
        <StatCard label="Clientes nuevos (30 días)" value={formatNumber(resumen.clientes.nuevos_ultimos_30_dias)} icon={UserPlus} accent="success" />
        <StatCard label="Proveedores activos" value={formatNumber(resumen.proveedores.total_activos)} icon={Truck} accent="primary" />
      </div>
    </div>
  );
}
