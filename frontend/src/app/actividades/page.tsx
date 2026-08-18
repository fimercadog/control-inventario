"use client";

import { CrmListPage } from "@/components/crm/crm-list-page";
export default function ActividadesPage() { return <CrmListPage title="Actividades" description="Seguimientos, llamadas, reuniones y tareas de tu equipo." endpoint="/actividades" fields={[{ name: "asunto", label: "Asunto", required: true }, { name: "tipo", label: "Tipo", required: true, defaultValue: "tarea" }, { name: "oportunidad_id", label: "ID oportunidad", type: "number" }, { name: "programada_para", label: "Fecha y hora", type: "date" }]} actions={[{ label: "Completar", endpoint: (item) => `/actividades/${item.id}/completar` }]} />; }
