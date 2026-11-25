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
      // The AI Adoption About page moved to /about (Avatar Learning's About is now /learning/about).
      { source: "/adoption/about", destination: "/about", permanent: true },
    ];
  },
  // Keep private, transactional and utility pages out of search results. A header (rather than robots.txt
  // Disallow) so crawlers can still fetch the page and see the noindex. Public content pages are not listed.
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [
      // Signed-in areas
      "/admin/:path*",
      "/dashboard/:path*",
      "/partner-dashboard/:path*",
      "/profile",
      "/onboarded",
      "/partners/onboarding",
      // Sign-in / account flows (Avatar Learning; the /adoption/* ones already set noindex metadata)
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
      "/complete-profile",
      // Purchase / course-progress steps
      "/courses/:id/enroll",
      "/courses/:id/learn",
      "/courses/:id/success",
      "/courses/:id/assessment/:path*",
      "/direct2hire/success",
      // Placeholder and design-export pages (/home duplicates the homepage)
      "/coming-soon",
      "/home",
      "/home-revamp/:path*",
    ].map((source) => ({ source, headers: noindex }));
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
