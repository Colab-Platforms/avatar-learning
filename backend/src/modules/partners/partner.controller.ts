import { Request, Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import type { AuthRequest } from "@/middlewares/authMiddleware.js";
import { getPaginationOptions, formatPaginationResponse } from "@/utils/paginationUtils.js";
import { PartnerService, AdminPartnerService } from "./partner.service.js";
import { validateApplyPartner } from "./partner.validators.js";

const partnerService = new PartnerService();
const adminService = new AdminPartnerService();

const param = (req: Request, key: string): string => String(req.params[key]);

// ─── User ─────────────────────────────────────────────────────────────────────

export const apply = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = validateApplyPartner(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const partner = await partnerService.apply(req.user!.id, value);
    sendResponse(res, true, partner, "Application submitted", STATUS_CODES.CREATED);
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const getMine = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partner = await partnerService.getMine(req.user!.id);
    sendResponse(res, true, partner, "Partner profile fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const getMyReferrals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page, pageSize, take, skip } = getPaginationOptions(req.query, 20);
    const { referrals, totalRecords } = await partnerService.getMyReferrals(req.user!.id, take, skip);
    const response = formatPaginationResponse(referrals, totalRecords, page, pageSize);
    sendResponse(res, true, response, "Referrals fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const claim = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await partnerService.claim(req.user!.id);
    sendResponse(res, true, result, "Payout claim submitted", STATUS_CODES.CREATED);
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminList = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const type = req.query.type as string | undefined;
    const { page, pageSize, take, skip } = getPaginationOptions(req.query, 20);
    const { partners, totalRecords } = await adminService.list(status, type, take, skip);
    const response = formatPaginationResponse(partners, totalRecords, page, pageSize);
    sendResponse(res, true, response, "Partners fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const adminGetById = async (req: Request, res: Response): Promise<void> => {
  try {
    const partner = await adminService.getById(param(req, "id"));
    sendResponse(res, true, partner, "Partner fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const adminApprove = async (req: Request, res: Response): Promise<void> => {
  try {
    const partner = await adminService.approve(param(req, "id"));
    sendResponse(res, true, partner, "Partner approved");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const adminReject = async (req: Request, res: Response): Promise<void> => {
  try {
    const partner = await adminService.reject(param(req, "id"));
    sendResponse(res, true, partner, "Partner rejected");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const adminListClaims = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const { page, pageSize, take, skip } = getPaginationOptions(req.query, 20);
    const { claims, totalRecords } = await adminService.listClaims(status, take, skip);
    const response = formatPaginationResponse(claims, totalRecords, page, pageSize);
    sendResponse(res, true, response, "Claims fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const adminMarkClaimPaid = async (req: Request, res: Response): Promise<void> => {
  try {
    const claimRecord = await adminService.markClaimPaid(param(req, "claimId"));
    sendResponse(res, true, claimRecord, "Claim marked as paid");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};
