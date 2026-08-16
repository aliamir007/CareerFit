import { Worker } from "bullmq";
import { getRedisConnection } from "../config/redis.js";
import { recruiter } from "../models/recruiter.model.js";
import { Notification } from "../models/notification.model.js";
import { JOB_NOTIFICATIONS_QUEUE } from "../queues/jobNotification.queue.js";
import { findCandidatesMatchingJob } from "../services/jobMatching.service.js";
import {
  ACTIVE_RECRUITER_JOB_STATUSES,
  normalizeRecruiterJobStatus,
} from "../utils/recruiterJob.js";

let workerInstance;

async function processJobNotification({ jobId }) {
  const recruiterJob = await recruiter.findById(jobId);

  if (!recruiterJob) {
    throw new Error(`Recruiter job not found for id ${jobId}`);
  }

  const jobStatus = normalizeRecruiterJobStatus(recruiterJob.status);
  if (!ACTIVE_RECRUITER_JOB_STATUSES.includes(jobStatus)) {
    return;
  }

  const matches = await findCandidatesMatchingJob(recruiterJob.skills_req || []);

  if (matches.length === 0) {
    return;
  }

  await Notification.bulkWrite(
    matches.map(({ candidate, matchedSkills, missingSkills, matchScore }) => ({
      updateOne: {
        filter: {
          candidateId: candidate._id,
          jobId: recruiterJob._id,
        },
        update: {
          $setOnInsert: {
            candidateId: candidate._id,
            jobId: recruiterJob._id,
            companyName: recruiterJob.company_name,
            jobTitle: recruiterJob.job_title,
            matchScore,
            matchedSkills,
            missingSkills,
            isRead: false,
          },
        },
        upsert: true,
      },
    })),
  );
}

export function startJobNotificationWorker() {
  if (workerInstance) {
    return workerInstance;
  }

  workerInstance = new Worker(
    JOB_NOTIFICATIONS_QUEUE,
    async (job) => processJobNotification(job.data),
    {
      connection: getRedisConnection(),
    },
  );

  workerInstance.on("failed", (job, error) => {
    console.error(
      `Job notification worker failed for ${job?.id ?? "unknown job"}:`,
      error.message,
    );
  });

  return workerInstance;
}
