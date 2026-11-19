"use client";

import { useSyncExternalStore } from "react";

/**
 * AI Adoption account session — separate from the learning platform's auth
 * (store/authSlice.ts, /api/auth). Talks only to /api/adoption/auth and keeps
 * its own session token under its own storage key. Passwords are never stored.
 */

export type AdoptionUser = {
  id: string;
  fullName: string;
  email: string;
  emailVerified: boolean;
  hasPassword: boolean;
  hasGoogle: boolean;
  /** Tools this account may use (granted by the Avatar team; empty for new accounts). */
  products: string[];
  createdAt: string;
};

type State = { status: "loading" | "signedOut" | "signedIn"; user: AdoptionUser | null };

const TOKEN_KEY = "adoption_session";
const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
const API = `${base.endsWith("/api") ? base : `${base}/api`}/adoption/auth`;

let state: State = { status: "loading", user: null };
const listeners = new Set<() => void>();
const set = (s: State) => {
  state = s;
  listeners.forEach((l) => l());
};

const readToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
const writeToken = (t: string | null) => {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable: session lasts for this page only */
  }
};

export class AdoptionApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function call<T>(path: string, body?: unknown, token?: string | null): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API + path, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new AdoptionApiError("We couldn't reach the server. Check your connection and try again.", 0);
  }
  const json = (await res.json().catch(() => null)) as { status?: boolean; data?: T; message?: string } | null;
  if (!res.ok || !json?.status) {
    throw new AdoptionApiError(json?.message || "Something went wrong. Please try again.", res.status);
  }
  return json.data as T;
}

type SessionData = { token: string; user: AdoptionUser };
const signIn = ({ token, user }: SessionData) => {
  writeToken(token);
  set({ status: "signedIn", user });
};

let started = false;
/** Loads the saved session once per page load and confirms it with the server. */
function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  const token = readToken();
  if (!token) return set({ status: "signedOut", user: null });
  call<{ user: AdoptionUser }>("/me", undefined, token)
    .then(({ user }) => set({ status: "signedIn", user }))
    .catch((e: AdoptionApiError) => {
      if (e.status === 401 || e.status === 403) writeToken(null); // expired or revoked
      set({ status: "signedOut", user: null });
    });
  // Keep tabs in sync (sign-in / sign-out in another tab).
  window.addEventListener("storage", (e) => {
    if (e.key !== TOKEN_KEY) return;
    started = false;
    start();
  });
}

export function useAdoptionSession() {
  return useSyncExternalStore(
    (l) => {
      start();
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}

export type LoginResult = { requiresVerification: true; email: string } | SessionData;

export const adoptionAuth = {
  register: (fullName: string, email: string, password: string) =>
    call<{ email: string; requiresVerification: true }>("/register", { fullName, email, password }),
  verifyEmail: async (email: string, code: string) => signIn(await call<SessionData>("/verify-email", { email, code })),
  resendVerification: (email: string) => call<null>("/resend-verification", { email }),
  login: async (email: string, password: string): Promise<{ requiresVerification: boolean; email?: string }> => {
    const r = await call<LoginResult>("/login", { email, password });
    if ("token" in r) {
      signIn(r);
      return { requiresVerification: false };
    }
    return { requiresVerification: true, email: r.email };
  },
  google: async (idToken: string) => signIn(await call<SessionData>("/google", { idToken })),
  forgotPassword: (email: string) => call<null>("/forgot-password", { email }),
  resetPassword: (email: string, code: string, password: string) => call<null>("/reset-password", { email, code, password }),
  logout: async () => {
    const token = readToken();
    writeToken(null);
    set({ status: "signedOut", user: null });
    if (token) await call<null>("/logout", {}, token).catch(() => {}); // revoke on the server
  },
};
