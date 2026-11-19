"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adoptionAccount, adoptionAuth, type AdoptionUser } from "@/lib/adoptionSession";
import { ErrorBox, errorMessage, focusRing, primaryHover, secondaryHover } from "../../_components/ui";
import { PasswordField, PasswordRules, passwordOk } from "../../_components/form";
import { Notice, card, muted, sectionTitle, smallBtn, smallSecondary } from "./shared";

function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setDone("");
    if (!current) return setError("Enter your current password.");
    if (!passwordOk(next)) return setError("Your new password doesn't meet all the requirements.");
    if (next !== confirm) return setError("New passwords don't match.");
    setBusy(true);
    setError("");
    try {
      await adoptionAccount.changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      setDone("Password changed. You've been signed out on other devices.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate style={{ ...card, gap: 14 }}>
      <PasswordField label="Current password" name="currentPassword" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} show={show} onToggle={() => setShow((s) => !s)} />
      <PasswordField label="New password" name="newPassword" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} show={show} onToggle={() => setShow((s) => !s)} hint={<PasswordRules password={next} />} />
      <PasswordField label="Confirm new password" name="confirmNewPassword" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} show={show} onToggle={() => setShow((s) => !s)} />
      {error && <ErrorBox>{error}</ErrorBox>}
      {done && !error && <Notice>{done}</Notice>}
      <button type="submit" disabled={busy} aria-busy={busy} className={`${focusRing} ${primaryHover}`} style={smallBtn}>{busy ? "Updating…" : "Change password"}</button>
    </form>
  );
}

export function SettingsSection({ user }: { user: AdoptionUser }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const method = user.hasPassword && user.hasGoogle ? "Email & password, and Google" : user.hasGoogle ? "Google" : "Email & password";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <section aria-labelledby="signin-h" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2 id="signin-h" style={sectionTitle}>Sign-in method</h2>
        <p style={{ margin: 0, fontSize: 15, color: "#f4f6f8" }}>{method}</p>
      </section>

      <section aria-labelledby="pw-h" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2 id="pw-h" style={sectionTitle}>Password</h2>
        {user.hasPassword ? (
          <ChangePassword />
        ) : (
          <div style={{ ...card, ...muted }}>
            You sign in with Google, so there&apos;s no Avatar password on this account — your Google account&apos;s security settings protect it. If you&apos;d also like to sign in with email and a password, you can create one.
            <Link href={`/adoption/forgot-password?email=${encodeURIComponent(user.email)}`} className={`${focusRing} ${secondaryHover}`} style={smallSecondary}>Create a password</Link>
          </div>
        )}
      </section>

      <section aria-labelledby="sec-h" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2 id="sec-h" style={sectionTitle}>Security</h2>
        <div style={{ ...card, ...muted }}>
          Signed in somewhere you no longer use? Sign out everywhere except this device.
          {msg && <Notice>{msg}</Notice>}
          {error && <ErrorBox>{error}</ErrorBox>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setMsg("");
                setError("");
                try {
                  const r = await adoptionAccount.signOutOthers();
                  setMsg(r.signedOut ? `Signed out on ${r.signedOut} other device${r.signedOut === 1 ? "" : "s"}.` : "You weren't signed in anywhere else.");
                } catch (e) {
                  setError(errorMessage(e));
                } finally {
                  setBusy(false);
                }
              }}
              className={`${focusRing} ${secondaryHover}`}
              style={smallSecondary}
            >
              Sign out other devices
            </button>
            <button
              type="button"
              onClick={async () => {
                await adoptionAuth.logout();
                router.replace("/");
              }}
              className={`${focusRing} ${secondaryHover}`}
              style={smallSecondary}
            >
              Log out
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
