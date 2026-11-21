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
  phone: string | null;
  jobRole: string | null;
  companyName: string | null;
  companySize: string | null;
  /** A new email waiting for its verification code. */
  pendingEmail: string | null;
  createdAt: string;
};

type State = { status: "loading" | "signedOut" | "signedIn"; user: AdoptionUser | null };

const TOKEN_KEY = "adoption_session";
const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
/** Backend API root (handles NEXT_PUBLIC_API_BASE_URL with or without a trailing /api). */
export const API_ROOT = base.endsWith("/api") ? base : `${base}/api`;
const API = `${API_ROOT}/adoption/auth`;

let state: State = { status: "loading", user: null };
const listeners = new Set<() => void>();
const set = (s: State) => {
  state = s;
  listeners.forEach((l) => l());
};

/** The AI Adoption session token, if signed in (never the learning platform's). */
export const readAdoptionToken = () => readToken();
function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
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

async function call<T>(path: string, body?: unknown, token?: string | null, root = API): Promise<T> {
  let res: Response;
  try {
    res = await fetch(root + path, {
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

// ─── Tools on the signed-in account ──────────────────────────────────────────

/** Effective status from the backend. EXPIRED / NO_ACCESS are derived there. */
export type ToolStatus = "ACTIVE" | "PENDING_SETUP" | "SUSPENDED" | "EXPIRED" | "NO_ACCESS";
export type AdoptionTool = {
  product: string;
  name: string;
  description: string;
  status: ToolStatus;
  expiresAt: string | null;
  /** Whether the tool's app address has been set up on the server. */
  configured: boolean;
  /** When this account asked for access (pending request), if any. */
  requestedAt: string | null;
};

const ACCOUNT = `${API_ROOT}/adoption/account`;
const authed = <T,>(path: string, body?: unknown) => {
  const token = readToken();
  if (!token) return Promise.reject(new AdoptionApiError("Please sign in.", 401));
  return call<T>(path, body, token, ACCOUNT).catch((e: AdoptionApiError) => {
    if (e.status === 401) {
      writeToken(null); // session expired or revoked
      set({ status: "signedOut", user: null });
    }
    throw e;
  });
};

export const adoptionTools = {
  list: () => authed<{ tools: AdoptionTool[] }>("/tools").then((r) => r.tools),
  /** The server checks access every time; only active access returns the tool's address. */
  open: (product: string) => authed<{ url: string }>(`/tools/${encodeURIComponent(product)}/open`, {}).then((r) => r.url),
  requestAccess: (product: string, message?: string) => authed<{ tools: AdoptionTool[] }>("/requests", { product, message }).then((r) => r.tools),
};

// ─── My Account: profile, security, demo requests ─────────────────────────────

const setUser = (user: AdoptionUser) => set({ status: "signedIn", user });

export type ProfileUpdate = { fullName?: string; phone?: string; jobRole?: string; companyName?: string; companySize?: string };
export type DemoStatus = "SUBMITTED" | "UNDER_REVIEW" | "SCHEDULED" | "COMPLETED" | "CANCELLED";
export type MyDemoRequest = { id: string; tools: string[]; customRequirement: string | null; status: DemoStatus; scheduledAt: string | null; createdAt: string };

export const adoptionAccount = {
  updateProfile: async (p: ProfileUpdate) => {
    const r = await callMethod<{ user: AdoptionUser }>("PATCH", "/profile", p);
    setUser(r.user);
    return r.user;
  },
  requestEmailChange: (newEmail: string, currentPassword?: string) =>
    authed<{ pendingEmail: string }>("/email/request", { newEmail, currentPassword }).then(async (r) => {
      const { user } = await authed<{ user: AdoptionUser }>("/profile");
      setUser(user);
      return r;
    }),
  confirmEmailChange: (code: string) => authed<{ user: AdoptionUser }>("/email/confirm", { code }).then((r) => (setUser(r.user), r.user)),
  cancelEmailChange: () => authed<{ user: AdoptionUser }>("/email/cancel", {}).then((r) => (setUser(r.user), r.user)),
  changePassword: (currentPassword: string, newPassword: string) => authed<null>("/password", { currentPassword, newPassword }),
  signOutOthers: () => authed<{ signedOut: number }>("/sessions/sign-out-others", {}),
  demoRequests: () => authed<{ requests: MyDemoRequest[] }>("/demo-requests").then((r) => r.requests),
};

/** PATCH and other verbs for the signed-in account API. */
function callMethod<T>(method: string, path: string, body: unknown): Promise<T> {
  const token = readToken();
  if (!token) return Promise.reject(new AdoptionApiError("Please sign in.", 401));
  return fetch(ACCOUNT + path, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) })
    .catch(() => {
      throw new AdoptionApiError("We couldn't reach the server. Check your connection and try again.", 0);
    })
    .then(async (res) => {
      const json = (await res.json().catch(() => null)) as { status?: boolean; data?: T; message?: string } | null;
      if (res.status === 401) {
        writeToken(null);
        set({ status: "signedOut", user: null });
      }
      if (!res.ok || !json?.status) throw new AdoptionApiError(json?.message || "Something went wrong. Please try again.", res.status);
      return json.data as T;
    });
}

export type DemoRequestInput = {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  role: string;
  companySize: string;
  /** AI Adoption product keys, e.g. ["CRM", "HRMS"]. */
  tools: string[];
  customRequirement?: string;
  message?: string;
  /** The visitor ticked "message me on WhatsApp": the only thing that lets the server send the WhatsApp confirmation. */
  whatsappConsent?: boolean;
};

/** Book a Demo. Linked to the account only when sent with a valid session. */
export const submitDemoRequest = (input: DemoRequestInput) =>
  call<{ id: string; status: DemoStatus; tools: string[]; createdAt: string }>("", input, readToken(), `${API_ROOT}/adoption/demo-requests`);
