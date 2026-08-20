"use client";

import { Badge } from "@/components/ui/badge";
import { CrmModulePage } from "@/components/crm/crm-module-page";

const CONTACT_STATUS = {
  prospecto: { label: "Prospecto", variant: "secondary" },
  cliente: { label: "Cliente", variant: "success" },
  inactivo: { label: "Inactivo", variant: "destructive" },
} as const;

export default function ContactosPage() {
  return <CrmModulePage title="Contactos" singularTitle="Contacto" description="Prospectos y contactos vinculados a tus clientes." endpoint="/contactos" quickLink={{ href: "/clientes", label: "Ver clientes" }} searchPlaceholder="Buscar por nombre o correo…" stateOptions={[{ value: "todos", label: "Todos los estados" }, { value: "prospecto", label: "Prospectos" }, { value: "cliente", label: "Clientes" }, { value: "inactivo", label: "Inactivos" }]} emptyMessage="No se encontraron contactos." canEdit editEndpoint={(item) => `/contactos/${item.id}`} fields={[{ name: "nombre", label: "Nombre", required: true }, { name: "apellido", label: "Apellido" }, { name: "email", label: "Correo", type: "email" }, { name: "telefono", label: "Teléfono" }, { name: "cargo", label: "Cargo" }, { name: "origen", label: "Origen" }]} columns={[{ header: "Nombre", value: (item) => <span className="font-medium">{[item.nombre, item.apellido].filter(Boolean).join(" ")}</span> }, { header: "Cliente", value: (item) => String((item.cliente as { nombre?: string } | null)?.nombre ?? "—") }, { header: "Correo", value: (item) => String(item.email ?? "—") }, { header: "Cargo", value: (item) => String(item.cargo ?? "—") }, { header: "Estado", value: (item) => { const status = CONTACT_STATUS[String(item.estado ?? "prospecto") as keyof typeof CONTACT_STATUS] ?? CONTACT_STATUS.prospecto; return <Badge variant={status.variant}>{status.label}</Badge>; } }]} actions={[{ label: "Convertir en cliente", endpoint: (item) => `/contactos/${item.id}/convertir` }]} />;
}
