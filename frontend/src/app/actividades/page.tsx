"use client";

import { Badge } from "@/components/ui/badge";
import { CrmModulePage } from "@/components/crm/crm-module-page";

const ACTIVITY_STATUS = {
  pendiente: { label: "Pendiente", variant: "warning" },
  completada: { label: "Completada", variant: "success" },
} as const;

export default function ActividadesPage() {
  return <CrmModulePage title="Actividades" singularTitle="Actividad" createLabel="Nueva Actividad" description="Seguimientos, llamadas, reuniones y tareas de tu equipo." endpoint="/actividades" searchPlaceholder="Buscar por asunto…" emptyMessage="No se encontraron actividades." stateOptions={[{ value: "todos", label: "Todos los estados" }, { value: "pendiente", label: "Pendientes" }, { value: "completada", label: "Completadas" }]} matchesSearch={(item, term) => `${item.asunto ?? ""} ${(item.oportunidad as { nombre?: string } | null)?.nombre ?? ""}`.toLowerCase().includes(term.toLowerCase())} fields={[{ name: "asunto", label: "Asunto", required: true }, { name: "tipo", label: "Tipo", required: true, defaultValue: "tarea" }, { name: "oportunidad_id", label: "ID oportunidad", type: "number" }, { name: "programada_para", label: "Fecha y hora", type: "date" }]} columns={[{ header: "Actividad", value: (item) => <span className="font-medium">{String(item.asunto)}</span> }, { header: "Tipo", value: (item) => String(item.tipo ?? "—") }, { header: "Oportunidad", value: (item) => String((item.oportunidad as { nombre?: string } | null)?.nombre ?? "—") }, { header: "Programada", value: (item) => item.programada_para ? new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(new Date(String(item.programada_para))) : "—" }, { header: "Estado", value: (item) => { const status = ACTIVITY_STATUS[String(item.estado ?? "pendiente") as keyof typeof ACTIVITY_STATUS] ?? ACTIVITY_STATUS.pendiente; return <Badge variant={status.variant}>{status.label}</Badge>; } }]} actions={[{ label: "Completar", endpoint: (item) => `/actividades/${item.id}/completar` }]} />;
}
