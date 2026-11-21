import type { Metadata } from "next";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AdoptionShell } from "@/components/ai-ecosystem/AdoptionShell";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export const metadata: Metadata = {
  title: "Book a Demo | Avatar AI Adoption",
  description: "Book a demo of Avatar AI Adoption tools for your business.",
  alternates: { canonical: "https://www.avatarindia.com/book-demo" },
};

/** AI Adoption Book a Demo at its clean URL (was /adoption/book-demo, which now redirects here — next.config.ts).
 * Same frame as before: the Google sign-in provider the /adoption/* pages share, plus the small AdoptionShell header. */
export default function BookDemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AdoptionShell>{children}</AdoptionShell>
    </GoogleOAuthProvider>
  );
}
