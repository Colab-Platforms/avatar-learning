import type { Metadata } from "next";
import { AdoptionShell } from "@/components/ai-ecosystem/AdoptionShell";

export const metadata: Metadata = {
  title: "Book a Demo | Avatar AI Adoption",
  description: "Book a demo of Avatar AI Adoption tools for your business.",
};

export default function AdoptionBookDemoLayout({ children }: { children: React.ReactNode }) {
  return <AdoptionShell>{children}</AdoptionShell>;
}
