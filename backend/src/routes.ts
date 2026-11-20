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
import couponRoutes from "./modules/coupon/coupon.route.js";
import adminCouponRoutes from "./modules/coupon/admin.route.js";
import adminDashboardRoutes from "./modules/dashboard/admin.route.js";
import webinarRoutes from "./modules/webinar/webinar.route.js";
import adminWebinarRoutes from "./modules/webinar/admin.route.js";
import whatsappRoutes from "./modules/whatsapp/whatsapp.route.js";
import businessAdminRoutes from "./modules/business-admin/business-admin.route.js";
import adoptionAuthRoutes from "./modules/adoption/adoption.route.js";
import { accountRouter as adoptionAccountRoutes, adminRouter as adminAdoptionRoutes } from "./modules/adoption/adoption.access.js";
import { profileRouter as adoptionProfileRoutes, demoRouter as adoptionDemoRoutes, adminDemoRouter as adminAdoptionDemoRoutes } from "./modules/adoption/adoption.profile.js";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "Server is healthy" });
});

router.use("/auth", authRoutes);
router.use("/adoption/auth", adoptionAuthRoutes); // AI Adoption accounts (separate from /auth)
router.use("/adoption/account", adoptionAccountRoutes); // AI Adoption: my tools, open tool, request access
router.use("/adoption/account", adoptionProfileRoutes); // AI Adoption: profile, email, password, my demo requests
router.use("/adoption/demo-requests", adoptionDemoRoutes); // AI Adoption: Book a Demo submissions
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
router.use("/coupons", couponRoutes);
router.use("/admin", adminCouponRoutes);
router.use("/admin", adminDashboardRoutes);
router.use("/webinar", webinarRoutes);
router.use("/admin", adminWebinarRoutes);
router.use("/whatsapp", whatsappRoutes);
router.use("/business-admin", businessAdminRoutes);
router.use("/admin", adminAdoptionRoutes); // AI Adoption tool access (admin only)
router.use("/admin", adminAdoptionDemoRoutes); // AI Adoption demo requests (admin only)

export default router;
