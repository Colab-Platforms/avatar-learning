import crypto from "node:crypto";
import prisma from "@root/prisma.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { hashPassword, comparePassword } from "@/utils/auth.js";
import { verifyGoogleIdToken } from "@/utils/googleAuth.js";
import { sendAdoptionVerifyEmail, sendAdoptionResetEmail, sendAdoptionChangeEmail } from "./adoption.mailer.js";
import { effectiveStatus } from "./adoption.products.js";
import { findLearningUser, findAdoptionUser, ensureLearningUser, ensureAdoptionUser, matchCredentials, syncPassword, endAllSessions, isBcryptHash, joinName, normEmail } from "@/modules/auth/identity.service.js";
import { issueLearningLogin } from "@/modules/auth/auth.service.js";

/**
 * AI Adoption accounts. The PROFILE side stays here (own sessions, email codes and per-product access that is never granted
 * automatically), but the identity is shared with the learning platform: the same email + password signs in to both, and one
 * person never gets two accounts (see auth/identity.service.ts). Roles live on the shared users row only; an Adoption
 * session grants no administration access.
 */

const SESSION_DAYS = 30;
const CODE_MINUTES = 10;
const MAX_CODE_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 45;

type Purpose = "VERIFY_EMAIL" | "RESET_PASSWORD" | "CHANGE_EMAIL";

const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
const sixDigits = () => crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
// A real bcrypt hash of a random value, compared against when the account
// doesn't exist, so "no such account" and "wrong password" take the same time.
const dummyHash = hashPassword(crypto.randomBytes(16).toString("hex"));

export type PublicAdoptionUser = {
  id: string;
  fullName: string;
  email: string;
  emailVerified: boolean;
  hasPassword: boolean;
  hasGoogle: boolean;
  /** Tools with ACTIVE, unexpired access (the full list with statuses is GET /api/adoption/account/tools). */
  products: string[];
  phone: string | null;
  jobRole: string | null;
  companyName: string | null;
  companySize: string | null;
  /** A new email waiting for its verification code. */
  pendingEmail: string | null;
  createdAt: Date;
};

export async function toPublic(userId: string): Promise<PublicAdoptionUser> {
  const u = await prisma.adoptionUser.findUniqueOrThrow({
    where: { id: userId },
    include: { entitlements: { select: { product: true, status: true, expiresAt: true }, orderBy: { grantedAt: "asc" } } },
  });
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    emailVerified: u.emailVerified,
    hasPassword: !!u.passwordHash,
    hasGoogle: !!u.googleId,
    products: u.entitlements.filter((e) => effectiveStatus(e) === "ACTIVE").map((e) => e.product),
    phone: u.phone,
    jobRole: u.jobRole,
    companyName: u.companyName,
    companySize: u.companySize,
    pendingEmail: u.pendingEmail,
    createdAt: u.createdAt,
  };
}

async function createSession(userId: string, userAgent?: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  await prisma.adoptionSession.create({
    data: {
      tokenHash: sha256(token),
      userId,
      userAgent: userAgent?.slice(0, 300),
      expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000),
    },
  });
  return { token, user: await toPublic(userId) };
}

const STAFF_ROLES = ["SUPERADMIN", "SUPER_ADMIN", "BUSINESS_ADMIN"];

/**
 * Business Admin staff (Super Admin / Business Admin) who sign in here also get a Learning session, so they can open
 * /admin-adaption without a second login. Everyone else receives an Adoption session only. Authorization is unchanged:
 * the admin APIs still check the role on every request.
 */
async function attachStaffSession<T extends object>(result: T, email: string, userAgent?: string): Promise<T & { learning?: Awaited<ReturnType<typeof issueLearningLogin>> }> {
  try {
    const lu = await findLearningUser(email);
    if (!lu || !lu.isActive || !lu.userRoleMappings.some((m) => STAFF_ROLES.includes(m.role.name))) return result;
    const learning = await issueLearningLogin(lu.id, userAgent);
    return learning ? { ...result, learning } : result;
  } catch (e) {
    console.error("[adoption-auth] staff session bridge failed", e instanceof Error ? e.name : "error");
    return result;
  }
}

/** The Adoption account for an email, created from the shared identity when a Learning user has none yet. Null when nobody qualifies. */
async function resolveAdoptionAccount(email: string) {
  const existing = await findAdoptionUser(email);
  if (existing) return existing;
  const lu = await findLearningUser(email);
  if (!lu || !lu.isActive || !lu.isEmailVerified) return null;
  return ensureAdoptionUser({ email: lu.email, fullName: joinName(lu, lu.email.split("@")[0]), passwordHash: lu.password, emailVerified: true, phone: lu.phoneNo });
}

export async function issueCode(userId: string, purpose: Purpose) {
  const recent = await prisma.adoptionEmailCode.findFirst({
    where: { userId, purpose, used: false },
    orderBy: { createdAt: "desc" },
  });
  if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_SECONDS * 1000) {
    throw new ApiError("Please wait a moment before requesting another code.", STATUS_CODES.TOO_MANY_REQUESTS);
  }
  // Only the newest code is valid.
  await prisma.adoptionEmailCode.updateMany({ where: { userId, purpose, used: false }, data: { used: true } });
  const code = sixDigits();
  await prisma.adoptionEmailCode.create({
    data: { userId, purpose, codeHash: sha256(code), expiresAt: new Date(Date.now() + CODE_MINUTES * 60_000) },
  });
  return code;
}

export async function consumeCode(userId: string, purpose: Purpose, code: string) {
  const rec = await prisma.adoptionEmailCode.findFirst({
    where: { userId, purpose, used: false },
    orderBy: { createdAt: "desc" },
  });
  if (!rec || rec.expiresAt < new Date()) {
    throw new ApiError("This code has expired. Request a new one.", STATUS_CODES.BAD_REQUEST);
  }
  if (rec.attempts >= MAX_CODE_ATTEMPTS) {
    throw new ApiError("Too many incorrect attempts. Request a new code.", STATUS_CODES.TOO_MANY_REQUESTS);
  }
  const ok = crypto.timingSafeEqual(Buffer.from(rec.codeHash), Buffer.from(sha256(code)));
  if (!ok) {
    await prisma.adoptionEmailCode.update({ where: { id: rec.id }, data: { attempts: { increment: 1 } } });
    throw new ApiError("That code isn't right. Check the email and try again.", STATUS_CODES.BAD_REQUEST);
  }
  await prisma.adoptionEmailCode.update({ where: { id: rec.id }, data: { used: true } });
}

export class AdoptionAuthService {
  /** Create an account (or refresh an unverified one) and email a verification code. */
  async register(data: { fullName: string; email: string; password: string }) {
    const existing = await prisma.adoptionUser.findUnique({ where: { email: data.email } });
    if (existing?.emailVerified) {
      throw new ApiError("An account with this email already exists. Sign in instead.", STATUS_CODES.CONFLICT);
    }
    // The same email already registered on the learning platform (verified): that is the same person. Sign in with it.
    const learner = await findLearningUser(data.email);
    if (learner && (learner.isEmailVerified || learner.isPhoneVerified)) {
      throw new ApiError("An account with this email already exists. Sign in instead.", STATUS_CODES.CONFLICT);
    }
    const passwordHash = await hashPassword(data.password);
    const user = existing
      ? // Never verified: whoever proves the inbox now owns it, so replace the old details.
        await prisma.adoptionUser.update({ where: { id: existing.id }, data: { fullName: data.fullName, passwordHash } })
      : await prisma.adoptionUser.create({ data: { fullName: data.fullName, email: data.email, passwordHash } });

    if (existing) await prisma.adoptionEmailCode.updateMany({ where: { userId: user.id, used: false }, data: { used: true } });
    const code = await issueCode(user.id, "VERIFY_EMAIL");
    await sendAdoptionVerifyEmail(user.email, code, user.fullName);
    return { email: user.email, requiresVerification: true as const };
  }

  async verifyEmail(data: { email: string; code: string }, userAgent?: string) {
    const user = await prisma.adoptionUser.findUnique({ where: { email: data.email } });
    if (!user || !user.isActive) throw new ApiError("This code has expired. Request a new one.", STATUS_CODES.BAD_REQUEST);
    if (user.emailVerified) throw new ApiError("This email is already verified. Please sign in.", STATUS_CODES.CONFLICT);
    await consumeCode(user.id, "VERIFY_EMAIL", data.code);
    await prisma.adoptionUser.update({ where: { id: user.id }, data: { emailVerified: true } });
    await this.linkIdentity(user);
    return attachStaffSession(await createSession(user.id, userAgent), user.email, userAgent);
  }

  /**
   * Keeps the shared identity in step with a verified Adoption account: creates the users row when missing, fills an empty
   * password hash, marks the email verified. An UNVERIFIED learning row for this email is taken over by whoever just proved the
   * inbox (same rule the learning platform uses). Never throws into the sign-in: lazy provisioning on the next login covers a miss.
   */
  private async linkIdentity(u: { email: string; fullName: string; passwordHash: string | null; googleId?: string | null }) {
    try {
      const lu = await findLearningUser(u.email);
      if (lu && !lu.isEmailVerified && !lu.isPhoneVerified && isBcryptHash(u.passwordHash)) {
        await prisma.user.update({ where: { id: lu.id }, data: { password: u.passwordHash, isEmailVerified: true } });
        return;
      }
      await ensureLearningUser({ email: u.email, fullName: u.fullName, passwordHash: u.passwordHash, googleId: u.googleId, emailVerified: true });
    } catch (e) {
      console.error("[adoption-auth] could not link the shared identity", e instanceof Error ? e.name : "error");
    }
  }

  /** Always succeeds from the caller's point of view (doesn't reveal which emails exist). */
  async resendVerification(email: string) {
    const user = await prisma.adoptionUser.findUnique({ where: { email } });
    if (user && !user.emailVerified && user.isActive) {
      const code = await issueCode(user.id, "VERIFY_EMAIL");
      await sendAdoptionVerifyEmail(user.email, code, user.fullName);
    }
  }

  /**
   * Email + password against the SHARED identity: the learning users hash, or the Adoption hash (either one proves the
   * person; nothing is overwritten). A learning-only account gets its Adoption profile created here, so nobody registers twice.
   * Wrong email, wrong password and a deactivated account all answer the same generic 401.
   */
  async login(data: { email: string; password: string; rawPassword?: string }, userAgent?: string) {
    const email = normEmail(data.email);
    const [adoption, learner] = await Promise.all([findAdoptionUser(email), findLearningUser(email)]);
    const known = adoption ?? learner;
    const typed = [data.rawPassword, data.password].filter((p): p is string => typeof p === "string" && p.length > 0);
    if (!known) {
      await comparePassword(data.password, await dummyHash); // same timing as a real check
      throw new ApiError("Incorrect email or password.", STATUS_CODES.UNAUTHORIZED);
    }
    const match = await matchCredentials(email, typed);
    if (!match) {
      if (adoption && !adoption.passwordHash && adoption.googleId && !learner?.password) {
        throw new ApiError("This account uses Google sign-in. Continue with Google instead.", STATUS_CODES.UNAUTHORIZED);
      }
      throw new ApiError("Incorrect email or password.", STATUS_CODES.UNAUTHORIZED);
    }
    if ((adoption && !adoption.isActive) || (learner && (!learner.isActive || learner.isDeleted))) {
      throw new ApiError("Incorrect email or password.", STATUS_CODES.UNAUTHORIZED);
    }

    // Create or complete the Adoption profile from the shared identity (verification is inherited from the learning side).
    const user = await ensureAdoptionUser({
      email,
      fullName: adoption?.fullName ?? (learner ? joinName(learner, email.split("@")[0]) : email.split("@")[0]),
      passwordHash: adoption?.passwordHash ?? learner?.password ?? null,
      emailVerified: adoption?.emailVerified ?? learner?.isEmailVerified ?? false,
      phone: learner?.phoneNo ?? null,
    });
    // If the learning side already vouched for the inbox, an Adoption row that was unverified is brought in line.
    if (!user.emailVerified && learner?.isEmailVerified) await prisma.adoptionUser.update({ where: { id: user.id }, data: { emailVerified: true } });
    const verified = user.emailVerified || !!learner?.isEmailVerified;

    if (!verified) {
      // Correct password but inbox not proven yet: send a fresh code.
      try {
        const code = await issueCode(user.id, "VERIFY_EMAIL");
        await sendAdoptionVerifyEmail(user.email, code, user.fullName);
      } catch (e) {
        if (!(e instanceof ApiError && e.statusCode === STATUS_CODES.TOO_MANY_REQUESTS)) throw e;
      }
      return { requiresVerification: true as const, email: user.email };
    }
    await this.linkIdentity({ email, fullName: user.fullName, passwordHash: user.passwordHash });
    return attachStaffSession(await createSession(user.id, userAgent), email, userAgent);
  }

  /**
   * Google sign-in / sign-up. Only Google-verified emails are accepted.
   * An existing account is linked only if its email was verified with us; an
   * unverified email/password account is taken over by the Google-proven owner
   * and its unproven password removed (prevents pre-registration hijacking).
   */
  async google(idToken: string, userAgent?: string) {
    let profile;
    try {
      profile = await verifyGoogleIdToken(idToken);
    } catch {
      throw new ApiError("Google sign-in failed. Please try again.", STATUS_CODES.UNAUTHORIZED);
    }
    if (!profile.emailVerified) {
      throw new ApiError("Your Google email isn't verified, so it can't be used to sign in.", STATUS_CODES.UNAUTHORIZED);
    }
    const email = profile.email.trim().toLowerCase();
    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || email.split("@")[0];

    let user = await prisma.adoptionUser.findUnique({ where: { googleId: profile.googleId } });
    if (!user) {
      const byEmail = await prisma.adoptionUser.findUnique({ where: { email } });
      if (byEmail) {
        user = await prisma.adoptionUser.update({
          where: { id: byEmail.id },
          data: byEmail.emailVerified
            ? { googleId: profile.googleId }
            : { googleId: profile.googleId, emailVerified: true, passwordHash: null, fullName },
        });
        if (!byEmail.emailVerified) await prisma.adoptionSession.deleteMany({ where: { userId: byEmail.id } });
      } else {
        user = await prisma.adoptionUser.create({ data: { email, fullName, googleId: profile.googleId, emailVerified: true } });
      }
    }
    if (!user.isActive) throw new ApiError("This account has been deactivated.", STATUS_CODES.FORBIDDEN);
    await this.linkIdentity({ email: user.email, fullName: user.fullName, passwordHash: user.passwordHash, googleId: user.googleId });
    return attachStaffSession(await createSession(user.id, userAgent), user.email, userAgent);
  }

  /** Returns the session's user id, or throws 401. */
  async authenticate(token: string) {
    const s = await prisma.adoptionSession.findUnique({ where: { tokenHash: sha256(token) }, include: { user: true } });
    if (!s || s.expiresAt < new Date() || !s.user.isActive) {
      if (s) await prisma.adoptionSession.delete({ where: { id: s.id } }).catch(() => {});
      throw new ApiError("Your session has expired. Please sign in again.", STATUS_CODES.UNAUTHORIZED);
    }
    return { userId: s.userId, sessionId: s.id };
  }

  me(userId: string) {
    return toPublic(userId);
  }

  async logout(sessionId: string) {
    await prisma.adoptionSession.delete({ where: { id: sessionId } }).catch(() => {});
  }

  /** Always succeeds from the caller's point of view. */
  async forgotPassword(email: string) {
    const user = await resolveAdoptionAccount(email);
    if (user && user.isActive && user.emailVerified) {
      const code = await issueCode(user.id, "RESET_PASSWORD");
      await sendAdoptionResetEmail(user.email, code, user.fullName);
    }
  }

  /** Step 1 of changing email: re-check the password (if the account has one), then email a code to the NEW address. */
  async requestEmailChange(userId: string, newEmail: string, currentPassword?: string) {
    const user = await prisma.adoptionUser.findUniqueOrThrow({ where: { id: userId } });
    if (newEmail === user.email) throw new ApiError("That's already your email address.", STATUS_CODES.BAD_REQUEST);
    if (user.passwordHash) {
      if (!currentPassword || !(await comparePassword(currentPassword, user.passwordHash))) {
        throw new ApiError("Your current password is incorrect.", STATUS_CODES.UNAUTHORIZED);
      }
    }
    const taken = (await prisma.adoptionUser.findUnique({ where: { email: newEmail } })) ?? (await findLearningUser(newEmail));
    if (taken) throw new ApiError("Another account already uses that email.", STATUS_CODES.CONFLICT);
    await prisma.adoptionUser.update({ where: { id: userId }, data: { pendingEmail: newEmail } });
    const code = await issueCode(userId, "CHANGE_EMAIL");
    await sendAdoptionChangeEmail(newEmail, code, user.fullName);
    return { pendingEmail: newEmail };
  }

  /** Step 2: the code sent to the new address proves ownership; only then does the email change. */
  async confirmEmailChange(userId: string, code: string) {
    const user = await prisma.adoptionUser.findUniqueOrThrow({ where: { id: userId } });
    if (!user.pendingEmail) throw new ApiError("There's no email change waiting for a code.", STATUS_CODES.BAD_REQUEST);
    await consumeCode(userId, "CHANGE_EMAIL", code);
    const taken = await prisma.adoptionUser.findUnique({ where: { email: user.pendingEmail } });
    if (taken && taken.id !== userId) throw new ApiError("Another account already uses that email.", STATUS_CODES.CONFLICT);
    // The shared identity must move with it, or the two rows would stop being the same person.
    const learner = await findLearningUser(user.email);
    const learnerTaken = await findLearningUser(user.pendingEmail);
    if (learnerTaken && learnerTaken.id !== learner?.id) throw new ApiError("Another account already uses that email.", STATUS_CODES.CONFLICT);
    await prisma.adoptionUser.update({ where: { id: userId }, data: { email: user.pendingEmail, pendingEmail: null, emailVerified: true } });
    if (learner) await prisma.user.update({ where: { id: learner.id }, data: { email: user.pendingEmail, isEmailVerified: true } });
    return toPublic(userId);
  }

  async cancelEmailChange(userId: string) {
    await prisma.adoptionUser.update({ where: { id: userId }, data: { pendingEmail: null } });
    await prisma.adoptionEmailCode.updateMany({ where: { userId, purpose: "CHANGE_EMAIL", used: false }, data: { used: true } });
    return toPublic(userId);
  }

  /** Email/password accounts only. Signs out every other session. */
  async changePassword(userId: string, sessionId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.adoptionUser.findUniqueOrThrow({ where: { id: userId } });
    if (!user.passwordHash) throw new ApiError("This account signs in with Google and has no password.", STATUS_CODES.BAD_REQUEST);
    if (!(await comparePassword(currentPassword, user.passwordHash))) throw new ApiError("Your current password is incorrect.", STATUS_CODES.UNAUTHORIZED);
    await syncPassword(user.email, await hashPassword(newPassword)); // one password for every module
    await prisma.adoptionSession.deleteMany({ where: { userId, NOT: { id: sessionId } } });
    const learner = await findLearningUser(user.email);
    if (learner) await prisma.session.deleteMany({ where: { userId: learner.id } });
  }

  async signOutOthers(userId: string, sessionId: string) {
    const r = await prisma.adoptionSession.deleteMany({ where: { userId, NOT: { id: sessionId } } });
    return { signedOut: r.count };
  }

  async resetPassword(data: { email: string; code: string; password: string }) {
    const user = await resolveAdoptionAccount(data.email);
    if (!user || !user.isActive || !user.emailVerified) throw new ApiError("This code has expired. Request a new one.", STATUS_CODES.BAD_REQUEST);
    await consumeCode(user.id, "RESET_PASSWORD", data.code);
    await this.linkIdentity({ email: user.email, fullName: user.fullName, passwordHash: user.passwordHash });
    await syncPassword(user.email, await hashPassword(data.password)); // the same password now works in every module
    await endAllSessions(user.email); // sign out everywhere, in every module
  }
}
