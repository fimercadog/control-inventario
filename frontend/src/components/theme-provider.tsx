"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";
type ThemeContextValue = { theme: Theme; resolvedTheme: "light" | "dark"; setTheme: (theme: Theme) => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);
const fallbackValue: ThemeContextValue = { theme: "system", resolvedTheme: "light", setTheme: () => undefined };

function systemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Theme context without next-themes' inline script, which React 19 rejects in Next 16 dev mode. */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  enableSystem = true,
  storageKey = "fidelos-theme",
}: {
  children: ReactNode;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  storageKey?: string;
  attribute?: "class";
  disableTransitionOnChange?: boolean;
}) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    const stored = window.localStorage.getItem(storageKey);
    return stored === "light" || stored === "dark" || (enableSystem && stored === "system") ? stored : defaultTheme;
  });
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(enableSystem || nextTheme !== "system" ? nextTheme : "light");
  }, [enableSystem]);

  useEffect(() => {
    const resolve = () => setResolvedTheme(theme === "system" ? systemTheme() : theme);
    resolve();
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", resolve);
    return () => media.removeEventListener("change", resolve);
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    document.documentElement.style.colorScheme = resolvedTheme;
    window.localStorage.setItem(storageKey, theme);
  }, [resolvedTheme, storageKey, theme]);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [resolvedTheme, setTheme, theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext) ?? fallbackValue;
}
