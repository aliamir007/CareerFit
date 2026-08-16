import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { job_seeker } from "../models/job_seeker.model.js";
import { APIError } from "../utils/APIerror.js";
import { APIresponse } from "../utils/APIresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const isProduction = process.env.NODE_ENV === "production";
const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7d, matching REFRESH_TOKEN_EXPIRY
  path: "/",
};

const AccessAndRefreshTokens = async (userID) => {
  const user = await User.findById(userID);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  await User.findByIdAndUpdate(user._id, { refreshToken }, { new: true });
  return { accessToken, refreshToken };
};

const registerUser = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;
  if (!email || !password || !username) {
    throw new APIError(400, "Email, password and username are required");
  }
  const user_exists = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (user_exists) {
    throw new APIError(400, "User with this email or username already exists");
  }
  const user = await User.create({
    email,
    password,
    username,
  });
  if (!user) {
    throw new APIError(
      500,
      "Failed to create user due to some internal error, try again",
    );
  }
  const { accessToken, refreshToken } = await AccessAndRefreshTokens(user._id);

  const safeUser = user.toObject();
  delete safeUser.password;
  delete safeUser.refreshToken;

  return res
    .status(201)
    .cookie("refreshToken", refreshToken, refreshCookieOptions)
    .json(
      new APIresponse(201, "User registered successfully", {
        user: safeUser,
        accessToken,
      }),
    );
});

const login = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;
  if (!(email || username) || !password) {
    throw new APIError(400, "Email/username and password are required");
  }
  const user_exists = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (!user_exists) {
    throw new APIError(404, "User with this email or username does not exist");
  }
  const PasswordMatch = await user_exists.checkPassword(password);
  if (!PasswordMatch) {
    throw new APIError(401, "Invalid password");
  }
  const { accessToken, refreshToken } = await AccessAndRefreshTokens(
    user_exists._id,
  );
  return res
    .status(200)
    .cookie("refreshToken", refreshToken, refreshCookieOptions)
    .json(
      new APIresponse(200, "user logged in successfully", {
        accessToken,
      }),
    );
});


const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;
  if (!incomingRefreshToken) {
    throw new APIError(401, "Your session has expired. Please log in again.");
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
  } catch {
    throw new APIError(401, "Your session has expired. Please log in again.");
  }

  const user = await User.findById(decodedToken?._id);
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new APIError(401, "Your session has expired. Please log in again.");
  }

  const { accessToken, refreshToken } = await AccessAndRefreshTokens(user._id);

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, refreshCookieOptions)
    .json(new APIresponse(200, "Session refreshed", { accessToken }));
});

const choose_role = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!role) {
    throw new APIError(
      400,
      "Choose whether you are a job seeker or a recruiter.",
    );
  }
  if (!["job seeker", "recruiter"].includes(role)) {
    throw new APIError(
      400,
      `Invalid role "${role}". Choose either "job seeker" or "recruiter".`,
    );
  }
  const user = await User.findById(req.user._id);
  user.role = role;
  await user.save();

  return res
    .status(200)
    .json(new APIresponse(200, `You are now registered as: ${role}`, { role }));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const safeUser = { ...req.user.toObject() };

  if (safeUser.role === "job seeker") {
    const candidateProfile = await job_seeker
      .findOne({ user_id: safeUser._id })
      .select("_id");

    safeUser.candidateProfileId = candidateProfile?._id ?? null;
  }

  return res
    .status(200)
    .json(new APIresponse(200, "Current user fetched successfully", safeUser));
});

const logoutUser = asyncHandler(async (req, res) => {
  // Drop the stored token so the outstanding refresh cookie can no longer be
  // redeemed. Clearing the cookie alone would leave the session valid.
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });

  const clearOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  };
  return res
    .status(200)
    .clearCookie("refreshToken", clearOptions)
    .clearCookie("accessToken", clearOptions) // legacy cookie from earlier builds
    .json(new APIresponse(200, "User logged out successfully", {}));
});

const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    throw new APIError(400, "Google credential is required");
  }

  let payload;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    payload = ticket.getPayload();
  } catch (error) {
    throw new APIError(401, "Invalid Google token");
  }

  const { email, name, picture, email_verified } = payload;

  if (!email_verified) {
    throw new APIError(401, "Google account is not verified");
  }

  let user = await User.findOne({ email });

  if (!user) {
    let username = name.replace(/\s+/g, "").toLowerCase();

    const usernameExists = await User.findOne({ username });

    if (usernameExists) {
      username = `${username}${Date.now()}`;
    }

    user = await User.create({
      email,
      username,
      provider: "google",
    });
  }

  const { accessToken, refreshToken } = await AccessAndRefreshTokens(user._id);

  const safeUser = user.toObject();

  delete safeUser.password;
  delete safeUser.refreshToken;

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, refreshCookieOptions)
    .json(
      new APIresponse(200, "Google login successful", {
        user: safeUser,
        accessToken,
      }),
    );
});
export {
  registerUser,
  login,
  googleLogin,
  refreshAccessToken,
  choose_role,
  getCurrentUser,
  logoutUser,
};
