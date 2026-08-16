import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );

/**
 * Uploads an in-memory PDF buffer to Cloudinary.
 *
 * resource_type is "raw" because PDFs are not images: under the default "auto"
 * or "image" type Cloudinary tries to rasterise them, and free accounts block
 * PDF delivery outright.
 *
 * Resolves to { path, publicId } where path is the secure_url the frontend
 * links to directly.
 */
export const uploadResumeBuffer = (buffer, originalName) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "resumes",
        public_id: `${Date.now()}_${originalName.replace(/\.pdf$/i, "")}`,
        format: "pdf",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ path: result.secure_url, publicId: result.public_id });
      },
    );

    uploadStream.end(buffer);
  });

export default cloudinary;
