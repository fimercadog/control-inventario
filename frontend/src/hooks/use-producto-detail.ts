import { useEffect, useState } from "react";
import { fetchProducto } from "@/lib/api/productos";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { Producto } from "@/types/producto";

/**
 * Fetches the full product by id whenever `productoId` changes. Shared by the Editar dialog
 * and the standalone Ficha page.
 */
export function useProductoDetail(productoId: number | null) {
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productoId === null) return;
    let ignore = false;
    fetchProducto(productoId)
      .then((data) => {
        if (ignore) return;
        setProducto(data);
        setError(null);
        setLoadedId(productoId);
      })
      .catch((err) => {
        if (ignore) return;
        setError(extractApiErrorMessage(err, "No se pudo cargar el producto."));
        setLoadedId(productoId);
      });
    return () => {
      ignore = true;
    };
  }, [productoId]);

  const isLoading = productoId !== null && loadedId !== productoId;
  return { producto, isLoading, error, setProducto };
}
