"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Boxes,
  AlertTriangle,
  FolderTree,
  Tag,
  Truck,
  ArrowLeftRight,
  ScrollText,
  PackageX,
  Users,
  UserCog,
  ShieldCheck,
  Loader2,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCatalogoReportes } from "@/store/slices/reportes-slice";

const ICONOS: Record<string, LucideIcon> = {
  "inventario-resumen": Boxes,
  "stock-actual": Boxes,
  "stock-bajo": AlertTriangle,
  "inventario-por-categoria": FolderTree,
  "inventario-por-marca": Tag,
  "inventario-por-proveedor": Truck,
  "movimientos-inventario": ArrowLeftRight,
  "kardex-producto": ScrollText,
  "productos-sin-movimiento": PackageX,
  proveedores: Truck,
  clientes: Users,
  "actividad-usuarios": UserCog,
  auditoria: ShieldCheck,
};

/**
 * Catálogo de los 13 reportes (ampliación 2026-08-03). Lee
 * `GET /reportes/catalogo` — nunca hardcodea la lista de reportes acá:
 * si el backend agrega un reporte 14, esta pestaña lo muestra sin
 * cambios, salvo el ícono (cae al genérico `ScrollText`).
 */
export function ReportesCatalogoTab() {
  const dispatch = useAppDispatch();
  const { catalogo, catalogoLoading } = useAppSelector((state) => state.reportes);

  useEffect(() => {
    dispatch(fetchCatalogoReportes());
  }, [dispatch]);

  if (catalogoLoading && catalogo.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando catálogo de reportes...
      </div>
    );
  }

  if (catalogo.length === 0) {
    return (
      <EmptyState
        icon={ScrollText}
        title="No pudimos cargar el catálogo"
        description="Intenta recargar la página."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {catalogo.map((reporte) => {
        const Icono = ICONOS[reporte.clave] ?? ScrollText;

        return (
          <Link key={reporte.clave} href={`/reportes/${reporte.clave}`}>
            <Card className="h-full border-border/60 transition-colors hover:border-primary/50 hover:bg-accent/40">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icono className="size-4.5" />
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </div>
                <CardTitle className="mt-2">{reporte.nombre}</CardTitle>
                <CardDescription>{reporte.descripcion}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
