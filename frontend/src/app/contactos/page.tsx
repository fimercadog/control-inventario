"use client";

import { CrmListPage } from "@/components/crm/crm-list-page";
export default function ContactosPage() { return <CrmListPage title="Contactos" description="Prospectos y contactos vinculados a tus clientes." endpoint="/contactos" fields={[{ name: "nombre", label: "Nombre", required: true }, { name: "apellido", label: "Apellido" }, { name: "email", label: "Correo", type: "email" }, { name: "telefono", label: "Teléfono" }, { name: "cargo", label: "Cargo" }, { name: "origen", label: "Origen" }]} actions={[{ label: "Convertir", endpoint: (item) => `/contactos/${item.id}/convertir` }]} />; }
