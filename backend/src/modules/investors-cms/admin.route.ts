import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as investorController from "./investor.controller.js";

const router = Router();

// All admin routes require ADMIN role or higher
router.use(auth("ADMIN"));

// ─── Categories ───────────────────────────────────────────────────────────────
router.get("/investors/categories", investorController.getCategories);
router.post("/investors/categories", investorController.createCategory);
router.put("/investors/categories/:id", investorController.updateCategory);
router.delete("/investors/categories/:id", investorController.deleteCategory);

// ─── Documents ────────────────────────────────────────────────────────────────
// Static route must come before /:id to avoid being shadowed
router.get("/investors/documents/upload/sign", investorController.signDocumentUpload);
router.get("/investors/documents", investorController.getDocuments);
router.post("/investors/documents", investorController.createDocument);
router.put("/investors/documents/:id", investorController.updateDocument);
router.delete("/investors/documents/:id", investorController.deleteDocument);

export default router;
