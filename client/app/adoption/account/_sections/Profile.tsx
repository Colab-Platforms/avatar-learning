"use client";

import { useState, type FormEvent } from "react";
import { adoptionAccount, type AdoptionUser } from "@/lib/adoptionSession";
import { COMPANY_SIZES, ROLES } from "@/components/ai-ecosystem/DemoRequestForm";
import { ErrorBox, errorMessage, fieldStyle, focusRing, labelStyle, primaryHover, secondaryHover } from "../../_components/ui";
import { EMAIL_RE, Field } from "../../_components/form";
import { Notice, card, muted, sectionTitle, smallBtn, smallSecondary } from "./shared";

const selectCls = "border border-white/10 focus:border-[#6fe3ef] focus:shadow-[0_0_0_4px_rgba(111,227,239,.12)]";
const selectStyle: React.CSSProperties = { ...fieldStyle, border: undefined, cursor: "pointer" };
const optionStyle: React.CSSProperties = { background: "#0b0d12", color: "#f4f6f8" };

function Select({ label, name, value, onChange, options, placeholder }: { label: string; name: string; value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  // Keep a previously saved value selectable even if it's not in today's list.
  const opts = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <div style={labelStyle}>
      <label htmlFor={`f-${name}`}>{label}</label>
      <select id={`f-${name}`} name={name} value={value} onChange={(e) => onChange(e.target.value)} className={selectCls} style={{ ...selectStyle, color: value ? "#f4f6f8" : "#8a939e" }}>
        <option value="" style={optionStyle}>{placeholder}</option>
        {opts.map((o) => (
          <option key={o} value={o} style={optionStyle}>{o}</option>
        ))}
      </select>
    </div>
  );
}

/** Email change: password re-check → code to the NEW address → confirm. The email only changes after the code. */
function EmailChange({ user }: { user: AdoptionUser }) {
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
      if (ok) setNotice(ok);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (user.pendingEmail) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (code.length !== 6) return setError("Enter the 6-digit code.");
          void run(async () => {
            await adoptionAccount.confirmEmailChange(code);
            setCode("");
            setOpen(false);
          }, "Your email has been updated.");
        }}
        style={{ ...card, gap: 12 }}
      >
        <p style={muted}>
          We sent a 6-digit code to <strong style={{ color: "#f4f6f8" }}>{user.pendingEmail}</strong>. Your sign-in email stays <strong style={{ color: "#f4f6f8" }}>{user.email}</strong> until you confirm.
        </p>
        <Field label="Verification code" name="emailCode" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} />
        {error && <ErrorBox>{error}</ErrorBox>}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="submit" disabled={busy} className={`${focusRing} ${primaryHover}`} style={smallBtn}>{busy ? "Confirming…" : "Confirm new email"}</button>
          <button type="button" disabled={busy} onClick={() => run(() => adoptionAccount.requestEmailChange(user.pendingEmail!, password || undefined), "A new code is on its way.")} className={`${focusRing} ${secondaryHover}`} style={smallSecondary}>Resend code</button>
          <button type="button" disabled={busy} onClick={() => run(() => adoptionAccount.cancelEmailChange(), "Email change cancelled.")} className={`${focusRing} ${secondaryHover}`} style={smallSecondary}>Cancel change</button>
        </div>
      </form>
    );
  }

  if (!open) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {notice && <Notice>{notice}</Notice>}
        <button type="button" onClick={() => setOpen(true)} className={`${focusRing} ${secondaryHover}`} style={smallSecondary}>Change email</button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        if (!EMAIL_RE.test(newEmail.trim())) return setError("Enter a valid email address.");
        if (user.hasPassword && !password) return setError("Enter your current password to confirm it's you.");
        void run(() => adoptionAccount.requestEmailChange(newEmail.trim(), password || undefined));
      }}
      style={{ ...card, gap: 12 }}
    >
      <Field label="New email address" name="newEmail" type="email" autoComplete="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
      {user.hasPassword && <Field label="Current password" name="currentPasswordEmail" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />}
      <p style={{ margin: 0, fontSize: 12.5, color: "#8a939e" }}>We&apos;ll email a code to the new address. Your email only changes once you enter it.</p>
      {error && <ErrorBox>{error}</ErrorBox>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="submit" disabled={busy} className={`${focusRing} ${primaryHover}`} style={smallBtn}>{busy ? "Sending…" : "Send code"}</button>
        <button type="button" disabled={busy} onClick={() => { setOpen(false); setError(""); }} className={`${focusRing} ${secondaryHover}`} style={smallSecondary}>Cancel</button>
      </div>
    </form>
  );
}

export function ProfileSection({ user }: { user: AdoptionUser }) {
  const [form, setForm] = useState({
    fullName: user.fullName,
    phone: user.phone ?? "",
    jobRole: user.jobRole ?? "",
    companyName: user.companyName ?? "",
    companySize: user.companySize ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (form.fullName.trim().length < 2) return setError("Please enter your full name.");
    if (form.phone.trim() && !/^\+?[0-9 ()-]{7,20}$/.test(form.phone.trim())) return setError("Enter a valid phone number.");
    setBusy(true);
    setError("");
    try {
      await adoptionAccount.updateProfile({ ...form, fullName: form.fullName.trim() });
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <section aria-labelledby="email-h" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2 id="email-h" style={sectionTitle}>Email address</h2>
        <p style={{ margin: 0, fontSize: 15, color: "#f4f6f8" }}>
          {user.email} {user.emailVerified && <span style={{ fontSize: 12.5, color: "#8fe9f2" }}>· verified</span>}
        </p>
        <EmailChange user={user} />
      </section>

      <section aria-labelledby="profile-h" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 id="profile-h" style={sectionTitle}>My profile</h2>
        <form onSubmit={save} noValidate style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))", gap: 16 }}>
          <Field label="Full Name" name="fullName" autoComplete="name" value={form.fullName} onChange={(e) => set("fullName")(e.target.value)} />
          <Field label="Mobile Number" name="phone" type="tel" autoComplete="tel" placeholder="+91" value={form.phone} onChange={(e) => set("phone")(e.target.value)} />
          <Select label="Job Role" name="jobRole" value={form.jobRole} onChange={set("jobRole")} options={ROLES} placeholder="Select your role" />
          <Field label="Company Name" name="companyName" autoComplete="organization" placeholder="Company name" value={form.companyName} onChange={(e) => set("companyName")(e.target.value)} />
          <Select label="Company Size" name="companySize" value={form.companySize} onChange={set("companySize")} options={COMPANY_SIZES} placeholder="Select company size" />
          <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 10 }}>
            {error && <ErrorBox>{error}</ErrorBox>}
            {saved && !error && <Notice>Profile saved.</Notice>}
            <button type="submit" disabled={busy} aria-busy={busy} className={`${focusRing} ${primaryHover}`} style={smallBtn}>{busy ? "Saving…" : "Save profile"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
