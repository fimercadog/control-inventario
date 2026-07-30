import { SupplierDetailScreen } from "@/components/supplier-detail-screen";

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SupplierDetailScreen proveedorId={Number(id)} />;
}
