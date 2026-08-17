import type { ReactNode } from "react";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";

export default function MovimientosLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedShell>{children}</AuthenticatedShell>;
}
