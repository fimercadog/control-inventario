"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { crearProveedor, actualizarProveedor } from "@/lib/api/proveedores";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { Proveedor } from "@/types/proveedor";

const operationalSchema = {
  nombre: z.string().min(1, "El nombre es obligatorio."),
  contacto: z.string(),
  telefono: z.string(),
  direccion: z.string(),
  ciudad: z.string(),
  pais: z.string(),
  notas: z.string(),
};

const createSchema = z.object({
  ...operationalSchema,
  nit: z.string(),
  email: z.union([z.literal(""), z.string().email("Ingresá un correo válido.")]),
});

const editSchema = z.object(operationalSchema);

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

/**
 * Shared by Nuevo Proveedor and Editar Proveedor. NIT/email are Identity
 * (ADR-015) — StoreProveedorRequest accepts both, UpdateProveedorRequest
 * doesn't even declare them (the backend ignores them silently if sent), so
 * in edit mode they're rendered as disabled inputs sourced straight from
 * `proveedor`, never registered with react-hook-form — there's no path by
 * which this form could submit them on an update, not just a UI-level lock.
 */
export function ProveedorForm({
  proveedor,
  onSuccess,
}: {
  proveedor?: Proveedor;
  onSuccess: (proveedor: Proveedor) => void;
}) {
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);
  const isEdit = proveedor !== undefined;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateValues | EditValues>({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: {
      nombre: proveedor?.nombre ?? "",
      contacto: proveedor?.contacto ?? "",
      telefono: proveedor?.telefono ?? "",
      direccion: proveedor?.direccion ?? "",
      ciudad: proveedor?.ciudad ?? "",
      pais: proveedor?.pais ?? "",
      notas: proveedor?.notas ?? "",
      ...(isEdit ? {} : { nit: "", email: "" }),
    },
  });
  const createErrors = errors as typeof errors & Partial<Record<"nit" | "email", { message?: string }>>;

  async function onSubmit(values: CreateValues | EditValues) {
    setStatus("submitting");
    setError(null);
    try {
      const operational = {
        nombre: values.nombre,
        contacto: values.contacto || null,
        telefono: values.telefono || null,
        direccion: values.direccion || null,
        ciudad: values.ciudad || null,
        pais: values.pais || null,
        notas: values.notas || null,
      };
      const saved = isEdit
        ? await actualizarProveedor(proveedor.id, operational)
        : await crearProveedor({
            ...operational,
            nit: (values as CreateValues).nit || null,
            email: (values as CreateValues).email || null,
          });
      onSuccess(saved);
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError, "No se pudo guardar el proveedor."));
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
        <Label htmlFor="proveedor-nombre">Nombre</Label>
        <Input
          id="proveedor-nombre"
          placeholder="Ej. Distribuidora Central"
          aria-invalid={Boolean(errors.nombre)}
          aria-describedby={errors.nombre ? "proveedor-nombre-error" : undefined}
          {...register("nombre")}
        />
        {errors.nombre ? (
          <p id="proveedor-nombre-error" className="text-sm text-destructive">
            {errors.nombre.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="proveedor-nit">
            NIT {isEdit ? <span className="text-xs font-normal text-muted-foreground">(no editable)</span> : null}
          </Label>
          {isEdit ? (
            <Input id="proveedor-nit" value={proveedor.nit ?? ""} disabled readOnly />
          ) : (
            <Input id="proveedor-nit" placeholder="Ej. 900123456" {...register("nit")} />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="proveedor-email">
            Email {isEdit ? <span className="text-xs font-normal text-muted-foreground">(no editable)</span> : null}
          </Label>
          {isEdit ? (
            <Input id="proveedor-email" value={proveedor.email ?? ""} disabled readOnly />
          ) : (
            <>
              <Input
                id="proveedor-email"
                type="email"
                placeholder="Ej. contacto@proveedor.com"
                aria-invalid={Boolean(createErrors.email)}
                {...register("email")}
              />
              {createErrors.email ? <p className="text-sm text-destructive">{createErrors.email.message}</p> : null}
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="proveedor-contacto">Contacto</Label>
          <Input id="proveedor-contacto" placeholder="Persona de contacto" {...register("contacto")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="proveedor-telefono">Teléfono</Label>
          <Input id="proveedor-telefono" placeholder="Ej. +57 300 1234567" {...register("telefono")} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="proveedor-direccion">Dirección</Label>
        <Input id="proveedor-direccion" placeholder="Dirección opcional" {...register("direccion")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="proveedor-ciudad">Ciudad</Label>
          <Input id="proveedor-ciudad" {...register("ciudad")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="proveedor-pais">País</Label>
          <Input id="proveedor-pais" {...register("pais")} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="proveedor-notas">Notas</Label>
        <Textarea id="proveedor-notas" placeholder="Notas opcionales" {...register("notas")} />
      </div>

      <Button type="submit" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? <Loader2 className="size-4 animate-spin" /> : null}
        {isEdit ? "Guardar cambios" : "Crear proveedor"}
      </Button>
    </form>
  );
}
