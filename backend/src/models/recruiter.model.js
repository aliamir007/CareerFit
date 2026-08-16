import mongoose from "mongoose";
import {
  normalizeRecruiterJobStatus,
  RECRUITER_JOB_STATUS,
  RECRUITER_JOB_STATUS_VALUES,
} from "../utils/recruiterJob.js";

const recruiter_schema = mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  email: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  company_name: {
    type: String,
    required: true,
  },
  job_title: {
    type: String,
    required: true,
  },
  job_description: {
    type: String
  },
  skills_req: [
    {
      type: String,
    },
  ],
  status: {
    type: String,
    enum: RECRUITER_JOB_STATUS_VALUES,
    default: RECRUITER_JOB_STATUS.ACTIVE,
    set: normalizeRecruiterJobStatus,
  },
  requirements_vector: {
    type: [Number],
    required: false,
  },
  experience_required: { type: String, required: false },
}, { timestamps: true });
export const recruiter = mongoose.model("recruiter", recruiter_schema);
