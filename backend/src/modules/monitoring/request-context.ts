import { AsyncLocalStorage } from "node:async_hooks";
import type { NextFunction, Request, Response } from "express";
import { cleanIp, isValidVisitorKey, parseUserAgent, countryFromHeaders, type DeviceInfo } from "./monitoring.util.js";

/**
 * Who is making this request, available to any service without changing its signature (so sign-in code can record an event
 * with the device, IP and the browser's visitor id). Holds NO body, password, token or cookie.
 */
export interface RequestContext {
  ip: string | null;
  userAgent: string | null;
  device: DeviceInfo;
  country: string | null;
  visitorKey: string | null;
}

const als = new AsyncLocalStorage<RequestContext>();

export const currentContext = (): RequestContext | undefined => als.getStore();

export function requestContext(req: Request, _res: Response, next: NextFunction): void {
  const ua = req.get("user-agent") ?? null;
  const header = req.get("x-visitor-id");
  als.run(
    {
      ip: cleanIp(req.ip),
      userAgent: ua ? ua.slice(0, 300) : null,
      device: parseUserAgent(ua),
      country: countryFromHeaders(req.headers),
      visitorKey: isValidVisitorKey(header) ? header : null,
    },
    next,
  );
}

/** For tests and background work: run a function inside a given context. */
export const withContext = <T>(ctx: RequestContext, fn: () => T): T => als.run(ctx, fn);
