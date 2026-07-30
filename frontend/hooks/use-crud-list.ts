"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PaginatedItems } from "@/lib/api/types";

/**
 * Global UI Standard (aprobado 2026-07-29, docs/03_FUNCTIONAL_SPEC/RC1_GAP_ANALYSIS.md):
 * toda mutación (Crear/Editar/Deshabilitar/Habilitar) debe invalidar y
 * recargar la lista desde el backend — nunca parchear el arreglo local a
 * mano. Este hook centraliza esa recarga: cada pantalla de lista llama
 * `refetch()` tras una mutación exitosa, y como el fetcher recibido ya
 * encapsula los filtros/página/orden vigentes, la recarga los preserva
 * automáticamente sin que el llamador tenga que repetir esa lógica.
 *
 * `deps` deben ser los mismos valores (búsqueda, filtro de estado, página)
 * que ya usa el `fetcher` — cuando cambian, se dispara un refetch nuevo
 * igual que antes de este hook; el punto no es evitar ese refetch, es
 * eliminar el parcheo manual de `items` en cada dialog de Crear/Editar/Delete.
 */
export function useCrudList<T>(fetcher: () => Promise<PaginatedItems<T>>, deps: unknown[] = []) {
  const [items, setItems] = useState<T[]>([]);
  const [meta, setMeta] = useState<PaginatedItems<T>["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    return fetcherRef
      .current()
      .then((result) => {
        setItems(result.items);
        setMeta(result.meta);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No pudimos cargar los datos.");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { items, meta, loading, error, refetch };
}
