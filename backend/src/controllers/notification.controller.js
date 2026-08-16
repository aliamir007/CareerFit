import mongoose from "mongoose";
import { job_seeker } from "../models/job_seeker.model.js";
import { Notification } from "../models/notification.model.js";
import { APIError } from "../utils/APIerror.js";
import { APIresponse } from "../utils/APIresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

async function getOwnedCandidateProfile(candidateId, userId) {
  if (!mongoose.Types.ObjectId.isValid(candidateId)) {
    throw new APIError(400, "Invalid candidate identifier.");
  }

  const candidate = await job_seeker.findOne({
    _id: candidateId,
    user_id: userId,
  }).select("_id");

  if (!candidate) {
    throw new APIError(403, "You are not allowed to access these notifications.");
  }

  return candidate;
}

const getCandidateNotifications = asyncHandler(async (req, res) => {
  await getOwnedCandidateProfile(req.params.candidateId, req.user._id);

  const notifications = await Notification.find({
    candidateId: req.params.candidateId,
  }).sort({ createdAt: -1 });

  return res.status(200).json(
    new APIresponse(200, "Notifications fetched successfully.", {
      notifications,
    }),
  );
});

const getUnreadNotificationCount = asyncHandler(async (req, res) => {
  await getOwnedCandidateProfile(req.params.candidateId, req.user._id);

  const unreadCount = await Notification.countDocuments({
    candidateId: req.params.candidateId,
    isRead: false,
  });

  return res.status(200).json(
    new APIresponse(200, "Unread notification count fetched successfully.", {
      unreadCount,
    }),
  );
});

const markNotificationRead = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new APIError(400, "Invalid notification identifier.");
  }

  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    throw new APIError(404, "Notification not found.");
  }

  await getOwnedCandidateProfile(notification.candidateId, req.user._id);

  notification.isRead = true;
  await notification.save();

  return res.status(200).json(
    new APIresponse(200, "Notification marked as read.", {
      notification,
    }),
  );
});

export {
  getCandidateNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
};
