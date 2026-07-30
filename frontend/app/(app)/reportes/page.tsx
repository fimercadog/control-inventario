import { FileBarChart2 } from "lucide-react";
import { PendingModule } from "@/components/pending-module";

export default function ReportesPage() {
  return (
    <PendingModule
      title="Reportes"
      icon={FileBarChart2}
      description="Reportes por rango de fechas y por módulo."
    />
  );
}
