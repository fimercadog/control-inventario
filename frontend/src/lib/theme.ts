export type ThemePreference = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "fidelos-theme";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

/** Applies the preference synchronously so a user action never waits for React or the API. */
export function applyThemePreference(theme: ThemePreference) {
  const root = document.documentElement;
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  root.classList.toggle("dark", theme === "dark" || (theme === "system" && systemPrefersDark));
  root.dataset.theme = theme;
}

export function persistThemePreference(theme: ThemePreference) {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function storedThemePreference(): ThemePreference {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(stored) ? stored : "system";
}
