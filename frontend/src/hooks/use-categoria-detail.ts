import { useEffect, useState } from "react";
import { fetchCategoria } from "@/lib/api/categorias";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { Categoria } from "@/types/categoria";

/**
 * Fetches the full category by id whenever `categoriaId` changes. Shared by the Ver and
 * Editar dialogs so neither duplicates this fetch-by-id effect.
 */
export function useCategoriaDetail(categoriaId: number | null) {
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (categoriaId === null) return;
    let ignore = false;
    fetchCategoria(categoriaId)
      .then((data) => {
        if (ignore) return;
        setCategoria(data);
        setError(null);
        setLoadedId(categoriaId);
      })
      .catch((err) => {
        if (ignore) return;
        setError(extractApiErrorMessage(err, "No se pudo cargar la categoría."));
        setLoadedId(categoriaId);
      });
    return () => {
      ignore = true;
    };
  }, [categoriaId]);

  const isLoading = categoriaId !== null && loadedId !== categoriaId;
  return { categoria, isLoading, error, setCategoria };
}
