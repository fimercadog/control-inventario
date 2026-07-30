import { ShieldCheck } from "lucide-react";
import { PendingModule } from "@/components/pending-module";

export default function RolesPage() {
  return (
    <PendingModule
      title="Roles"
      icon={ShieldCheck}
      description="Gestión de roles y permisos."
    />
  );
}
