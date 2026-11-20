"use client";

import { useEffect, useState } from "react";
import { DemoRequestForm } from "@/components/ai-ecosystem/DemoRequestForm";
import { useAdoptionSession } from "@/lib/adoptionSession";
import { Heading } from "../_components/ui";
import { BackLink } from "../_components/form";

/**
 * Book a Demo for AI Adoption, as its own page (used from the account
 * dashboard). Same form as the homepage; signed-in customers get their name
 * and email filled in. ?tools=CRM,HRMS pre-ticks tools.
 */
export default function AdoptionBookDemoPage() {
  const { status, user } = useAdoptionSession();
  const [tools, setTools] = useState<string[] | null>(null);

  useEffect(() => {
    setTools((new URLSearchParams(window.location.search).get("tools") ?? "").split(",").filter(Boolean));
  }, []);

  const ready = status !== "loading" && tools !== null;

  return (
    <div style={{ width: "100%", maxWidth: 680, borderRadius: 24, padding: 1, background: "linear-gradient(180deg,rgba(143,233,242,.4),rgba(255,255,255,.06) 50%)" }}>
      <div style={{ borderRadius: 23, background: "#0b0d12", padding: "clamp(24px,5vw,40px)", display: "flex", flexDirection: "column", gap: 24 }}>
        {user && <BackLink href="/adoption/account">Back to my account</BackLink>}
        <Heading title="Book a Demo" subtitle="Tell us about your business and the tools you'd like to see. We reply within 1 business day." />
        {ready ? (
          // Remount once the session is known so the signed-in name/email are filled in.
          <DemoRequestForm key={user?.id ?? "guest"} prefill={user ? { name: user.fullName, email: user.email, company: user.companyName ?? undefined } : undefined} initialTools={tools} />
        ) : (
          <p style={{ margin: 0, color: "#a3abb5" }} aria-live="polite">Loading…</p>
        )}
      </div>
    </div>
  );
}
