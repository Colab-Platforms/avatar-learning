import { Router, Request, Response } from "express";
const router = Router();
import authRoutes from "./modules/auth/auth.route.js";
import courseRoutes from "./modules/course/course.route.js";
import adminCourseRoutes from "./modules/course/admin.route.js";
import chatbotRoutes from "./modules/chatbot/chatbot.route.js";
import internshipRoutes from "./modules/internship/internship.route.js";
import adminInternshipRoutes from "./modules/internship/admin.route.js";
import userRoutes from "./modules/user/user.route.js";
import investorRoutes from "./modules/investors-cms/investor.route.js";
import adminInvestorRoutes from "./modules/investors-cms/admin.route.js";
import direct2hireRoutes from "./modules/direct2hire/direct2hire.route.js";
import adminDirect2hireRoutes from "./modules/direct2hire/admin.route.js";

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
router.use("/direct2hire", direct2hireRoutes);
router.use("/admin", adminDirect2hireRoutes);

export default router;
