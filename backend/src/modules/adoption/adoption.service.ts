import crypto from "node:crypto";
import prisma from "@root/prisma.js";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { hashPassword, comparePassword } from "@/utils/auth.js";
import { verifyGoogleIdToken } from "@/utils/googleAuth.js";
import { sendAdoptionVerifyEmail, sendAdoptionResetEmail, sendAdoptionChangeEmail } from "./adoption.mailer.js";
import { effectiveStatus } from "./adoption.products.js";

/**
 * AI Adoption accounts. Entirely separate from the learning platform's
 * User/Session tables and /auth endpoints: own users, own sessions, own email
 * codes, and per-product access (AdoptionEntitlement) that is never granted
 * automatically.
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
    return createSession(user.id, userAgent);
  }

  /** Always succeeds from the caller's point of view (doesn't reveal which emails exist). */
  async resendVerification(email: string) {
    const user = await prisma.adoptionUser.findUnique({ where: { email } });
    if (user && !user.emailVerified && user.isActive) {
      const code = await issueCode(user.id, "VERIFY_EMAIL");
      await sendAdoptionVerifyEmail(user.email, code, user.fullName);
    }
  }

  async login(data: { email: string; password: string }, userAgent?: string) {
    const user = await prisma.adoptionUser.findUnique({ where: { email: data.email } });
    const ok = await comparePassword(data.password, user?.passwordHash ?? (await dummyHash));
    if (user && !user.passwordHash && user.googleId) {
      throw new ApiError("This account uses Google sign-in. Continue with Google instead.", STATUS_CODES.UNAUTHORIZED);
    }
    if (!user || !user.passwordHash || !ok || !user.isActive) {
      throw new ApiError("Incorrect email or password.", STATUS_CODES.UNAUTHORIZED);
    }
    if (!user.emailVerified) {
      // Correct password but inbox not proven yet: send a fresh code.
      try {
        const code = await issueCode(user.id, "VERIFY_EMAIL");
        await sendAdoptionVerifyEmail(user.email, code, user.fullName);
      } catch (e) {
        if (!(e instanceof ApiError && e.statusCode === STATUS_CODES.TOO_MANY_REQUESTS)) throw e;
      }
      return { requiresVerification: true as const, email: user.email };
    }
    return createSession(user.id, userAgent);
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
    return createSession(user.id, userAgent);
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
    const user = await prisma.adoptionUser.findUnique({ where: { email } });
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
    const taken = await prisma.adoptionUser.findUnique({ where: { email: newEmail } });
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
    await prisma.adoptionUser.update({ where: { id: userId }, data: { email: user.pendingEmail, pendingEmail: null, emailVerified: true } });
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
    await prisma.adoptionUser.update({ where: { id: userId }, data: { passwordHash: await hashPassword(newPassword) } });
    await prisma.adoptionSession.deleteMany({ where: { userId, NOT: { id: sessionId } } });
  }

  async signOutOthers(userId: string, sessionId: string) {
    const r = await prisma.adoptionSession.deleteMany({ where: { userId, NOT: { id: sessionId } } });
    return { signedOut: r.count };
  }

  async resetPassword(data: { email: string; code: string; password: string }) {
    const user = await prisma.adoptionUser.findUnique({ where: { email: data.email } });
    if (!user || !user.isActive || !user.emailVerified) throw new ApiError("This code has expired. Request a new one.", STATUS_CODES.BAD_REQUEST);
    await consumeCode(user.id, "RESET_PASSWORD", data.code);
    await prisma.adoptionUser.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(data.password) } });
    await prisma.adoptionSession.deleteMany({ where: { userId: user.id } }); // sign out everywhere
  }
}
