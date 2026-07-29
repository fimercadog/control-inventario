import { Check, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatConfidence } from "@/lib/format";

const THRESHOLD = 0.85;

/**
 * Nunca se expone terminología de IA ("confidence score", etc.) — solo un
 * indicador de certeza en lenguaje natural, coherente con el umbral real
 * del backend (config/captura_ia.php, 0.85).
 */
export function ConfidenceBadge({ value, className }: { value: number; className?: string }) {
  const verified = value >= THRESHOLD;

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent gap-1",
        verified
          ? "bg-success/15 text-success dark:bg-success/20"
          : "bg-warning/20 text-amber-700 dark:bg-warning/25 dark:text-amber-400",
        className
      )}
    >
      {verified ? <Check data-icon="inline-start" /> : <AlertTriangle data-icon="inline-start" />}
      {verified ? "Verificado" : "Revisar"} · {formatConfidence(value)}
    </Badge>
  );
}
