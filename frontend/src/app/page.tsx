import type { Metadata } from "next";
import { MarketingLanding } from "@/components/marketing/marketing-landing";

export const metadata: Metadata = {
  title: "FidelOS | Control de inventario y CRM",
  description: "Centraliza inventario, clientes, oportunidades, actividades, automatizaciones y reportes con FidelOS.",
  keywords: ["CRM", "control de inventario", "software de inventario", "gestión de clientes", "gestión comercial"],
  alternates: { canonical: "/" },
  openGraph: { title: "FidelOS | Inventario y CRM en una sola plataforma", description: "Controla la operación y el seguimiento comercial desde un mismo lugar.", type: "website", locale: "es_CO", siteName: "FidelOS" },
  twitter: { card: "summary", title: "FidelOS | Inventario y CRM", description: "Control operativo y comercial desde un solo lugar." },
};

export default function Home() {
  return <MarketingLanding />;
}
