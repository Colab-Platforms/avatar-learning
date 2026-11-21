import { after, before, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// SAFETY: the REAL AuthService (Learning), AdoptionAuthService and identity.service run over an in-memory database installed on
// the prisma client object. DATABASE_URL points at a dead port first, mail is captured (nothing is sent), Google is stubbed.
const saved: Record<string, string | undefined> = {};
for (const k of ["DATABASE_URL", "JWT_SECRET", "GOOGLE_CLIENT_ID", "RESEND_API_KEY", "SMTP_FROM_EMAIL", "WHATSAPP_AUTOMATION_ENABLED"]) saved[k] = process.env[k];
process.env.DATABASE_URL = "postgresql://nobody:nobody@127.0.0.1:1/none";
process.env.JWT_SECRET = "test_jwt_secret_not_real_0123456789";
process.env.GOOGLE_CLIENT_ID = "test-client-id.apps.googleusercontent.com";
process.env.RESEND_API_KEY = "";
process.env.SMTP_FROM_EMAIL = "";
process.env.WHATSAPP_AUTOMATION_ENABLED = "false";
const realFetch = globalThis.fetch;
globalThis.fetch = (async () => {
  throw new Error("network is disabled in tests");
}) as typeof fetch;

const { default: prisma } = await import("../../prisma.js");
const { default: AuthService } = await import("../../src/modules/auth/auth.service.js");
const { AdoptionAuthService } = await import("../../src/modules/adoption/adoption.service.js");
const identity = await import("../../src/modules/auth/identity.service.js");
const { resend } = await import("../../src/utils/mailer.js");
const { OAuth2Client } = await import("google-auth-library");

const db: any = prisma;
const learning = new AuthService();
const adoption = new AdoptionAuthService();

// ─── mail capture ───
let mails: Array<{ to: string; html: string }> = [];
(resend as any).emails.send = async (m: any) => {
  mails.push({ to: String(m.to), html: String(m.html) });
  return { error: null };
};
const lastCode = (to: string) => {
  const m = [...mails].reverse().find((x) => x.to === to);
  assert.ok(m, `no mail was sent to ${to}`);
  return m!.html.match(/>(\d{6})</)![1];
};

// ─── google stub ───
let googleProfile: { sub: string; email: string; given_name?: string; family_name?: string } = { sub: "g-1", email: "x@example.com" };
(OAuth2Client.prototype as any).verifyIdToken = async () => ({ getPayload: () => ({ ...googleProfile, email_verified: true }) });

// ─── in-memory database ───
type Row = Record<string, any>;
let users: Row[], roles: Row[], mappings: Row[], sessions: Row[], aUsers: Row[], aSessions: Row[], aCodes: Row[], resets: Row[], otps: Row[];
let seq = 0;
const nid = (p: string) => `${p}_${++seq}`;
const match = (row: Row, where: Row = {}): boolean =>
  Object.entries(where).every(([k, v]) => {
    if (k === "NOT") return !match(row, v as Row);
    if (v && typeof v === "object" && !(v instanceof Date)) {
      if ("equals" in v) return String(row[k] ?? "").toLowerCase() === String(v.equals).toLowerCase();
      if ("gte" in v) return row[k] >= v.gte;
      return true;
    }
    return row[k] === v;
  });
const withRoles = (u: Row | undefined, inc?: Row) =>
  !u ? null : inc?.userRoleMappings ? { ...u, userRoleMappings: mappings.filter((m) => m.userId === u.id).map((m) => ({ role: roles.find((r) => r.id === m.roleId) })) } : { ...u };
const patch = (row: Row, data: Row) => Object.assign(row, Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)));

const originals: Array<() => void> = [];
function install(path: string, fn: (...a: any[]) => any) {
  const parts = path.split(".");
  const key = parts.pop()!;
  const holder = parts.reduce((o: any, p) => o[p], db);
  const had = Object.prototype.hasOwnProperty.call(holder, key);
  const prev = holder[key];
  holder[key] = fn;
  originals.push(() => (had ? (holder[key] = prev) : delete holder[key]));
}

before(() => {
  install("$transaction", async (arg: any) => (typeof arg === "function" ? arg(db) : Promise.all(arg)));
  install("role.findUnique", async ({ where }: any) => roles.find((r) => r.name === where.name) ?? null);
  install("userRoleMapping.create", async ({ data }: any) => (mappings.push({ ...data }), data));
  // learning users
  install("user.findFirst", async ({ where, include }: any) => withRoles(users.find((u) => match(u, where)), include));
  install("user.create", async ({ data }: any) => {
    if (users.some((u) => u.email.toLowerCase() === String(data.email).toLowerCase())) throw new Error("UNIQUE email");
    const u = { id: nid("u"), phoneNo: null, googleId: null, password: null, isActive: true, isDeleted: false, isEmailVerified: false, isPhoneVerified: false, profileCompleted: false, authProvider: "LOCAL", profileImage: null, createdAt: new Date(), ...data };
    users.push(u);
    return { ...u };
  });
  install("user.update", async ({ where, data, include }: any) => withRoles(patch(users.find((u) => u.id === where.id)!, data), include));
  install("user.findUnique", async ({ where }: any) => users.find((u) => match(u, where)) ?? null);
  install("user.findUniqueOrThrow", async ({ where, include }: any) => withRoles(users.find((u) => match(u, where)), include)!);
  install("session.create", async ({ data }: any) => (sessions.push({ id: nid("s"), ...data }), data));
  install("session.deleteMany", async ({ where }: any) => {
    const keep = sessions.filter((s) => !match(s, where));
    const n = sessions.length - keep.length;
    sessions = keep;
    return { count: n };
  });
  install("session.findFirst", async ({ where }: any) => sessions.find((s) => match(s, where)) ?? null);
  install("otpVerification.findFirst", async ({ where }: any) => otps.find((o) => match(o, where)) ?? null);
  install("otpVerification.update", async ({ where, data }: any) => patch(otps.find((o) => o.id === where.id)!, data));
  install("passwordResetToken.updateMany", async ({ where, data }: any) => (resets.filter((r) => match(r, where)).forEach((r) => patch(r, data)), { count: 0 }));
  install("passwordResetToken.create", async ({ data }: any) => (resets.push({ id: nid("r"), used: false, ...data }), data));
  install("passwordResetToken.findUnique", async ({ where }: any) => {
    const r = resets.find((x) => x.token === where.token);
    return r ? { ...r, user: users.find((u) => u.id === r.userId) } : null;
  });
  install("passwordResetToken.update", async ({ where, data }: any) => patch(resets.find((r) => r.id === where.id)!, data));
  // adoption
  const aWith = (u: Row | undefined, inc?: Row) => (!u ? null : inc?.entitlements ? { ...u, entitlements: [] } : { ...u });
  install("adoptionUser.findUnique", async ({ where, include }: any) => aWith(aUsers.find((u) => match(u, where)), include));
  install("adoptionUser.findUniqueOrThrow", async ({ where, include }: any) => aWith(aUsers.find((u) => match(u, where)), include)!);
  install("adoptionUser.create", async ({ data }: any) => {
    if (aUsers.some((u) => u.email === data.email)) throw new Error("UNIQUE adoption email");
    const u = { id: nid("au"), passwordHash: null, googleId: null, emailVerified: false, isActive: true, phone: null, jobRole: null, companyName: null, companySize: null, pendingEmail: null, createdAt: new Date(), ...data };
    aUsers.push(u);
    return { ...u };
  });
  install("adoptionUser.update", async ({ where, data }: any) => ({ ...patch(aUsers.find((u) => u.id === where.id)!, data) }));
  install("adoptionSession.create", async ({ data }: any) => (aSessions.push({ id: nid("as"), ...data }), data));
  install("adoptionSession.deleteMany", async ({ where }: any) => {
    const keep = aSessions.filter((s) => !match(s, where));
    const n = aSessions.length - keep.length;
    aSessions = keep;
    return { count: n };
  });
  install("adoptionSession.findUnique", async ({ where }: any) => {
    const s = aSessions.find((x) => x.tokenHash === where.tokenHash);
    return s ? { ...s, user: aUsers.find((u) => u.id === s.userId) } : null;
  });
  install("adoptionSession.delete", async ({ where }: any) => ((aSessions = aSessions.filter((s) => s.id !== where.id)), {}));
  install("adoptionEmailCode.findFirst", async ({ where }: any) => [...aCodes].reverse().find((c) => match(c, where)) ?? null);
  install("adoptionEmailCode.create", async ({ data }: any) => (aCodes.push({ id: nid("c"), used: false, attempts: 0, createdAt: new Date(Date.now() - 60_000), ...data }), data));
  install("adoptionEmailCode.updateMany", async ({ where, data }: any) => (aCodes.filter((c) => match(c, where)).forEach((c) => patch(c, data)), { count: 0 }));
  install("adoptionEmailCode.update", async ({ where, data }: any) => {
    const c = aCodes.find((x) => x.id === where.id)!;
    for (const [k, v] of Object.entries(data)) c[k] = v && typeof v === "object" && "increment" in (v as any) ? c[k] + (v as any).increment : v;
    return c;
  });
});
after(() => {
  while (originals.length) originals.pop()!();
  globalThis.fetch = realFetch;
  for (const [k, v] of Object.entries(saved)) (v === undefined ? delete process.env[k] : (process.env[k] = v));
});
beforeEach(() => {
  seq = 0;
  mails = [];
  roles = ["USER", "ADMIN", "SUPERADMIN", "BUSINESS_ADMIN"].map((name) => ({ id: `role_${name}`, name }));
  users = []; mappings = []; sessions = []; aUsers = []; aSessions = []; aCodes = []; resets = []; otps = [];
  googleProfile = { sub: "g-1", email: "x@example.com" };
});

// ─── helpers ───
const EMAIL = "asha.rao@example.com";
const PW = "Cobalt#Harbor5521Lamp";
const hash = (p: string) => bcrypt.hash(p, 4);
const seedUser = async (over: Row = {}, role = "USER", pw: string | null = PW) => {
  const u = { id: nid("u"), email: EMAIL, firstName: "Asha", lastName: "Rao", password: pw ? await hash(pw) : null, phoneNo: null, googleId: null, isActive: true, isDeleted: false, isEmailVerified: true, isPhoneVerified: false, profileCompleted: true, authProvider: "LOCAL", profileImage: null, createdAt: new Date(), ...over };
  users.push(u);
  mappings.push({ userId: u.id, roleId: `role_${role}` });
  return u;
};
const seedAdoption = async (over: Row = {}, pw: string | null = PW) => {
  const a = { id: nid("au"), fullName: "Asha Rao", email: EMAIL, passwordHash: pw ? await hash(pw) : null, googleId: null, emailVerified: true, isActive: true, phone: null, jobRole: null, companyName: null, companySize: null, pendingEmail: null, createdAt: new Date(), ...over };
  aUsers.push(a);
  return a;
};
const registerLearning = (email = EMAIL, password = PW) => learning.register({ firstName: "Asha", lastName: "Rao", email, password, phoneNo: "9876543210", state: "KA", country: "IN", city: "Bengaluru" } as any);
const verifyLearningEmail = (email = EMAIL) => {
  const otp = "123456";
  otps.push({ id: nid("o"), email, otpCode: crypto.createHash("sha256").update(otp).digest("hex"), type: "REGISTER", used: false, expiresAt: new Date(Date.now() + 600_000), createdAt: new Date() });
  return learning.verifyOtp({ email, otp, type: "REGISTER" } as any);
};
const roleOf = (token: string) => (jwt.verify(token, process.env.JWT_SECRET!) as any).role;

describe("one account, one password, every module", () => {
  it("1. registers in Learning, then signs in to Adoption with the same credentials (no second registration, no duplicate)", async () => {
    await registerLearning();
    await verifyLearningEmail();
    assert.equal(users.length, 1);
    const r: any = await adoption.login({ email: EMAIL, password: PW });
    assert.ok(r.token && r.user.email === EMAIL && r.user.emailVerified === true);
    assert.equal(users.length, 1, "no second shared identity");
    assert.equal(aUsers.length, 1, "exactly one Adoption profile, created from the identity");
    assert.equal(aUsers[0].fullName, "Asha Rao");
    assert.equal(aUsers[0].passwordHash, users[0].password, "same hash");
    assert.equal((await adoption.login({ email: EMAIL, password: PW })).hasOwnProperty("token"), true);
    assert.equal(aUsers.length, 1, "a second login creates nothing");
    assert.equal(r.learning, undefined, "a regular user gets no Learning session from Adoption");
  });

  it("2. registers in Adoption, then signs in to Learning with the same credentials", async () => {
    await adoption.register({ fullName: "Asha Rao", email: EMAIL, password: PW });
    assert.equal(users.length, 0, "nothing is shared until the inbox is proven");
    await adoption.verifyEmail({ email: EMAIL, code: lastCode(EMAIL) });
    assert.equal(users.length, 1, "the shared identity is created on verification");
    assert.deepEqual(mappings.filter((m) => m.userId === users[0].id).map((m) => m.roleId), ["role_USER"], "plain USER, nothing more");
    const adoptionId = aUsers[0].id;
    const r: any = await learning.login({ email: EMAIL, password: PW });
    assert.ok(r.accessToken && r.refreshToken);
    assert.equal(roleOf(r.accessToken), "USER");
    assert.equal(users.length, 1);
    assert.equal(aUsers[0].id, adoptionId, "the Adoption id never changes");
  });

  it("2b. a legacy Adoption-only account (verified, never in Learning) can sign in to Learning and is provisioned once, as USER", async () => {
    const a = await seedAdoption();
    const r: any = await learning.login({ email: EMAIL, password: PW });
    assert.equal(roleOf(r.accessToken), "USER");
    await learning.login({ email: EMAIL, password: PW });
    assert.equal(users.length, 1);
    assert.equal(aUsers.length, 1);
    assert.equal(aUsers[0].id, a.id);
    assert.equal(users[0].isEmailVerified, true);
  });

  it("3. accounts created separately with DIFFERENT passwords: both work in both modules, neither hash is overwritten, nothing duplicates", async () => {
    await seedUser({}, "USER", "Learning#Pass1234xyz");
    await seedAdoption({}, "Adoption#Pass5678abc");
    const lHash = users[0].password, aHash = aUsers[0].passwordHash;
    for (const pw of ["Learning#Pass1234xyz", "Adoption#Pass5678abc"]) {
      assert.ok((await learning.login({ email: EMAIL, password: pw }) as any).accessToken, `learning ${pw}`);
      assert.ok((await adoption.login({ email: EMAIL, password: pw }) as any).token, `adoption ${pw}`);
    }
    assert.deepEqual([users[0].password, aUsers[0].passwordHash], [lHash, aHash], "hashes untouched");
    await assert.rejects(adoption.login({ email: EMAIL, password: "wrong-password-1A!" }), /Incorrect email or password/);
    await assert.rejects(learning.login({ email: EMAIL, password: "wrong-password-1A!" }), /Invalid email or password/);
    assert.deepEqual([users.length, aUsers.length], [1, 1]);
  });

  it("3b. an empty or corrupt hash never matches, is never copied over a good one, and a good hash fills an empty one", async () => {
    await seedUser({ password: "not-a-bcrypt-hash" });
    const good = await hash(PW);
    await seedAdoption({ passwordHash: good });
    assert.ok((await learning.login({ email: EMAIL, password: PW }) as any).accessToken, "the valid Adoption hash still proves the person");
    assert.equal(users[0].password, "not-a-bcrypt-hash", "an existing (even odd) value is never overwritten implicitly");
    await assert.rejects(identity.syncPassword(EMAIL, ""), /invalid password hash/);
    await assert.rejects(identity.syncPassword(EMAIL, "plain-text"), /invalid password hash/);
    users[0].password = null;
    await adoption.login({ email: EMAIL, password: PW });
    assert.equal(users[0].password, good, "an empty hash is filled from the proven one");
  });

  it("3c. passwords containing < and > work in both modules (typed form is accepted)", async () => {
    const pw = "Pa<ss>word#12345Q";
    await seedUser({}, "USER", pw);
    assert.ok((await learning.login({ email: EMAIL, password: pw.replace("<", "&lt;").replace(">", "&gt;"), rawPassword: pw }) as any).accessToken);
    assert.ok((await adoption.login({ email: EMAIL, password: pw.replace("<", "&lt;").replace(">", "&gt;"), rawPassword: pw }) as any).token);
  });

  it("no duplicate accounts through registration: a verified identity on either side blocks the other module's register", async () => {
    await seedUser();
    await assert.rejects(adoption.register({ fullName: "Asha Rao", email: EMAIL, password: PW }), /already exists/);
    users = []; mappings = [];
    await seedAdoption();
    await assert.rejects(registerLearning(), /already registered/);
    assert.deepEqual([users.length, aUsers.length], [0, 1]);
  });

  it("an unverified Adoption registrant cannot take over a verified Learning account, and email case does not create a second account", async () => {
    await seedUser();
    await assert.rejects(adoption.register({ fullName: "Mallory", email: EMAIL.toUpperCase().toLowerCase(), password: "Evil#Pass12345x" }), /already exists/);
    const r: any = await adoption.login({ email: EMAIL.toUpperCase(), password: PW });
    assert.ok(r.token);
    assert.deepEqual([users.length, aUsers.length], [1, 1]);
  });
});

describe("password reset and sessions across modules", () => {
  it("4a. a reset started in Adoption sets the password for Learning too and ends sessions in both", async () => {
    await seedUser();
    await seedAdoption();
    await learning.login({ email: EMAIL, password: PW });
    await adoption.login({ email: EMAIL, password: PW });
    assert.ok(sessions.length === 1 && aSessions.length === 1);
    await adoption.forgotPassword(EMAIL);
    const NEW = "Violet!Marble#8472Orbit";
    await adoption.resetPassword({ email: EMAIL, code: lastCode(EMAIL), password: NEW });
    assert.ok((await learning.login({ email: EMAIL, password: NEW }) as any).accessToken, "Learning accepts the new password");
    assert.ok((await adoption.login({ email: EMAIL, password: NEW }) as any).token);
    await assert.rejects(learning.login({ email: EMAIL, password: PW }), /Invalid email or password/);
    await assert.rejects(adoption.login({ email: EMAIL, password: PW }), /Incorrect email or password/);
    assert.equal(sessions.length + aSessions.length, 2, "only the two sessions made after the reset exist");
  });

  it("4b. a reset started in Learning sets the password for Adoption too and ends sessions in both", async () => {
    await seedUser();
    await seedAdoption();
    await adoption.login({ email: EMAIL, password: PW });
    await learning.forgotPassword(EMAIL);
    const NEW = "Violet!Marble#8472Orbit";
    await learning.resetPassword(resets[0].token, NEW);
    assert.equal(aSessions.length, 0, "the Adoption session ended");
    assert.ok((await adoption.login({ email: EMAIL, password: NEW }) as any).token);
    await assert.rejects(adoption.login({ email: EMAIL, password: PW }), /Incorrect email or password/);
    assert.ok((await learning.login({ email: EMAIL, password: NEW }) as any).accessToken);
  });

  it("4c. an Adoption-only person can reset from Learning, and a Learning-only person from Adoption (identity is created from the verified one)", async () => {
    await seedAdoption();
    await learning.forgotPassword(EMAIL);
    assert.equal(users.length, 1, "the shared identity appears so the reset can proceed");
    users = []; mappings = []; aUsers = []; resets = []; mails = [];
    await seedUser();
    await adoption.forgotPassword(EMAIL);
    assert.equal(aUsers.length, 1);
    await adoption.resetPassword({ email: EMAIL, code: lastCode(EMAIL), password: "Violet!Marble#8472Orbit" });
    assert.ok((await learning.login({ email: EMAIL, password: "Violet!Marble#8472Orbit" }) as any).accessToken);
  });

  it("4d. forgot-password for an unknown email reveals nothing in Adoption and sends no mail", async () => {
    await adoption.forgotPassword("nobody@example.com");
    assert.equal(mails.length, 0);
  });

  it("10. logout ends only that module's session; a deactivated or soft-deleted account cannot sign in anywhere", async () => {
    await seedUser();
    await seedAdoption();
    const l: any = await learning.login({ email: EMAIL, password: PW });
    const a: any = await adoption.login({ email: EMAIL, password: PW });
    await learning.logout(l.refreshToken);
    assert.deepEqual([sessions.length, aSessions.length], [0, 1], "Adoption session survives a Learning logout (separate sessions)");
    const { sessionId } = await adoption.authenticate(a.token);
    await adoption.logout(sessionId);
    assert.equal(aSessions.length, 0);
    users[0].isActive = false;
    await assert.rejects(adoption.login({ email: EMAIL, password: PW }), /Incorrect email or password/);
    await assert.rejects(learning.login({ email: EMAIL, password: PW }), /deactivated/);
    users[0].isActive = true;
    users[0].isDeleted = true;
    aUsers[0].isActive = false;
    await assert.rejects(adoption.login({ email: EMAIL, password: PW }), /Incorrect email or password/);
  });
});

describe("Google sign-in keeps working", () => {
  it("5a. Adoption Google for an existing Learning user links to the same identity (no duplicate), keeps roles", async () => {
    await seedUser({ email: "x@example.com" }, "ADMIN");
    googleProfile = { sub: "g-1", email: "x@example.com", given_name: "Asha", family_name: "Rao" };
    const r: any = await adoption.google("id-token");
    assert.ok(r.token);
    assert.deepEqual([users.length, aUsers.length], [1, 1]);
    assert.equal(users[0].googleId, "g-1", "Google linked onto the existing identity");
    assert.deepEqual(mappings.map((m) => m.roleId), ["role_ADMIN"], "roles untouched");
  });

  it("5b. Learning Google for an Adoption-only Google user reuses the email's identity (no duplicate users row)", async () => {
    googleProfile = { sub: "g-2", email: "newgoogle@example.com", given_name: "Neha" };
    await adoption.google("id-token");
    assert.equal(users.length, 1, "Adoption Google also creates the shared identity");
    const r: any = await learning.googleAuth({ idToken: "id-token" } as any);
    assert.ok(r.accessToken);
    assert.equal(users.length, 1);
    assert.equal(aUsers.length, 1);
  });
});

describe("authorization is NOT widened by a shared login", () => {
  it("6. Super Admin signing in through Adoption also gets a Learning session whose role is SUPERADMIN (for /admin-adaption)", async () => {
    await seedUser({}, "SUPERADMIN");
    await seedAdoption();
    const r: any = await adoption.login({ email: EMAIL, password: PW });
    assert.ok(r.learning?.accessToken);
    assert.equal(roleOf(r.learning.accessToken), "SUPERADMIN");
    assert.ok(r.learning.refreshToken);
  });

  it("7. Business Admin staff get a BUSINESS_ADMIN token (Business Admin only; the Learning Admin routes refuse that role)", async () => {
    await seedUser({}, "BUSINESS_ADMIN");
    const r: any = await adoption.login({ email: EMAIL, password: PW });
    assert.equal(roleOf(r.learning.accessToken), "BUSINESS_ADMIN");
  });

  it("8. a regular USER (or Learning Admin) signing in through Adoption never receives a Learning session from it", async () => {
    await seedUser({}, "USER");
    assert.equal(((await adoption.login({ email: EMAIL, password: PW })) as any).learning, undefined);
    users = []; mappings = []; aUsers = [];
    await seedUser({}, "ADMIN");
    assert.equal(((await adoption.login({ email: EMAIL, password: PW })) as any).learning, undefined, "Learning Admin stays on /admin through the Learning login only");
  });

  it("9. a deactivated Super Admin gets no bridged session; provisioning never invents roles", async () => {
    await seedUser({}, "SUPERADMIN");
    await seedAdoption();
    users[0].isActive = false;
    await assert.rejects(adoption.login({ email: EMAIL, password: PW }), /Incorrect email or password/);
    users[0].isActive = true;
    roles = roles.filter((r) => r.name !== "USER");
    users = []; mappings = [];
    assert.equal(await identity.ensureLearningUser({ email: "new@example.com", fullName: "N", emailVerified: true }), null, "missing USER role: nothing is created");
    assert.equal(users.length, 0);
  });
});
