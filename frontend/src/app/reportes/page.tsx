"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProgramadosTab } from "@/app/reportes/programados-tab";
import { usePermission } from "@/hooks/use-permission";
import { fetchResumenReportes, fetchCatalogoReportes, fetchHistorialReportes } from "@/lib/api/reportes";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/utils/format";
import type { ReporteCatalogoItem, ReporteHistorialEntry, ReporteResumen } from "@/types/reporte";

export default function ReportesPage() {
  const canView = usePermission("reportes.ver");
  const canManage = usePermission("reportes.gestionar");

  const [resumen, setResumen] = useState<ReporteResumen | null>(null);
  const [catalogo, setCatalogo] = useState<ReporteCatalogoItem[] | null>(null);
  const [historial, setHistorial] = useState<ReporteHistorialEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canView) return;
    fetchResumenReportes().catch((err) => setError(extractApiErrorMessage(err, "No se pudo cargar el resumen."))).then((data) => {
      if (data) setResumen(data);
    });
    fetchCatalogoReportes().then(setCatalogo).catch(() => setCatalogo([]));
    fetchHistorialReportes({}).then((data) => setHistorial(data.items)).catch(() => setHistorial([]));
  }, [canView]);

  if (!canView) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>No tienes permiso para ver este módulo.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reportes</h1>
        <p className="text-sm text-muted-foreground">Catálogo de reportes reales sobre tu inventario, movimientos y terceros.</p>
      </div>

      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="catalogo">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="programados">Programados</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="pt-4">
          {resumen === null ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Cargando" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ResumenCard title="Inventario" data={resumen.inventario} />
              <ResumenCard title={`Movimientos (${resumen.rango.desde} — ${resumen.rango.hasta})`} data={resumen.movimientos} />
              <ResumenCard title="Clientes" data={resumen.clientes} />
              <ResumenCard title="Proveedores" data={resumen.proveedores} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="catalogo" className="pt-4">
          {catalogo === null ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Cargando" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {catalogo.map((reporte) => (
                <Card key={reporte.clave}>
                  <CardHeader>
                    <CardTitle className="text-base">{reporte.nombre}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">{reporte.descripcion}</p>
                    <Button variant="outline" size="sm" className="w-fit" render={<Link href={`/reportes/${reporte.clave}`} />}>
                      Ver reporte
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="historial" className="pt-4">
          {historial === null ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Cargando" />
            </div>
          ) : historial.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no se ha generado ningún reporte.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {historial.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {catalogo?.find((c) => c.clave === entry.tipo_reporte)?.nombre ?? entry.tipo_reporte}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(entry.created_at)}
                      {entry.usuario ? ` · ${entry.usuario.email}` : ""} · {entry.formato.toUpperCase()} ·{" "}
                      {entry.total_filas} filas
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="programados" className="pt-4">
          {catalogo === null ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Cargando" />
            </div>
          ) : (
            <ProgramadosTab catalogo={catalogo} canManage={canManage} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ResumenCard({ title, data }: { title: string; data: Record<string, unknown> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {Object.entries(data).map(([k, v]) => (
          <div key={k} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{k.replace(/_/g, " ")}</span>
            <span className="font-medium text-foreground">
              {typeof v === "object" && v !== null ? JSON.stringify(v) : String(v)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
