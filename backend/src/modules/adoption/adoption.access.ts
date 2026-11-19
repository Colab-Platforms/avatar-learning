import { Router, Request, Response } from "express";
import Joi from "joi";
import prisma from "@root/prisma.js";
import { auth, type AuthRequest } from "@/middlewares/authMiddleware.js";
import { createLimiter } from "@/middlewares/rateLimiter.js";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { ApiError } from "@/utils/ApiError.js";
import type { AdoptionProduct, AdoptionAccessStatus } from "@prisma/client";
import { requireAdoptionSession } from "./adoption.controller.js";
import { ADOPTION_PRODUCTS, PRODUCT_KEYS, effectiveStatus, toolUrl } from "./adoption.products.js";

/**
 * Tool access for AI Adoption accounts.
 *  - Customer routes (/api/adoption/account/*): need an AI Adoption session.
 *  - Admin routes (/api/admin/adoption/*): need the existing admin login
 *    (auth("ADMIN")). Customers can never change their own access.
 */

type Handler = (req: Request, res: Response) => Promise<void>;
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
      console.error("[adoption-access]", err);
      sendResponse(res, false, null, "Something went wrong. Please try again.", STATUS_CODES.SERVER_ERROR);
    }
  };

const productParam = (req: Request): AdoptionProduct => {
  const p = String(req.params.product ?? "").toUpperCase() as AdoptionProduct;
  if (!PRODUCT_KEYS.includes(p)) throw new ApiError("Unknown tool.", STATUS_CODES.NOT_FOUND);
  return p;
};

/** Full tool list for one account: every product with its effective status. */
async function toolsFor(userId: string) {
  const [ents, pending] = await Promise.all([
    prisma.adoptionEntitlement.findMany({ where: { userId } }),
    prisma.adoptionAccessRequest.findMany({ where: { userId, status: "PENDING" }, select: { product: true, createdAt: true } }),
  ]);
  const now = new Date();
  return ADOPTION_PRODUCTS.map((p) => {
    const e = ents.find((x) => x.product === p.key);
    const req = pending.find((r) => r.product === p.key);
    return {
      product: p.key,
      name: p.name,
      description: p.description,
      status: effectiveStatus(e, now),
      expiresAt: e?.expiresAt ?? null,
      configured: !!toolUrl(p.key),
      requestedAt: req?.createdAt ?? null,
    };
  });
}

// ─── Customer routes ──────────────────────────────────────────────────────────

export const accountRouter = Router();
accountRouter.use(requireAdoptionSession);

accountRouter.get(
  "/tools",
  handle(async (_req, res) => {
    sendResponse(res, true, { tools: await toolsFor(res.locals.adoptionUserId) }, "");
  }),
);

/** The backend decides: only ACTIVE, unexpired access to a configured tool returns its address. */
accountRouter.post(
  "/tools/:product/open",
  handle(async (req, res) => {
    const product = productParam(req);
    const e = await prisma.adoptionEntitlement.findUnique({ where: { userId_product: { userId: res.locals.adoptionUserId, product } } });
    const status = effectiveStatus(e);
    const messages: Record<string, string> = {
      NO_ACCESS: "You don't have access to this tool.",
      PENDING_SETUP: "This tool is still being set up for your account.",
      SUSPENDED: "Access to this tool is suspended. Please contact us.",
      EXPIRED: "Your access to this tool has expired. Please contact us to renew.",
    };
    if (status !== "ACTIVE") throw new ApiError(messages[status], STATUS_CODES.FORBIDDEN);
    const url = toolUrl(product);
    if (!url) throw new ApiError("This tool's link hasn't been configured yet. Our team will share access details with you.", STATUS_CODES.CONFLICT);
    sendResponse(res, true, { url }, "");
  }),
);

const requestLimiter = createLimiter({ windowMs: 60 * 60_000, max: 20, message: "Too many requests. Please try again later." });
accountRouter.post(
  "/requests",
  requestLimiter,
  handle(async (req, res) => {
    const { error, value } = Joi.object({
      product: Joi.string().valid(...PRODUCT_KEYS).required().messages({ "any.only": "Unknown tool.", "any.required": "Choose a tool." }),
      message: Joi.string().trim().max(500).allow("").optional(),
    }).validate(req.body, { stripUnknown: true });
    if (error) throw new ApiError(error.message, STATUS_CODES.BAD_REQUEST);
    const userId = res.locals.adoptionUserId as string;
    const product = value.product as AdoptionProduct;
    const e = await prisma.adoptionEntitlement.findUnique({ where: { userId_product: { userId, product } } });
    const status = effectiveStatus(e);
    if (status === "ACTIVE" || status === "PENDING_SETUP") throw new ApiError("You already have this tool (or it's being set up).", STATUS_CODES.CONFLICT);
    const existing = await prisma.adoptionAccessRequest.findFirst({ where: { userId, product, status: "PENDING" } });
    if (existing) throw new ApiError("You've already requested this tool. Our team will be in touch.", STATUS_CODES.CONFLICT);
    // Recorded for the team to review — nothing is activated automatically.
    await prisma.adoptionAccessRequest.create({ data: { userId, product, message: value.message || null } });
    sendResponse(res, true, { tools: await toolsFor(userId) }, "Request sent. Our team will contact you.", STATUS_CODES.CREATED);
  }),
);

// ─── Admin routes (existing admin login) ──────────────────────────────────────

export const adminRouter = Router();
adminRouter.use(auth("ADMIN"));

async function actorOf(req: Request) {
  const id = (req as AuthRequest).user?.id;
  const admin = id ? await prisma.user.findUnique({ where: { id }, select: { email: true } }) : null;
  return { actorId: id ?? null, actorEmail: admin?.email ?? null };
}

adminRouter.get(
  "/adoption/users",
  handle(async (req, res) => {
    const search = String(req.query.search ?? "").trim();
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));
    const where = search
      ? { OR: [{ email: { contains: search, mode: "insensitive" as const } }, { fullName: { contains: search, mode: "insensitive" as const } }] }
      : {};
    const [total, users, pendingCounts] = await Promise.all([
      prisma.adoptionUser.count({ where }),
      prisma.adoptionUser.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, fullName: true, email: true, emailVerified: true, isActive: true, createdAt: true, entitlements: { select: { product: true, status: true, expiresAt: true } } },
      }),
      prisma.adoptionAccessRequest.groupBy({ by: ["userId"], where: { status: "PENDING" }, _count: { _all: true } }),
    ]);
    const now = new Date();
    sendResponse(res, true, {
      total,
      page,
      pageSize,
      users: users.map(({ entitlements, ...u }) => ({
        ...u,
        activeTools: entitlements.filter((e) => effectiveStatus(e, now) === "ACTIVE").map((e) => e.product),
        assignedCount: entitlements.length,
        pendingRequests: pendingCounts.find((p) => p.userId === u.id)?._count._all ?? 0,
      })),
    }, "");
  }),
);

adminRouter.get(
  "/adoption/users/:id",
  handle(async (req, res) => {
    const id = String(req.params.id);
    const user = await prisma.adoptionUser.findUnique({
      where: { id },
      select: { id: true, fullName: true, email: true, emailVerified: true, isActive: true, createdAt: true },
    });
    if (!user) throw new ApiError("User not found.", STATUS_CODES.NOT_FOUND);
    const [tools, history, requests] = await Promise.all([
      toolsFor(id),
      prisma.adoptionEntitlementEvent.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.adoptionAccessRequest.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 50 }),
    ]);
    sendResponse(res, true, { user, tools, history, requests }, "");
  }),
);

/** Assign or change access: status ACTIVE | PENDING_SETUP | SUSPENDED, optional expiry, optional note. */
adminRouter.put(
  "/adoption/users/:id/tools/:product",
  handle(async (req, res) => {
    const userId = String(req.params.id);
    const product = productParam(req);
    const { error, value } = Joi.object({
      status: Joi.string().valid("ACTIVE", "PENDING_SETUP", "SUSPENDED").required(),
      expiresAt: Joi.date().iso().allow(null).optional(),
      note: Joi.string().trim().max(500).allow("", null).optional(),
    }).validate(req.body, { stripUnknown: true });
    if (error) throw new ApiError(error.message, STATUS_CODES.BAD_REQUEST);
    const user = await prisma.adoptionUser.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new ApiError("User not found.", STATUS_CODES.NOT_FOUND);
    const status = value.status as AdoptionAccessStatus;
    const expiresAt: Date | null = value.expiresAt ? new Date(value.expiresAt) : null;
    const note: string | null = value.note || null;
    const actor = await actorOf(req);

    const before = await prisma.adoptionEntitlement.findUnique({ where: { userId_product: { userId, product } } });
    await prisma.$transaction([
      prisma.adoptionEntitlement.upsert({
        where: { userId_product: { userId, product } },
        create: { userId, product, status, expiresAt, note, grantedBy: actor.actorEmail },
        update: { status, expiresAt, note },
      }),
      prisma.adoptionEntitlementEvent.create({
        data: { userId, product, action: before ? "UPDATED" : "GRANTED", fromStatus: before?.status ?? null, toStatus: status, expiresAt, note, ...actor },
      }),
      // Assigning a tool settles any open request for it.
      prisma.adoptionAccessRequest.updateMany({
        where: { userId, product, status: "PENDING" },
        data: { status: "APPROVED", handledAt: new Date(), handledBy: actor.actorEmail },
      }),
    ]);
    sendResponse(res, true, { tools: await toolsFor(userId) }, "Access updated.");
  }),
);

adminRouter.delete(
  "/adoption/users/:id/tools/:product",
  handle(async (req, res) => {
    const userId = String(req.params.id);
    const product = productParam(req);
    const before = await prisma.adoptionEntitlement.findUnique({ where: { userId_product: { userId, product } } });
    if (!before) throw new ApiError("This user has no access to that tool.", STATUS_CODES.NOT_FOUND);
    const actor = await actorOf(req);
    await prisma.$transaction([
      prisma.adoptionEntitlement.delete({ where: { id: before.id } }),
      prisma.adoptionEntitlementEvent.create({ data: { userId, product, action: "REVOKED", fromStatus: before.status, toStatus: null, ...actor } }),
    ]);
    sendResponse(res, true, { tools: await toolsFor(userId) }, "Access removed.");
  }),
);

adminRouter.get(
  "/adoption/requests",
  handle(async (req, res) => {
    const status = String(req.query.status ?? "PENDING").toUpperCase();
    const where = ["PENDING", "APPROVED", "DECLINED"].includes(status) ? { status: status as "PENDING" | "APPROVED" | "DECLINED" } : {};
    const requests = await prisma.adoptionAccessRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });
    sendResponse(res, true, { requests }, "");
  }),
);

/** Decline a request. (Approving happens by assigning the tool, which settles the request.) */
adminRouter.patch(
  "/adoption/requests/:id/decline",
  handle(async (req, res) => {
    const id = String(req.params.id);
    const r = await prisma.adoptionAccessRequest.findUnique({ where: { id } });
    if (!r) throw new ApiError("Request not found.", STATUS_CODES.NOT_FOUND);
    if (r.status !== "PENDING") throw new ApiError("This request has already been handled.", STATUS_CODES.CONFLICT);
    const actor = await actorOf(req);
    await prisma.adoptionAccessRequest.update({ where: { id }, data: { status: "DECLINED", handledAt: new Date(), handledBy: actor.actorEmail } });
    sendResponse(res, true, null, "Request declined.");
  }),
);
