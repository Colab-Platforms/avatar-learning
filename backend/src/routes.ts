import { Router, Request, Response } from "express";
const router = Router();
import authRoutes from "./modules/auth/auth.route.js";
import courseRoutes from "./modules/course/course.route.js";
import adminCourseRoutes from "./modules/course/admin.route.js";
import chatbotRoutes from "./modules/chatbot/chatbot.route.js";
import internshipRoutes from "./modules/internship/internship.route.js";
import adminInternshipRoutes from "./modules/internship/admin.route.js";
import userRoutes from "./modules/user/user.route.js";
import paymentRoutes from "./modules/payment/payment.route.js";

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
router.use("/payment", paymentRoutes);

export default router;
