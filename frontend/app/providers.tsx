"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { useRouter } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { makeStore, type AppStore } from "@/store/store";
import { bootstrapAuth, sessionExpired } from "@/store/slices/auth-slice";
import { setOnSessionExpired } from "@/lib/api/auth-token";

function AuthBootstrap({ store }: { store: AppStore }) {
  const router = useRouter();

  useEffect(() => {
    store.dispatch(bootstrapAuth());

    setOnSessionExpired(() => {
      store.dispatch(sessionExpired());
      router.replace("/login");
    });

    return () => setOnSessionExpired(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => makeStore());

  return (
    <Provider store={store}>
      <AuthBootstrap store={store} />
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <TooltipProvider delay={200}>
          {children}
          <Toaster richColors position="top-center" />
        </TooltipProvider>
      </ThemeProvider>
    </Provider>
  );
}
