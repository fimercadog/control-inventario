"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSessionUser } from "@/hooks/use-permission";

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

  if (!user) return null;

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
    </div>
  );
}
