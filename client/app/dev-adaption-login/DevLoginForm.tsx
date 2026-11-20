"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";

/** Development-only sign-in for /admin-adaption. Unlocks a sandbox with fake data; it is not a real account. */
export function DevLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { data } = await apiClient.post("/business-admin/dev-login", { email, password });
      // Same storage shape as the normal login; there is no refresh token (the dev token lasts 8 hours).
      localStorage.setItem("auth", JSON.stringify({ user: data.data.user, accessToken: data.data.accessToken, refreshToken: "" }));
      router.replace("/admin-adaption");
    } catch {
      setError("Dev login is unavailable or the credentials are wrong. Is the backend running with DEV_TEST_LOGIN=true?");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl border border-white/10 p-6">
        <h1 className="text-lg font-semibold text-white">Dev test login</h1>
        <p className="text-xs text-amber-400">Local development only. Sandbox data; opens /admin-adaption and nothing else.</p>
        <input type="email" required autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white" />
        <input type="password" required autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white" />
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={busy} className="w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50">
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
