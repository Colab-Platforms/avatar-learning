import prisma from "@root/prisma.js";
import { comparePassword } from "@/utils/auth.js";

/**
 * Unified identity. ONE person = one email = one `users` row (the shared identity that carries roles and the learning
 * profile) plus, for AI Adoption, one `adoption_users` row (the Adoption profile, sessions, tool access and demo requests).
 * The two rows are linked by email; ids never change, so every existing foreign key keeps working.
 *
 * Rules (enforced here so every module behaves the same):
 *  - never create a second row for an email that already has one on either side;
 *  - never overwrite an existing valid password hash (only fill an empty one, or replace it on an explicit
 *    register / reset / change that has just proven ownership);
 *  - never store an empty or non-bcrypt value as a password;
 *  - roles live only on `users`; provisioning a missing `users` row always gives plain USER;
 *  - authorization is unchanged: possessing a login does not grant any module (each API still checks roles/permissions).
 */

export const normEmail = (e: string): string => e.trim().toLowerCase();
export const isBcryptHash = (h: unknown): h is string => typeof h === "string" && /^\$2[aby]\$\d{2}\$.{53}$/.test(h);

/** Case-insensitive lookup of the live (not deleted) shared identity. */
export const findLearningUser = (email: string) =>
  prisma.user.findFirst({ where: { email: { equals: normEmail(email), mode: "insensitive" }, isDeleted: false }, include: { userRoleMappings: { include: { role: true } } } });

export const findAdoptionUser = (email: string) => prisma.adoptionUser.findUnique({ where: { email: normEmail(email) } });

const splitName = (full: string): { firstName: string; lastName: string | null } => {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? full.trim(), lastName: parts.length > 1 ? parts.slice(1).join(" ") : null };
};
export const joinName = (u: { firstName: string | null; lastName: string | null }, fallback: string): string => [u.firstName, u.lastName].filter(Boolean).join(" ") || fallback;

/**
 * Makes sure the shared `users` row exists for an email that is already proven (verified Adoption account, or Google).
 * Returns the existing row untouched when there is one. Creates a plain USER otherwise.
 */
export async function ensureLearningUser(input: { email: string; fullName: string; passwordHash?: string | null; googleId?: string | null; emailVerified: boolean }) {
  const email = normEmail(input.email);
  const existing = await findLearningUser(email);
  if (existing) {
    const patch: Record<string, unknown> = {};
    if (!existing.password && isBcryptHash(input.passwordHash)) patch.password = input.passwordHash; // fill, never overwrite
    if (input.emailVerified && !existing.isEmailVerified) patch.isEmailVerified = true;
    if (input.googleId && !existing.googleId && input.emailVerified) patch.googleId = input.googleId;
    if (Object.keys(patch).length) await prisma.user.update({ where: { id: existing.id }, data: patch });
    return { userId: existing.id, created: false };
  }
  const role = await prisma.role.findUnique({ where: { name: "USER" } });
  if (!role) return null; // not seeded: the caller degrades gracefully, it never invents a role
  const { firstName, lastName } = splitName(input.fullName);
  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        firstName, lastName, email,
        password: isBcryptHash(input.passwordHash) ? input.passwordHash : null,
        googleId: input.googleId ?? null,
        authProvider: input.googleId && !isBcryptHash(input.passwordHash) ? "GOOGLE" : "LOCAL",
        isEmailVerified: input.emailVerified,
        // An email/password account has what it needs; a Google-only one still completes the learning profile step later.
        profileCompleted: isBcryptHash(input.passwordHash),
      },
    });
    await tx.userRoleMapping.create({ data: { userId: u.id, roleId: role.id } });
    return u;
  });
  return { userId: user.id, created: true };
}

/**
 * Makes sure the Adoption profile exists for an existing shared identity (so a Learning user can sign in at Adoption without a
 * second registration). The Adoption row copies the hash only to keep both sides consistent; the shared identity stays the source.
 */
export async function ensureAdoptionUser(input: { email: string; fullName: string; passwordHash?: string | null; emailVerified: boolean; phone?: string | null }) {
  const email = normEmail(input.email);
  const existing = await findAdoptionUser(email);
  if (existing) {
    const patch: Record<string, unknown> = {};
    if (!existing.passwordHash && isBcryptHash(input.passwordHash)) patch.passwordHash = input.passwordHash;
    if (input.emailVerified && !existing.emailVerified) patch.emailVerified = true;
    if (Object.keys(patch).length) return prisma.adoptionUser.update({ where: { id: existing.id }, data: patch });
    return existing;
  }
  return prisma.adoptionUser.create({
    data: { email, fullName: input.fullName.trim() || email.split("@")[0], passwordHash: isBcryptHash(input.passwordHash) ? input.passwordHash : null, emailVerified: input.emailVerified, phone: input.phone ?? null },
  });
}

/**
 * Explicit password change (register / reset / change): the new hash goes to BOTH sides so one password works everywhere.
 * Refuses an empty or non-bcrypt value. Returns how many rows were updated.
 */
export async function syncPassword(email: string, hash: string): Promise<{ learning: boolean; adoption: boolean }> {
  if (!isBcryptHash(hash)) throw new Error("Refusing to store an invalid password hash.");
  const e = normEmail(email);
  const learning = await findLearningUser(e);
  if (learning) await prisma.user.update({ where: { id: learning.id }, data: { password: hash } });
  const adoption = await findAdoptionUser(e);
  if (adoption) await prisma.adoptionUser.update({ where: { id: adoption.id }, data: { passwordHash: hash } });
  return { learning: !!learning, adoption: !!adoption };
}

/** Ends every session of this person in BOTH modules (used after a password reset). */
export async function endAllSessions(email: string): Promise<void> {
  const e = normEmail(email);
  const learning = await findLearningUser(e);
  if (learning) await prisma.session.deleteMany({ where: { userId: learning.id } });
  const adoption = await findAdoptionUser(e);
  if (adoption) await prisma.adoptionSession.deleteMany({ where: { userId: adoption.id } });
}

export interface CredentialMatch {
  /** Which stored hash the typed password matched. */
  via: "learning" | "adoption";
  learningUserId: string | null;
  adoptionUserId: string | null;
}

/**
 * Checks the typed password(s) against EVERY stored hash for this email (the shared identity first). Accepts either, because
 * accounts created separately before unification may hold different passwords; nothing is overwritten here.
 * Empty/invalid hashes can never match. Returns null when nothing matches.
 */
export async function matchCredentials(email: string, passwords: string[]): Promise<CredentialMatch | null> {
  const typed = [...new Set(passwords.filter((p) => typeof p === "string" && p.length > 0))];
  if (!typed.length) return null;
  const learning = await findLearningUser(email);
  const adoption = await findAdoptionUser(email);
  const check = async (hash: unknown) => {
    if (!isBcryptHash(hash)) return false;
    for (const p of typed) if (await comparePassword(p, hash)) return true;
    return false;
  };
  const ids = { learningUserId: learning?.id ?? null, adoptionUserId: adoption?.id ?? null };
  if (learning && (await check(learning.password))) return { via: "learning", ...ids };
  if (adoption && (await check(adoption.passwordHash))) return { via: "adoption", ...ids };
  return null;
}
