"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { crearProducto, actualizarProducto } from "@/lib/api/productos";
import { findLabel } from "@/lib/utils/select-label";
import { fetchMarcas } from "@/lib/api/marcas";
import { fetchCategorias } from "@/lib/api/categorias";
import { fetchUnidadesMedida } from "@/lib/api/unidades-medida";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { Producto } from "@/types/producto";
import type { Marca } from "@/types/marca";
import type { Categoria } from "@/types/categoria";
import type { UnidadMedida } from "@/types/unidad-medida";

const NUEVA = "__nueva__";

const productoFormSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio."),
  codigo: z.string(),
  codigo_barras: z.string(),
  marca_id: z.string(),
  marca_nuevo: z.string(),
  categoria_id: z.string(),
  unidad_medida_id: z.string(),
  unidad_medida_nuevo: z.string(),
  descripcion: z.string(),
  presentacion: z.string(),
  costo: z.string(),
  precio: z.string(),
  stock_minimo: z.string(),
  stock_maximo: z.string(),
});

type ProductoFormValues = z.infer<typeof productoFormSchema>;

/**
 * Shared by Nuevo Producto y Editar Producto. codigo/codigo_barras solo se aceptan al crear —
 * ausentes por completo de UpdateProductoRequest (confirmado contra el Request real, no
 * asumido) — en edición se muestran de solo lectura, mismo patrón que NIT/email en
 * Proveedores/Clientes. marca/unidad_medida permiten elegir una existente o escribir una
 * nueva (quick-create, mutuamente excluyente con el *_id — StoreProductoRequest/
 * UpdateProductoRequest lo confirman); categoria es solo selección, sin campo *_nuevo en el
 * backend real.
 */
export function ProductoForm({ producto, onSuccess }: { producto?: Producto; onSuccess: (producto: Producto) => void }) {
  const isEdit = Boolean(producto);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);

  useEffect(() => {
    fetchMarcas({ estado: "activo", per_page: 100 }).then((d) => setMarcas(d.items)).catch(() => {});
    fetchCategorias({ estado: "activo", per_page: 100 }).then((d) => setCategorias(d.items)).catch(() => {});
    fetchUnidadesMedida({ estado: "activo", per_page: 100 }).then((d) => setUnidades(d.items)).catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ProductoFormValues>({
    resolver: zodResolver(productoFormSchema),
    defaultValues: {
      nombre: producto?.nombre ?? "",
      codigo: producto?.codigo ?? "",
      codigo_barras: producto?.codigo_barras ?? "",
      marca_id: producto?.marca_id ? String(producto.marca_id) : "",
      marca_nuevo: "",
      categoria_id: producto?.categoria_id ? String(producto.categoria_id) : "",
      unidad_medida_id: producto?.unidad_medida_id ? String(producto.unidad_medida_id) : "",
      unidad_medida_nuevo: "",
      descripcion: producto?.descripcion ?? "",
      presentacion: producto?.presentacion ?? "",
      costo: producto ? String(producto.costo) : "",
      precio: producto ? String(producto.precio) : "",
      stock_minimo: producto ? String(producto.stock_minimo) : "",
      stock_maximo: producto?.stock_maximo != null ? String(producto.stock_maximo) : "",
    },
  });

  const marcaId = watch("marca_id");
  const unidadId = watch("unidad_medida_id");

  async function onSubmit(values: ProductoFormValues) {
    setStatus("submitting");
    setError(null);
    try {
      const base = {
        nombre: values.nombre,
        marca_id: values.marca_id && values.marca_id !== NUEVA ? Number(values.marca_id) : undefined,
        marca_nuevo: values.marca_id === NUEVA && values.marca_nuevo ? values.marca_nuevo : undefined,
        categoria_id: values.categoria_id ? Number(values.categoria_id) : undefined,
        unidad_medida_id: values.unidad_medida_id && values.unidad_medida_id !== NUEVA ? Number(values.unidad_medida_id) : undefined,
        unidad_medida_nuevo: values.unidad_medida_id === NUEVA && values.unidad_medida_nuevo ? values.unidad_medida_nuevo : undefined,
        descripcion: values.descripcion || null,
        presentacion: values.presentacion || null,
        costo: values.costo ? Number(values.costo) : undefined,
        precio: values.precio ? Number(values.precio) : undefined,
        stock_minimo: values.stock_minimo ? Number(values.stock_minimo) : undefined,
        stock_maximo: values.stock_maximo ? Number(values.stock_maximo) : null,
      };
      const saved =
        isEdit && producto
          ? await actualizarProducto(producto.id, base)
          : await crearProducto({
              ...base,
              codigo: values.codigo || null,
              codigo_barras: values.codigo_barras || null,
            });
      onSuccess(saved);
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError, "No se pudo guardar el producto."));
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
        <Label htmlFor="producto-nombre">Nombre</Label>
        <Input
          id="producto-nombre"
          placeholder="Ej. Alimento seco 15kg"
          aria-invalid={Boolean(errors.nombre)}
          {...register("nombre")}
        />
        {errors.nombre ? <p className="text-sm text-destructive">{errors.nombre.message}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="producto-codigo">Código</Label>
          {isEdit ? (
            <Input id="producto-codigo" value={producto?.codigo ?? ""} disabled readOnly />
          ) : (
            <Input id="producto-codigo" placeholder="Opcional" {...register("codigo")} />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="producto-codigo-barras">Código de barras</Label>
          {isEdit ? (
            <Input id="producto-codigo-barras" value={producto?.codigo_barras ?? ""} disabled readOnly />
          ) : (
            <Input id="producto-codigo-barras" placeholder="Opcional" {...register("codigo_barras")} />
          )}
        </div>
      </div>
      {isEdit ? <p className="text-xs text-muted-foreground">Código y código de barras no son editables.</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="producto-marca">Marca</Label>
          <Controller
            control={control}
            name="marca_id"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="producto-marca">
                  <SelectValue placeholder="Sin marca">
                    {(value: string) =>
                      value === NUEVA
                        ? "+ Crear nueva marca…"
                        : findLabel(
                            value,
                            marcas,
                            (m) => m.id,
                            (m) => m.nombre,
                            // Falls back to the product's own denormalized marca name when the
                            // real marca exists but isn't in this picker's fetched page (the
                            // demo data has 247 marcas for this company — a plain per_page:100
                            // fetch can genuinely miss one that's still perfectly valid).
                            producto && value === String(producto.marca_id) ? (producto.marca ?? "Sin marca") : "Sin marca"
                          )
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {marcas.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.nombre}
                    </SelectItem>
                  ))}
                  <SelectItem value={NUEVA}>+ Crear nueva marca…</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {marcaId === NUEVA ? (
            <Input placeholder="Nombre de la nueva marca" {...register("marca_nuevo")} />
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="producto-categoria">Categoría</Label>
          <Controller
            control={control}
            name="categoria_id"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="producto-categoria">
                  <SelectValue placeholder="Sin categoría">
                    {(value: string) =>
                      findLabel(
                        value,
                        categorias,
                        (c) => c.id,
                        (c) => c.nombre,
                        producto && value === String(producto.categoria_id) ? (producto.categoria ?? "Sin categoría") : "Sin categoría"
                      )
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="producto-unidad">Unidad de medida</Label>
        <Controller
          control={control}
          name="unidad_medida_id"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="producto-unidad">
                <SelectValue placeholder="Sin unidad de medida">
                  {(value: string) =>
                    value === NUEVA
                      ? "+ Crear nueva unidad de medida…"
                      : findLabel(
                          value,
                          unidades,
                          (u) => u.id,
                          (u) => (u.abreviatura ? `${u.nombre} (${u.abreviatura})` : u.nombre),
                          producto && value === String(producto.unidad_medida_id)
                            ? (producto.unidad_medida ?? "Sin unidad de medida")
                            : "Sin unidad de medida"
                        )
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {unidades.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.nombre}
                    {u.abreviatura ? ` (${u.abreviatura})` : ""}
                  </SelectItem>
                ))}
                <SelectItem value={NUEVA}>+ Crear nueva unidad de medida…</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {unidadId === NUEVA ? (
          <Input placeholder="Nombre de la nueva unidad de medida" {...register("unidad_medida_nuevo")} />
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="producto-presentacion">Presentación</Label>
        <Input id="producto-presentacion" placeholder="Ej. Bolsa 15kg" {...register("presentacion")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="producto-descripcion">Descripción</Label>
        <Textarea id="producto-descripcion" placeholder="Opcional" {...register("descripcion")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="producto-costo">Costo</Label>
          <Input id="producto-costo" type="number" step="0.01" min="0" placeholder="0.00" {...register("costo")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="producto-precio">Precio</Label>
          <Input id="producto-precio" type="number" step="0.01" min="0" placeholder="0.00" {...register("precio")} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="producto-stock-minimo">Stock mínimo</Label>
          <Input
            id="producto-stock-minimo"
            type="number"
            step="0.01"
            min="0"
            placeholder="0"
            {...register("stock_minimo")}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="producto-stock-maximo">Stock máximo</Label>
          <Input
            id="producto-stock-maximo"
            type="number"
            step="0.01"
            min="0"
            placeholder="Opcional"
            {...register("stock_maximo")}
          />
        </div>
      </div>
      {!isEdit ? (
        <p className="text-xs text-muted-foreground">
          El stock inicial es 0 — para asignarlo, registra un ingreso desde la ficha del producto
          después de crearlo.
        </p>
      ) : null}

      <Button type="submit" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? <Loader2 className="size-4 animate-spin" /> : null}
        {isEdit ? "Guardar cambios" : "Crear producto"}
      </Button>
    </form>
  );
}
