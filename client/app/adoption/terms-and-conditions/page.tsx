import type { Metadata } from "next";
import { LegalDoc } from "@/components/ai-ecosystem/legal/LegalDoc";
import { TERMS_AND_CONDITIONS } from "@/components/ai-ecosystem/legal/termsAndConditions";

export const metadata: Metadata = {
  title: "Terms & Conditions | Avatar AI Adoption",
  description: "Terms governing your use of the Avatar AI Adoption platform, operated by Avatar Industries Limited.",
  alternates: { canonical: "https://www.avatarindia.com/adoption/terms-and-conditions" },
};

/** AI Adoption Terms & Conditions (site navbar + footer, dark theme). Avatar Learning keeps its own page at /terms-and-conditions. */
export default function AdoptionTermsPage() {
  return <LegalDoc {...TERMS_AND_CONDITIONS} />;
}
