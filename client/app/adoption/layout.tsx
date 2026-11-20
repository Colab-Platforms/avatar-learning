import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

/**
 * All /adoption/* pages share the Google sign-in provider. Each page group
 * draws its own frame: the sign-in, account and book-demo pages use the small
 * AdoptionShell header; /adoption/about uses the full site navbar and footer.
 */
export default function AdoptionLayout({ children }: { children: React.ReactNode }) {
  return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{children}</GoogleOAuthProvider>;
}
