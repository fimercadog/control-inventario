import { Tags } from "lucide-react";
import { PendingModule } from "@/components/pending-module";

export default function CategoriasPage() {
  return (
    <PendingModule
      title="Categorías"
      icon={Tags}
      description="Catálogo de categorías de producto."
    />
  );
}
