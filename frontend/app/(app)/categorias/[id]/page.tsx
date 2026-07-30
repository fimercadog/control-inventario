import { CategoriaDetailScreen } from "@/components/categoria-detail-screen";

export default async function CategoriaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CategoriaDetailScreen categoriaId={Number(id)} />;
}
