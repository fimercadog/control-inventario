"use client";

import { useSyncExternalStore } from "react";
import { getEstadoContingencia, subscribeContingencia } from "@/lib/contingencia/store";

const serverSnapshot = { activo: false, operaciones: [] };

export function useContingencia() {
  return useSyncExternalStore(subscribeContingencia, getEstadoContingencia, () => serverSnapshot);
}
