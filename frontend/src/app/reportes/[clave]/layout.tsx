import type { ReactNode } from "react";

/** Private report previews are omitted from the static marketing package. */
export function generateStaticParams() {
  return [{ clave: "static" }];
}

export default function ReportePreviewLayout({ children }: { children: ReactNode }) {
  return children;
}
