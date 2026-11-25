import type { Metadata } from "next";
import { LegalDoc } from "@/components/ai-ecosystem/legal/LegalDoc";
import { PRIVACY_POLICY } from "@/components/ai-ecosystem/legal/privacyPolicy";

export const metadata: Metadata = {
  title: "Privacy Policy | Avatar AI Adoption",
  description: "How Avatar Industries Limited collects, uses, and protects information through the Avatar AI Adoption platform.",
  // Same document, word for word, as /privacy-policy: canonical points there so search engines index one copy.
  alternates: { canonical: "https://www.avatarindia.com/privacy-policy" },
};

/** AI Adoption Privacy Policy (site navbar + footer, dark theme). Avatar Learning keeps its own page at /privacy-policy. */
export default function AdoptionPrivacyPolicyPage() {
  return <LegalDoc {...PRIVACY_POLICY} />;
}
