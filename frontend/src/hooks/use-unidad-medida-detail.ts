import { useEffect, useState } from "react";
import { fetchUnidadMedida } from "@/lib/api/unidades-medida";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { UnidadMedida } from "@/types/unidad-medida";

/**
 * Fetches the full unit of measure by id whenever `unidadMedidaId` changes. Shared by the
 * Ver and Editar dialogs so neither duplicates this fetch-by-id effect.
 */
export function useUnidadMedidaDetail(unidadMedidaId: number | null) {
  const [unidadMedida, setUnidadMedida] = useState<UnidadMedida | null>(null);
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (unidadMedidaId === null) return;
    let ignore = false;
    fetchUnidadMedida(unidadMedidaId)
      .then((data) => {
        if (ignore) return;
        setUnidadMedida(data);
        setError(null);
        setLoadedId(unidadMedidaId);
      })
      .catch((err) => {
        if (ignore) return;
        setError(extractApiErrorMessage(err, "No se pudo cargar la unidad de medida."));
        setLoadedId(unidadMedidaId);
      });
    return () => {
      ignore = true;
    };
  }, [unidadMedidaId]);

  const isLoading = unidadMedidaId !== null && loadedId !== unidadMedidaId;
  return { unidadMedida, isLoading, error, setUnidadMedida };
}
