import type { Request, Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { logger } from "@/utils/logger.js";
import { validateDemoBooking } from "./demo.validators.js";
import type { DemoBookingService } from "./demo.service.js";

/** POST /api/demo/book (public). Always answers about the BOOKING only: WhatsApp is never part of its success or failure. */
export function createDemoController(getService: () => DemoBookingService, now: () => Date = () => new Date()) {
  return {
    async book(req: Request, res: Response): Promise<void> {
      const v = validateDemoBooking(req.body, now());
      if (!v.ok) {
        const first = Object.values(v.errors)[0];
        sendResponse(res, false, { errors: v.errors }, first, STATUS_CODES.BAD_REQUEST);
        return;
      }
      try {
        const r = await getService().book(v.value);
        sendResponse(
          res,
          true,
          { id: r.id, duplicate: r.duplicate, preferredAt: r.preferredAt },
          r.duplicate ? "We already have this demo request. Our team will be in touch." : "Your demo request has been received. Our team will confirm shortly.",
          r.duplicate ? STATUS_CODES.OK : STATUS_CODES.CREATED,
        );
      } catch (err) {
        // The booking could not be saved: say so plainly, and never echo database details.
        logger.error(`[Demo] Booking could not be saved: ${err instanceof Error ? err.name : "unknown error"}`);
        sendResponse(res, false, null, "We could not save your request. Please try again in a moment.", STATUS_CODES.SERVER_ERROR);
      }
    },
  };
}
