import { ScrollText } from "lucide-react";
import { PendingModule } from "@/components/pending-module";

export default function AuditoriaPage() {
  return (
    <PendingModule
      title="Auditoría"
      icon={ScrollText}
      description="Historial de acciones registradas en el sistema."
    />
  );
}
