import { ClienteDetailScreen } from "@/components/cliente-detail-screen";

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClienteDetailScreen clienteId={Number(id)} />;
}
