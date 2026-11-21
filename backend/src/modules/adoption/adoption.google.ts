import type { PrismaClient } from "@prisma/client";

export interface GoogleAccountInput {
  googleId: string;
  email: string;
  fullName: string;
}

/**
 * Finds or creates the Adoption account for a verified Google profile (same behaviour as before, moved here so the choices
 * can be tested without a database). `onRegistered` is the welcome/registration event: it fires exactly when this sign-in
 * is what brings an account into existence as a verified account:
 *  - a brand-new account                                        -> fires
 *  - an existing UNVERIFIED account that Google now verifies    -> fires (they have just completed registration)
 *  - an existing verified account (linking Google, or signing in) -> never fires
 * The email automation de-duplicates per person, so a repeat call cannot produce a second welcome email.
 */
export async function resolveGoogleAccount(db: Pick<PrismaClient, "adoptionUser" | "adoptionSession">, input: GoogleAccountInput, onRegistered: (userId: string) => void) {
  const { googleId, email, fullName } = input;
  let user = await db.adoptionUser.findUnique({ where: { googleId } });
  if (!user) {
    const byEmail = await db.adoptionUser.findUnique({ where: { email } });
    if (byEmail) {
      user = await db.adoptionUser.update({
        where: { id: byEmail.id },
        data: byEmail.emailVerified ? { googleId } : { googleId, emailVerified: true, passwordHash: null, fullName },
      });
      if (!byEmail.emailVerified) {
        await db.adoptionSession.deleteMany({ where: { userId: byEmail.id } });
        onRegistered(user.id);
      }
    } else {
      user = await db.adoptionUser.create({ data: { email, fullName, googleId, emailVerified: true } });
      onRegistered(user.id);
    }
  }
  return user;
}
