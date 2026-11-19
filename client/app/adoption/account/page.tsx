"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adoptionAuth, useAdoptionSession } from "@/lib/adoptionSession";
import { Heading, focusRing, primaryBtn, primaryHover, secondaryBtn, secondaryHover } from "../_components/ui";

// Display names for AdoptionProduct values from the backend.
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

/**
 * AI Adoption account landing page (protected). Shows only the tools this
 * account has been granted — none by default — until the product dashboard exists.
 */
export default function AdoptionAccountPage() {
  const router = useRouter();
  const { status, user } = useAdoptionSession();

  useEffect(() => {
    if (status === "signedOut") router.replace("/adoption/login?next=/adoption/account");
  }, [status, router]);

  if (status !== "signedIn" || !user) {
    return <p style={{ margin: 0, color: "#a3abb5" }} aria-live="polite">{status === "loading" ? "Loading your account…" : "Taking you to sign in…"}</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Heading title={`Hi, ${user.fullName.split(" ")[0]}`} subtitle={user.email} />

      <section aria-labelledby="tools-heading" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 id="tools-heading" style={{ margin: 0, fontSize: 13, letterSpacing: ".06em", textTransform: "uppercase", color: "#8a939e", fontWeight: 500 }}>
          Your tools
        </h2>
        {user.products.length === 0 ? (
          <div style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.02)", padding: 16, fontSize: 14, lineHeight: 1.55, color: "#a3abb5" }}>
            No tools are active on your account yet. Our team sets up access to CRM, HRMS, OMS and the other tools for your business. Book a demo and we&apos;ll get you started.
          </div>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 8 }}>
            {user.products.map((p) => (
              <li key={p} style={{ borderRadius: 12, border: "1px solid rgba(111,227,239,.25)", background: "rgba(111,227,239,.05)", padding: "12px 14px", fontSize: 14, color: "#f4f6f8" }}>
                {PRODUCT_NAMES[p] ?? p}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {user.products.length === 0 && (
          <Link href="/#demo-form" className={`${focusRing} ${primaryHover}`} style={primaryBtn}>
            Book a Demo
          </Link>
        )}
        <button
          type="button"
          onClick={async () => {
            await adoptionAuth.logout();
            router.replace("/");
          }}
          className={`${focusRing} ${secondaryHover}`}
          style={secondaryBtn}
        >
          Log out
        </button>
      </div>
    </div>
  );
}
