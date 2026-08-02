import { UsuarioDetailScreen } from "@/components/usuario-detail-screen";

export default async function UsuarioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <UsuarioDetailScreen usuarioId={Number(id)} />;
}
