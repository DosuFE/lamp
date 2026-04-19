import type { NextConfig } from "next";

const backendBase = (
  process.env.BACKEND_PROXY_URL ?? "https://lamp-toz7.onrender.com"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendBase}/:path*`,
      },
    ];
  },
};

export default nextConfig;
