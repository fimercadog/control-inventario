"use client";

import { useEffect, type ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { wireSessionBridge } from "@/store/session-bridge";

export function StoreProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    wireSessionBridge();
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
