"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { actualizarStock } from "@/lib/api/stock";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { StockItem } from "@/types/stock";

const stockFormSchema = z.object({
  stock_minimo: z.string(),
  stock_maximo: z.string(),
});

type StockFormValues = z.infer<typeof stockFormSchema>;

/**
 * UpdateStockRequest solo acepta stock_minimo/stock_maximo — el stock actual se muestra de
 * solo lectura, nunca como campo del formulario (propiedad exclusiva de InventoryService).
 */
export function StockForm({ item, onSuccess }: { item: StockItem; onSuccess: (item: StockItem) => void }) {
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
  } = useForm<StockFormValues>({
    resolver: zodResolver(stockFormSchema),
    defaultValues: {
      stock_minimo: String(item.stock_minimo),
      stock_maximo: item.stock_maximo != null ? String(item.stock_maximo) : "",
    },
  });

  async function onSubmit(values: StockFormValues) {
    setStatus("submitting");
    setError(null);
    try {
      const saved = await actualizarStock(item.id, {
        stock_minimo: values.stock_minimo ? Number(values.stock_minimo) : undefined,
        stock_maximo: values.stock_maximo ? Number(values.stock_maximo) : null,
      });
      onSuccess(saved);
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError, "No se pudo actualizar el stock."));
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label>Stock actual</Label>
        <Input value={item.stock_actual} disabled readOnly />
        <p className="text-xs text-muted-foreground">
          Solo lectura — cambia únicamente mediante Movimientos.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="stock-minimo">Stock mínimo</Label>
          <Input id="stock-minimo" type="number" step="0.01" min="0" {...register("stock_minimo")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="stock-maximo">Stock máximo</Label>
          <Input id="stock-maximo" type="number" step="0.01" min="0" placeholder="Opcional" {...register("stock_maximo")} />
        </div>
      </div>

      <Button type="submit" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? <Loader2 className="size-4 animate-spin" /> : null}
        Guardar umbrales
      </Button>
    </form>
  );
}
