import { Router } from "express";
import {
  login,
  registerUser,
  refreshAccessToken,
  choose_role,
  getCurrentUser,
  logoutUser,
  googleLogin,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();
router.route("/register").post(registerUser);
router.route("/login").post(login);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/role").post(verifyJWT, choose_role);
router.route("/me").get(verifyJWT, getCurrentUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/google-login").post(googleLogin);
export default router;
