"use client";

import { useEffect, useState } from "react";
import { History, Loader2, ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchHistorialReportes } from "@/store/slices/reportes-slice";
import { formatNumber } from "@/lib/format";

const FORMATO_LABEL: Record<string, string> = {
  pdf: "PDF",
  excel: "Excel",
  csv: "CSV",
  preview: "Vista previa",
};

/**
 * Historial de ejecuciones (ampliación 2026-08-03). `ReporteHistorial`
 * es inmutable — esta pestaña es solo lectura, sin acciones de fila,
 * igual que Auditoría.
 */
export function ReportesHistorialTab() {
  const dispatch = useAppDispatch();
  const { historial, historialLoading } = useAppSelector((state) => state.reportes);
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchHistorialReportes({ page }));
  }, [dispatch, page]);

  const registros = historial?.items ?? [];
  const meta = historial?.meta ?? null;

  return (
    <Card className="border-border/60 py-0">
      <CardContent className="flex flex-col gap-4 px-0 pb-4">
        {historialLoading && registros.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Cargando historial...
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Reporte</TableHead>
                  <TableHead>Formato</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Filas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registros.map((registro) => (
                  <TableRow key={registro.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {registro.created_at ? new Date(registro.created_at).toLocaleString("es-CO") : "—"}
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      <History className="size-4 text-muted-foreground" />
                      {registro.tipo_reporte}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-muted text-muted-foreground">
                        {FORMATO_LABEL[registro.formato] ?? registro.formato}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {registro.usuario?.email ?? "Sistema"}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {registro.total_filas !== null ? formatNumber(registro.total_filas) : "—"}
                    </TableCell>
                  </TableRow>
                ))}

                {registros.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0">
                      <EmptyState
                        icon={SearchX}
                        title="Sin ejecuciones registradas"
                        description="Cuando generes o exportes un reporte, aparecerá aquí."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {meta && meta.last_page > 1 && (
              <div className="flex items-center justify-between border-t border-border/60 px-4 pt-4">
                <span className="text-sm text-muted-foreground">
                  Página {meta.current_page} de {meta.last_page}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={page <= 1 || historialLoading}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="size-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={page >= meta.last_page || historialLoading}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Siguiente
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
