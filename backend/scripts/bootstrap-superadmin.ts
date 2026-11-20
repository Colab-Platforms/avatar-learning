// One-time bootstrap of the FIRST Super Admin. Nothing is hardcoded: the email and password come from the environment of
// the person running it, the password is hashed with bcrypt before it is stored, and it is never printed.
//
//   BOOTSTRAP_SUPERADMIN_EMAIL=you@company.com BOOTSTRAP_SUPERADMIN_PASSWORD='...' npm run bootstrap:superadmin
//
// It writes to whatever DATABASE_URL points at (use `npm run bootstrap:superadmin:local` for the local test database), so it refuses to run in production unless you pass --i-understand-this-writes-to-the-database.
// It refuses to touch an account that already exists with a different role set, and it is a no-op if that Super Admin exists.
import prisma from "../prisma.js";
import { passwordProblem } from "../src/modules/business-admin/admins.service.js";
import { buildSuperAdminData } from "../src/modules/business-admin/superadmin.bootstrap.js";

async function main() {
  const email = (process.env.BOOTSTRAP_SUPERADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.BOOTSTRAP_SUPERADMIN_PASSWORD ?? "";
  const name = (process.env.BOOTSTRAP_SUPERADMIN_NAME ?? "Super Admin").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error("Set BOOTSTRAP_SUPERADMIN_EMAIL to a valid email.");
  const problem = passwordProblem(password, { email, name });
  if (problem) throw new Error(`BOOTSTRAP_SUPERADMIN_PASSWORD: ${problem}`);
  if (process.env.NODE_ENV === "production" && !process.argv.includes("--i-understand-this-writes-to-the-database")) {
    throw new Error("Refusing to run with NODE_ENV=production without --i-understand-this-writes-to-the-database.");
  }

  const role = await prisma.role.findUnique({ where: { name: "SUPERADMIN" } });
  if (!role) throw new Error("The SUPERADMIN role does not exist. Run `npm run db:seed` first.");

  const existing = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, include: { userRoleMappings: { include: { role: true } } } });
  if (existing) {
    const names = existing.userRoleMappings.map((m) => m.role.name);
    if (names.includes("SUPERADMIN")) return void console.log("A Super Admin with this email already exists. Nothing changed.");
    throw new Error("An account with this email already exists and is not a Super Admin. Nothing changed (promote it deliberately instead).");
  }

  const user = await prisma.user.create({ data: await buildSuperAdminData({ email, name, password, roleId: role.id }) });
  await prisma.businessAdminAuditLog.create({ data: { actorUserId: null, actorEmail: "bootstrap-script", action: "SUPERADMIN_BOOTSTRAPPED", targetUserId: user.id, targetEmail: email, details: {} } });
  console.log(`Super Admin created for ${email}. Sign in at /login, then open /admin-adaption.`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : "Bootstrap failed.");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
