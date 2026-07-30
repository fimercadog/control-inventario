import { UnidadMedidaDetailScreen } from "@/components/unidad-medida-detail-screen";

export default async function UnidadMedidaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <UnidadMedidaDetailScreen unidadMedidaId={Number(id)} />;
}
