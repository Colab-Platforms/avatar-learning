"use client";

import { useRef, useState, type FormEvent } from "react";
import { adoptionAuth } from "@/lib/adoptionSession";
import { Heading, TextLink, errorMessage, focusRing, primaryBtn, primaryHover, useSignedInRedirect } from "../../_components/ui";
import { BackLink, CodeStep, EMAIL_RE, Field, FormError, PasswordField } from "../../_components/form";

type Errors = { email?: string; password?: string };

export default function AdoptionEmailLoginPage() {
  const signedIn = useSignedInRedirect();
  const [step, setStep] = useState<"form" | "verify">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState(false);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const validate = (em: string, pw: string): Errors => {
    const e: Errors = {};
    if (!em.trim()) e.email = "Please enter your email address.";
    else if (!EMAIL_RE.test(em.trim())) e.email = "Please enter a valid email address.";
    if (!pw) e.password = "Please enter your password.";
    return e;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return; // no duplicate submissions
    setTouched(true);
    setFormError("");
    const v = validate(email, password);
    setErrors(v);
    if (v.email) return emailRef.current?.focus();
    if (v.password) return passwordRef.current?.focus();
    setBusy(true);
    try {
      const r = await adoptionAuth.login(email.trim(), password);
      if (r.requiresVerification) setStep("verify"); // correct password, email not verified yet
      // On success the session is set and useSignedInRedirect opens the account page.
    } catch (err) {
      setFormError(errorMessage(err));
      setPassword("");
      passwordRef.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  if (signedIn) return <Heading title="Welcome back" subtitle="You're signed in. Opening your account…" />;

  if (step === "verify") {
    return (
      <CodeStep
        email={email.trim()}
        title="Verify your email"
        subtitle="Your email isn't verified yet. We sent a 6-digit code to {email}."
        submitLabel="Verify & Sign In"
        onSubmit={(code) => adoptionAuth.verifyEmail(email.trim(), code)}
        onResend={() => adoptionAuth.resendVerification(email.trim())}
        onBack={() => setStep("form")}
        backLabel="Back to sign in"
      />
    );
  }

  const recheck = (em: string, pw: string) => touched && setErrors(validate(em, pw));

  return (
    <form onSubmit={onSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <BackLink href="/adoption/login">Back to login options</BackLink>
      <Heading title="Welcome Back" subtitle="Sign in to your Avatar account." />

      <Field
        label="Email Address"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@company.com"
        value={email}
        onChange={(e) => { setEmail(e.target.value); recheck(e.target.value, password); }}
        error={errors.email}
        inputRef={emailRef}
      />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="current-password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => { setPassword(e.target.value); recheck(email, e.target.value); }}
        error={errors.password}
        inputRef={passwordRef}
        show={show}
        onToggle={() => setShow((s) => !s)}
        right={<TextLink href={`/adoption/forgot-password${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ""}`}>Forgot password?</TextLink>}
      />

      <FormError message={formError} />

      <button type="submit" disabled={busy} aria-busy={busy} className={`${focusRing} ${primaryHover}`} style={{ ...primaryBtn, marginTop: 4 }}>
        {busy ? "Signing in…" : "Sign In"}
      </button>

      <p style={{ margin: 0, fontSize: 14, color: "#8a939e", textAlign: "center" }}>
        Don&apos;t have an account? <TextLink href="/adoption/signup">Create Account</TextLink>
      </p>
    </form>
  );
}
