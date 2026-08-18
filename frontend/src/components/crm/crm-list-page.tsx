"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, Plus, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api/client";

type RecordItem = Record<string, unknown>;
export type CrmField = { name: string; label: string; type?: "text" | "email" | "number" | "date"; required?: boolean; defaultValue?: string };
export type CrmAction = { label: string; endpoint: (item: RecordItem) => string; method?: "post" | "patch" };

function titleOf(item: RecordItem): string { return String(item.nombre ?? item.asunto ?? item.titulo ?? "Sin título"); }

export function CrmListPage({ title, description, endpoint, fields = [], actions = [] }: { title: string; description: string; endpoint: string; fields?: CrmField[]; actions?: CrmAction[] }) {
  const [items, setItems] = useState<RecordItem[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false); const [saving, setSaving] = useState(false); const [formError, setFormError] = useState<string | null>(null);
  const load = () => { setLoading(true); setError(null); apiClient.get(endpoint).then(({ data }) => { const payload = data.data; setItems(Array.isArray(payload) ? payload : payload.data ?? []); }).catch(() => setError("No se pudieron cargar los datos. Intenta de nuevo.")).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, [endpoint]);
  async function create(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setFormError(null); const raw = new FormData(event.currentTarget); const payload: Record<string, unknown> = {}; for (const field of fields) { const value = String(raw.get(field.name) ?? "").trim(); if (!value) continue; payload[field.name] = field.type === "number" ? Number(value) : value; } try { await apiClient.post(endpoint, payload); setShowForm(false); event.currentTarget.reset(); load(); } catch { setFormError("No se pudo guardar. Revisa los datos y tus permisos."); } finally { setSaving(false); } }
  async function runAction(action: CrmAction, item: RecordItem) { setError(null); try { await apiClient.request({ method: action.method ?? "post", url: action.endpoint(item) }); load(); } catch { setError("No se pudo completar la acción. Verifica tus permisos."); } }
  return <div className="mx-auto flex w-full max-w-[1160px] flex-col gap-6 pb-4">
    <header className="flex items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold tracking-tight">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{description}</p></div><div className="flex gap-2">{fields.length > 0 ? <Button onClick={() => setShowForm((open) => !open)}>{showForm ? <X className="size-4" /> : <Plus className="size-4" />}{showForm ? "Cerrar" : "Nuevo"}</Button> : null}<Button variant="outline" onClick={load}><RefreshCw className="size-4" />Actualizar</Button></div></header>
    {showForm ? <form onSubmit={create} className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2"><p className="sm:col-span-2 text-sm font-medium">Crear {title.slice(0, -1)}</p>{fields.map((field) => <label key={field.name} className="grid gap-1.5 text-sm font-medium">{field.label}<Input name={field.name} type={field.type ?? "text"} required={field.required} defaultValue={field.defaultValue} /></label>)}{formError ? <p className="sm:col-span-2 text-sm text-destructive">{formError}</p> : null}<div className="sm:col-span-2"><Button type="submit" disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}Guardar</Button></div></form> : null}
    <section className="overflow-hidden rounded-2xl border border-border bg-card">{loading ? <div className="flex min-h-52 items-center justify-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div> : error ? <p className="p-6 text-sm text-destructive">{error}</p> : items.length === 0 ? <p className="p-10 text-center text-sm text-muted-foreground">Aún no hay registros.</p> : <ul className="divide-y divide-border">{items.map((item, index) => { const etapa = item.etapa as RecordItem | undefined; return <li key={String(item.id ?? index)} className="flex items-center justify-between gap-4 p-4"><div><p className="font-medium">{titleOf(item)}</p><p className="mt-1 text-sm text-muted-foreground">{String(item.estado ?? etapa?.nombre ?? item.evento ?? item.tipo ?? "Activo")}</p></div><div className="flex items-center gap-2">{item.monto ? <span className="text-sm font-medium">${Number(item.monto).toLocaleString("es-CO")}</span> : null}{actions.map((action) => <Button key={action.label} size="sm" variant="outline" onClick={() => runAction(action, item)}>{action.label}</Button>)}</div></li>; })}</ul>}</section>
  </div>;
}
