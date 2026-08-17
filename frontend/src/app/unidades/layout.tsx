import type { ReactNode } from "react";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";

export default function UnidadesMedidaLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedShell>{children}</AuthenticatedShell>;
}
