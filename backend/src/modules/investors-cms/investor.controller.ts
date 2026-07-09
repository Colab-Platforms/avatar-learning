import { Request, Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { getInvestorDocUploadSignature } from "@/utils/cloudinary.js";
import {
  getPaginationOptions,
  formatPaginationResponse,
} from "@/utils/paginationUtils.js";
import { AdminInvestorService, PublicInvestorService } from "./investor.service.js";
import {
  validateCreateCategory,
  validateUpdateCategory,
  validateCreateDocument,
  validateUpdateDocument,
} from "./investor.validators.js";

const adminService = new AdminInvestorService();
const publicService = new PublicInvestorService();

const param = (req: Request, key: string): string => String(req.params[key]);

// ─── Admin – Categories ───────────────────────────────────────────────────────

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await adminService.getCategories();
    sendResponse(res, true, categories, "Categories fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = validateCreateCategory(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const category = await adminService.createCategory(value);
    sendResponse(res, true, category, "Category created", STATUS_CODES.CREATED);
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = validateUpdateCategory(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const category = await adminService.updateCategory(param(req, "id"), value);
    sendResponse(res, true, category, "Category updated");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    await adminService.deleteCategory(param(req, "id"));
    sendResponse(res, true, null, "Category deleted");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

// ─── Admin – Documents ────────────────────────────────────────────────────────

export const getDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const categoryId = req.query.categoryId as string | undefined;
    const { page, pageSize, take, skip } = getPaginationOptions(req.query, 10);
    const { documents, totalRecords } = await adminService.getDocuments(categoryId, take, skip);
    const response = formatPaginationResponse(documents, totalRecords, page, pageSize);
    sendResponse(res, true, response, "Documents fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const createDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = validateCreateDocument(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const document = await adminService.createDocument(value, req.user!.id);
    sendResponse(res, true, document, "Document created", STATUS_CODES.CREATED);
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const updateDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = validateUpdateDocument(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const document = await adminService.updateDocument(param(req, "id"), value);
    sendResponse(res, true, document, "Document updated");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    await adminService.deleteDocument(param(req, "id"));
    sendResponse(res, true, null, "Document deleted");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

// Signed direct-upload params for PDFs (client uploads straight to Cloudinary)
export const signDocumentUpload = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const signData = getInvestorDocUploadSignature();
    sendResponse(res, true, signData, "Upload signature generated");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

// ─── Public Endpoints ─────────────────────────────────────────────────────────

export const getPublicCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await publicService.getCategoriesWithDocuments();
    sendResponse(res, true, categories, "Investor categories fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};
