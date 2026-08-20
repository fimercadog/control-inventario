"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { CalendarPlus, CheckCircle2, ClipboardList, CloudOff, PackagePlus, RefreshCw, Trash2, TriangleAlert, Wifi } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { sincronizarActividadContingencia, sincronizarOperacionContingencia } from "@/lib/api/contingencia";
import { actualizarOperacion, agregarActividadContingencia, agregarOperacion, eliminarOperacion, salirContingencia } from "@/lib/contingencia/store";
import { useContingencia } from "@/hooks/use-contingencia";
import type { CreateProductoPayload } from "@/types/producto";

function text(form: FormData, key: string) { return String(form.get(key) ?? "").trim(); }
function numberOrUndefined(value: string) { return value === "" ? undefined : Number(value); }

export default function ContingenciaPage() {
  const { activo, operaciones } = useContingencia();
  const [online, setOnline] = useState(true);
  const [exitOpen, setExitOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [pendingDialogOpen, setPendingDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update(); window.addEventListener("online", update); window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);

  function enqueue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: CreateProductoPayload = {
      nombre: text(form, "nombre"), codigo: text(form, "codigo") || null, codigo_barras: text(form, "codigo_barras") || null,
      presentacion: text(form, "presentacion") || null, descripcion: text(form, "descripcion") || null,
      costo: numberOrUndefined(text(form, "costo")), precio: numberOrUndefined(text(form, "precio")),
      stock_minimo: numberOrUndefined(text(form, "stock_minimo")), stock_maximo: numberOrUndefined(text(form, "stock_maximo")),
    };
    if (!payload.nombre) return;
    agregarOperacion({ tipo: "crear", productoNombre: payload.nombre, payload });
    event.currentTarget.reset();
    setProductDialogOpen(false);
  }

  function enqueueActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const asunto = text(form, "actividad_asunto");
    if (!asunto) return;
    const tipo = text(form, "actividad_tipo") as "llamada" | "correo" | "reunion" | "tarea" | "nota";
    agregarActividadContingencia({ actividadNombre: asunto, payload: { tipo: tipo || "tarea", asunto, descripcion: text(form, "actividad_descripcion") || undefined, programada_para: text(form, "actividad_programada_para") || undefined } });
    event.currentTarget.reset();
    setActivityDialogOpen(false);
  }

  async function sync(id: string) {
    const op = operaciones.find((candidate) => candidate.id === id);
    if (!op) return;
    setSyncing(id);
    try { if (op.modulo === "actividad") await sincronizarActividadContingencia(op); else await sincronizarOperacionContingencia(op); eliminarOperacion(id); }
    catch (error: unknown) {
      const status = (error as { response?: { status?: number; data?: unknown } }).response?.status;
      actualizarOperacion(id, status === 409
        ? { estado: "conflicto", conflicto: (error as { response?: { data?: unknown } }).response?.data, error: "El producto cambió en el servidor." }
        : { estado: "error", error: extractApiErrorMessage(error, "No se pudo sincronizar. Inténtalo manualmente de nuevo.") });
    } finally { setSyncing(null); }
  }

  return <div className="mx-auto flex max-w-4xl flex-col gap-6">
    <div><h1 className="text-2xl font-semibold">Modo Contingencia</h1><p className="text-sm text-muted-foreground">Las operaciones se guardan localmente y solo se envían cuando tú las sincronices.</p></div>
    {!activo ? <Alert><AlertDescription className="flex flex-wrap items-center justify-between gap-3">El Modo Contingencia no está activo.<Button size="sm" nativeButton={false} render={<Link href="/dashboard" />}>Ir al Dashboard</Button></AlertDescription></Alert> : null}
    <div className="flex items-center gap-2 text-sm font-medium">{online ? <Wifi className="size-4 text-success" /> : <CloudOff className="size-4 text-warning" />}{online ? "Conectado" : "Sin conexión"}<span className="font-normal text-muted-foreground">— este indicador no sincroniza automáticamente.</span></div>
    <div className="grid gap-4 md:grid-cols-3">
      <Card><CardHeader><div className="mb-2 grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><PackagePlus className="size-5" /></div><CardTitle>Crear producto offline</CardTitle><CardDescription>Registra un producto local para sincronizarlo después.</CardDescription></CardHeader><CardContent><Button className="w-full" disabled={!activo} onClick={() => setProductDialogOpen(true)}>Crear producto</Button></CardContent></Card>
      <Card><CardHeader><div className="mb-2 grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><CalendarPlus className="size-5" /></div><CardTitle>Registrar actividad CRM offline</CardTitle><CardDescription>Guarda un seguimiento comercial para enviarlo más tarde.</CardDescription></CardHeader><CardContent><Button className="w-full" disabled={!activo} onClick={() => setActivityDialogOpen(true)}>Registrar actividad</Button></CardContent></Card>
      <Card><CardHeader><div className="mb-2 grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><ClipboardList className="size-5" /></div><CardTitle>Operaciones pendientes</CardTitle><CardDescription>{operaciones.length ? `${operaciones.length} operación(es) esperando sincronización.` : "No hay operaciones pendientes."}</CardDescription></CardHeader><CardContent><br /><Button className="w-full" variant="outline" onClick={() => setPendingDialogOpen(true)}>Ver operaciones</Button></CardContent></Card>
    </div>
    <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>Crear producto offline</DialogTitle><DialogDescription>Solo texto. El stock inicial seguirá siendo 0; categorías, marcas y unidades se pueden completar posteriormente.</DialogDescription></DialogHeader><form className="grid gap-4 sm:grid-cols-2" onSubmit={enqueue}>
      <div className="sm:col-span-2"><Label htmlFor="cont-nombre">Nombre</Label><Input id="cont-nombre" name="nombre" required /></div>
      <div><Label htmlFor="cont-codigo">Código</Label><Input id="cont-codigo" name="codigo" /></div><div><Label htmlFor="cont-barras">Código de barras</Label><Input id="cont-barras" name="codigo_barras" /></div>
      <div><Label htmlFor="cont-presentacion">Presentación</Label><Input id="cont-presentacion" name="presentacion" /></div><div><Label htmlFor="cont-costo">Costo</Label><Input id="cont-costo" name="costo" type="number" min="0" step="0.01" /></div>
      <div><Label htmlFor="cont-precio">Precio</Label><Input id="cont-precio" name="precio" type="number" min="0" step="0.01" /></div><div><Label htmlFor="cont-minimo">Stock mínimo</Label><Input id="cont-minimo" name="stock_minimo" type="number" min="0" step="0.01" /></div>
      <div><Label htmlFor="cont-maximo">Stock máximo</Label><Input id="cont-maximo" name="stock_maximo" type="number" min="0" step="0.01" /></div><div className="sm:col-span-2"><Label htmlFor="cont-descripcion">Descripción</Label><Textarea id="cont-descripcion" name="descripcion" /></div>
      <DialogFooter className="sm:col-span-2"><Button type="button" variant="outline" onClick={() => setProductDialogOpen(false)}>Cancelar</Button><Button type="submit">Guardar en operaciones pendientes</Button></DialogFooter>
    </form></DialogContent></Dialog>
    <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>Registrar actividad CRM offline</DialogTitle><DialogDescription>Solo actividades manuales. No modifica oportunidades, etapas, responsables ni automatizaciones.</DialogDescription></DialogHeader><form className="grid gap-4 sm:grid-cols-2" onSubmit={enqueueActivity}>
      <div className="sm:col-span-2"><Label htmlFor="cont-actividad-asunto">Asunto</Label><Input id="cont-actividad-asunto" name="actividad_asunto" required /></div>
      <div><Label htmlFor="cont-actividad-tipo">Tipo</Label><Input id="cont-actividad-tipo" name="actividad_tipo" defaultValue="tarea" placeholder="tarea, llamada, correo, reunión o nota" required /></div>
      <div><Label htmlFor="cont-actividad-fecha">Fecha programada</Label><Input id="cont-actividad-fecha" name="actividad_programada_para" type="datetime-local" /></div>
      <div className="sm:col-span-2"><Label htmlFor="cont-actividad-descripcion">Descripción</Label><Textarea id="cont-actividad-descripcion" name="actividad_descripcion" /></div>
      <DialogFooter className="sm:col-span-2"><Button type="button" variant="outline" onClick={() => setActivityDialogOpen(false)}>Cancelar</Button><Button type="submit">Guardar actividad pendiente</Button></DialogFooter>
    </form></DialogContent></Dialog>
    <Dialog open={pendingDialogOpen} onOpenChange={setPendingDialogOpen}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>Operaciones pendientes</DialogTitle><DialogDescription>Se procesan individualmente y en el orden en que fueron registradas.</DialogDescription></DialogHeader><div className="flex max-h-[55vh] flex-col gap-3 overflow-y-auto">
      {operaciones.length === 0 ? <p className="text-sm text-muted-foreground">No hay operaciones pendientes.</p> : operaciones.map((op) => <div key={op.id} className="rounded-lg border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">{op.modulo === "actividad" ? `Actividad: ${op.actividadNombre}` : `${op.tipo === "crear" ? "Crear" : "Actualizar"}: ${op.productoNombre}`}</p><p className="text-xs text-muted-foreground">{new Date(op.creadaEn).toLocaleString("es-CO")} · {op.estado}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" disabled={!activo || syncing !== null} onClick={() => sync(op.id)}><RefreshCw className="size-4" />Sincronizar ahora</Button><Button size="sm" variant="ghost" aria-label="Descartar operación" onClick={() => eliminarOperacion(op.id)}><Trash2 className="size-4" /></Button></div></div>
        {op.error ? <Alert variant="destructive" className="mt-3"><TriangleAlert className="size-4" /><AlertDescription>{op.error}{"conflicto" in op && op.conflicto ? " Conserva la versión local; revisa la versión del servidor antes de decidir." : ""}</AlertDescription></Alert> : null}
      </div>)}
    </div></DialogContent></Dialog>
    {activo ? <Button variant="outline" className="self-start" onClick={() => setExitOpen(true)}><CheckCircle2 />Salir de Contingencia</Button> : null}
    <Dialog open={exitOpen} onOpenChange={setExitOpen}><DialogContent><DialogHeader><DialogTitle>{operaciones.length ? "Hay operaciones pendientes" : "Salir de Contingencia"}</DialogTitle><DialogDescription>{operaciones.length ? "Los cambios locales no se eliminarán y podrás sincronizarlos cuando vuelvas a activar el modo." : "No hay operaciones pendientes por sincronizar."}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setExitOpen(false)}>Cancelar</Button><Button onClick={() => { salirContingencia(); setExitOpen(false); }}>Salir conservando operaciones</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
