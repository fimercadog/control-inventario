"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScrollText, Search, SearchX, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAuditLogs } from "@/store/slices/auditoria-slice";
import { formatNumber } from "@/lib/format";

/**
 * Auditoría (2026-08-02, docs/03_FUNCTIONAL_SPEC/Auditoria.md). Módulo
 * 100% de solo lectura — sin botón "Nuevo", sin acciones de fila: no hay
 * crear/editar/eliminar aquí, AuditLog es inmutable. Columna "Usuario"
 * muestra el email de la cuenta, nunca el nombre real de la persona
 * (regla de privacidad no negociable, confirmada por el propietario del
 * proyecto).
 */
export default function AuditoriaPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items: registros, meta, loading } = useAppSelector((state) => state.auditoria);

  const [search, setSearch] = useState("");
  const [modulo, setModulo] = useState("todos");
  const [accion, setAccion] = useState("todos");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, modulo, accion, desde, hasta]);

  useEffect(() => {
    dispatch(
      fetchAuditLogs({
        busqueda: search || undefined,
        modulo: modulo === "todos" ? undefined : modulo,
        accion: accion === "todos" ? undefined : accion,
        desde: desde || undefined,
        hasta: hasta || undefined,
        page,
      })
    );
  }, [dispatch, search, modulo, accion, desde, hasta, page]);

  const modulosDisponibles = meta?.modulos_disponibles ?? [];
  const accionesDisponibles = meta?.acciones_disponibles ?? [];

  const moduloItems: Record<string, string> = {
    todos: "Todos los módulos",
    ...Object.fromEntries(modulosDisponibles.map((m) => [m, m])),
  };
  const accionItems: Record<string, string> = {
    todos: "Todas las acciones",
    ...Object.fromEntries(accionesDisponibles.map((a) => [a, a])),
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Auditoría</h1>
        <p className="text-sm text-muted-foreground">
          {loading ? "Cargando..." : `${formatNumber(meta?.total ?? registros.length)} eventos registrados.`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-55 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por módulo, acción o resultado..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select items={moduloItems} value={modulo} onValueChange={(value) => setModulo(value ?? "todos")}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Módulo" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(moduloItems).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select items={accionItems} value={accion} onValueChange={(value) => setAccion(value ?? "todos")}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Acción" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(accionItems).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          className="w-40"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
          aria-label="Desde"
        />
        <Input
          type="date"
          className="w-40"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
          aria-label="Hasta"
        />
      </div>

      <Card className="border-border/60 py-0">
        <CardContent className="flex flex-col gap-4 px-0 pb-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Cargando auditoría...
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Resultado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registros.map((registro) => (
                    <TableRow
                      key={registro.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/auditoria/${registro.id}`)}
                    >
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {registro.created_at ? new Date(registro.created_at).toLocaleString("es-CO") : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <ScrollText className="size-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm">{registro.usuario?.email ?? "Sistema"}</span>
                            {registro.usuario && registro.usuario.roles.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {registro.usuario.roles.join(", ")}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{registro.modulo}</TableCell>
                      <TableCell className="font-mono text-xs">{registro.accion}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            registro.resultado === "exitoso"
                              ? "bg-emerald-600 text-white dark:bg-emerald-500"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {registro.resultado ?? "—"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}

                  {registros.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="p-0">
                        <EmptyState
                          icon={SearchX}
                          title="No encontramos eventos"
                          description="Prueba con otros filtros, o un rango de fechas más amplio."
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
