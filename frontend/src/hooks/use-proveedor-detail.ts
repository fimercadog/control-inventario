import { useEffect, useState } from "react";
import { fetchProveedor } from "@/lib/api/proveedores";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { Proveedor } from "@/types/proveedor";

/**
 * Fetches the full proveedor by id whenever `proveedorId` changes. Shared by
 * the Ver and Editar dialogs so neither duplicates this fetch-by-id effect.
 */
export function useProveedorDetail(proveedorId: number | null) {
  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (proveedorId === null) return;
    let ignore = false;
    fetchProveedor(proveedorId)
      .then((data) => {
        if (ignore) return;
        setProveedor(data);
        setError(null);
        setLoadedId(proveedorId);
      })
      .catch((err) => {
        if (ignore) return;
        setError(extractApiErrorMessage(err, "No se pudo cargar el proveedor."));
        setLoadedId(proveedorId);
      });
    return () => {
      ignore = true;
    };
  }, [proveedorId]);

  const isLoading = proveedorId !== null && loadedId !== proveedorId;
  return { proveedor, isLoading, error, setProveedor };
}
