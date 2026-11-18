import { Cashfree, CFEnvironment } from "cashfree-pg";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";

export const CASHFREE_API_VERSION = "2025-01-01";

export function getCashfreeEnvironment(): "sandbox" | "production" {
  return process.env.CASHFREE_ENV === "production" ? "production" : "sandbox";
}

export function getCashfree(): Cashfree {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  if (!appId || !secretKey) {
    throw new ApiError("Cashfree credentials not configured", STATUS_CODES.SERVER_ERROR);
  }

  const environment =
    getCashfreeEnvironment() === "production"
      ? CFEnvironment.PRODUCTION
      : CFEnvironment.SANDBOX;

  const cashfree = new Cashfree(environment, appId, secretKey);
  cashfree.XApiVersion = CASHFREE_API_VERSION;
  return cashfree;
}
