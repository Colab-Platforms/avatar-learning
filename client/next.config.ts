import type { NextConfig } from "next";
import { checkApiBase, API_BASE_VAR } from "./lib/apiBaseCheck";

// Vercel Preview builds must have their own development API. Fail the BUILD (clearly) rather than ship a Preview that
// would silently call the production backend. Production, local dev and non-Vercel builds are not affected.
const apiCheck = checkApiBase(process.env.VERCEL_ENV, process.env[API_BASE_VAR]);
if (!apiCheck.ok) {
  throw new Error(`\n\n[avatar-learning] Preview build blocked: ${apiCheck.reason}\n`);
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Lets the browser bundle know which Vercel environment it was built for (see lib/apiBase.ts).
  env: { NEXT_PUBLIC_DEPLOY_ENV: process.env.VERCEL_ENV ?? "" },
  // /home serves the revamped homepage exported from the design tool, as-is
  // (static files in public/home-revamp). beforeFiles so it wins over app routes.
  // The AI Adoption Ecosystem page (/) and Avatar Learning (/learning) are untouched.
  async rewrites() {
    return {
      beforeFiles: [{ source: "/home", destination: "/home-revamp/index.html" }],
      afterFiles: [],
      fallback: [],
    };
  },
  // AI Adoption "Insights" was renamed to "Blogs": keep old links and search results working.
  async redirects() {
    return [
      { source: "/insights", destination: "/blogs", permanent: true },
      { source: "/insights/:slug", destination: "/blogs/:slug", permanent: true },
      // Book a Demo moved to its clean URL; the query (e.g. ?tools=CRM) is kept automatically.
      { source: "/adoption/book-demo", destination: "/book-demo", permanent: true },
    ];
  },
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
