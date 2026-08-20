import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8000";
const staticExport = process.env.STATIC_EXPORT === "true";

const nextConfig: NextConfig = staticExport
  ? { devIndicators: false, output: "export" }
  : {
      devIndicators: false,
      async rewrites() {
        return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
      },
    };

export default nextConfig;
