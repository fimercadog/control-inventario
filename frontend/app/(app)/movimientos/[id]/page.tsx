import { MovimientoDetailScreen } from "@/components/movimiento-detail-screen";

export default async function MovimientoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MovimientoDetailScreen movimientoId={Number(id)} />;
}
