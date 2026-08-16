import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
// Legacy Passport Google OAuth - no longer used after migration to Google Identity Services
// import session from "express-session";
import dotenv from "dotenv";
// import passport from "./config/passport.js";

// Loaded here, not just in index.js: ES module imports run before index.js's
// own dotenv.config() call, so without this the config below would read an
// empty process.env and fall back to defaults.
dotenv.config();

const app = express();

// FRONTEND_URL may list several comma-separated origins, so a dev server on a
// drifted port (or a preview deployment) does not silently fail every request
// with an opaque CORS error.
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // No Origin header: curl, Postman, server-to-server. Not a browser, so
      // there is no cross-origin risk to guard against.
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin.replace(/\/$/, ""))) {
        return callback(null, true);
      }

      console.warn(
        `CORS: refused origin "${origin}". Allowed: ${allowedOrigins.join(", ")}. ` +
          `Add it to FRONTEND_URL in backend/.env if this is expected.`,
      );
      return callback(null, false);
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

import userRouter from "./routers/user.routes.js";
app.use("/api/v1/user", userRouter);

import jobSeeker from "./routers/job_seeker.routes.js";
app.use("/findJob", jobSeeker);

import recruiter from "./routers/recruiter.routes.js";
app.use("/recruit", recruiter);

import notificationRouter from "./routers/notification.routes.js";
app.use("/api/notifications", notificationRouter);



app.use((req, res) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    errors: [],
  });
});


app.use((err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong.";

  
  if (err.name === "MulterError" || message === "Only PDF files are allowed") {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "That file is larger than 5MB. Please upload a smaller PDF.";
    }
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: err.errors || [],
  });
});

export { app };
