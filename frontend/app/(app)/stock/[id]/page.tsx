import { StockDetailScreen } from "@/components/stock-detail-screen";

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StockDetailScreen productoId={Number(id)} />;
}
