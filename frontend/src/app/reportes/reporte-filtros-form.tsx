"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchCategorias } from "@/lib/api/categorias";
import { fetchMarcas } from "@/lib/api/marcas";
import { fetchProductos } from "@/lib/api/productos";
import { fetchAuditLog } from "@/lib/api/audit-log";
import type { ReporteFiltro } from "@/types/reporte";

interface Option {
  value: string;
  label: string;
}

/**
 * Fuentes de opciones para los filtros `select` — vocabulario cerrado, confirmado leyendo las
 * 13 clases de app/Reports/*.php: categoria_id/marca_id/producto_id/modulo/accion/tipo/estado
 * son las únicas claves `select` que existen. `tipo` (movimiento) y `estado` (activo/todos)
 * son enums reales del backend, no listas dinámicas — hardcodearlos aquí es correcto, mismo
 * criterio que el resto del proyecto ya aplica para esos dos campos en otros módulos.
 */
const STATIC_OPTIONS: Record<string, Option[]> = {
  tipo: [
    { value: "entrada", label: "Entrada" },
    { value: "salida", label: "Salida" },
    { value: "ajuste", label: "Ajuste" },
  ],
  estado: [
    { value: "activo", label: "Activos" },
    { value: "todos", label: "Todos" },
  ],
};

function useSelectOptions(claves: string[]) {
  const [fetchedOptions, setFetchedOptions] = useState<Record<string, Option[]>>({});

  useEffect(() => {
    if (claves.includes("categoria_id")) {
      fetchCategorias({ estado: "activo", per_page: 100 }).then((d) =>
        setFetchedOptions((prev) => ({ ...prev, categoria_id: d.items.map((c) => ({ value: String(c.id), label: c.nombre })) }))
      ).catch(() => {});
    }
    if (claves.includes("marca_id")) {
      fetchMarcas({ estado: "activo", per_page: 100 }).then((d) =>
        setFetchedOptions((prev) => ({ ...prev, marca_id: d.items.map((m) => ({ value: String(m.id), label: m.nombre })) }))
      ).catch(() => {});
    }
    if (claves.includes("producto_id")) {
      fetchProductos({ estado: "activo", per_page: 100 }).then((d) =>
        setFetchedOptions((prev) => ({ ...prev, producto_id: d.items.map((p) => ({ value: String(p.id), label: p.nombre })) }))
      ).catch(() => {});
    }
    if (claves.includes("modulo") || claves.includes("accion")) {
      fetchAuditLog({ per_page: 10 }).then((d) =>
        setFetchedOptions((prev) => ({
          ...prev,
          modulo: d.meta.modulos_disponibles.map((m) => ({ value: m, label: m })),
          accion: d.meta.acciones_disponibles.map((a) => ({ value: a, label: a })),
        }))
      ).catch(() => {});
    }
    // claves is derived fresh from filtrosDisponibles on every render of the parent, but its
    // *contents* only change when the report (clave) changes — safe to depend on its join.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claves.join(",")]);

  // tipo/estado are real backend enums, not async data — computed directly, never through an
  // effect+setState cycle (React Compiler's set-state-in-effect rule flags synchronous
  // setState calls in an effect body; there's also just no need to fetch a constant).
  return useMemo(() => ({ ...STATIC_OPTIONS, ...fetchedOptions }), [fetchedOptions]);
}

export function ReporteFiltrosForm({
  filtros,
  values,
  onChange,
}: {
  filtros: ReporteFiltro[];
  values: Record<string, string>;
  onChange: (clave: string, value: string) => void;
}) {
  const selectKeys = filtros.filter((f) => f.tipo === "select").map((f) => f.clave);
  const options = useSelectOptions(selectKeys);

  if (filtros.length === 0) {
    return <p className="text-sm text-muted-foreground">Este reporte no tiene filtros.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {filtros.map((filtro) => (
        <div key={filtro.clave} className="flex flex-col gap-2">
          <Label htmlFor={`filtro-${filtro.clave}`}>
            {filtro.etiqueta}
            {filtro.requerido ? " *" : ""}
          </Label>
          {filtro.tipo === "select" ? (
            <Select value={values[filtro.clave] ?? ""} onValueChange={(v) => onChange(filtro.clave, v ?? "")}>
              <SelectTrigger id={`filtro-${filtro.clave}`}>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                {(options[filtro.clave] ?? []).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : filtro.tipo === "fecha" ? (
            <Input
              id={`filtro-${filtro.clave}`}
              type="date"
              value={values[filtro.clave] ?? ""}
              onChange={(e) => onChange(filtro.clave, e.target.value)}
            />
          ) : (
            <Input
              id={`filtro-${filtro.clave}`}
              value={values[filtro.clave] ?? ""}
              onChange={(e) => onChange(filtro.clave, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
