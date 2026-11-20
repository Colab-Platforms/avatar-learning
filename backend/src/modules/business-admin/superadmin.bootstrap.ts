import bcrypt from "bcrypt";
import { ADMIN_BCRYPT_COST } from "./admins.service.js";

/**
 * The exact row the bootstrap script creates for the first Super Admin. It lives in a module (not inside the script) so a test
 * can prove this shape signs in through the ordinary /api/auth/login: same `users` table, lower-cased email, LOCAL provider,
 * verified and active (so no OTP step), password hashed with bcrypt, and the SUPERADMIN role mapping.
 */
export async function buildSuperAdminData(input: { email: string; name: string; password: string; roleId: string }, cost = ADMIN_BCRYPT_COST) {
  const [firstName, ...rest] = input.name.trim().split(/\s+/);
  return {
    email: input.email.trim().toLowerCase(),
    firstName,
    lastName: rest.join(" ") || null,
    password: await bcrypt.hash(input.password, cost),
    authProvider: "LOCAL" as const,
    isEmailVerified: true,
    isActive: true,
    profileCompleted: true,
    userRoleMappings: { create: { roleId: input.roleId } },
  };
}
