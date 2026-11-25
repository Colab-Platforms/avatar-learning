import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

/**
 * All /adoption/* pages share the Google sign-in provider. Each page group
 * draws its own frame: the sign-in, account and book-demo pages use the small
 * AdoptionShell header. (The AI Adoption About page lives at /about.)
 */
export default function AdoptionLayout({ children }: { children: React.ReactNode }) {
  return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{children}</GoogleOAuthProvider>;
}
