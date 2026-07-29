"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";

/**
 * Puerta de acceso de las pantallas autenticadas. `status` arranca en
 * 'idle' mientras Providers intenta el refresh silencioso contra la
 * cookie httpOnly; solo se redirige a /login una vez que ese resultado
 * ya se conoce ('unauthenticated'), para no bounce-ear a un usuario con
 * sesión válida durante una recarga de página.
 */
export function useRequireAuth() {
  const router = useRouter();
  const { user, status } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  return { user, ready: status === "authenticated" && !!user };
}
