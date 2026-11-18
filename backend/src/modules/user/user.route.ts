import { Router } from "express";
import * as userController from "./user.controller.js";
import { auth } from "@/middlewares/authMiddleware.js";
import { requireCompleteProfile } from "@/middlewares/requireCompleteProfile.js";
import { handleProfileImageUpload } from "@/middlewares/profileImageUploadMiddleware.js";

const router = Router();

router.get("/", auth("ADMIN", "SUPERADMIN"), userController.getAllUsers);
// Allowed while profile is incomplete — client needs current user state
router.get("/me", auth("USER"), userController.getMe);
router.post(
    "/me/quiz/complete",
    auth("USER"),
    requireCompleteProfile,
    userController.completeQuiz,
);
router.get(
    "/me/resume/sign",
    auth("USER"),
    requireCompleteProfile,
    userController.signResumeUpload,
);
router.post(
    "/me/resume/complete",
    auth("USER"),
    requireCompleteProfile,
    userController.completeResumeUpload,
);
router.delete(
    "/me/resume",
    auth("USER"),
    requireCompleteProfile,
    userController.deleteResume,
);
router.patch(
    "/profile/image",
    auth("USER"),
    requireCompleteProfile,
    handleProfileImageUpload,
    userController.uploadProfileImage,
);
router.delete(
    "/profile/image",
    auth("USER"),
    requireCompleteProfile,
    userController.removeProfileImage,
);
router.get("/:id", auth("USER", "ADMIN", "SUPERADMIN"), requireCompleteProfile, userController.getUserById);
router.post("/", userController.createUser);
router.put("/:id", auth("USER", "ADMIN", "SUPERADMIN"), requireCompleteProfile, userController.updateUser);
router.patch("/:id/role", auth("SUPERADMIN"), userController.setUserRole);
router.delete("/:id", auth("USER", "ADMIN", "SUPERADMIN"), requireCompleteProfile, userController.deleteUser);

export default router;
