"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { login, verifyOtp, resendOtp, clearError } from "@/store/authSlice";
import { ERROR_COLOR, ErrorBox, Heading, TextLink, fieldStyle, focusRing, labelStyle, primaryBtn, primaryHover, useFreshAuthErrors, useSignedInRedirect } from "../../_components/ui";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
type Errors = { email?: string; password?: string };

function validate(email: string, password: string): Errors {
  const e: Errors = {};
  if (!email.trim()) e.email = "Please enter your email address.";
  else if (!EMAIL_RE.test(email.trim())) e.email = "Please enter a valid email address.";
  if (!password) e.password = "Please enter your password.";
  return e;
}

function inputStyle(bad: boolean): React.CSSProperties {
  // Normal border comes from focusCls so the focus colour can apply; errors override it inline.
  return { ...fieldStyle, border: bad ? `1px solid ${ERROR_COLOR}` : undefined };
}
const focusCls = "border border-white/10 focus:border-[#6fe3ef] focus:shadow-[0_0_0_4px_rgba(111,227,239,.12)]";

function BackLink() {
  return (
    <Link href="/adoption/login" className="text-[#a3abb5] transition-colors hover:text-white focus-visible:text-white" style={{ fontSize: 14, textDecoration: "none", alignSelf: "flex-start" }}>
      ← All sign-in options
    </Link>
  );
}

export default function AdoptionEmailLoginPage() {
  useFreshAuthErrors();
  const signedIn = useSignedInRedirect();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);

  const [step, setStep] = useState<"form" | "otp">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState(false);
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [resent, setResent] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!cooldown) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const onLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return; // no duplicate submissions
    setTouched(true);
    const v = validate(email, password);
    setErrors(v);
    if (v.email) return emailRef.current?.focus();
    if (v.password) return passwordRef.current?.focus();
    dispatch(clearError());
    const result = await dispatch(login({ email: email.trim(), password }));
    if (login.fulfilled.match(result) && result.payload.requiresVerification) {
      setStep("otp"); // unverified account: the backend has emailed a code
      setOtp("");
    } else if (login.rejected.match(result)) {
      setPassword("");
      passwordRef.current?.focus();
    }
    // On success the session is set and useSignedInRedirect takes over.
  };

  const onVerify = (e: FormEvent) => {
    e.preventDefault();
    const code = otp.replace(/\D/g, "");
    if (code.length < 6 || loading) return;
    dispatch(clearError());
    dispatch(verifyOtp({ email: email.trim(), otp: code, type: "LOGIN" }));
  };

  const onResend = async () => {
    if (cooldown > 0 || loading) return;
    setResent(false);
    dispatch(clearError());
    const r = await dispatch(resendOtp({ email: email.trim(), type: "LOGIN" }));
    if (resendOtp.fulfilled.match(r)) {
      setResent(true);
      setCooldown(60);
    }
  };

  if (signedIn) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Heading title="Welcome back" subtitle="You're signed in. Taking you back…" />
      </div>
    );
  }

  if (step === "otp") {
    return (
      <form onSubmit={onVerify} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Heading title="Check your email" subtitle={`We sent a 6-digit code to ${email.trim()}. Enter it to finish signing in.`} />
        <label style={labelStyle}>
          Verification code
          <input
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="••••••"
            className={focusCls}
            style={{ ...fieldStyle, border: undefined, fontSize: 20, letterSpacing: "0.5em", textAlign: "center" }}
          />
        </label>
        {error && <ErrorBox>{error}</ErrorBox>}
        {resent && !error && <p role="status" style={{ margin: 0, fontSize: 14, color: "#8fe9f2" }}>A new code is on its way.</p>}
        <button type="submit" disabled={loading || otp.length < 6} aria-busy={loading} className={`${focusRing} ${primaryHover}`} style={primaryBtn}>
          {loading ? "Verifying…" : "Verify & Sign In"}
        </button>
        <p style={{ margin: 0, fontSize: 14, color: "#8a939e", textAlign: "center" }}>
          Didn&apos;t get it?{" "}
          <button type="button" onClick={onResend} disabled={cooldown > 0 || loading} className="text-[#6fe3ef] hover:text-[#8fe9f2] disabled:text-[#8a939e] focus-visible:underline" style={{ border: 0, background: "none", padding: 0, font: "inherit", cursor: cooldown > 0 ? "default" : "pointer" }}>
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
        </p>
        <button type="button" onClick={() => { setStep("form"); dispatch(clearError()); }} className="text-[#a3abb5] hover:text-white focus-visible:text-white" style={{ border: 0, background: "none", padding: 0, fontSize: 14, cursor: "pointer", alignSelf: "flex-start" }}>
          ← Back to sign in
        </button>
      </form>
    );
  }

  const recheck = (em: string, pw: string) => touched && setErrors(validate(em, pw));

  return (
    <form onSubmit={onLogin} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <BackLink />
      <Heading title="Sign in with email" subtitle="Use the email and password for your Avatar account." />

      <label style={{ ...labelStyle, marginTop: 6 }}>
        Email Address
        <input
          ref={emailRef}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); recheck(e.target.value, password); }}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={focusCls}
          style={inputStyle(!!errors.email)}
        />
        {errors.email && <span id="email-error" style={{ fontSize: 13, color: ERROR_COLOR }}>{errors.email}</span>}
      </label>

      <div style={labelStyle}>
        <span style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <label htmlFor="password">Password</label>
          <span style={{ fontSize: 13 }}>
            <TextLink href="/forgot-password">Forgot password?</TextLink>
          </span>
        </span>
        <div style={{ position: "relative" }}>
          <input
            ref={passwordRef}
            id="password"
            type={show ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => { setPassword(e.target.value); recheck(email, e.target.value); }}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            className={focusCls}
            style={{ ...inputStyle(!!errors.password), paddingRight: 72 }}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
            className={`text-[#a3abb5] transition-colors hover:text-white focus-visible:text-white ${focusRing}`}
            style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", height: 36, padding: "0 10px", borderRadius: 8, border: 0, background: "transparent", fontSize: 13, cursor: "pointer" }}
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>
        {errors.password && <span id="password-error" style={{ fontSize: 13, color: ERROR_COLOR }}>{errors.password}</span>}
      </div>

      {error && <ErrorBox>{error}</ErrorBox>}

      <button type="submit" disabled={loading} aria-busy={loading} className={`${focusRing} ${primaryHover}`} style={{ ...primaryBtn, marginTop: 4 }}>
        {loading ? "Signing in…" : "Sign In"}
      </button>

      <p style={{ margin: 0, fontSize: 14, color: "#8a939e", textAlign: "center" }}>
        New to Avatar? <TextLink href="/adoption/signup">Create an account</TextLink>
      </p>
    </form>
  );
}
