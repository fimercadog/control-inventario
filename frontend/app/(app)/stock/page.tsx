import { Warehouse } from "lucide-react";
import { PendingModule } from "@/components/pending-module";

export default function StockPage() {
  return (
    <PendingModule
      title="Stock"
      icon={Warehouse}
      description="Gestión de inventario por producto (mínimos, máximos, ajustes)."
    />
  );
}
