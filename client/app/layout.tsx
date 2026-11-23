import "./globals.css";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import { SITE } from "@/data/site";
import { StoreProvider } from "@/store/StoreProvider";
import QueryProvider from "@/store/QueryProvider";
import { DeferredWidgets } from "@/components/ui/DeferredWidgets";
import { AnalyticsConsent } from "@/components/ui/AnalyticsConsent";
import { ActivityTracker } from "@/components/analytics/ActivityTracker";
// import { IndependenceDayPromo } from "@/components/ui/IndependenceDayPromo";
import { ProfileCompletionGuard } from "@/components/auth/ProfileCompletionGuard";
import { WebinarPopup } from "@/app/direct2hire/WebinarPopup";

// Self-hosted (SIL Open Font License): the same variable latin files Google serves, so the build never depends on fetching
// fonts from Google (that fetch fails intermittently on Vercel builds: "Cannot read properties of null (reading '1')").
const inter = localFont({
  src: "./fonts/Inter-latin.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-inter",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

// Used only for the AI Adoption Ecosystem hero headline.
const spaceGrotesk = localFont({
  src: "./fonts/SpaceGrotesk-latin.woff2",
  weight: "500 700",
  style: "normal",
  variable: "--font-space-grotesk",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: SITE.tagline,
  description: SITE.description,
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
      </head>
      <body>
        <StoreProvider>
          <QueryProvider>
            <ProfileCompletionGuard>{children}</ProfileCompletionGuard>
            <DeferredWidgets />
            {/* Clarity, Google Tag Manager and Meta Pixel: public pages only, after the visitor accepts (see lib/clarityConsent.ts) */}
            <AnalyticsConsent />
            {/* Live Monitoring: first-party visit tracking, only after the visitor accepted analytics (lib/activityTracker.ts) */}
            <ActivityTracker />
            {/* <IndependenceDayPromo /> */}
            <WebinarPopup />
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
