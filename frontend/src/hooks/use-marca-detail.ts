import { useEffect, useState } from "react";
import { fetchMarca } from "@/lib/api/marcas";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { Marca } from "@/types/marca";

/**
 * Fetches the full brand by id whenever `marcaId` changes. Shared by the Ver and Editar
 * dialogs so neither duplicates this fetch-by-id effect.
 */
export function useMarcaDetail(marcaId: number | null) {
  const [marca, setMarca] = useState<Marca | null>(null);
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (marcaId === null) return;
    let ignore = false;
    fetchMarca(marcaId)
      .then((data) => {
        if (ignore) return;
        setMarca(data);
        setError(null);
        setLoadedId(marcaId);
      })
      .catch((err) => {
        if (ignore) return;
        setError(extractApiErrorMessage(err, "No se pudo cargar la marca."));
        setLoadedId(marcaId);
      });
    return () => {
      ignore = true;
    };
  }, [marcaId]);

  const isLoading = marcaId !== null && loadedId !== marcaId;
  return { marca, isLoading, error, setMarca };
}
