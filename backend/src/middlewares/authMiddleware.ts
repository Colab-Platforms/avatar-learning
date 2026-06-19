import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "@/utils/ApiError.js";
import STATUS_CODES from "@/utils/statusCodes.js";

export type Role = "USER" | "ADMIN" | "SUPERADMIN";

export type AuthRequest = Request & {
    user?: {
        id: string;
        role: Role;
    }
};

export const auth = (...allowedRoles: Role[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        try {
            const header = req.headers.authorization;
            if (!header || !header.startsWith("Bearer ")) {
                throw new ApiError("Authentication required", STATUS_CODES.UNAUTHORIZED);
            }

            const token = header.split(" ")[1];
            if (!process.env.JWT_SECRET) {
                throw new ApiError("JWT secret is not defined", STATUS_CODES.SERVER_ERROR);
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string; role: Role };

            if (allowedRoles.length > 0) {
                const effectiveRoles = [...allowedRoles];
                if (effectiveRoles.includes("ADMIN") && !effectiveRoles.includes("SUPERADMIN")) {
                    effectiveRoles.push("SUPERADMIN");
                }

                if (!effectiveRoles.includes(decoded.role)) {
                    throw new ApiError("You do not have permission to access this resource", STATUS_CODES.FORBIDDEN);
                }
            }

            req.user = { id: decoded.id, role: decoded.role };
            next();
        } catch (error: any) {
            if (error instanceof ApiError) {
                next(error);
            } else if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
                next(new ApiError("Invalid or expired token", STATUS_CODES.UNAUTHORIZED));
            } else {
                next(error);
            }
        }
    };
};
