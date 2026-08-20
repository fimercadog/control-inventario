"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useSessionUser } from "@/hooks/use-permission";

const isThemePreference = (value: unknown): value is "light" | "dark" | "system" =>
  value === "light" || value === "dark" || value === "system";

/** Applies the signed-in user's persisted theme preference to the application shell. */
export function ThemeSync() {
  const userTheme = useSessionUser()?.theme;
  const { setTheme } = useTheme();

  useEffect(() => {
    if (isThemePreference(userTheme)) setTheme(userTheme);
  }, [setTheme, userTheme]);

  return null;
}
