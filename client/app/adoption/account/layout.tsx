import type { Metadata } from "next";
import { AdoptionShell } from "@/components/ai-ecosystem/AdoptionShell";

export const metadata: Metadata = {
  title: "My Account | Avatar AI Adoption",
  robots: { index: false },
};

export default function AdoptionAccountLayout({ children }: { children: React.ReactNode }) {
  return <AdoptionShell>{children}</AdoptionShell>;
}
