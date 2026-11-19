import type { Metadata } from "next";
import { AdoptionShell } from "@/components/ai-ecosystem/AdoptionShell";

export const metadata: Metadata = {
  title: "Thank You | Avatar AI Adoption",
  description: "Your demo request has been submitted.",
  robots: { index: false }, // a post-submission page, not for search results
};

export default function ThankYouLayout({ children }: { children: React.ReactNode }) {
  return <AdoptionShell>{children}</AdoptionShell>;
}
