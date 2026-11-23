/**
 * Sign-ins an administrator has terminated.
 *
 * The SOURCE OF TRUTH is the database: terminating a session marks its monitoring_sessions row end_reason = 'TERMINATED' (indexed
 * on auth_session_id) and deletes the refresh-token row. Every instance of the backend therefore agrees, and the revocation
 * survives restarts and deploys. The access token carries the refresh-token row id as `sid`; the auth middleware asks "was the
 * session with this sid terminated?" for any token that has one.
 *
 * To keep that off the hot path there are two small in-memory caches per instance:
 *  - a positive cache (a revoked sid stays revoked until its access token would have expired anyway), and
 *  - a short negative cache (a sid found NOT revoked is not asked about again for 10 seconds).
 * So a termination made on one instance is enforced on the others within ~10 seconds, and immediately on the instance that
 * performed it.
 *
 * FAIL CLOSED: if the database cannot answer (error or timeout) for a token that carries a sid, the status is UNKNOWN and the
 * check throws RevocationUnavailableError, which the auth middleware turns into a temporary 503. An unverifiable session is never
 * allowed through, and a failure is never cached as "not revoked" (nor as "revoked"), so the very next request asks again and
 * unrelated sessions recover the moment the database does. Tokens WITHOUT a sid (issued before this feature) are not checked.
 */
const ACCESS_TOKEN_TTL_MS = 24 * 3600_000 + 60_000;
export const NEGATIVE_TTL_MS = 10_000;
const MAX_ENTRIES = 5000;

export type RevocationLookup = (sessionId: string) => Promise<boolean>;

/** The revocation status of a session could not be verified (database error or timeout). */
export class RevocationUnavailableError extends Error {
  readonly code = "REVOCATION_UNAVAILABLE";
  constructor() {
    super("Session verification is temporarily unavailable.");
    this.name = "RevocationUnavailableError";
    Object.setPrototypeOf(this, RevocationUnavailableError.prototype);
  }
}

/** Longest the auth middleware waits for the database before answering 503 (a hung database must not hang every request). */
let lookupTimeoutMs = 1500;
export const setRevocationTimeout = (ms: number | null): void => {
  lookupTimeoutMs = ms ?? 1500;
};

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new RevocationUnavailableError()), ms);
    p.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });

const defaultLookup: RevocationLookup = async (sessionId) => {
  const { default: prisma } = await import("@root/prisma.js");
  const hit = await prisma.monitoringSession.findFirst({ where: { authSessionId: sessionId, endReason: "TERMINATED" }, select: { id: true } });
  return !!hit;
};

let lookup: RevocationLookup = defaultLookup;
const revoked = new Map<string, number>();
const notRevoked = new Map<string, number>();

const trim = (m: Map<string, number>, now: number) => {
  if (m.size <= MAX_ENTRIES) return;
  for (const [k, exp] of m) if (exp < now) m.delete(k);
  if (m.size > MAX_ENTRIES) for (const k of [...m.keys()].slice(0, m.size - MAX_ENTRIES)) m.delete(k); // still too big: drop the oldest
};

/** Called by the instance that terminates a session: enforced here immediately (other instances learn through the database). */
export function revokeAuthSession(sessionId: string, now = Date.now()): void {
  notRevoked.delete(sessionId);
  revoked.set(sessionId, now + ACCESS_TOKEN_TTL_MS);
  trim(revoked, now);
}

export async function isAuthSessionRevoked(sessionId: string | undefined | null, now = Date.now()): Promise<boolean> {
  if (!sessionId) return false; // tokens issued before this feature carry no sid and cannot be revoked individually
  const exp = revoked.get(sessionId);
  if (exp !== undefined) {
    if (exp > now) return true;
    revoked.delete(sessionId);
  }
  const clean = notRevoked.get(sessionId);
  if (clean !== undefined && clean > now) return false;
  let isRevoked: boolean;
  try {
    isRevoked = await withTimeout(lookup(sessionId), lookupTimeoutMs);
  } catch {
    throw new RevocationUnavailableError(); // unknown status: nothing is cached, nothing is allowed
  }
  if (isRevoked) {
    revoked.set(sessionId, now + ACCESS_TOKEN_TTL_MS);
    trim(revoked, now);
    return true;
  }
  notRevoked.set(sessionId, now + NEGATIVE_TTL_MS);
  trim(notRevoked, now);
  return false;
}

/** Tests: replace the database lookup (null restores the real one). */
export const setRevocationLookup = (fn: RevocationLookup | null): void => {
  lookup = fn ?? defaultLookup;
};

/** How many verified states this instance currently remembers (tests: proves failures are not cached). */
export const cacheSizes = () => ({ revoked: revoked.size, notRevoked: notRevoked.size });

/** Tests, and "forget this instance's memory" (simulates another instance or a restart). */
export const clearRevocations = (): void => {
  revoked.clear();
  notRevoked.clear();
};
