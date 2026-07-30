import { ProductDetailScreen } from "@/components/product-detail-screen";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductDetailScreen productId={Number(id)} />;
}
