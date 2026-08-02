import { RoleDetailScreen } from "@/components/role-detail-screen";

export default async function RoleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RoleDetailScreen roleId={Number(id)} />;
}
