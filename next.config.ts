import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow all tunnel origins for local testing and HMR
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "*.localtunnel.me",
    "localhost:3000",
    "127.0.0.1:3000"
  ],
};

export default nextConfig;
