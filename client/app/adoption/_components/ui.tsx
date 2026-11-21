"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { adoptionAuth, useAdoptionSession, AdoptionApiError, consumeStaffRedirect } from "@/lib/adoptionSession";

/** Where people land after signing in: their AI Adoption account page. */
export const AFTER_LOGIN = "/adoption/account";

export const ERROR_COLOR = "#ff8a8a";

// Same input look as the Book a Demo form.
export const fieldStyle: React.CSSProperties = {
  height: 48,
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,.1)",
  background: "rgba(255,255,255,.03)",
  color: "#f4f6f8",
  padding: "0 14px",
  fontSize: 15,
  outline: "none",
  transition: "border-color .2s, box-shadow .2s",
};
export const labelStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8, fontSize: 14, color: "#a3abb5" };

const pill: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  width: "100%",
  height: 44, // matches Google's button (its tallest size is 44px)
  boxSizing: "border-box",
  borderRadius: 999,
  fontSize: 15,
  fontWeight: 500,
  textDecoration: "none",
  cursor: "pointer",
  transition: "background .2s, border-color .2s, box-shadow .3s, opacity .2s",
};
// Colours live in classes (not inline) so hover/focus states can override them.
export const primaryBtn: React.CSSProperties = { ...pill, border: 0 };
export const secondaryBtn: React.CSSProperties = pill;
export const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6fe3ef]";
/** Outlined secondary button (as the navbar's Login). */
export const secondaryHover = "border border-white/[0.14] bg-white/[0.03] text-[#f4f6f8] hover:border-white/30 hover:bg-white/[0.07]";
/** White primary button (as the demo form's submit). */
export const primaryHover = "bg-[#f4f6f8] text-[#07080b] hover:bg-white hover:shadow-[0_0_32px_rgba(111,227,239,.5)] disabled:opacity-60 disabled:cursor-default disabled:shadow-none";

export function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 style={{ margin: 0, fontSize: "clamp(28px,5vw,36px)", lineHeight: 1.1, letterSpacing: "-0.03em", fontWeight: 600, background: "linear-gradient(180deg,#fff 40%,#8e98a4)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
        {title}
      </h1>
      <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.5, color: "#a3abb5" }}>{subtitle}</p>
    </div>
  );
}

export function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" style={{ borderRadius: 12, padding: "12px 14px", fontSize: 14, lineHeight: 1.45, color: ERROR_COLOR, border: "1px solid rgba(255,138,138,.3)", background: "rgba(255,138,138,.06)" }}>
      {children}
    </div>
  );
}

export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-[#6fe3ef] transition-colors hover:text-[#8fe9f2] focus-visible:underline" style={{ textDecoration: "none" }}>
      {children}
    </Link>
  );
}

/**
 * Sends signed-in visitors on to AFTER_LOGIN (or a safe ?next= path), both when
 * they arrive already signed in and right after the backend confirms a sign-in.
 */
export function useSignedInRedirect() {
  const router = useRouter();
  const { status } = useAdoptionSession();
  useEffect(() => {
    if (status !== "signedIn") return;
    // Business Admin staff: a full page load, so the Learning store picks up the session that came with this sign-in.
    if (consumeStaffRedirect()) {
      window.location.assign("/admin-adaption");
      return;
    }
    const next = new URLSearchParams(window.location.search).get("next");
    router.replace(next && next.startsWith("/adoption/") ? next : AFTER_LOGIN);
  }, [status, router]);
  return status === "signedIn";
}

export const errorMessage = (e: unknown) => (e instanceof AdoptionApiError || e instanceof Error ? e.message : "Something went wrong. Please try again.");

/**
 * Google's own sign-in button (Google Identity Services). The ID token is
 * verified by the AI Adoption backend (POST /api/adoption/auth/google), which
 * signs in existing Adoption users and creates accounts for new ones.
 * Nothing here is simulated.
 */
export function GoogleButton({ text }: { text: "continue_with" | "signup_with" }) {
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  // Google renders a fixed-width button; size it to the card.
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const fit = () => setWidth(Math.max(200, Math.min(400, Math.floor(el.clientWidth))));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onSuccess = async (res: CredentialResponse) => {
    setLocalError("");
    if (!res.credential) {
      setLocalError("Google didn't return a sign-in. Please try again.");
      return;
    }
    setLoading(true);
    try {
      await adoptionAuth.google(res.credential); // useSignedInRedirect takes over on success
    } catch (e) {
      setLocalError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div ref={boxRef} aria-busy={loading} style={{ display: "flex", justifyContent: "center", minHeight: 44, opacity: loading ? 0.6 : 1, pointerEvents: loading ? "none" : "auto" }}>
        {width > 0 && (
          <GoogleLogin
            key={width}
            onSuccess={onSuccess}
            onError={() => setLocalError("Google sign-in was cancelled or failed. Please try again.")}
            theme="filled_black"
            shape="pill"
            size="large"
            text={text}
            logo_alignment="center"
            width={width}
          />
        )}
      </div>
      {localError && <ErrorBox>{localError}</ErrorBox>}
    </div>
  );
}

export function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "#8a939e" }} aria-hidden="true">
      <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,.08)" }} />
      or
      <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,.08)" }} />
    </div>
  );
}

export function LegalNote() {
  return (
    <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "#8a939e", textAlign: "center" }}>
      By continuing, you agree to our <TextLink href="/terms-and-conditions">Terms &amp; Conditions</TextLink> and{" "}
      <TextLink href="/privacy-policy">Privacy Policy</TextLink>.
    </p>
  );
}
