import { Router } from "express";
import {
  search_employees,
  get_my_jobs,
  update_job,
  update_job_status,
} from "../controllers/recruiter.controller.js";
import { isRecruiter, verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/postJob").post(verifyJWT, isRecruiter, search_employees);
router.route("/my-jobs").get(verifyJWT, isRecruiter, get_my_jobs);
router.route("/job/:id").put(verifyJWT, isRecruiter, update_job);
router.route("/job/:id/status").patch(verifyJWT, isRecruiter, update_job_status);

export default router;
