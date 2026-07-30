import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // BUG-008: oculta el indicador flotante de desarrollo de Next.js (el
  // círculo con la "N") — no debe aparecer en demos ni en producción.
  devIndicators: false,
};

export default nextConfig;
