import "./globals.css";
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import { SITE } from "@/data/site";
import { StoreProvider } from "@/store/StoreProvider";
import QueryProvider from "@/store/QueryProvider";
import { DeferredWidgets } from "@/components/ui/DeferredWidgets";
import { AnalyticsConsent } from "@/components/ui/AnalyticsConsent";
// import { IndependenceDayPromo } from "@/components/ui/IndependenceDayPromo";
import { ProfileCompletionGuard } from "@/components/auth/ProfileCompletionGuard";
import { WebinarPopup } from "@/app/direct2hire/WebinarPopup";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Used only for the AI Adoption Ecosystem hero headline.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
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
            {/* <IndependenceDayPromo /> */}
            <WebinarPopup />
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
