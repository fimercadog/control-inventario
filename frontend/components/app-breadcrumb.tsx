"use client";

import { usePathname } from "next/navigation";

/**
 * Mapa mínimo ruta → (grupo, título) para el breadcrumb del header
 * (RC1 Sidebar Oficial, regla "cada módulo debe tener... Breadcrumb").
 * Refleja la misma agrupación de `app-sidebar.tsx` — no se comparte el
 * mismo array a propósito, para no acoplar un componente de layout al
 * shape interno (íconos incluidos) del sidebar.
 */
const RUTAS: Record<string, { grupo?: string; titulo: string }> = {
  "/dashboard": { titulo: "Dashboard" },
  "/captura": { titulo: "Captura IA" },
  "/productos": { grupo: "Inventario", titulo: "Productos" },
  "/categorias": { grupo: "Inventario", titulo: "Categorías" },
  "/marcas": { grupo: "Inventario", titulo: "Marcas" },
  "/unidades-medida": { grupo: "Inventario", titulo: "Unidades de Medida" },
  "/stock": { grupo: "Inventario", titulo: "Stock" },
  "/movimientos": { grupo: "Inventario", titulo: "Movimientos" },
  "/proveedores": { grupo: "Terceros", titulo: "Proveedores" },
  "/clientes": { grupo: "Terceros", titulo: "Clientes" },
  "/usuarios": { grupo: "Administración", titulo: "Usuarios" },
  "/roles": { grupo: "Administración", titulo: "Roles" },
  "/auditoria": { grupo: "Administración", titulo: "Auditoría" },
  "/configuracion": { grupo: "Administración", titulo: "Configuración" },
  "/reportes": { titulo: "Reportes" },
  "/perfil": { titulo: "Perfil" },
  "/perfil/cambiar-contrasena": { titulo: "Cambiar contraseña" },
};

function tituloDesdeSegmento(segmento: string): string {
  return segmento
    .split("-")
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(" ");
}

export function AppBreadcrumb() {
  const pathname = usePathname();

  const raiz = "/" + (pathname.split("/")[1] ?? "");
  const entrada = RUTAS[pathname] ?? RUTAS[raiz];
  const titulo = entrada?.titulo ?? tituloDesdeSegmento(pathname.split("/").filter(Boolean).pop() ?? "");
  const grupo = entrada?.grupo;

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-muted-foreground">Fidel OS</span>
      {grupo && (
        <>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">{grupo}</span>
        </>
      )}
      <span className="text-muted-foreground">/</span>
      <span className="font-medium">{titulo}</span>
    </div>
  );
}
