import { ReportePreviewScreen } from "@/components/reporte-preview-screen";

export default async function ReportePreviewPage({
  params,
}: {
  params: Promise<{ clave: string }>;
}) {
  const { clave } = await params;
  return <ReportePreviewScreen clave={clave} />;
}
