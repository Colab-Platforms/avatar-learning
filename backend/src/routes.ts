import { Router, Request, Response } from "express";
import authRoutes from "./modules/auth/auth.route.js";
import courseRoutes from "./modules/course/course.route.js";
import adminCourseRoutes from "./modules/course/admin.route.js";
import chatbotRoutes from "./modules/chatbot/chatbot.route.js";
import internshipRoutes from "./modules/internship/internship.route.js";
import adminInternshipRoutes from "./modules/internship/admin.route.js";
import userRoutes from "./modules/user/user.route.js";
import investorRoutes from "./modules/investors-cms/investor.route.js";
import adminInvestorRoutes from "./modules/investors-cms/admin.route.js";
import paymentRoutes from "./modules/payment/payment.route.js";
import direct2hireRoutes from "./modules/direct2hire/direct2hire.route.js";
import adminDirect2hireRoutes from "./modules/direct2hire/admin.route.js";
import contactRoutes from "./modules/contact/contact.route.js";
import adminContactRoutes from "./modules/contact/admin.route.js";
import partnerRoutes from "./modules/partners/partner.route.js";
import adminPartnerRoutes from "./modules/partners/admin.route.js";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "Server is healthy" });
});

router.use("/auth", authRoutes);
router.use("/courses", courseRoutes);
router.use("/internships", internshipRoutes);
router.use("/admin", adminCourseRoutes);
router.use("/admin", adminInternshipRoutes);
router.use("/chatbot", chatbotRoutes);
router.use("/users", userRoutes);
router.use("/investors", investorRoutes);
router.use("/admin", adminInvestorRoutes);
router.use("/payment", paymentRoutes);
router.use("/direct2hire", direct2hireRoutes);
router.use("/admin", adminDirect2hireRoutes);
router.use("/contact", contactRoutes);
router.use("/admin", adminContactRoutes);
router.use("/partners", partnerRoutes);
router.use("/admin", adminPartnerRoutes);

export default router;
