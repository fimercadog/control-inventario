import type { ReactNode } from "react";

/** The authenticated product detail remains dynamic in normal deployments.
 * Static marketing exports intentionally omit private detail records. */
export function generateStaticParams() {
  return [{ id: "static" }];
}

export default function ProductoDetailLayout({ children }: { children: ReactNode }) {
  return children;
}
