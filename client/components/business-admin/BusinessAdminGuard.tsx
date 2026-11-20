"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { BusinessAdminShell } from "@/components/business-admin/BusinessAdminShell";
import { BusinessThemeRoot } from "@/components/business-admin/theme";
import { describeApiError, fetchBusinessMe, type BusinessAdminMe } from "@/lib/businessAdminApi";

type State =
  | { kind: "checking" }
  | { kind: "allowed"; me: BusinessAdminMe; name: string; email: string }
  | { kind: "denied" }
  | { kind: "error"; message: string };

/**
 * Business Admin guard. This is a separate surface from /admin (Learning Admin) and is not nested under it.
 * Access is decided by the SERVER (GET /api/business-admin/me); nothing in this tree renders for anyone
 * the server has not approved, and every data call is independently enforced by the API.
 */
export function BusinessAdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "checking" });

  const check = useCallback(async () => {
    setState({ kind: "checking" });
    let stored: { user?: { firstName?: string; lastName?: string; email?: string }; accessToken?: string } | null = null;
    try {
      const raw = localStorage.getItem("auth");
      stored = raw ? JSON.parse(raw) : null;
    } catch {
      stored = null;
    }
    if (!stored?.accessToken) {
      router.replace("/login");
      return;
    }
    try {
      const me = await fetchBusinessMe();
      const name = `${stored.user?.firstName ?? ""} ${stored.user?.lastName ?? ""}`.trim() || "Admin";
      setState({ kind: "allowed", me, name, email: stored.user?.email ?? "" });
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) router.replace("/login");
      else if (status === 403) setState({ kind: "denied" });
      else setState({ kind: "error", message: describeApiError(err) });
    }
  }, [router]);

  useEffect(() => {
    void check();
  }, [check]);

  if (state.kind === "allowed") {
    return (
      <BusinessThemeRoot>
        <BusinessAdminShell me={state.me} name={state.name} email={state.email}>
          {children}
        </BusinessAdminShell>
      </BusinessThemeRoot>
    );
  }

  return (
    <BusinessThemeRoot>
    <div className="min-h-screen flex items-center justify-center bg-ink-950 px-4">
      {state.kind === "checking" && (
        <div role="status" aria-label="Checking access" className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      )}
      {state.kind === "denied" && (
        <div className="max-w-md text-center">
          <ShieldAlert className="mx-auto mb-4 text-amber-400" size={36} />
          <h1 className="text-lg font-semibold text-white">Business Admin access required</h1>
          <p className="mt-2 text-sm text-white/50">
            Your account is not authorised for Avatar Adaption Business Admin. Learning Admin access does not include it. Ask a super admin to grant access.
          </p>
          <div className="mt-5 flex justify-center gap-3 text-sm">
            <Link href="/" className="rounded-lg border border-white/10 px-4 py-2 text-white/70 hover:bg-white/5">Go to site</Link>
            <Link href="/admin" className="rounded-lg border border-white/10 px-4 py-2 text-white/70 hover:bg-white/5">Learning Admin</Link>
          </div>
        </div>
      )}
      {state.kind === "error" && (
        <div className="max-w-md text-center">
          <h1 className="text-lg font-semibold text-white">Could not open Business Admin</h1>
          <p className="mt-2 text-sm text-white/50">{state.message}</p>
          <button type="button" onClick={() => void check()} className="mt-5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">
            Try again
          </button>
        </div>
      )}
    </div>
    </BusinessThemeRoot>
  );
}
