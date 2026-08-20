"use client";

import { Check, Laptop, Moon, Sun } from "lucide-react";
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { actualizarPerfil } from "@/lib/api/perfil";
import { useSessionUser } from "@/hooks/use-permission";
import { useAppDispatch } from "@/store/hooks";
import { sessionActions } from "@/store/slices/session-slice";
import { useTheme } from "@/components/theme-provider";

type Theme = "light" | "dark" | "system";

const isThemePreference = (value: unknown): value is Theme =>
  value === "light" || value === "dark" || value === "system";

const options: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Laptop },
];

/** Reuses the existing profile preference; this only makes it accessible in the App Bar. */
export function ThemeMenu() {
  const dispatch = useAppDispatch();
  const user = useSessionUser();
  const { theme, setTheme } = useTheme();
  const current: Theme = isThemePreference(theme) ? theme : "system";

  async function selectTheme(theme: Theme) {
    if (!user || theme === current) return;
    const previous = user;
    setTheme(theme);
    dispatch(sessionActions.updateUser({ ...user, theme }));

    try {
      dispatch(sessionActions.updateUser(await actualizarPerfil({ theme })));
    } catch {
      setTheme(isThemePreference(previous.theme) ? previous.theme : "system");
      dispatch(sessionActions.updateUser(previous));
    }
  }

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuLabel>Apariencia</DropdownMenuLabel>
        {options.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem key={value} onClick={() => selectTheme(value)}>
            <Icon className="size-4" />
            {label}
            {current === value ? <Check className="ml-auto size-4 text-primary" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuGroup>
    </>
  );
}
