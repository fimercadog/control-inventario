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
import { crearCliente, actualizarCliente } from "@/lib/api/clientes";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { Cliente } from "@/types/cliente";

const createSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio."),
  nit: z.string(),
  contacto: z.string(),
  telefono: z.string(),
  email: z.union([z.literal(""), z.string().email("Correo inválido.")]),
  direccion: z.string(),
  ciudad: z.string(),
  pais: z.string(),
  notas: z.string(),
});

const editSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio."),
  contacto: z.string(),
  telefono: z.string(),
  direccion: z.string(),
  ciudad: z.string(),
  pais: z.string(),
  notas: z.string(),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

/**
 * Shared by Nuevo Cliente y Editar Cliente. NIT/email son Identity (ADR-015): aceptados solo
 * en creación, únicos por empresa. En edición se muestran de solo lectura y NUNCA se
 * registran con react-hook-form — imposible enviarlos en el PATCH sin importar el estado de
 * la UI, mismo patrón ya usado en Proveedores. Un campo vaciado se envía como `null`
 * explícito (no se omite la clave): ClienteDTO distingue "no enviado" de "enviado como
 * null" — omitir la clave NO borraría el valor anterior (confirmado contra el backend real,
 * ver frontend/types/cliente.ts).
 */
export function ClienteForm({ cliente, onSuccess }: { cliente?: Cliente; onSuccess: (cliente: Cliente) => void }) {
  const isEdit = Boolean(cliente);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateValues | EditValues>({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: isEdit
      ? {
          nombre: cliente?.nombre ?? "",
          contacto: cliente?.contacto ?? "",
          telefono: cliente?.telefono ?? "",
          direccion: cliente?.direccion ?? "",
          ciudad: cliente?.ciudad ?? "",
          pais: cliente?.pais ?? "",
          notas: cliente?.notas ?? "",
        }
      : {
          nombre: "",
          nit: "",
          contacto: "",
          telefono: "",
          email: "",
          direccion: "",
          ciudad: "",
          pais: "",
          notas: "",
        },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  async function onSubmit(values: CreateValues | EditValues) {
    setStatus("submitting");
    setError(null);
    try {
      const saved =
        isEdit && cliente
          ? await actualizarCliente(cliente.id, {
              nombre: values.nombre,
              contacto: values.contacto || null,
              telefono: values.telefono || null,
              direccion: values.direccion || null,
              ciudad: values.ciudad || null,
              pais: values.pais || null,
              notas: values.notas || null,
            })
          : await crearCliente({
              nombre: values.nombre,
              nit: (values as CreateValues).nit || null,
              contacto: values.contacto || null,
              telefono: values.telefono || null,
              email: (values as CreateValues).email || null,
              direccion: values.direccion || null,
              ciudad: values.ciudad || null,
              pais: values.pais || null,
              notas: values.notas || null,
            });
      onSuccess(saved);
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError, "No se pudo guardar el cliente."));
      setStatus("idle");
    }
  }

  const createErrors = errors as typeof errors & Partial<Record<"nit" | "email", { message?: string }>>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="cliente-nombre">Nombre</Label>
        <Input
          id="cliente-nombre"
          placeholder="Ej. Distribuidora El Sol"
          aria-invalid={Boolean(errors.nombre)}
          aria-describedby={errors.nombre ? "cliente-nombre-error" : undefined}
          {...register("nombre")}
        />
        {errors.nombre ? (
          <p id="cliente-nombre-error" className="text-sm text-destructive">
            {errors.nombre.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cliente-nit">NIT</Label>
          {isEdit ? (
            <Input id="cliente-nit" value={cliente?.nit ?? ""} disabled readOnly />
          ) : (
            <Input id="cliente-nit" placeholder="Opcional" {...register("nit")} />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cliente-email">Email</Label>
          {isEdit ? (
            <Input id="cliente-email" value={cliente?.email ?? ""} disabled readOnly />
          ) : (
            <>
              <Input
                id="cliente-email"
                type="email"
                placeholder="Opcional"
                aria-invalid={Boolean(createErrors.email)}
                {...register("email")}
              />
              {createErrors.email ? (
                <p className="text-sm text-destructive">{createErrors.email.message}</p>
              ) : null}
            </>
          )}
        </div>
      </div>
      {isEdit ? <p className="text-xs text-muted-foreground">NIT y email no son editables.</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cliente-contacto">Contacto</Label>
          <Input id="cliente-contacto" placeholder="Persona de contacto" {...register("contacto")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cliente-telefono">Teléfono</Label>
          <Input id="cliente-telefono" placeholder="Opcional" {...register("telefono")} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="cliente-direccion">Dirección</Label>
        <Input id="cliente-direccion" placeholder="Opcional" {...register("direccion")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cliente-ciudad">Ciudad</Label>
          <Input id="cliente-ciudad" placeholder="Opcional" {...register("ciudad")} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cliente-pais">País</Label>
          <Input id="cliente-pais" placeholder="Opcional" {...register("pais")} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="cliente-notas">Notas</Label>
        <Textarea id="cliente-notas" placeholder="Opcional" {...register("notas")} />
      </div>

      <Button type="submit" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? <Loader2 className="size-4 animate-spin" /> : null}
        {isEdit ? "Guardar cambios" : "Crear cliente"}
      </Button>
    </form>
  );
}
