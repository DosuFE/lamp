import type { NextConfig } from "next";

const backendBase = (
  process.env.BACKEND_PROXY_URL ??
  (process.env.NODE_ENV === "development"
    ? "http://localhost:5051"
    : "https://lamp-toz7.onrender.com")
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
