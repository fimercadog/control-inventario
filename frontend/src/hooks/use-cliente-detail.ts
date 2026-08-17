import { useEffect, useState } from "react";
import { fetchCliente } from "@/lib/api/clientes";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { Cliente } from "@/types/cliente";

/**
 * Fetches the full customer by id whenever `clienteId` changes. Shared by the Ver and Editar
 * dialogs so neither duplicates this fetch-by-id effect.
 */
export function useClienteDetail(clienteId: number | null) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clienteId === null) return;
    let ignore = false;
    fetchCliente(clienteId)
      .then((data) => {
        if (ignore) return;
        setCliente(data);
        setError(null);
        setLoadedId(clienteId);
      })
      .catch((err) => {
        if (ignore) return;
        setError(extractApiErrorMessage(err, "No se pudo cargar el cliente."));
        setLoadedId(clienteId);
      });
    return () => {
      ignore = true;
    };
  }, [clienteId]);

  const isLoading = clienteId !== null && loadedId !== clienteId;
  return { cliente, isLoading, error, setCliente };
}
