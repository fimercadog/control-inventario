import { UserCog } from "lucide-react";
import { PendingModule } from "@/components/pending-module";

export default function UsuariosPage() {
  return (
    <PendingModule
      title="Usuarios"
      icon={UserCog}
      description="Administración de usuarios de la empresa."
    />
  );
}
