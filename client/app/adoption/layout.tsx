import type { Metadata } from "next";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AdoptionShell } from "@/components/ai-ecosystem/AdoptionShell";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export const metadata: Metadata = {
  title: "Login | Avatar AI Adoption",
  description: "Sign in or create an account to get started.",
  robots: { index: false },
};

/** Dark shell for the AI Adoption account pages (separate from the learning platform's /login). Each page group draws its own card. */
export default function AdoptionAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AdoptionShell>{children}</AdoptionShell>
    </GoogleOAuthProvider>
  );
}
