"use client";

import Link from "next/link";
import { Divider, GoogleButton, Heading, LegalNote, focusRing, primaryBtn, primaryHover, secondaryBtn, secondaryHover, useSignedInRedirect } from "../_components/ui";

const mailIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 6.5 8.5 6 8.5-6" />
  </svg>
);

export default function AdoptionLoginPage() {
  const signedIn = useSignedInRedirect();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <Heading title="Welcome to Avatar AI Adoption" subtitle="Sign in or create an account to get started." />
      {signedIn ? (
        <p style={{ margin: 0, color: "#a3abb5" }}>You&apos;re signed in. Opening your account…</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <GoogleButton text="continue_with" />
          <Link href="/adoption/login/email" className={`${focusRing} ${secondaryHover}`} style={secondaryBtn}>
            {mailIcon}
            Continue with Email
          </Link>
          <Divider />
          <Link href="/adoption/signup" className={`${focusRing} ${primaryHover}`} style={primaryBtn}>
            Create an Account
          </Link>
        </div>
      )}
      <LegalNote />
    </div>
  );
}
