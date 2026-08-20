import type { ReactNode } from "react";

/** Private user records are omitted from the static marketing package. */
export function generateStaticParams() {
  return [{ id: "static" }];
}

export default function UsuarioDetailLayout({ children }: { children: ReactNode }) {
  return children;
}
