import { UserCircle } from "lucide-react";
import { PendingModule } from "@/components/pending-module";

export default function PerfilPage() {
  return (
    <PendingModule
      title="Perfil"
      icon={UserCircle}
      description="Edición de datos personales, avatar e idioma."
    />
  );
}
