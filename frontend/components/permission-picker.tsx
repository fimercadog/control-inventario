"use client";

import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/**
 * Módulo 5 — Role Management (2026-08-02). Agrupa el catálogo plano de
 * permisos (`recurso.accion`) por `recurso` para que asignar permisos a
 * un rol sea manejable — con 45+ permisos en una sola lista plana sería
 * inusable. El catálogo ya llega sin `plataforma.*` (el backend lo
 * excluye — ver `PermissionController`), así que no hay que filtrarlo de nuevo aquí.
 */
export function PermissionPicker({
  catalogo,
  seleccionados,
  onChange,
  loading,
}: {
  catalogo: string[];
  seleccionados: string[];
  onChange: (permisos: string[]) => void;
  loading?: boolean;
}) {
  const grupos = useMemo(() => {
    const mapa = new Map<string, string[]>();
    for (const permiso of catalogo) {
      const [recurso] = permiso.split(".");
      const lista = mapa.get(recurso) ?? [];
      lista.push(permiso);
      mapa.set(recurso, lista);
    }
    return Array.from(mapa.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [catalogo]);

  function toggle(permiso: string, marcado: boolean) {
    if (marcado) {
      onChange([...seleccionados, permiso]);
    } else {
      onChange(seleccionados.filter((p) => p !== permiso));
    }
  }

  function toggleGrupo(permisosDelGrupo: string[], marcarTodos: boolean) {
    const resto = seleccionados.filter((p) => !permisosDelGrupo.includes(p));
    onChange(marcarTodos ? [...resto, ...permisosDelGrupo] : resto);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando catálogo de permisos...</p>;
  }

  return (
    <div className="flex max-h-80 flex-col gap-4 overflow-y-auto rounded-lg border border-border/60 p-4">
      {grupos.map(([recurso, permisos]) => {
        const todosMarcados = permisos.every((p) => seleccionados.includes(p));
        const algunoMarcado = permisos.some((p) => seleccionados.includes(p));
        return (
          <div key={recurso} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={todosMarcados}
                indeterminate={!todosMarcados && algunoMarcado}
                onCheckedChange={(marcado) => toggleGrupo(permisos, marcado === true)}
              />
              <Label className="text-sm font-medium capitalize">{recurso.replace(/-/g, " ")}</Label>
            </div>
            <div className="ml-6 flex flex-wrap gap-x-4 gap-y-2">
              {permisos.map((permiso) => (
                <div key={permiso} className="flex items-center gap-2">
                  <Checkbox
                    checked={seleccionados.includes(permiso)}
                    onCheckedChange={(marcado) => toggle(permiso, marcado === true)}
                  />
                  <Label className="text-xs font-normal text-muted-foreground">{permiso}</Label>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
