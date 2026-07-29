import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "primary",
  hint,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accent?: "primary" | "success" | "destructive" | "warning";
  hint?: string;
}) {
  const accentClasses: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    destructive: "bg-destructive/10 text-destructive",
    warning: "bg-warning/20 text-amber-700 dark:text-amber-400",
  };

  return (
    <Card className="border-border/60">
      <CardContent className="flex items-center gap-4">
        <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", accentClasses[accent])}>
          <Icon className="size-5" />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
          <span className="text-sm leading-tight text-muted-foreground">{label}</span>
          {hint && <span className="text-xs text-muted-foreground/80">{hint}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
