"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useContingencia } from "@/hooks/use-contingencia";

export function ContingenciaBanner() {
  const { activo, operaciones } = useContingencia();
  if (!activo) return null;
  return <Alert className="mb-4 border-amber-500 bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"><TriangleAlert className="size-4" /><AlertDescription><strong>Modo Contingencia activo.</strong> Las operaciones normales de escritura están bloqueadas. <Link className="underline" href="/contingencia">{operaciones.length} operación(es) pendiente(s)</Link>.</AlertDescription></Alert>;
}
