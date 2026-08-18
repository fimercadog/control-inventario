"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ContingenciaBanner } from "@/components/layout/contingencia-banner";
import { useAppSelector } from "@/store/hooks";

/**
 * Reads session status only — does not itself trigger bootstrapSession(). The root
 * layout's <SessionBootstrap> is the single global trigger; also dispatching from here
 * would fire a second concurrent /auth/refresh call, and since refresh tokens rotate
 * on every use, the loser of that race gets a "session expired" instead of a session.
 */
export function AuthenticatedShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const status = useAppSelector((state) => state.session.status);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "idle" || status === "loading" || status === "unauthenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Cargando" />
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-5 md:p-8"><ContingenciaBanner />{children}</main>
      </div>
    </div>
  );
}
