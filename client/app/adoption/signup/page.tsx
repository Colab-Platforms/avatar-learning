"use client";

import { useRef, useState, type FormEvent } from "react";
import { adoptionAuth } from "@/lib/adoptionSession";
import { Divider, ERROR_COLOR, GoogleButton, Heading, TextLink, errorMessage, focusRing, primaryBtn, primaryHover, useSignedInRedirect } from "../_components/ui";
import { CodeStep, EMAIL_RE, Field, FormError, PasswordField, PasswordRules, passwordOk } from "../_components/form";

type Errors = Partial<Record<"fullName" | "email" | "password" | "confirm" | "terms", string>>;

export default function AdoptionSignupPage() {
  const signedIn = useSignedInRedirect();
  const [step, setStep] = useState<"form" | "verify">("form");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState(false);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const refs = {
    fullName: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
    confirm: useRef<HTMLInputElement>(null),
    terms: useRef<HTMLInputElement>(null),
  };

  const validate = (v = { fullName, email, password, confirm, terms }): Errors => {
    const e: Errors = {};
    if (v.fullName.trim().length < 2) e.fullName = "Please enter your full name.";
    if (!v.email.trim()) e.email = "Please enter your work email.";
    else if (!EMAIL_RE.test(v.email.trim())) e.email = "Please enter a valid email address.";
    if (!v.password) e.password = "Please create a password.";
    else if (!passwordOk(v.password)) e.password = "Your password doesn't meet all the requirements below.";
    if (!v.confirm) e.confirm = "Please confirm your password.";
    else if (v.confirm !== v.password) e.confirm = "Passwords don't match.";
    if (!v.terms) e.terms = "Please accept the Terms & Conditions and Privacy Policy.";
    return e;
  };
  const recheck = (patch: Partial<{ fullName: string; email: string; password: string; confirm: string; terms: boolean }>) =>
    touched && setErrors(validate({ fullName, email, password, confirm, terms, ...patch }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return; // no duplicate submissions
    setTouched(true);
    setFormError("");
    const v = validate();
    setErrors(v);
    const first = (["fullName", "email", "password", "confirm", "terms"] as const).find((k) => v[k]);
    if (first) return refs[first].current?.focus();
    setBusy(true);
    try {
      await adoptionAuth.register(fullName.trim(), email.trim(), password);
      setStep("verify"); // account is only usable after the emailed code is confirmed
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (signedIn) return <Heading title="You're all set" subtitle="Opening your account…" />;

  if (step === "verify") {
    return (
      <CodeStep
        email={email.trim()}
        title="Verify your email"
        subtitle="We sent a 6-digit code to {email}. Enter it to finish creating your account."
        submitLabel="Verify & Create Account"
        onSubmit={(code) => adoptionAuth.verifyEmail(email.trim(), code)}
        onResend={() => adoptionAuth.resendVerification(email.trim())}
        onBack={() => setStep("form")}
        backLabel="Back to sign-up"
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <Heading title="Create Your Account" subtitle="Get started with Avatar's business tools." />

      <form onSubmit={onSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Full Name" name="fullName" autoComplete="name" placeholder="Your full name" value={fullName}
          onChange={(e) => { setFullName(e.target.value); recheck({ fullName: e.target.value }); }} error={errors.fullName} inputRef={refs.fullName} />
        <Field label="Work Email Address" name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@company.com" value={email}
          onChange={(e) => { setEmail(e.target.value); recheck({ email: e.target.value }); }} error={errors.email} inputRef={refs.email} />
        <PasswordField label="Password" name="password" autoComplete="new-password" placeholder="Create a password" value={password}
          onChange={(e) => { setPassword(e.target.value); recheck({ password: e.target.value }); }} error={errors.password} inputRef={refs.password}
          show={show} onToggle={() => setShow((s) => !s)} hint={<PasswordRules password={password} />} />
        <PasswordField label="Confirm Password" name="confirm" autoComplete="new-password" placeholder="Re-enter your password" value={confirm}
          onChange={(e) => { setConfirm(e.target.value); recheck({ confirm: e.target.value }); }} error={errors.confirm} inputRef={refs.confirm}
          show={show} onToggle={() => setShow((s) => !s)} />

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13.5, lineHeight: 1.5, color: "#a3abb5", cursor: "pointer" }}>
            <input
              ref={refs.terms}
              type="checkbox"
              name="terms"
              checked={terms}
              onChange={(e) => { setTerms(e.target.checked); recheck({ terms: e.target.checked }); }}
              aria-invalid={!!errors.terms}
              aria-describedby={errors.terms ? "terms-error" : undefined}
              className={focusRing}
              style={{ width: 16, height: 16, margin: "3px 0 0", flex: "none", accentColor: "#6fe3ef", cursor: "pointer" }}
            />
            <span>
              I agree to the <TextLink href="/terms-and-conditions">Terms &amp; Conditions</TextLink> and{" "}
              <TextLink href="/privacy-policy">Privacy Policy</TextLink>.
            </span>
          </label>
          {errors.terms && <span id="terms-error" style={{ fontSize: 13, color: ERROR_COLOR }}>{errors.terms}</span>}
        </div>

        <FormError message={formError} />

        <button type="submit" disabled={busy} aria-busy={busy} className={`${focusRing} ${primaryHover}`} style={{ ...primaryBtn, marginTop: 4 }}>
          {busy ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <Divider />
      <GoogleButton text="signup_with" />

      <p style={{ margin: 0, fontSize: 14, color: "#8a939e", textAlign: "center" }}>
        Already have an account? <TextLink href="/adoption/login/email">Sign In</TextLink>
      </p>
    </div>
  );
}
