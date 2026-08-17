"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileSpreadsheet, FileText, Loader2, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReporteFiltrosForm } from "@/app/reportes/reporte-filtros-form";
import { usePermission } from "@/hooks/use-permission";
import {
  fetchCatalogoReportes,
  fetchPreviewReporte,
  exportarReportePdf,
  exportarReporteExcel,
  exportarReporteCsv,
} from "@/lib/api/reportes";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { ReporteCatalogoItem, ReporteResultado } from "@/types/reporte";
import type { PaginationMeta } from "@/types/api";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ReportePreviewPage({ params }: { params: Promise<{ clave: string }> }) {
  const { clave } = use(params);
  const canView = usePermission("reportes.ver");

  const [catalogo, setCatalogo] = useState<ReporteCatalogoItem[] | null>(null);
  const [item, setItem] = useState<ReporteCatalogoItem | null>(null);
  const [filtroValues, setFiltroValues] = useState<Record<string, string>>({});
  const [appliedFiltros, setAppliedFiltros] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [resultado, setResultado] = useState<ReporteResultado | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportingFormat, setExportingFormat] = useState<"pdf" | "excel" | "csv" | null>(null);

  useEffect(() => {
    fetchCatalogoReportes()
      .then((items) => {
        setCatalogo(items);
        const found = items.find((r) => r.clave === clave) ?? null;
        setItem(found);
      })
      .catch(() => setCatalogo([]));
  }, [clave]);

  // Requires at least the required filters to be filled before requesting a preview
  // (mirrors the backend: KardexProducto's producto_id is `requerido: true` and the backend
  // rejects an empty one with a 422 — no point firing that request from an empty form).
  const requiredFilters = item?.filtros_disponibles.filter((f) => f.requerido) ?? [];
  const missingRequired = requiredFilters.some((f) => !appliedFiltros[f.clave]);

  useEffect(() => {
    // No setResultado(null) here: the JSX below already checks `missingRequired` before
    // `resultado === null`, so a stale result from a previous fetch never renders while
    // required filters are incomplete — no need to clear it imperatively.
    if (!canView || !item || missingRequired) {
      return;
    }
    let ignore = false;
    fetchPreviewReporte(clave, appliedFiltros, page)
      .then((data) => {
        if (ignore) return;
        setResultado(data);
        setMeta(data.meta);
        setError(null);
      })
      .catch((err) => {
        if (ignore) return;
        setError(extractApiErrorMessage(err, "No se pudo generar la vista previa."));
      });
    return () => {
      ignore = true;
    };
  }, [canView, clave, item, appliedFiltros, page, missingRequired]);

  async function handleExport(formato: "pdf" | "excel" | "csv") {
    setExportingFormat(formato);
    setError(null);
    try {
      const exportFn = formato === "pdf" ? exportarReportePdf : formato === "excel" ? exportarReporteExcel : exportarReporteCsv;
      const { blob, filename } = await exportFn(clave, appliedFiltros);
      downloadBlob(blob, filename);
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo exportar el reporte."));
    } finally {
      setExportingFormat(null);
    }
  }

  if (!canView) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>No tienes permiso para ver este módulo.</AlertDescription>
      </Alert>
    );
  }

  if (catalogo !== null && item === null) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>El reporte &quot;{clave}&quot; no existe en el catálogo.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/reportes" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Volver a Reportes
      </Link>

      {item ? (
        <>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{item.nombre}</h1>
            <p className="text-sm text-muted-foreground">{item.descripcion}</p>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <ReporteFiltrosForm filtros={item.filtros_disponibles} values={filtroValues} onChange={(k, v) => setFiltroValues((prev) => ({ ...prev, [k]: v }))} />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setAppliedFiltros(filtroValues);
                  setPage(1);
                }}
              >
                <Table2 className="size-4" />
                Ver vista previa
              </Button>
            </div>
          </div>

          {error ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : missingRequired ? (
            <p className="text-sm text-muted-foreground">
              Completa los filtros obligatorios (*) y pulsa &quot;Ver vista previa&quot;.
            </p>
          ) : resultado === null ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Cargando" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">{resultado.total} resultado(s)</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={exportingFormat !== null} onClick={() => handleExport("csv")}>
                    {exportingFormat === "csv" ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}
                    CSV
                  </Button>
                  <Button variant="outline" size="sm" disabled={exportingFormat !== null} onClick={() => handleExport("excel")}>
                    {exportingFormat === "excel" ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}
                    Excel
                  </Button>
                  <Button variant="outline" size="sm" disabled={exportingFormat !== null} onClick={() => handleExport("pdf")}>
                    {exportingFormat === "pdf" ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
                    PDF
                  </Button>
                </div>
              </div>

              {Object.keys(resultado.resumen).length > 0 ? (
                <div className="flex flex-wrap gap-4 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                  {Object.entries(resultado.resumen).map(([k, v]) => (
                    <span key={k}>
                      <span className="text-muted-foreground">{k}: </span>
                      <span className="font-medium text-foreground">{String(v)}</span>
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {resultado.columnas.map((col) => (
                        <TableHead key={col.clave}>{col.etiqueta}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultado.filas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={resultado.columnas.length} className="h-24 text-center text-muted-foreground">
                          Sin resultados para estos filtros.
                        </TableCell>
                      </TableRow>
                    ) : (
                      resultado.filas.map((fila, index) => (
                        <TableRow key={index}>
                          {resultado.columnas.map((col) => (
                            <TableCell key={col.clave}>{fila[col.clave] != null ? String(fila[col.clave]) : "—"}</TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {meta && meta.last_page > 1 ? (
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Anterior
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Página {meta.current_page} de {meta.last_page}
                  </span>
                  <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>
                    Siguiente
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
