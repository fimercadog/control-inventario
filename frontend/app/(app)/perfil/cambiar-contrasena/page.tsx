import { KeyRound } from "lucide-react";
import { PendingModule } from "@/components/pending-module";

export default function CambiarContrasenaPage() {
  return (
    <PendingModule
      title="Cambiar contraseña"
      icon={KeyRound}
      description="Actualizar la contraseña de tu cuenta."
    />
  );
}
