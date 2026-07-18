import rateLimit, { Options } from "express-rate-limit";
import STATUS_CODES from "@/utils/statusCodes.js";
import { sendResponse } from "@/utils/responseUtils.js";

interface RateLimiterOptions {
    windowMs: number;
    max: number;
    message?: string;
}

export function createLimiter({
    windowMs,
    max,
    message = "Too many requests. Please try again later.",
}: RateLimiterOptions) {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req, res) => {
            sendResponse(res, false, null, message, STATUS_CODES.TOO_MANY_REQUESTS);
        },
    } satisfies Partial<Options>);
}
