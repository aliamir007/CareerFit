import mongoose from "mongoose";
const job_seeker_schema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  atsScore: {
    type: Number,
    default: 0,
  },
  parsedSkills: {
    languages: [String],
    frameworks: [String],
    databases: [String],
    cloud: [String],
    tools: [String],
    concepts: [String],
    softSkills: [String],
  },

  skills: [
    {
      type: String,
    },
  ],
  // Vector embeddings for future semantic search
  skills_vector: {
    type: [Number], // Array of 768 floating point numbers
    required: false, // Set to false initially, populated when resume/skills are processed
  },
  resume: {
    originalName: {
      type: String, // filename as the candidate uploaded it
      required: false,
    },
    path: {
      type: String, // Cloudinary secure_url; linked to directly by the frontend
      required: false,
    },
    publicId: {
      type: String, // Cloudinary public_id, needed to replace or delete the file
      required: false,
    },
    uploadedAt: {
      type: Date,
      required: false,
    },
  },
});
export const job_seeker = mongoose.model("job_seeker", job_seeker_schema)