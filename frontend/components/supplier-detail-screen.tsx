"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Ban, CheckCircle2, Loader2, Package, Pencil, Save, Truck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import {
  getProveedor,
  updateProveedor,
  disableProveedor,
  enableProveedor,
  listProductosDeProveedor,
} from "@/lib/api/proveedores";
import type { ProductoProveedorAsociacion, Proveedor, UpdateProveedorPayload } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";

/**
 * Ficha de Proveedor (docs/03_FUNCTIONAL_SPEC/Suppliers.md) — mismo
 * patrón de navegación unificada que la Ficha de Producto: un solo
 * destino para ver/editar/deshabilitar un proveedor.
 */
export function SupplierDetailScreen({ proveedorId }: { proveedorId: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [productosAsociados, setProductosAsociados] = useState<ProductoProveedorAsociacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(searchParams.get("editar") === "1");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UpdateProveedorPayload>({});

  useEffect(() => {
    if (!Number.isFinite(proveedorId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    Promise.all([getProveedor(proveedorId), listProductosDeProveedor(proveedorId)])
      .then(([result, productosResult]) => {
        setProveedor(result);
        setProductosAsociados(productosResult);
        setForm({
          nombre: result.nombre,
          nit: result.nit ?? "",
          contacto: result.contacto ?? "",
          telefono: result.telefono ?? "",
          email: result.email ?? "",
          direccion: result.direccion ?? "",
          ciudad: result.ciudad ?? "",
          pais: result.pais ?? "",
          notas: result.notas ?? "",
        });
      })
      .catch((error) => {
        const status = (error as { status?: number }).status;
        if (status === 404) {
          setNotFound(true);
        } else {
          toast.error(error instanceof Error ? error.message : "No pudimos cargar el proveedor.");
        }
      })
      .finally(() => setLoading(false));
  }, [proveedorId]);

  async function save() {
    if (!proveedor) return;
    setSaving(true);
    try {
      const actualizado = await updateProveedor(proveedor.id, form);
      setProveedor(actualizado);
      setEditing(false);
      toast.success("Proveedor actualizado correctamente");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleEstado() {
    if (!proveedor) return;
    try {
      const actualizado =
        proveedor.estado === "activo"
          ? await disableProveedor(proveedor.id)
          : await enableProveedor(proveedor.id);
      setProveedor(actualizado);
      toast.success(actualizado.estado === "activo" ? "Proveedor habilitado" : "Proveedor deshabilitado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos actualizar el estado.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando proveedor...
      </div>
    );
  }

  if (notFound || !proveedor) {
    return (
      <div className="flex flex-col gap-6">
        <Button variant="ghost" size="sm" className="w-fit gap-2" onClick={() => router.push("/proveedores")}>
          <ArrowLeft className="size-4" />
          Volver a Proveedores
        </Button>
        <EmptyState
          icon={Truck}
          title="No encontramos este proveedor"
          description="No existe, o no pertenece a tu empresa."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" className="w-fit gap-2" onClick={() => router.push("/proveedores")}>
          <ArrowLeft className="size-4" />
          Volver a Proveedores
        </Button>
        {!editing && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-2" onClick={toggleEstado}>
              {proveedor.estado === "activo" ? (
                <>
                  <Ban className="size-4" />
                  Deshabilitar
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Habilitar
                </>
              )}
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setEditing(true)}>
              <Pencil className="size-4" />
              Editar
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-start gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Truck className="size-7" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{proveedor.nombre}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {proveedor.nit && <span>NIT: {proveedor.nit}</span>}
            <Badge variant={proveedor.estado === "activo" ? "outline" : "secondary"}>
              {proveedor.estado === "activo" ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="detalle">
        <TabsList>
          <TabsTrigger value="detalle">Detalle</TabsTrigger>
          <TabsTrigger value="productos">Productos ({productosAsociados.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="detalle">
      <Card className="border-border/60">
        <CardContent className="flex flex-col gap-4 pt-6">
          {editing ? (
            <>
              <Field label="Razón Social">
                <Input
                  value={form.nombre ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="NIT / Tax ID">
                  <Input value={form.nit ?? ""} onChange={(e) => setForm((f) => ({ ...f, nit: e.target.value }))} />
                </Field>
                <Field label="Contacto">
                  <Input
                    value={form.contacto ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, contacto: e.target.value }))}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Teléfono">
                  <Input
                    value={form.telefono ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                  />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={form.email ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </Field>
              </div>
              <Field label="Dirección">
                <Input
                  value={form.direccion ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ciudad">
                  <Input
                    value={form.ciudad ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, ciudad: e.target.value }))}
                  />
                </Field>
                <Field label="País">
                  <Input value={form.pais ?? ""} onChange={(e) => setForm((f) => ({ ...f, pais: e.target.value }))} />
                </Field>
              </div>
              <Field label="Notas">
                <Input value={form.notas ?? ""} onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))} />
              </Field>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => setEditing(false)} disabled={saving}>
                  <X className="size-4" />
                  Cancelar
                </Button>
                <Button className="flex-1 gap-2" onClick={save} disabled={saving}>
                  <Save className="size-4" />
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Contacto" value={proveedor.contacto ?? "—"} />
              <InfoRow label="Teléfono" value={proveedor.telefono ?? "—"} />
              <InfoRow label="Email" value={proveedor.email ?? "—"} />
              <InfoRow label="Dirección" value={proveedor.direccion ?? "—"} />
              <InfoRow label="Ciudad" value={proveedor.ciudad ?? "—"} />
              <InfoRow label="País" value={proveedor.pais ?? "—"} />
              <InfoRow label="Notas" value={proveedor.notas ?? "—"} />
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="productos">
          <Card className="border-border/60 py-0">
            <CardContent className="px-0">
              {productosAsociados.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="Sin productos asociados"
                  description="Este proveedor todavía no está asociado a ningún producto. La asociación se crea desde la ficha del producto."
                />
              ) : (
                <ul className="divide-y">
                  {productosAsociados.map((asociacion) => (
                    <li key={asociacion.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Package className="size-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <Link
                            href={`/productos/${asociacion.producto_id}`}
                            className="flex items-center gap-2 text-sm font-medium hover:underline"
                          >
                            {asociacion.producto_nombre}
                            {asociacion.es_principal && <Badge variant="outline">Principal</Badge>}
                          </Link>
                          <span className="text-xs text-muted-foreground">
                            {[
                              asociacion.codigo_proveedor && `Código: ${asociacion.codigo_proveedor}`,
                              asociacion.precio_compra != null &&
                                `Precio de compra: ${formatCurrency(asociacion.precio_compra)}`,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "Sin datos adicionales"}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
