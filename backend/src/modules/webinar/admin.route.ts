import { Router } from "express";
import { auth } from "@/middlewares/authMiddleware.js";
import * as adminWebinarController from "./admin.controller.js";

const router = Router();

router.use(auth("ADMIN"));

router.get("/webinar/registrations", adminWebinarController.adminGetAll);
router.get("/webinar/registrations/:id", adminWebinarController.adminGetById);

router.get("/webinar/schedules", adminWebinarController.adminGetAllSchedules);
router.get("/webinar/schedules/:id", adminWebinarController.adminGetScheduleById);
router.post("/webinar/schedules", adminWebinarController.adminCreateSchedule);
router.patch("/webinar/schedules/:id", adminWebinarController.adminUpdateSchedule);
router.delete("/webinar/schedules/:id", adminWebinarController.adminDeleteSchedule);
router.patch("/webinar/schedules/:id/publish", adminWebinarController.adminPublishSchedule);
router.patch("/webinar/schedules/:id/live", adminWebinarController.adminSetScheduleLive);
router.patch("/webinar/schedules/:id/unlive", adminWebinarController.adminUnsetScheduleLive);

export default router;
