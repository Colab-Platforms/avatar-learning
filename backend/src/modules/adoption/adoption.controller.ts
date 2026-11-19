import { Request, Response, NextFunction } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { ApiError } from "@/utils/ApiError.js";
import { AdoptionAuthService } from "./adoption.service.js";
import {
  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validateEmailOnly,
  validateResetPassword,
  validateGoogle,
} from "./adoption.validators.js";

const service = new AdoptionAuthService();
const ua = (req: Request) => req.get("user-agent") ?? undefined;

type Handler = (req: Request, res: Response) => Promise<void>;
/** Validation → 400, ApiError → its status, anything else → generic 500 (details only in server logs). */
const handle =
  (fn: Handler) =>
  async (req: Request, res: Response): Promise<void> => {
    try {
      await fn(req, res);
    } catch (err) {
      if (err instanceof ApiError) {
        sendResponse(res, false, null, err.message, err.statusCode);
        return;
      }
      console.error("[adoption-auth]", err);
      sendResponse(res, false, null, "Something went wrong. Please try again.", STATUS_CODES.SERVER_ERROR);
    }
  };

function body<T>(res: Response, result: { error?: { message: string }; value: T }): T | null {
  if (result.error) {
    sendResponse(res, false, null, result.error.message, STATUS_CODES.BAD_REQUEST);
    return null;
  }
  return result.value;
}

export const register = handle(async (req, res) => {
  const v = body(res, validateRegister(req.body));
  if (!v) return;
  const data = await service.register(v as { fullName: string; email: string; password: string });
  sendResponse(res, true, data, "We sent a 6-digit code to your email.", STATUS_CODES.CREATED);
});

export const verifyEmail = handle(async (req, res) => {
  const v = body(res, validateVerifyEmail(req.body));
  if (!v) return;
  const data = await service.verifyEmail(v as { email: string; code: string }, ua(req));
  sendResponse(res, true, data, "Email verified. Welcome to Avatar AI Adoption!");
});

export const resendVerification = handle(async (req, res) => {
  const v = body(res, validateEmailOnly(req.body));
  if (!v) return;
  await service.resendVerification((v as { email: string }).email);
  sendResponse(res, true, null, "If that account needs verifying, a new code is on its way.");
});

export const login = handle(async (req, res) => {
  const v = body(res, validateLogin(req.body));
  if (!v) return;
  const data = await service.login(v as { email: string; password: string }, ua(req));
  sendResponse(res, true, data, "requiresVerification" in data ? "Verify your email to continue." : "Signed in.");
});

export const google = handle(async (req, res) => {
  const v = body(res, validateGoogle(req.body));
  if (!v) return;
  const data = await service.google((v as { idToken: string }).idToken, ua(req));
  sendResponse(res, true, data, "Signed in with Google.");
});

export const forgotPassword = handle(async (req, res) => {
  const v = body(res, validateEmailOnly(req.body));
  if (!v) return;
  await service.forgotPassword((v as { email: string }).email);
  sendResponse(res, true, null, "If an account exists for that email, we've sent a reset code.");
});

export const resetPassword = handle(async (req, res) => {
  const v = body(res, validateResetPassword(req.body));
  if (!v) return;
  await service.resetPassword(v as { email: string; code: string; password: string });
  sendResponse(res, true, null, "Password updated. Please sign in with your new password.");
});

export const me = handle(async (_req, res) => {
  sendResponse(res, true, { user: await service.me(res.locals.adoptionUserId) }, "");
});

export const logout = handle(async (_req, res) => {
  await service.logout(res.locals.adoptionSessionId);
  sendResponse(res, true, null, "Signed out.");
});

/** Requires a valid AI Adoption session token: `Authorization: Bearer <token>`. */
export async function requireAdoptionSession(req: Request, res: Response, next: NextFunction) {
  const header = req.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    sendResponse(res, false, null, "Please sign in.", STATUS_CODES.UNAUTHORIZED);
    return;
  }
  try {
    const { userId, sessionId } = await service.authenticate(token);
    res.locals.adoptionUserId = userId;
    res.locals.adoptionSessionId = sessionId;
    next();
  } catch (err) {
    const status = err instanceof ApiError ? err.statusCode : STATUS_CODES.UNAUTHORIZED;
    sendResponse(res, false, null, err instanceof Error ? err.message : "Please sign in.", status);
  }
}
