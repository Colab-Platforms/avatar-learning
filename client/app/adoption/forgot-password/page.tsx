"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { adoptionAuth } from "@/lib/adoptionSession";
import { Heading, errorMessage, focusRing, primaryBtn, primaryHover } from "../_components/ui";
import { BackLink, CodeStep, EMAIL_RE, Field, FormError, PasswordField, PasswordRules, passwordOk } from "../_components/form";

export default function AdoptionForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset" | "done">("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    const e = new URLSearchParams(window.location.search).get("email");
    if (e) setEmail(e);
  }, []);

  const sendCode = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setFormError("");
    if (!EMAIL_RE.test(email.trim())) return setEmailError("Please enter a valid email address.");
    setEmailError("");
    setBusy(true);
    try {
      await adoptionAuth.forgotPassword(email.trim());
      setStep("reset");
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (step === "done") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <Heading title="Password updated" subtitle="You can now sign in with your new password." />
        <button type="button" onClick={() => router.push("/adoption/login/email")} className={`${focusRing} ${primaryHover}`} style={primaryBtn}>
          Sign In
        </button>
      </div>
    );
  }

  if (step === "reset") {
    return (
      <CodeStep
        email={email.trim()}
        title="Check your email"
        subtitle="If an account exists for {email}, we've sent a 6-digit code. Enter it and choose a new password."
        submitLabel="Update Password"
        validateExtra={() => (!passwordOk(password) ? "Your new password doesn't meet all the requirements." : password !== confirm ? "Passwords don't match." : null)}
        onSubmit={async (code) => {
          await adoptionAuth.resetPassword(email.trim(), code, password);
          setStep("done");
        }}
        onResend={() => adoptionAuth.forgotPassword(email.trim())}
        onBack={() => setStep("email")}
        backLabel="Use a different email"
      >
        <PasswordField label="New password" name="password" autoComplete="new-password" placeholder="Create a new password" value={password}
          onChange={(e) => setPassword(e.target.value)} show={show} onToggle={() => setShow((s) => !s)} hint={<PasswordRules password={password} />} />
        <PasswordField label="Confirm new password" name="confirm" autoComplete="new-password" placeholder="Re-enter it" value={confirm}
          onChange={(e) => setConfirm(e.target.value)} show={show} onToggle={() => setShow((s) => !s)} />
      </CodeStep>
    );
  }

  return (
    <form onSubmit={sendCode} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <BackLink href="/adoption/login/email">Back to sign in</BackLink>
      <Heading title="Reset your password" subtitle="Enter your account email and we'll send you a code to set a new password." />
      <Field label="Email Address" name="email" type="email" autoComplete="email" inputMode="email" placeholder="you@company.com"
        value={email} onChange={(e) => setEmail(e.target.value)} error={emailError} />
      <FormError message={formError} />
      <button type="submit" disabled={busy} aria-busy={busy} className={`${focusRing} ${primaryHover}`} style={primaryBtn}>
        {busy ? "Sending…" : "Send Code"}
      </button>
    </form>
  );
}
