"use client";

import { Badge } from "@/components/ui/badge";
import { CrmModulePage } from "@/components/crm/crm-module-page";

export default function AutomatizacionesPage() {
  return <CrmModulePage title="Automatizaciones" singularTitle="Automatización" description="Reglas que crean seguimientos y avisan al equipo automáticamente." endpoint="/automatizaciones" searchPlaceholder="Buscar automatizaciones…" emptyMessage="No se encontraron automatizaciones." stateOptions={[{ value: "todos", label: "Todos los estados" }, { value: "true", label: "Activas" }, { value: "false", label: "Inactivas" }]} stateValue={(item) => Boolean(item.activa)} matchesSearch={(item, term) => `${item.nombre ?? ""} ${item.evento ?? ""}`.toLowerCase().includes(term.toLowerCase())} fields={[{ name: "nombre", label: "Nombre", required: true }, { name: "evento", label: "Evento", required: true, defaultValue: "oportunidad.creada" }, { name: "acciones", label: "Acciones JSON", required: true, defaultValue: '[{"tipo":"crear_actividad","asunto":"Seguimiento","dias":1}]' }]} columns={[{ header: "Nombre", value: (item) => <span className="font-medium">{String(item.nombre)}</span> }, { header: "Evento", value: (item) => String(item.evento ?? "—") }, { header: "Acciones", value: (item) => Array.isArray(item.acciones) ? `${item.acciones.length} configurada(s)` : "—" }, { header: "Estado", value: (item) => <Badge variant={Boolean(item.activa) ? "success" : "outline"}>{Boolean(item.activa) ? "Activa" : "Inactiva"}</Badge> }]} />;
}
