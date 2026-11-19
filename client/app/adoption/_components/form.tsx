"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ERROR_COLOR, ErrorBox, Heading, errorMessage, fieldStyle, focusRing, labelStyle, primaryBtn, primaryHover } from "./ui";

// Form pieces shared by the AI Adoption sign-in, sign-up and reset forms.

const inputCls = "border border-white/10 focus:border-[#6fe3ef] focus:shadow-[0_0_0_4px_rgba(111,227,239,.12)]";
const errStyle: React.CSSProperties = { fontSize: 13, color: ERROR_COLOR };

type FieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "style"> & {
  label: React.ReactNode;
  error?: string;
  hint?: React.ReactNode;
  inputRef?: React.Ref<HTMLInputElement>;
  right?: React.ReactNode; // e.g. "Forgot password?" beside the label
};

function LabelRow({ fid, label, right }: { fid: string; label: React.ReactNode; right?: React.ReactNode }) {
  return (
    <span style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
      <label htmlFor={fid}>{label}</label>
      {right && <span style={{ fontSize: 13 }}>{right}</span>}
    </span>
  );
}

export function Field({ label, error, hint, inputRef, right, id, ...input }: FieldProps) {
  const fid = id ?? `f-${input.name}`;
  const described = [error ? `${fid}-error` : "", hint ? `${fid}-hint` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div style={labelStyle}>
      <LabelRow fid={fid} label={label} right={right} />
      <input
        ref={inputRef}
        id={fid}
        aria-invalid={!!error}
        aria-describedby={described}
        className={inputCls}
        style={{ ...fieldStyle, border: error ? `1px solid ${ERROR_COLOR}` : undefined }}
        {...input}
      />
      {hint && (
        <span id={`${fid}-hint`} style={{ fontSize: 12.5, color: "#8a939e", lineHeight: 1.5 }}>
          {hint}
        </span>
      )}
      {error && (
        <span id={`${fid}-error`} style={errStyle}>
          {error}
        </span>
      )}
    </div>
  );
}

export function PasswordField({ show, onToggle, label, error, hint, inputRef, right, id, ...input }: FieldProps & { show: boolean; onToggle: () => void }) {
  const fid = id ?? `f-${input.name}`;
  const described = [error ? `${fid}-error` : "", hint ? `${fid}-hint` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div style={labelStyle}>
      <LabelRow fid={fid} label={label} right={right} />
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          id={fid}
          type={show ? "text" : "password"}
          aria-invalid={!!error}
          aria-describedby={described}
          className={inputCls}
          style={{ ...fieldStyle, paddingRight: 72, border: error ? `1px solid ${ERROR_COLOR}` : undefined }}
          {...input}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className={`text-[#a3abb5] transition-colors hover:text-white focus-visible:text-white ${focusRing}`}
          style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", height: 36, padding: "0 10px", borderRadius: 8, border: 0, background: "transparent", fontSize: 13, cursor: "pointer" }}
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {hint && <div id={`${fid}-hint`}>{hint}</div>}
      {error && (
        <span id={`${fid}-error`} style={errStyle}>
          {error}
        </span>
      )}
    </div>
  );
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PASSWORD_RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "An uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "A lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "A number", test: (p) => /\d/.test(p) },
];
export const passwordOk = (p: string) => PASSWORD_RULES.every((r) => r.test(p));

export function PasswordRules({ password }: { password: string }) {
  return (
    <ul aria-label="Password requirements" style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "4px 12px", fontSize: 12.5 }}>
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(password);
        return (
          <li key={r.label} style={{ display: "flex", alignItems: "center", gap: 6, color: ok ? "#8fe9f2" : "#8a939e" }}>
            <span aria-hidden="true">{ok ? "✓" : "•"}</span>
            {r.label}
            <span className="sr-only">{ok ? " (done)" : " (needed)"}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** "Enter the 6-digit code we emailed you" step, with resend + cooldown. */
export function CodeStep({
  email,
  title,
  subtitle,
  submitLabel,
  onSubmit,
  onResend,
  onBack,
  backLabel,
  children,
  validateExtra,
}: {
  email: string;
  title: string;
  subtitle: string;
  submitLabel: string;
  onSubmit: (code: string) => Promise<void>;
  onResend: () => Promise<unknown>;
  onBack: () => void;
  backLabel: string;
  children?: React.ReactNode; // extra fields (e.g. new password)
  validateExtra?: () => string | null;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [cooldown, setCooldown] = useState(45);
  useEffect(() => {
    if (!cooldown) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (code.length !== 6) return setError("Enter the 6-digit code from the email.");
    const extra = validateExtra?.();
    if (extra) return setError(extra);
    setBusy(true);
    setError("");
    try {
      await onSubmit(code);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  const resend = async () => {
    if (cooldown || busy) return;
    setError("");
    setNote("");
    try {
      await onResend();
      setNote("A new code is on its way.");
      setCooldown(45);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Heading title={title} subtitle={subtitle.replace("{email}", email)} />
      <div style={labelStyle}>
        <label htmlFor="code">Verification code</label>
        <input
          id="code"
          name="code"
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="••••••"
          className={inputCls}
          style={{ ...fieldStyle, border: undefined, fontSize: 20, letterSpacing: "0.5em", textAlign: "center" }}
        />
      </div>
      {children}
      {error && <ErrorBox>{error}</ErrorBox>}
      {note && !error && (
        <p role="status" style={{ margin: 0, fontSize: 14, color: "#8fe9f2" }}>
          {note}
        </p>
      )}
      <button type="submit" disabled={busy} aria-busy={busy} className={`${focusRing} ${primaryHover}`} style={primaryBtn}>
        {busy ? "Please wait…" : submitLabel}
      </button>
      <p style={{ margin: 0, fontSize: 14, color: "#8a939e", textAlign: "center" }}>
        Didn&apos;t get it?{" "}
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0}
          className="text-[#6fe3ef] hover:text-[#8fe9f2] disabled:text-[#8a939e] focus-visible:underline"
          style={{ border: 0, background: "none", padding: 0, font: "inherit", cursor: cooldown ? "default" : "pointer" }}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
      </p>
      <button type="button" onClick={onBack} className="text-[#a3abb5] hover:text-white focus-visible:text-white" style={{ border: 0, background: "none", padding: 0, fontSize: 14, cursor: "pointer", alignSelf: "flex-start" }}>
        ← {backLabel}
      </button>
    </form>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-[#a3abb5] transition-colors hover:text-white focus-visible:text-white" style={{ fontSize: 14, textDecoration: "none", alignSelf: "flex-start" }}>
      ← {children}
    </Link>
  );
}

export function FormError({ message }: { message: string }) {
  return message ? <ErrorBox>{message}</ErrorBox> : null;
}
