"use client";

import { useLayoutEffect } from "react";
import { useSessionUser } from "@/hooks/use-permission";
import {
  applyThemePreference,
  isThemePreference,
  persistThemePreference,
  storedThemePreference,
} from "@/lib/theme";

/** Applies the signed-in user's persisted theme preference to the application shell. */
export function ThemeSync() {
  const userTheme = useSessionUser()?.theme;

  useLayoutEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const theme = isThemePreference(userTheme) ? userTheme : storedThemePreference();

    if (isThemePreference(userTheme)) {
      persistThemePreference(userTheme);
    }

    function applyTheme() {
      applyThemePreference(theme);
    }

    applyTheme();
    media.addEventListener("change", applyTheme);

    return () => media.removeEventListener("change", applyTheme);
  }, [userTheme]);

  return null;
}
