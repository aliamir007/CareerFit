import { Router } from "express";
import { upload_resume, find_recruiter, get_job_by_id } from "../controllers/job_seeker.controller.js";
import { isJobSeeker, verifyJWT } from "../middlewares/auth.middleware.js";
import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB, mirroring the client-side cap
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});

const router = Router();
router.route("/upload").post(verifyJWT, isJobSeeker, upload.single("resume"), upload_resume);
router.route("/find_recruiter").get(verifyJWT, isJobSeeker, find_recruiter);
router.route("/job/:jobId").get(verifyJWT, isJobSeeker, get_job_by_id);
export default router;
