import { Router } from "express";
import {
  getCandidateNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
} from "../controllers/notification.controller.js";
import { isJobSeeker, verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/:candidateId").get(verifyJWT, isJobSeeker, getCandidateNotifications);
router.route("/:candidateId/unread-count").get(verifyJWT, isJobSeeker, getUnreadNotificationCount);
router.route("/:id/read").patch(verifyJWT, isJobSeeker, markNotificationRead);

export default router;
