import type { Request, RequestHandler, Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { logger } from "@/utils/logger.js";
import { ClarityError, isDimension, parsePages, parseRows, parseTotals, type ClarityService } from "./clarity.service.js";

const UNAVAILABLE = [
  { key: "live", label: "Live visitors", reason: "Microsoft Clarity has no live-visitor API. The Data Export API only returns the last 1 to 3 days." },
  { key: "newReturning", label: "New vs returning visitors", reason: "Not exposed by the Clarity Data Export API. It is visible in the Clarity dashboard." },
  { key: "entryExit", label: "Entry and exit pages", reason: "Not exposed by the Clarity Data Export API. Popular pages are available." },
  { key: "journeys", label: "Visitor journeys", reason: "Not exposed by any Clarity API. Use session recordings in the Clarity dashboard." },
  { key: "recordings", label: "Session recordings", reason: "Recordings can only be watched in the Clarity dashboard (there is no recordings API). Use the link above." },
  { key: "heatmaps", label: "Heatmaps and scroll maps", reason: "Heatmaps can only be viewed in the Clarity dashboard (there is no heatmap API). Use the link above." },
  { key: "longRange", label: "Date ranges longer than 3 days", reason: "Clarity only returns 1 to 3 days. Longer history can only come from snapshots this server has stored since it was connected." },
  { key: "compare", label: "Comparing two arbitrary periods", reason: "Clarity does not return past periods on request. Comparison uses stored snapshots only once enough of them exist." },
];

export function createAnalyticsController(clarity: ClarityService) {
  const run = (what: string, fn: (req: Request, res: Response) => Promise<void>): RequestHandler => async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      if (err instanceof ClarityError) return void sendResponse(res, false, { code: err.code }, err.message, err.statusCode);
      const kind = err instanceof Error ? `${err.name}${(err as { code?: string }).code ? ` (${(err as { code?: string }).code})` : ""}` : "unknown error";
      logger.error(`[BusinessAdmin] analytics ${what} failed: ${kind}`);
      sendResponse(res, false, null, "Something went wrong. Please try again.", STATUS_CODES.SERVER_ERROR);
    }
  };
  const days = (v: unknown): 1 | 2 | 3 | null => (v === undefined || v === "" ? 3 : v === "1" || v === "2" || v === "3" ? (Number(v) as 1 | 2 | 3) : null);

  return {
    status: run("status", async (_req, res) => {
      sendResponse(res, true, { ...(await clarity.status()), unavailable: UNAVAILABLE }, "OK");
    }),

    overview: run("overview", async (req, res) => {
      const d = days(req.query.days);
      if (!d) return void sendResponse(res, false, null, "days must be 1, 2 or 3 (Clarity's limit).", STATUS_CODES.BAD_REQUEST);
      const { data, meta } = await clarity.report(d, "", { refresh: req.query.refresh === "1" });
      sendResponse(res, true, { totals: parseTotals(data), meta }, "OK");
    }),

    breakdown: run("breakdown", async (req, res) => {
      const d = days(req.query.days);
      if (!d) return void sendResponse(res, false, null, "days must be 1, 2 or 3 (Clarity's limit).", STATUS_CODES.BAD_REQUEST);
      const dimension = req.query.dimension;
      if (!isDimension(dimension)) return void sendResponse(res, false, null, "Unknown dimension.", STATUS_CODES.BAD_REQUEST);
      const { data, meta } = await clarity.report(d, dimension, { refresh: req.query.refresh === "1" });
      const rows = parseRows(data, dimension);
      const pages = dimension === "URL" ? parsePages(data) : [];
      sendResponse(res, true, { dimension, rows, pages, total: rows.reduce((a, r) => a + (r.sessions ?? 0), 0), meta }, "OK");
    }),

    history: run("history", async (_req, res) => {
      sendResponse(res, true, { items: await clarity.history() }, "OK");
    }),
  };
}
