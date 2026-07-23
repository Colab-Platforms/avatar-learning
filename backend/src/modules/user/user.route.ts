import { Router } from "express";
import * as userController from "./user.controller.js";
import { auth } from "@/middlewares/authMiddleware.js";
import { handleProfileImageUpload } from "@/middlewares/profileImageUploadMiddleware.js";

const router = Router();

router.get("/", auth("ADMIN", "SUPERADMIN"), userController.getAllUsers);
router.get("/me", auth("USER"), userController.getMe);
router.get("/me/resume/sign", auth("USER"), userController.signResumeUpload);
router.post("/me/resume/complete", auth("USER"), userController.completeResumeUpload);
router.delete("/me/resume", auth("USER"), userController.deleteResume);
router.patch(
    "/profile/image",
    auth("USER"),
    handleProfileImageUpload,
    userController.uploadProfileImage,
);
router.delete("/profile/image", auth("USER"), userController.removeProfileImage);
router.get("/:id", auth("USER", "ADMIN", "SUPERADMIN"), userController.getUserById);
router.post("/", userController.createUser);
router.put("/:id", auth("USER", "ADMIN", "SUPERADMIN"), userController.updateUser);
router.patch("/:id/role", auth("SUPERADMIN"), userController.setUserRole);
router.delete("/:id", auth("USER", "ADMIN", "SUPERADMIN"), userController.deleteUser);

export default router;
