import { Router, Request, Response } from "express";
import Joi from "joi";
import prisma from "@root/prisma.js";
import { auth } from "@/middlewares/authMiddleware.js";
import { createLimiter } from "@/middlewares/rateLimiter.js";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { ApiError } from "@/utils/ApiError.js";
import { ContactService } from "@/modules/contact/contact.service.js";
import { emitAutomationEvent, toWaPhone } from "@/modules/business-admin/automation.emit.js";
import type { AdoptionProduct, AdoptionDemoStatus } from "@prisma/client";
import { requireAdoptionSession } from "./adoption.controller.js";
import { AdoptionAuthService, toPublic } from "./adoption.service.js";
import { ADOPTION_PRODUCTS, PRODUCT_KEYS } from "./adoption.products.js";

/**
 * AI Adoption "My Account": profile, email change, password, sessions, and
 * demo requests (customer + admin). Everything a customer reads or changes is
 * scoped to the user id of their own session.
 */

const service = new AdoptionAuthService();
const contactService = new ContactService();

type Handler = (req: Request, res: Response) => Promise<unknown>;
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
      console.error("[adoption-account]", err);
      sendResponse(res, false, null, "Something went wrong. Please try again.", STATUS_CODES.SERVER_ERROR);
    }
  };
const validate = <T>(schema: Joi.ObjectSchema, body: unknown): T => {
  const { error, value } = schema.validate(body, { stripUnknown: true, abortEarly: true });
  if (error) throw new ApiError(error.message, STATUS_CODES.BAD_REQUEST);
  return value as T;
};

export const ROLES = ["Founder / Business Owner", "CEO / Director", "Manager", "HR Manager", "Sales Manager", "Operations Manager", "IT Manager", "Other"];
export const COMPANY_SIZES = ["1–10 employees", "11–50 employees", "51–200 employees", "201–500 employees", "501–1000 employees", "1000+ employees"];
const newPassword = Joi.string().min(8).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
  "string.min": "Password must be at least 8 characters.",
  "string.pattern.base": "Password must include an uppercase letter, a lowercase letter and a number.",
  "any.required": "Enter a new password.",
});
const phone = Joi.string().trim().pattern(/^\+?[0-9 ()-]{7,20}$/).allow("", null).messages({ "string.pattern.base": "Enter a valid phone number." });

// ─── Customer: /api/adoption/account/* (signed in) ───────────────────────────

export const profileRouter = Router();
profileRouter.use(requireAdoptionSession);
const uid = (res: Response) => res.locals.adoptionUserId as string;

profileRouter.get("/profile", handle(async (_req, res) => sendResponse(res, true, { user: await toPublic(uid(res)) }, "")));

profileRouter.patch(
  "/profile",
  handle(async (req, res) => {
    const v = validate<{ fullName?: string; phone?: string | null; jobRole?: string | null; companyName?: string | null; companySize?: string | null }>(
      Joi.object({
        fullName: Joi.string().trim().min(2).max(120).messages({ "string.min": "Enter your full name." }),
        phone,
        jobRole: Joi.string().trim().max(80).allow("", null),
        companyName: Joi.string().trim().max(160).allow("", null),
        companySize: Joi.string().valid(...COMPANY_SIZES, "", null).messages({ "any.only": "Choose a company size from the list." }),
      }),
      req.body,
    );
    const clean = (x: string | null | undefined) => (x === undefined ? undefined : x?.trim() || null);
    await prisma.adoptionUser.update({
      where: { id: uid(res) },
      data: { fullName: v.fullName, phone: clean(v.phone), jobRole: clean(v.jobRole), companyName: clean(v.companyName), companySize: clean(v.companySize) },
    });
    sendResponse(res, true, { user: await toPublic(uid(res)) }, "Profile saved.");
  }),
);

// Separate limits so email changes and password changes don't use up each other's attempts.
const emailLimiter = createLimiter({ windowMs: 15 * 60_000, max: 10, message: "Too many attempts. Please wait a few minutes and try again." });
const passwordLimiter = createLimiter({ windowMs: 15 * 60_000, max: 10, message: "Too many attempts. Please wait a few minutes and try again." });
profileRouter.post(
  "/email/request",
  emailLimiter,
  handle(async (req, res) => {
    const v = validate<{ newEmail: string; currentPassword?: string }>(
      Joi.object({
        newEmail: Joi.string().trim().lowercase().email().max(254).required().messages({ "string.email": "Enter a valid email address.", "any.required": "Enter the new email address." }),
        currentPassword: Joi.string().max(128).allow(""),
      }),
      req.body,
    );
    const data = await service.requestEmailChange(uid(res), v.newEmail, v.currentPassword || undefined);
    sendResponse(res, true, data, `We sent a code to ${v.newEmail}.`);
  }),
);
profileRouter.post(
  "/email/confirm",
  emailLimiter,
  handle(async (req, res) => {
    const v = validate<{ code: string }>(Joi.object({ code: Joi.string().trim().pattern(/^\d{6}$/).required().messages({ "string.pattern.base": "Enter the 6-digit code." }) }), req.body);
    sendResponse(res, true, { user: await service.confirmEmailChange(uid(res), v.code) }, "Email updated.");
  }),
);
profileRouter.post("/email/cancel", handle(async (_req, res) => sendResponse(res, true, { user: await service.cancelEmailChange(uid(res)) }, "Email change cancelled.")));

profileRouter.post(
  "/password",
  passwordLimiter,
  handle(async (req, res) => {
    const v = validate<{ currentPassword: string; newPassword: string }>(
      Joi.object({ currentPassword: Joi.string().max(128).required().messages({ "any.required": "Enter your current password." }), newPassword }),
      req.body,
    );
    await service.changePassword(uid(res), res.locals.adoptionSessionId, v.currentPassword, v.newPassword);
    sendResponse(res, true, null, "Password changed. Other devices have been signed out.");
  }),
);
profileRouter.post("/sessions/sign-out-others", handle(async (_req, res) => sendResponse(res, true, await service.signOutOthers(uid(res), res.locals.adoptionSessionId), "Signed out on other devices.")));

profileRouter.get(
  "/demo-requests",
  handle(async (_req, res) => {
    const requests = await prisma.adoptionDemoRequest.findMany({
      where: { userId: uid(res) },
      orderBy: { createdAt: "desc" },
      select: { id: true, tools: true, customRequirement: true, status: true, scheduledAt: true, createdAt: true },
    });
    sendResponse(res, true, { requests }, "");
  }),
);

// ─── Public: POST /api/adoption/demo-requests ────────────────────────────────

export const demoRouter = Router();
const demoLimiter = createLimiter({ windowMs: 15 * 60_000, max: 10, message: "Too many requests. Please try again in a few minutes." });
const productName = (k: string) => ADOPTION_PRODUCTS.find((p) => p.key === k)?.name ?? k;

demoRouter.post(
  "/",
  demoLimiter,
  handle(async (req, res) => {
    const v = validate<{ name: string; email: string; company?: string; phone?: string; role: string; companySize: string; tools: AdoptionProduct[]; customRequirement?: string; message?: string }>(
      Joi.object({
        name: Joi.string().trim().min(2).max(120).required().messages({ "any.required": "Name is required.", "string.min": "Name is required." }),
        email: Joi.string().trim().lowercase().email().max(254).required().messages({ "string.email": "Enter a valid email.", "any.required": "Email is required." }),
        company: Joi.string().trim().max(160).allow(""),
        phone,
        role: Joi.string().valid(...ROLES).required().messages({ "any.only": "Choose your role.", "any.required": "Choose your role." }),
        companySize: Joi.string().valid(...COMPANY_SIZES).required().messages({ "any.only": "Choose your company size.", "any.required": "Choose your company size." }),
        tools: Joi.array().items(Joi.string().valid(...PRODUCT_KEYS)).min(1).unique().required().messages({ "array.min": "Choose at least one tool.", "any.required": "Choose at least one tool." }),
        customRequirement: Joi.string().trim().max(500).allow(""),
        message: Joi.string().trim().max(3000).allow(""),
      }),
      req.body,
    );
    if (v.tools.includes("CUSTOM") && !v.customRequirement?.trim()) throw new ApiError("Tell us which custom tool you're looking for.", STATUS_CODES.BAD_REQUEST);

    // Link to an account ONLY via a valid session (never by matching the typed email).
    let userId: string | null = null;
    const header = req.get("authorization") ?? "";
    if (header.startsWith("Bearer ")) {
      try {
        userId = (await service.authenticate(header.slice(7).trim())).userId;
      } catch {
        userId = null; // expired session: still accept the request, just unlinked
      }
    }
    const request = await prisma.adoptionDemoRequest.create({
      data: {
        userId,
        name: v.name,
        email: v.email,
        company: v.company || null,
        phone: v.phone || null,
        role: v.role,
        companySize: v.companySize,
        tools: v.tools,
        customRequirement: v.tools.includes("CUSTOM") ? v.customRequirement!.trim() : null,
        message: v.message || null,
      },
    });
    // WhatsApp automation hook (demo.requested): only after the request is saved. Fire-and-forget and a no-op unless
    // WHATSAPP_AUTOMATION_ENABLED=true, so it can never fail or slow the customer's submission. The engine still enforces
    // recorded opt-in, the 24-hour window and approved templates. The request id is the event id (one message per request).
    if (toWaPhone(v.phone).length >= 10) {
      emitAutomationEvent({ event: "demo.requested", eventId: request.id, phone: v.phone, fields: { name: v.name, email: v.email } });
    }
    // Same request in the existing Contacts inbox, so the sales workflow is unchanged.
    const toolNames = v.tools.map(productName).join(", ");
    await contactService
      .submit({
        name: v.name,
        email: v.email,
        subject: `AI Adoption demo request: ${toolNames}`.slice(0, 200),
        message: [
          `Name: ${v.name}`,
          `Work email: ${v.email}`,
          `Company: ${v.company || "—"}`,
          `Phone: ${v.phone || "—"}`,
          `Role: ${v.role}`,
          `Company size: ${v.companySize}`,
          `Tools: ${toolNames}`,
          ...(v.tools.includes("CUSTOM") ? [`Custom tool needed: ${v.customRequirement}`] : []),
          "",
          `Message: ${v.message || "—"}`,
          "",
          `AI Adoption account: ${userId ? `linked (id ${userId})` : "not signed in"}`,
          `Demo request id: ${request.id}`,
        ].join("\n"),
      })
      .catch((e: unknown) => console.error("[adoption-demo] contact copy failed", e)); // the request itself is already saved
    sendResponse(res, true, { id: request.id, status: request.status, tools: request.tools, createdAt: request.createdAt }, "Demo request received.", STATUS_CODES.CREATED);
  }),
);

// ─── Admin: /api/admin/adoption/demo-requests ────────────────────────────────

export const adminDemoRouter = Router();
adminDemoRouter.use(auth("ADMIN"));
const DEMO_STATUSES: AdoptionDemoStatus[] = ["SUBMITTED", "UNDER_REVIEW", "SCHEDULED", "COMPLETED", "CANCELLED"];

adminDemoRouter.get(
  "/adoption/demo-requests",
  handle(async (req, res) => {
    const status = String(req.query.status ?? "").toUpperCase() as AdoptionDemoStatus;
    const requests = await prisma.adoptionDemoRequest.findMany({
      where: DEMO_STATUSES.includes(status) ? { status } : {},
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });
    sendResponse(res, true, { requests }, "");
  }),
);

adminDemoRouter.patch(
  "/adoption/demo-requests/:id",
  handle(async (req, res) => {
    const v = validate<{ status: AdoptionDemoStatus; scheduledAt?: string | null; adminNote?: string | null }>(
      Joi.object({
        status: Joi.string().valid(...DEMO_STATUSES).required(),
        scheduledAt: Joi.date().iso().allow(null),
        adminNote: Joi.string().trim().max(1000).allow("", null),
      }),
      req.body,
    );
    if (v.status === "SCHEDULED" && !v.scheduledAt) throw new ApiError("Choose the demo date and time to mark it Scheduled.", STATUS_CODES.BAD_REQUEST);
    const id = String(req.params.id);
    const existing = await prisma.adoptionDemoRequest.findUnique({ where: { id } });
    if (!existing) throw new ApiError("Demo request not found.", STATUS_CODES.NOT_FOUND);
    const updated = await prisma.adoptionDemoRequest.update({
      where: { id },
      data: { status: v.status, scheduledAt: v.scheduledAt === undefined ? undefined : v.scheduledAt ? new Date(v.scheduledAt) : null, adminNote: v.adminNote === undefined ? undefined : v.adminNote || null },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });
    sendResponse(res, true, { request: updated }, "Demo request updated.");
  }),
);
