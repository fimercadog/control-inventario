"use client";

import { CrmListPage } from "@/components/crm/crm-list-page";
export default function AutomatizacionesPage() { return <CrmListPage title="Automatizaciones" description="Reglas que crean seguimientos y avisan al equipo automáticamente." endpoint="/automatizaciones" fields={[{ name: "nombre", label: "Nombre", required: true }, { name: "evento", label: "Evento", required: true, defaultValue: "oportunidad.creada" }, { name: "acciones", label: "Acciones JSON", required: true, defaultValue: '[{"tipo":"crear_actividad","asunto":"Seguimiento","dias":1}]' }]} />; }
