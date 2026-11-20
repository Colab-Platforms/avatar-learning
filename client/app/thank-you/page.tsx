"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdoptionSession } from "@/lib/adoptionSession";
import { readDemoConfirmation, trackDemoLeadOnce, type DemoConfirmation } from "@/lib/demoConfirmation";
import { focusRing, primaryBtn, primaryHover, secondaryBtn, secondaryHover } from "@/app/adoption/_components/ui";

const PRODUCT_NAMES: Record<string, string> = {
  CRM: "CRM",
  OMS: "OMS",
  SCRIPT_AUTOMATION: "Script Automation",
  LMS: "LMS",
  RECRUITMENT_CRM: "Recruitment CRM",
  HRMS: "HRMS",
  IMS: "IMS",
  CUSTOM: "Custom Tools",
};

const STEPS = [
  { title: "Requirement Review", text: "Our team reviews your business requirements and selected AI tools." },
  { title: "Demo Coordination", text: "Our team contacts you to arrange a suitable product demonstration." },
  { title: "Explore Solutions", text: "Discover how Avatar AI Adoption tools can support your business operations." },
];

const btn = (base: React.CSSProperties): React.CSSProperties => ({ ...base, width: "auto", padding: "0 24px", flex: "1 1 180px" });
const headingStyle: React.CSSProperties = { margin: 0, fontSize: "clamp(28px,4.6vw,40px)", lineHeight: 1.1, letterSpacing: "-0.03em", fontWeight: 600, textWrap: "balance", background: "linear-gradient(180deg,#fff 40%,#8e98a4)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" };

/**
 * The confirmed lead-conversion page for performance campaigns.
 *
 * Reached only by a full page load right after the backend has saved a demo
 * request (the form stores that confirmation in this tab's sessionStorage —
 * nothing is read from the URL). Visits without a confirmed submission (direct
 * links, bookmarks, new tabs, ad-preview clicks) are sent straight to the Book
 * a Demo form, so a view of /thank-you always means a real submission.
 * Conversion events fire once per request id, never again on refresh.
 */
export default function ThankYouPage() {
  const { status, user } = useAdoptionSession();
  const [confirmation, setConfirmation] = useState<DemoConfirmation | null | undefined>(undefined);

  useEffect(() => {
    const c = readDemoConfirmation();
    if (!c) {
      // Not a confirmed submission: don't render the conversion page at all.
      window.location.replace("/adoption/book-demo");
      return;
    }
    setConfirmation(c);
    trackDemoLeadOnce(c); // once per request id, even across refreshes
  }, []);

  const signedIn = status === "signedIn" && !!user;
  const secondary = signedIn ? { href: "/adoption/account#demos", label: "My Account" } : { href: "/", label: "Back to Home" };

  return (
    <div style={{ width: "100%", maxWidth: 640, borderRadius: 24, padding: 1, background: "linear-gradient(180deg,rgba(143,233,242,.4),rgba(255,255,255,.06) 50%)" }}>
      <div style={{ borderRadius: 23, background: "#0b0d12", padding: "clamp(28px,5vw,48px)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 22 }}>
        {confirmation === undefined ? (
          <p style={{ margin: 0, color: "#a3abb5" }} aria-live="polite">Loading…</p>
        ) : confirmation ? (
          <>
            <div aria-hidden="true" style={{ width: 56, height: 56, borderRadius: "50%", border: "1px solid rgba(111,227,239,.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#8fe9f2", boxShadow: "0 0 32px rgba(111,227,239,.18)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <h1 style={headingStyle}>Thank You for Your Interest!</h1>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.5, color: "#f4f6f8" }}>Your demo request has been submitted successfully.</p>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "#a3abb5" }}>Our team will review your requirements and contact you to discuss the next steps.</p>
            </div>

            <dl style={{ margin: 0, width: "100%", display: "flex", flexDirection: "column", gap: 6, padding: "14px 16px", borderRadius: 14, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.02)", textAlign: "left", fontSize: 14 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <dt style={{ color: "#8a939e" }}>Request ID:</dt>
                <dd style={{ margin: 0, color: "#f4f6f8", fontFamily: "var(--font-geist-mono), ui-monospace, monospace", wordBreak: "break-all" }}>{confirmation.id}</dd>
              </div>
              {confirmation.tools.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <dt style={{ color: "#8a939e" }}>Tools:</dt>
                  <dd style={{ margin: 0, color: "#8fe9f2" }}>{confirmation.tools.map((t) => PRODUCT_NAMES[t] ?? t).join(", ")}</dd>
                </div>
              )}
            </dl>

            <section aria-labelledby="next-h" style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
              <h2 id="next-h" style={{ margin: 0, fontSize: 13, letterSpacing: ".06em", textTransform: "uppercase", color: "#8a939e", fontWeight: 500 }}>What happens next</h2>
              <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {STEPS.map((s, i) => (
                  <li key={s.title} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 16px", borderRadius: 14, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.02)" }}>
                    <span aria-hidden="true" style={{ flex: "none", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#8fe9f2", border: "1px solid rgba(111,227,239,.35)", background: "rgba(111,227,239,.06)" }}>{i + 1}</span>
                    <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <strong style={{ fontSize: 15, fontWeight: 600, color: "#f4f6f8" }}>{s.title}</strong>
                      <span style={{ fontSize: 14, lineHeight: 1.5, color: "#a3abb5" }}>{s.text}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            {signedIn && <p style={{ margin: 0, fontSize: 13.5, color: "#8a939e" }}>You can track this request under My Account → Demo requests.</p>}

            <div style={{ width: "100%", display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/tools" className={`${focusRing} ${primaryHover}`} style={btn(primaryBtn)}>Explore AI Tools</Link>
              <Link href={secondary.href} className={`${focusRing} ${secondaryHover}`} style={btn(secondaryBtn)}>{secondary.label}</Link>
            </div>
          </>
        ) : (
          <p style={{ margin: 0, color: "#a3abb5" }} aria-live="polite">Taking you to the demo form…</p>
        )}
      </div>
    </div>
  );
}
