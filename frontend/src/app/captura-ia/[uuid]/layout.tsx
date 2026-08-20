import type { ReactNode } from "react";

/** Private capture records are omitted from the static marketing package. */
export function generateStaticParams() {
  return [{ uuid: "static" }];
}

export default function CapturaDetailLayout({ children }: { children: ReactNode }) {
  return children;
}
