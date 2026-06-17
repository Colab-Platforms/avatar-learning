import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SITE } from "@/data/site";
import { ScrollProgress } from "@/components/ui";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: SITE.tagline,
  description: SITE.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ScrollProgress />
        {children}
      </body>
    </html>
  );
}
