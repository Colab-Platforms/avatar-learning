"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { googleLogin, clearError } from "@/store/authSlice";

/** Where people land after signing in from the AI Adoption pages. */
export const AFTER_LOGIN = "/";

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
 * Sends signed-in visitors on to AFTER_LOGIN, both when they arrive already
 * signed in and right after a successful sign-in (the session is only set once
 * the backend confirms it).
 */
export function useSignedInRedirect() {
  const router = useRouter();
  const { user, hasHydrated } = useAppSelector((s) => s.auth);
  useEffect(() => {
    if (hasHydrated && user) router.replace(AFTER_LOGIN);
  }, [hasHydrated, user, router]);
  return hasHydrated && !!user;
}

/** Clear any error left over from another auth page. */
export function useFreshAuthErrors() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);
}

/**
 * Google's own sign-in button (Google Identity Services), wired to the existing
 * backend: the ID token goes to POST /auth/google, which signs in existing
 * users and creates accounts for new ones. Nothing here is simulated.
 */
export function GoogleButton({ text }: { text: "continue_with" | "signup_with" }) {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);
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

  const onSuccess = (res: CredentialResponse) => {
    setLocalError("");
    if (!res.credential) {
      setLocalError("Google didn't return a sign-in. Please try again.");
      return;
    }
    dispatch(clearError());
    dispatch(googleLogin({ idToken: res.credential }));
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
      {(localError || error) && <ErrorBox>{localError || error}</ErrorBox>}
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
