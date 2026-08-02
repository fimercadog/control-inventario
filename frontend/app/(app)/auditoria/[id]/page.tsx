import { AuditLogDetailScreen } from "@/components/audit-log-detail-screen";

export default async function AuditLogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AuditLogDetailScreen auditLogId={Number(id)} />;
}
