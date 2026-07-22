import multer from "multer";
import type { Request, Response, NextFunction } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(
        new Error(
          "Unsupported file type. Allowed formats: JPG, JPEG, PNG, WEBP",
        ),
      );
      return;
    }
    cb(null, true);
  },
});

export const profileImageUploadMiddleware = upload.single("image");

export function handleProfileImageUpload(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  profileImageUploadMiddleware(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        sendResponse(
          res,
          false,
          null,
          "File too large. Maximum size is 5MB",
          STATUS_CODES.BAD_REQUEST,
        );
        return;
      }
      sendResponse(
        res,
        false,
        null,
        err.message,
        STATUS_CODES.BAD_REQUEST,
      );
      return;
    }

    if (err instanceof Error) {
      sendResponse(
        res,
        false,
        null,
        err.message,
        STATUS_CODES.BAD_REQUEST,
      );
      return;
    }

    if (!req.file) {
      sendResponse(
        res,
        false,
        null,
        "Image file is required",
        STATUS_CODES.BAD_REQUEST,
      );
      return;
    }

    next();
  });
}
