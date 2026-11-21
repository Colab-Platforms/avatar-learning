// Repeatable reconciliation of existing accounts for the unified login (users <-> adoption_users, matched by email).
//
//   cd backend
//   npx tsx scripts/reconcile-accounts.ts            # DRY RUN: prints counts and what would change, writes nothing
//   npx tsx scripts/reconcile-accounts.ts --apply    # asks you to type the database name, then applies ONLY the safe fixes
//
// Safe fixes (idempotent; run it as often as you like):
//   * a VERIFIED, ACTIVE Adoption account with a valid password and no shared identity -> create the `users` row (plain USER role,
//     same email, same hash). The Adoption id is untouched.
//   * an EMPTY password hash on one side is filled from the other side's valid hash.
// It NEVER: overwrites an existing hash, creates a second row for an email, changes roles, touches unverified or inactive accounts,
// or deletes anything. Conflicts (different valid passwords, case-duplicate emails, invalid hashes) are only REPORTED for a human.
// Nothing is needed for correctness: login also does this lazily per account. This is for tidying up in one pass.
//
// Database: your shell's DATABASE_URL or a hidden prompt (backend/.env is never loaded). Output has counts and ids only, never
// emails, passwords, hashes or URLs.
import { isBcryptHash } from "../src/modules/auth/identity.service.js";

/** Host shown without the full name (self-contained so this script does not depend on other tooling). */
const maskHost = (host: string): string => {
  if (!host || /^(localhost|127\.0\.0\.1|::1)$/.test(host)) return host || "(none)";
  const parts = host.split(".");
  return `${(parts[0] ?? "").slice(0, 3)}***.${parts.slice(-2).join(".")}`;
};

function promptHidden(label: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    if (!stdin.isTTY) return reject(new Error(`${label}: no terminal available; provide it through an environment variable instead.`));
    process.stdout.write(`${label} (input hidden): `);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let buf = "";
    const onData = (chunk: string) => {
      for (const c of chunk) {
        if (c === "\r" || c === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          process.stdout.write("\n");
          return resolve(buf);
        }
        if (c === "\u0003") process.exit(130);
        if (c === "\u007f" || c === "\b") buf = buf.slice(0, -1);
        else buf += c;
      }
    };
    stdin.on("data", onData);
  });
}

export interface LUser { id: string; email: string; password: string | null; isEmailVerified: boolean; isActive: boolean; isDeleted: boolean }
export interface AUser { id: string; email: string; passwordHash: string | null; emailVerified: boolean; isActive: boolean }

export interface Plan {
  linked: number;
  /** Adoption-only accounts that qualify for a shared identity. */
  provisionLearning: AUser[];
  /** Learning-only accounts: nothing to do (the Adoption profile is created at first Adoption sign-in). */
  learningOnly: number;
  /** Empty hash on one side that a valid hash on the other side can fill. */
  fillLearningHash: Array<{ learningId: string; hash: string }>;
  fillAdoptionHash: Array<{ adoptionId: string; hash: string }>;
  /** For a human: not changed by this script. */
  conflicts: { differentValidPasswords: number; caseDuplicateEmails: string[]; invalidHashes: { learning: number; adoption: number }; adoptionUnqualified: number };
}

const key = (e: string) => e.trim().toLowerCase();

export function planReconcile(users: LUser[], adoption: AUser[]): Plan {
  const live = users.filter((u) => !u.isDeleted);
  const byEmail = new Map(live.map((u) => [key(u.email), u]));
  const plan: Plan = { linked: 0, provisionLearning: [], learningOnly: 0, fillLearningHash: [], fillAdoptionHash: [], conflicts: { differentValidPasswords: 0, caseDuplicateEmails: [], invalidHashes: { learning: 0, adoption: 0 }, adoptionUnqualified: 0 } };

  const seen = new Map<string, number>();
  for (const u of live) seen.set(key(u.email), (seen.get(key(u.email)) ?? 0) + 1);
  plan.conflicts.caseDuplicateEmails = [...seen].filter(([, n]) => n > 1).map(([e]) => e.replace(/^(.).*(@.*)$/, "$1***$2"));
  plan.conflicts.invalidHashes.learning = live.filter((u) => u.password && !isBcryptHash(u.password)).length;
  plan.conflicts.invalidHashes.adoption = adoption.filter((a) => a.passwordHash && !isBcryptHash(a.passwordHash)).length;

  const adoptionKeys = new Set(adoption.map((a) => key(a.email)));
  plan.learningOnly = live.filter((u) => !adoptionKeys.has(key(u.email))).length;

  for (const a of adoption) {
    const u = byEmail.get(key(a.email));
    if (u) {
      plan.linked++;
      if (!u.password && isBcryptHash(a.passwordHash)) plan.fillLearningHash.push({ learningId: u.id, hash: a.passwordHash });
      else if (!a.passwordHash && isBcryptHash(u.password)) plan.fillAdoptionHash.push({ adoptionId: a.id, hash: u.password });
      else if (isBcryptHash(u.password) && isBcryptHash(a.passwordHash) && u.password !== a.passwordHash) plan.conflicts.differentValidPasswords++;
    } else if (a.emailVerified && a.isActive && isBcryptHash(a.passwordHash)) {
      plan.provisionLearning.push(a);
    } else {
      plan.conflicts.adoptionUnqualified++;
    }
  }
  return plan;
}

export function render(p: Plan): string[] {
  return [
    `accounts linked by email (same person in both tables): ${p.linked}`,
    `Learning-only accounts (nothing to do): ${p.learningOnly}`,
    `Adoption-only, verified + active + valid password -> shared identity would be CREATED: ${p.provisionLearning.length}`,
    `empty hash that a valid hash on the other side can FILL: learning ${p.fillLearningHash.length}, adoption ${p.fillAdoptionHash.length}`,
    `FOR A HUMAN (never changed here): different valid passwords ${p.conflicts.differentValidPasswords} (both still work at login), case-duplicate emails ${p.conflicts.caseDuplicateEmails.length}, invalid hashes learning ${p.conflicts.invalidHashes.learning} / adoption ${p.conflicts.invalidHashes.adoption}, Adoption accounts not eligible (unverified, inactive or no password) ${p.conflicts.adoptionUnqualified}`,
  ];
}

async function main() {
  const doApply = process.argv.includes("--apply");
  if (!process.env.DATABASE_URL?.trim()) process.env.DATABASE_URL = await promptHidden("DATABASE_URL");
  const url = new URL(process.env.DATABASE_URL!);
  const dbName = url.pathname.replace(/^\//, "");
  console.log(`database: host ${maskHost(url.hostname)}  name ${dbName}`);

  const { default: prisma } = await import("../prisma.js");
  const { ensureLearningUser } = await import("../src/modules/auth/identity.service.js");
  try {
    const users = (await prisma.user.findMany({ select: { id: true, email: true, password: true, isEmailVerified: true, isActive: true, isDeleted: true } })) as LUser[];
    const adoption = (await prisma.adoptionUser.findMany({ select: { id: true, email: true, passwordHash: true, emailVerified: true, isActive: true } })) as AUser[];
    const plan = planReconcile(users, adoption);
    for (const line of render(plan)) console.log(line);
    if (!doApply) {
      console.log("DRY RUN. Nothing was changed. Re-run with --apply to perform only the CREATE and FILL steps above.");
      return;
    }
    const typed = await promptHidden(`Type the database name (${dbName}) to confirm`);
    if (typed.trim() !== dbName) throw new Error("Confirmation did not match the database name. Nothing was changed.");
    let created = 0, filled = 0;
    for (const a of plan.provisionLearning) {
      const full = await prisma.adoptionUser.findUnique({ where: { id: a.id }, select: { email: true, fullName: true, passwordHash: true } });
      if (!full) continue;
      const r = await ensureLearningUser({ email: full.email, fullName: full.fullName, passwordHash: full.passwordHash, emailVerified: true });
      if (r?.created) created++;
    }
    for (const f of plan.fillLearningHash) {
      const r = await prisma.user.updateMany({ where: { id: f.learningId, password: null }, data: { password: f.hash } });
      filled += r.count;
    }
    for (const f of plan.fillAdoptionHash) {
      const r = await prisma.adoptionUser.updateMany({ where: { id: f.adoptionId, passwordHash: null }, data: { passwordHash: f.hash } });
      filled += r.count;
    }
    console.log(`Done. Shared identities created: ${created}. Empty hashes filled: ${filled}. Nothing overwritten or deleted.`);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && /reconcile-accounts\.ts$/.test(process.argv[1].replace(/\\/g, "/"))) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message.replace(/postgres(ql)?:\/\/\S+/gi, "<url>").split("\n")[0] : "Reconcile failed.");
    process.exitCode = 1;
  });
}
