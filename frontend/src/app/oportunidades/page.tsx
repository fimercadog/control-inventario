"use client";

import { CrmListPage } from "@/components/crm/crm-list-page";
export default function OportunidadesPage() { return <CrmListPage title="Oportunidades" description="Gestiona tu embudo comercial y las fechas de cierre. Indica los IDs de cliente y etapa disponibles en tu empresa." endpoint="/oportunidades" fields={[{ name: "nombre", label: "Nombre", required: true }, { name: "cliente_id", label: "ID cliente", type: "number", required: true }, { name: "etapa_oportunidad_id", label: "ID etapa", type: "number", required: true }, { name: "monto", label: "Valor", type: "number" }, { name: "fecha_cierre_estimada", label: "Cierre estimado", type: "date" }]} />; }
