import { useEffect, useState } from "react";
import { fetchRole } from "@/lib/api/roles";
import { extractApiErrorMessage } from "@/lib/api/errors";
import type { Role } from "@/types/role";

/**
 * Fetches the full role (with its real `permisos` array — the list/index response only
 * has `permisos_count`, not the actual names) whenever `roleId` changes. Shared by the
 * Ver and Editar dialogs so neither duplicates this fetch-by-id effect.
 */
export function useRoleDetail(roleId: number | null) {
  const [role, setRole] = useState<Role | null>(null);
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (roleId === null) return;
    let ignore = false;
    fetchRole(roleId)
      .then((data) => {
        if (ignore) return;
        setRole(data);
        setError(null);
        setLoadedId(roleId);
      })
      .catch((err) => {
        if (ignore) return;
        setError(extractApiErrorMessage(err, "No se pudo cargar el rol."));
        setLoadedId(roleId);
      });
    return () => {
      ignore = true;
    };
  }, [roleId]);

  const isLoading = roleId !== null && loadedId !== roleId;
  return { role, isLoading, error, setRole };
}
