import { MarcaDetailScreen } from "@/components/marca-detail-screen";

export default async function MarcaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MarcaDetailScreen marcaId={Number(id)} />;
}
