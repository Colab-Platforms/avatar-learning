/**
 * Thin API client. Point NEXT_PUBLIC_API_BASE_URL at your backend.
 * All UI data is currently sourced from lib/courses.ts (mock data),
 * but components import via these helpers so swapping to a real
 * backend is a one-line change.
 */
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}
