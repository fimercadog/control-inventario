import type { MetadataRoute } from "next";

// BUG-004: mismo logotipo oficial (public/brand/logo.png) para favicon,
// app icon, manifest y Apple Touch Icon — sin iconos inconsistentes.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FidelOS — Control de Inventario",
    short_name: "FidelOS",
    description: "Control de inventario para bodegas y empresas: entradas, salidas, stock y reportes en un solo lugar.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/brand/logo.png",
        sizes: "1024x1024",
        type: "image/png",
      },
    ],
  };
}
