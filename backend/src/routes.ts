import { Router, Request, Response } from "express";
const router = Router();
import authRoutes from "./modules/auth/auth.route.js";
import userRoutes from "./modules/user/user.route.js";

router.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", message: "Server is healthy" });
});


router.use("/auth", authRoutes);
router.use("/users", userRoutes);

export default router;