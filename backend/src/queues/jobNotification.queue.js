import { Queue } from "bullmq";
import { getRedisConnection } from "../config/redis.js";

export const JOB_NOTIFICATIONS_QUEUE = "job-notifications";

let queueInstance;

export function getJobNotificationsQueue() {
  if (!queueInstance) {
    queueInstance = new Queue(JOB_NOTIFICATIONS_QUEUE, {
      connection: getRedisConnection(),
    });
  }

  return queueInstance;
}

export async function enqueueJobNotificationProcessing(jobId) {
  return getJobNotificationsQueue().add(
    JOB_NOTIFICATIONS_QUEUE,
    { jobId },
    {
      jobId: String(jobId),
      removeOnComplete: 50,
      removeOnFail: 50,
    },
  );
}
