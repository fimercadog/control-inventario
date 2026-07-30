import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";

/**
 * RC1 Sidebar Oficial (2026-07-30): todo módulo listado en el sidebar debe
 * tener página/ruta/título real, incluso si su implementación completa
 * todavía no existe — nunca datos mock, nunca una API inexistente
 * simulada. Este componente es la "estructura mínima" acordada para esos
 * casos: título + mensaje honesto de "pendiente de implementación".
 */
export function PendingModule({
  title,
  icon,
  description,
}: {
  title: string;
  icon: React.ElementType;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <Badge variant="secondary">Pendiente de implementación</Badge>
      </div>
      <Card className="border-border/60 py-0">
        <CardContent className="px-0">
          <EmptyState
            icon={icon}
            title="Este módulo se encuentra pendiente de implementación."
            description="Todavía no hay backend, API ni datos reales conectados a esta pantalla."
          />
        </CardContent>
      </Card>
    </div>
  );
}
