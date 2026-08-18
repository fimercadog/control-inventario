"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Moon, Sun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useSessionUser } from "@/hooks/use-permission";
import { useAppDispatch } from "@/store/hooks";
import { sessionActions } from "@/store/slices/session-slice";
import { actualizarPerfil } from "@/lib/api/perfil";
import { extractApiErrorMessage } from "@/lib/api/errors";

/**
 * No existe EmpresaController ni ConfiguracionController en el backend real (confirmado —
 * ver frontend/incidentes/INCIDENTES.md, INC-005). El propio manual lo confirma
 * explícitamente: "Los campos de 'Empresa' en Configuración (Nombre, Zona horaria) y el
 * umbral de Captura IA se muestran solo como información — no son editables... Este manual
 * no describe una capacidad de edición que no existe."
 *
 * Esta pantalla muestra únicamente lo que SÍ tiene una fuente de datos real: el nombre de la
 * empresa (ya viene en GET /auth/me). "Zona horaria" y "umbral de Captura IA" no se muestran
 * aquí — no existe ningún endpoint que exponga un valor real para ninguno de los dos (ni a
 * nivel de Empresa ni como un ajuste de Captura IA independiente); mostrarlos sería inventar
 * información, algo que spec.md prohíbe explícitamente. La zona horaria que el sistema sí
 * gestiona es la del propio usuario, ya editable en Mi Perfil.
 */
export default function ConfiguracionPage() {
  const user = useSessionUser();
  const dispatch = useAppDispatch();
  const [savingTheme, setSavingTheme] = useState(false);
  const [themeError, setThemeError] = useState<string | null>(null);

  if (!user) return null;

  const darkThemeEnabled = user.theme === "dark";

  async function toggleDarkTheme() {
    setSavingTheme(true);
    setThemeError(null);
    try {
      const updated = await actualizarPerfil({ theme: darkThemeEnabled ? "light" : "dark" });
      dispatch(sessionActions.updateUser(updated));
    } catch (error) {
      setThemeError(extractApiErrorMessage(error, "No se pudo actualizar el tema."));
    } finally {
      setSavingTheme(false);
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground">Información general de tu empresa en FidelOS.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Empresa</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Nombre</p>
            <p className="text-sm text-foreground">{user.empresa?.nombre ?? "—"}</p>
          </div>
          <Alert>
            <AlertDescription>
              Esta información es solo de consulta — no es editable desde esta pantalla en la
              versión actual del sistema.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Apariencia</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-foreground">Modo oscuro</p>
              <p className="text-sm text-muted-foreground">Usa una interfaz azul-violeta profunda para una visualización más cómoda.</p>
            </div>
            <Button variant="outline" onClick={toggleDarkTheme} disabled={savingTheme} className="w-fit">
              {savingTheme ? <Loader2 className="size-4 animate-spin" /> : darkThemeEnabled ? <Sun className="size-4" /> : <Moon className="size-4" />}
              {darkThemeEnabled ? "Usar modo claro" : "Activar modo oscuro"}
            </Button>
          </div>
          {themeError ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{themeError}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Más preferencias</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            El idioma y la zona horaria son preferencias personales, no de la empresa — se
            administran desde tu perfil.
          </p>
          <Button variant="outline" className="w-fit" nativeButton={false} render={<Link href="/perfil" />}>
            Ir a Mi Perfil
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
