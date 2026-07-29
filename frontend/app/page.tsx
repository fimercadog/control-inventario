"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

export default function Home() {
  const router = useRouter();
  const { status } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (status === "idle" || status === "loading") return;
    router.replace(status === "authenticated" ? "/dashboard" : "/login");
  }, [status, router]);

  return (
    <div className="flex min-h-svh flex-1 items-center justify-center bg-background">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}
