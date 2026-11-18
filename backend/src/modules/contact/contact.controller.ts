import { Request, Response } from "express";
import { sendResponse } from "@/utils/responseUtils.js";
import STATUS_CODES from "@/utils/statusCodes.js";
import { ContactService, AdminContactService } from "./contact.service.js";
import {
  getPaginationOptions,
  formatPaginationResponse,
} from "@/utils/paginationUtils.js";
import { validateCreateContact } from "./contact.validators.js";

const contactService = new ContactService();
const adminContactService = new AdminContactService();

const param = (req: Request, key: string): string => String(req.params[key]);

// ─── Public Endpoints ─────────────────────────────────────────────────────────

export const submitContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = validateCreateContact(req.body);
    if (error) {
      sendResponse(res, false, null, error.message, STATUS_CODES.BAD_REQUEST);
      return;
    }
    const contact = await contactService.submit(value);
    sendResponse(res, true, contact, "Message sent successfully", STATUS_CODES.CREATED);
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

// ─── Admin Endpoints ──────────────────────────────────────────────────────────

export const adminGetAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, pageSize, take, skip } = getPaginationOptions(req.query, 20);
    const { contacts, totalRecords } = await adminContactService.getAll(take, skip);
    const response = formatPaginationResponse(contacts, totalRecords, page, pageSize);
    sendResponse(res, true, response, "Contact messages fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const adminGetUnreadCount = async (_req: Request, res: Response): Promise<void> => {
  try {
    const count = await adminContactService.getUnreadCount();
    sendResponse(res, true, { count }, "Unread count fetched");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const adminMarkRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const contact = await adminContactService.markRead(param(req, "id"));
    sendResponse(res, true, contact, "Marked as read");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};

export const adminDelete = async (req: Request, res: Response): Promise<void> => {
  try {
    await adminContactService.delete(param(req, "id"));
    sendResponse(res, true, null, "Contact message deleted");
  } catch (err: any) {
    sendResponse(res, false, null, err.message, err.statusCode ?? STATUS_CODES.SERVER_ERROR);
  }
};
