import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SITE } from "@/data/site";
import { ScrollProgress } from "@/components/ui";
import { StoreProvider } from "@/store/StoreProvider";
import QueryProvider from "@/store/QueryProvider";
import ChatbotAgent from "@/components/ui/ChatbotAgent";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
    <html lang="en" className={inter.variable}>
      <body>
        <StoreProvider>
          <QueryProvider>
            <ScrollProgress />
            {children}
            <ChatbotAgent />
          </QueryProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
