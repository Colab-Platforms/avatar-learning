import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    qualities: [75, 95, 100],
  },
  // face-api.js (used by GridScan) pulls in Node's `fs` (absent in the browser bundle) and
  // node-fetch's optional `encoding` package; stub both so the build stays warning-free.
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      encoding: false,
      ...(isServer ? {} : { fs: false }),
    };
    return config;
  },
};

export default nextConfig;
