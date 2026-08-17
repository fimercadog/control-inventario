"use client";

import { useBootstrapSession } from "@/hooks/use-bootstrap-session";

/** Kicks off session restoration once per app load. Renders nothing. */
export function SessionBootstrap() {
  useBootstrapSession();
  return null;
}
