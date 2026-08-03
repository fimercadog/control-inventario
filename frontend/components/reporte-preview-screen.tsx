"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  FileText,
  FileSpreadsheet,
  FileDown,
  Printer,
  Loader2,
  SearchX,
  ChevronLeft,
  ChevronRight,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { ReporteFiltrosForm } from "@/components/reportes/reporte-filtros-form";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCatalogoReportes, fetchPreviewReporte, limpiarResultadoReporte } from "@/store/slices/reportes-slice";
import { exportarReporte, type FormatoExportacion } from "@/lib/api/reportes";
import { descargarBlob } from "@/lib/download";
import { formatNumber } from "@/lib/format";

const POR_PAGINA = 50;

/**
 * Preview de un reporte individual (ampliación 2026-08-03). La `clave`
 * identifica el reporte contra el catálogo — este componente no conoce
 * ninguno de los 13 reportes por nombre, todo (filtros, columnas,
 * título) sale de la respuesta del backend.
 */
export function ReportePreviewScreen({ clave }: { clave: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { catalogo, resultado, resultadoLoading, resultadoError } = useAppSelector((state) => state.reportes);
  const catalogoEntry = useMemo(() => catalogo.find((r) => r.clave === clave), [catalogo, clave]);

  const [filtros, setFiltros] = useState<Record<string, string>>({});
  const [pagina, setPagina] = useState(1);
  const [exportando, setExportando] = useState<FormatoExportacion | null>(null);

  useEffect(() => {
    if (catalogo.length === 0) {
      dispatch(fetchCatalogoReportes());
    }
  }, [dispatch, catalogo.length]);

  useEffect(() => {
    setFiltros({});
    setPagina(1);
    return () => {
      dispatch(limpiarResultadoReporte());
    };
  }, [clave, dispatch]);

  const faltaFiltroRequerido = (catalogoEntry?.filtros_disponibles ?? []).some(
    (f) => f.requerido && !filtros[f.clave]
  );

  useEffect(() => {
    if (!catalogoEntry || faltaFiltroRequerido) {
      return;
    }
    dispatch(
      fetchPreviewReporte({
        clave,
        filtros: { ...filtros, pagina: String(pagina), por_pagina: String(POR_PAGINA) },
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, clave, catalogoEntry, pagina]);

  function generar() {
    setPagina(1);
    dispatch(
      fetchPreviewReporte({
        clave,
        filtros: { ...filtros, pagina: "1", por_pagina: String(POR_PAGINA) },
      })
    );
  }

  async function exportar(formato: FormatoExportacion) {
    setExportando(formato);
    try {
      const { blob, nombreArchivo } = await exportarReporte(clave, formato, filtros);
      descargarBlob(blob, nombreArchivo);
      toast.success("Exportación descargada correctamente");
    } catch {
      toast.error("No pudimos generar la exportación. Intenta de nuevo.");
    } finally {
      setExportando(null);
    }
  }

  const totalPaginas = resultado ? Math.max(1, Math.ceil(resultado.total / POR_PAGINA)) : 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => router.push("/reportes")}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{catalogoEntry?.nombre ?? resultado?.titulo ?? "Reporte"}</h1>
          {catalogoEntry?.descripcion && (
            <p className="text-sm text-muted-foreground">{catalogoEntry.descripcion}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-end gap-3">
          {catalogoEntry && (
            <ReporteFiltrosForm
              filtros={catalogoEntry.filtros_disponibles}
              valores={filtros}
              onChange={(clave, valor) => setFiltros((prev) => ({ ...prev, [clave]: valor }))}
            />
          )}
          <Button size="sm" className="gap-1.5" onClick={generar} disabled={faltaFiltroRequerido || resultadoLoading}>
            <Play className="size-4" />
            Generar
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={!resultado || exportando !== null}
            onClick={() => exportar("pdf")}
          >
            {exportando === "pdf" ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={!resultado || exportando !== null}
            onClick={() => exportar("excel")}
          >
            {exportando === "excel" ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={!resultado || exportando !== null}
            onClick={() => exportar("csv")}
          >
            {exportando === "csv" ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
            CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" disabled={!resultado} onClick={() => window.print()}>
            <Printer className="size-4" />
            Imprimir
          </Button>
        </div>
      </div>

      <Card className="border-border/60 py-0">
        <CardContent className="flex flex-col gap-4 px-0 pb-4">
          {faltaFiltroRequerido ? (
            <EmptyState
              icon={SearchX}
              title="Selecciona los filtros requeridos"
              description="Este reporte necesita que completes los filtros marcados con * antes de generarlo."
            />
          ) : resultadoLoading && !resultado ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Generando reporte...
            </div>
          ) : resultadoError ? (
            <EmptyState icon={SearchX} title="No pudimos generar el reporte" description={resultadoError} />
          ) : resultado ? (
            <>
              <div className="flex items-center justify-between px-4 pt-2 text-sm text-muted-foreground print:hidden">
                <span>{formatNumber(resultado.total)} registro(s)</span>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    {resultado.columnas.map((columna) => (
                      <TableHead key={columna.clave}>{columna.etiqueta}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultado.filas.map((fila, index) => (
                    <TableRow key={index}>
                      {resultado.columnas.map((columna) => (
                        <TableCell key={columna.clave}>{fila[columna.clave] ?? "—"}</TableCell>
                      ))}
                    </TableRow>
                  ))}

                  {resultado.filas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={resultado.columnas.length} className="p-0">
                        <EmptyState
                          icon={SearchX}
                          title="Sin datos"
                          description="No hay resultados para los filtros seleccionados."
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {totalPaginas > 1 && (
                <div className="flex items-center justify-between border-t border-border/60 px-4 pt-4 print:hidden">
                  <span className="text-sm text-muted-foreground">
                    Página {pagina} de {totalPaginas}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      disabled={pagina <= 1 || resultadoLoading}
                      onClick={() => setPagina((p) => p - 1)}
                    >
                      <ChevronLeft className="size-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      disabled={pagina >= totalPaginas || resultadoLoading}
                      onClick={() => setPagina((p) => p + 1)}
                    >
                      Siguiente
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
