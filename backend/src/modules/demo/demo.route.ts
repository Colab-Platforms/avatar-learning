import { Router } from "express";
import prisma from "@root/prisma.js";
import { createLimiter } from "@/middlewares/rateLimiter.js";
import { createDemoController } from "./demo.controller.js";
import { DemoBookingService, getSandboxDemoDb, type DemoDb } from "./demo.service.js";

// Public: customers are not signed in. Rate-limited per IP so the form cannot be used to spam the sales team
// or to trigger WhatsApp messages.
const limiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many demo requests from this connection. Please try again in a few minutes.",
});

const real = new DemoBookingService(prisma as unknown as DemoDb);
// Chosen per request: in the dev sandbox the booking goes to the in-memory sandbox (never the real database).
const controller = createDemoController(() => {
  const sandbox = getSandboxDemoDb();
  return sandbox ? new DemoBookingService(sandbox) : real;
});

const router = Router();
router.post("/book", limiter, controller.book);

export default router;
