"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  fetchReportesProgramados,
  crearReporteProgramado,
  eliminarReporteProgramado,
} from "@/lib/api/reportes";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { findLabel } from "@/lib/utils/select-label";
import type { ReporteCatalogoItem, ReporteProgramadoEntry } from "@/types/reporte";

const schema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio."),
  tipo_reporte: z.string().min(1, "Selecciona un reporte."),
  formato: z.enum(["pdf", "excel", "csv"]),
  frecuencia: z.enum(["diaria", "semanal", "mensual"]),
  destinatarios: z.string(),
});

type FormValues = z.infer<typeof schema>;

const FRECUENCIA_LABEL: Record<string, string> = { diaria: "Diaria", semanal: "Semanal", mensual: "Mensual" };

/**
 * ReporteProgramado::class docblock (backend, textual): "infraestructura future-ready a
 * propósito: define QUÉ se programaría, sin que exista todavía un motor que lo ejecute."
 * Esta pantalla permite crear/listar/eliminar programaciones reales (la API sí las guarda),
 * pero nunca debe insinuar que se envían o ejecutan automáticamente — eso no existe todavía.
 */
export function ProgramadosTab({ catalogo, canManage }: { catalogo: ReporteCatalogoItem[]; canManage: boolean }) {
  const [items, setItems] = useState<ReporteProgramadoEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  function reload() {
    fetchReportesProgramados()
      .then((data) => {
        setItems(data);
        setError(null);
      })
      .catch((err) => setError(extractApiErrorMessage(err, "No se pudieron cargar los reportes programados.")));
  }

  useEffect(reload, []);

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      await eliminarReporteProgramado(id);
      reload();
    } catch (err) {
      setError(extractApiErrorMessage(err, "No se pudo eliminar la programación."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertDescription>
          Las programaciones se guardan, pero el sistema todavía no cuenta con un motor que las
          ejecute automáticamente — es infraestructura preparada para esa capacidad futura, no
          un envío automático real hoy.
        </AlertDescription>
      </Alert>

      {canManage ? (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button size="sm" className="w-fit" />}>
            <Plus className="size-4" />
            Nueva programación
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva programación</DialogTitle>
              <DialogDescription>Define qué reporte, con qué frecuencia y en qué formato.</DialogDescription>
            </DialogHeader>
            <ProgramadoForm
              catalogo={catalogo}
              onSuccess={() => {
                setCreateOpen(false);
                reload();
              }}
            />
          </DialogContent>
        </Dialog>
      ) : null}

      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {items === null ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Cargando" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay reportes programados.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((programado) => (
            <li key={programado.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div>
                <p className="text-sm font-medium text-foreground">{programado.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {catalogo.find((c) => c.clave === programado.tipo_reporte)?.nombre ?? programado.tipo_reporte} ·{" "}
                  {FRECUENCIA_LABEL[programado.frecuencia]} · {programado.formato.toUpperCase()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="border-slate-400/40 bg-slate-400/15 text-slate-300">
                  Sin ejecuciones (motor no implementado)
                </Badge>
                {canManage ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deletingId === programado.id}
                    onClick={() => handleDelete(programado.id)}
                  >
                    {deletingId === programado.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProgramadoForm({ catalogo, onSuccess }: { catalogo: ReporteCatalogoItem[]; onSuccess: () => void }) {
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: "", tipo_reporte: "", formato: "pdf", frecuencia: "semanal", destinatarios: "" },
  });

  async function onSubmit(values: FormValues) {
    setStatus("submitting");
    setError(null);
    try {
      await crearReporteProgramado({
        nombre: values.nombre,
        tipo_reporte: values.tipo_reporte,
        formato: values.formato,
        frecuencia: values.frecuencia,
        destinatarios: values.destinatarios
          ? values.destinatarios.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
      });
      onSuccess();
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError, "No se pudo crear la programación."));
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="prog-nombre">Nombre</Label>
        <Input id="prog-nombre" aria-invalid={Boolean(errors.nombre)} {...register("nombre")} />
        {errors.nombre ? <p className="text-sm text-destructive">{errors.nombre.message}</p> : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="prog-reporte">Reporte</Label>
        <Controller
          control={control}
          name="tipo_reporte"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="prog-reporte" aria-invalid={Boolean(errors.tipo_reporte)}>
                <SelectValue placeholder="Selecciona un reporte">
                  {(value: string) => findLabel(value, catalogo, (r) => r.clave, (r) => r.nombre, "Selecciona un reporte")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {catalogo.map((r) => (
                  <SelectItem key={r.clave} value={r.clave}>
                    {r.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.tipo_reporte ? <p className="text-sm text-destructive">{errors.tipo_reporte.message}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="prog-formato">Formato</Label>
          <Controller
            control={control}
            name="formato"
            render={({ field }) => (
              <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "pdf")}>
                <SelectTrigger id="prog-formato">
                  <SelectValue>{(v: string) => v.toUpperCase()}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="prog-frecuencia">Frecuencia</Label>
          <Controller
            control={control}
            name="frecuencia"
            render={({ field }) => (
              <Select value={field.value} onValueChange={(v) => field.onChange(v ?? "semanal")}>
                <SelectTrigger id="prog-frecuencia">
                  <SelectValue>{(v: string) => FRECUENCIA_LABEL[v]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diaria">Diaria</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensual">Mensual</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="prog-destinatarios">Destinatarios (correos separados por coma)</Label>
        <Input id="prog-destinatarios" placeholder="Opcional" {...register("destinatarios")} />
      </div>

      <Button type="submit" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? <Loader2 className="size-4 animate-spin" /> : null}
        Crear programación
      </Button>
    </form>
  );
}
