"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listCategorias } from "@/lib/api/categorias";
import { listMarcas } from "@/lib/api/marcas";
import { listProductos } from "@/lib/api/productos";
import type { Categoria, Marca, Producto, ReporteFiltroDisponible } from "@/lib/api/types";

const OPCIONES_FIJAS: Record<string, { value: string; label: string }[]> = {
  estado: [
    { value: "activo", label: "Activo" },
    { value: "inactivo", label: "Inactivo" },
    { value: "todos", label: "Todos" },
  ],
  tipo: [
    { value: "entrada", label: "Entrada" },
    { value: "salida", label: "Salida" },
    { value: "ajuste", label: "Ajuste" },
  ],
};

/**
 * Formulario de filtros genérico (ampliación 2026-08-03) — construido a
 * partir de `filtrosDisponibles` (viene del catálogo, ver
 * `App\Contracts\Reports\Reporte::filtrosDisponibles()`), nunca
 * hardcodeado por reporte. Los filtros `select` de entidad
 * (categoria_id/marca_id/producto_id) cargan sus opciones desde la API
 * real correspondiente — nunca datos de ejemplo.
 */
export function ReporteFiltrosForm({
  filtros,
  valores,
  onChange,
}: {
  filtros: ReporteFiltroDisponible[];
  valores: Record<string, string>;
  onChange: (clave: string, valor: string) => void;
}) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);

  const necesitaCategorias = filtros.some((f) => f.clave === "categoria_id");
  const necesitaMarcas = filtros.some((f) => f.clave === "marca_id");
  const necesitaProductos = filtros.some((f) => f.clave === "producto_id");

  useEffect(() => {
    if (necesitaCategorias) {
      listCategorias({ estado: "activo" }).then((res) => setCategorias(res.items)).catch(() => {});
    }
  }, [necesitaCategorias]);

  useEffect(() => {
    if (necesitaMarcas) {
      listMarcas({ estado: "activo" }).then((res) => setMarcas(res.items)).catch(() => {});
    }
  }, [necesitaMarcas]);

  useEffect(() => {
    if (necesitaProductos) {
      listProductos({ estado: "activo" }).then((res) => setProductos(res.items)).catch(() => {});
    }
  }, [necesitaProductos]);

  if (filtros.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      {filtros.map((filtro) => {
        const valor = valores[filtro.clave] ?? "";
        const etiqueta = `${filtro.etiqueta}${filtro.requerido ? " *" : ""}`;

        if (filtro.tipo === "fecha") {
          return (
            <div key={filtro.clave} className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">{etiqueta}</Label>
              <Input
                type="date"
                className="w-40"
                value={valor}
                onChange={(e) => onChange(filtro.clave, e.target.value)}
              />
            </div>
          );
        }

        if (filtro.tipo === "select" && filtro.clave === "categoria_id") {
          return (
            <EntitySelect
              key={filtro.clave}
              etiqueta={etiqueta}
              valor={valor}
              placeholder="Todas"
              opciones={categorias.map((c) => ({ value: String(c.id), label: c.nombre }))}
              onChange={(v) => onChange(filtro.clave, v)}
            />
          );
        }

        if (filtro.tipo === "select" && filtro.clave === "marca_id") {
          return (
            <EntitySelect
              key={filtro.clave}
              etiqueta={etiqueta}
              valor={valor}
              placeholder="Todas"
              opciones={marcas.map((m) => ({ value: String(m.id), label: m.nombre }))}
              onChange={(v) => onChange(filtro.clave, v)}
            />
          );
        }

        if (filtro.tipo === "select" && filtro.clave === "producto_id") {
          return (
            <EntitySelect
              key={filtro.clave}
              etiqueta={etiqueta}
              valor={valor}
              placeholder="Selecciona un producto"
              opciones={productos.map((p) => ({ value: String(p.id), label: p.codigo ? `${p.codigo} — ${p.nombre}` : p.nombre }))}
              onChange={(v) => onChange(filtro.clave, v)}
            />
          );
        }

        if (filtro.tipo === "select" && OPCIONES_FIJAS[filtro.clave]) {
          return (
            <EntitySelect
              key={filtro.clave}
              etiqueta={etiqueta}
              valor={valor}
              placeholder="Todos"
              opciones={OPCIONES_FIJAS[filtro.clave]}
              onChange={(v) => onChange(filtro.clave, v)}
            />
          );
        }

        return (
          <div key={filtro.clave} className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">{etiqueta}</Label>
            <Input
              type="text"
              className="w-48"
              value={valor}
              onChange={(e) => onChange(filtro.clave, e.target.value)}
            />
          </div>
        );
      })}
    </div>
  );
}

function EntitySelect({
  etiqueta,
  valor,
  placeholder,
  opciones,
  onChange,
}: {
  etiqueta: string;
  valor: string;
  placeholder: string;
  opciones: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const items: Record<string, string> = { "": placeholder, ...Object.fromEntries(opciones.map((o) => [o.value, o.label])) };

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{etiqueta}</Label>
      <Select items={items} value={valor} onValueChange={(v) => onChange(v ?? "")}>
        <SelectTrigger className="w-52">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(items).map(([value, label]) => (
            <SelectItem key={value || "__vacio__"} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
