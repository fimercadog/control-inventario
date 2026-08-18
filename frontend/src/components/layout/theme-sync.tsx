"use client";

import { useEffect } from "react";
import { useSessionUser } from "@/hooks/use-permission";

/** Applies the signed-in user's persisted theme preference to the application shell. */
export function ThemeSync() {
  const theme = useSessionUser()?.theme ?? "system";

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    function applyTheme() {
      root.classList.toggle("dark", theme === "dark" || (theme === "system" && media.matches));
    }

    applyTheme();
    media.addEventListener("change", applyTheme);

    return () => media.removeEventListener("change", applyTheme);
  }, [theme]);

  return null;
}
