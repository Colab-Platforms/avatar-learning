import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { isAuthSessionRevoked, RevocationUnavailableError } from "@/modules/monitoring/session-revocation.js";

// BUSINESS_ADMIN: staff created in Business Admin > Admin Management. No existing route lists it, so it is refused everywhere
// except the routes that name it explicitly (Business Admin, sign-out).
export type Role = "USER" | "ADMIN" | "SUPERADMIN" | "BUSINESS_ADMIN";

export type AuthRequest = Request & {
    user?: {
        id: string;
        role: Role;
    };
    /** Course the D2H access gate verified for this request. */
    d2hCourseId?: string;
};

export const auth = (...allowedRoles: Role[]) => {
    return async (req: Request, _res: Response, next: NextFunction) => {
        try {
            const header = req.headers.authorization;
            if (!header || !header.startsWith("Bearer ")) {
                throw new ApiError("Authentication required", STATUS_CODES.UNAUTHORIZED);
            }

            const token = header.split(" ")[1];
            if (!process.env.JWT_SECRET) {
                throw new ApiError("JWT secret is not defined", STATUS_CODES.SERVER_ERROR);
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string; role: Role; sid?: string };
            // An administrator ended this sign-in (Live Monitoring > Active Sessions): refuse it even though the token has not expired.
            // Only tokens that carry a session id are checked (older tokens are unaffected). If the database cannot say whether this session
            // was ended, the request is refused with a temporary 503 rather than let a possibly-revoked session through; other sessions
            // and other tokens recover as soon as the database does (nothing is cached for a failure).
            if (await isAuthSessionRevoked(decoded.sid)) {
                throw new ApiError("This session was ended by an administrator. Please sign in again.", STATUS_CODES.UNAUTHORIZED);
            }

            if (allowedRoles.length > 0) {
                const effectiveRoles = [...allowedRoles];
         // ensure that if a user has a higher role, they can access lower role routes
                if (effectiveRoles.includes("USER")) {
                    if (!effectiveRoles.includes("ADMIN")) effectiveRoles.push("ADMIN");
                    if (!effectiveRoles.includes("SUPERADMIN")) effectiveRoles.push("SUPERADMIN");
                } else if (effectiveRoles.includes("ADMIN") && !effectiveRoles.includes("SUPERADMIN")) {
                    effectiveRoles.push("SUPERADMIN");
                }

                if (!effectiveRoles.includes(decoded.role)) {
                    throw new ApiError("You do not have permission to access this resource", STATUS_CODES.FORBIDDEN);
                }
            }

            req.user = { id: decoded.id, role: decoded.role };
            next();
        } catch (error: any) {
            if (error instanceof RevocationUnavailableError) {
                next(new ApiError("We could not verify your session right now. Please try again in a moment.", STATUS_CODES.SERVICE_UNAVAILABLE));
            } else if (error instanceof ApiError) {
                next(error);
            } else if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
                next(new ApiError("Invalid or expired token", STATUS_CODES.UNAUTHORIZED));
            } else {
                next(error);
            }
        }
    };
};
