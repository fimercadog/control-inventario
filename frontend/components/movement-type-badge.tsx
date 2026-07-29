import { ArrowDownLeft, ArrowUpRight, RefreshCw, ClipboardList, ArrowLeftRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MovementType } from "@/lib/types";

const CONFIG: Record<MovementType, { label: string; className: string; icon: React.ElementType }> = {
  entrada: {
    label: "Entrada",
    className: "bg-success/15 text-success dark:bg-success/20",
    icon: ArrowDownLeft,
  },
  salida: {
    label: "Salida",
    className: "bg-destructive/10 text-destructive dark:bg-destructive/20",
    icon: ArrowUpRight,
  },
  ajuste: {
    label: "Ajuste",
    className: "bg-warning/20 text-amber-700 dark:bg-warning/25 dark:text-amber-400",
    icon: RefreshCw,
  },
  conteo: {
    label: "Conteo",
    className: "bg-muted text-muted-foreground",
    icon: ClipboardList,
  },
  transferencia: {
    label: "Transferencia",
    className: "bg-accent text-accent-foreground",
    icon: ArrowLeftRight,
  },
};

export function MovementTypeBadge({ tipo, className }: { tipo: MovementType; className?: string }) {
  const config = CONFIG[tipo];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("border-transparent gap-1", config.className, className)}>
      <Icon data-icon="inline-start" />
      {config.label}
    </Badge>
  );
}
