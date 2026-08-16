export const RECRUITER_JOB_STATUS = Object.freeze({
  ACTIVE: "Active",
  CLOSED: "Closed",
});

export const RECRUITER_JOB_STATUS_VALUES = Object.values(RECRUITER_JOB_STATUS);

// Support existing stored values so older jobs remain readable after the enum
// is tightened to the new Active / Closed pair.
export const ACTIVE_RECRUITER_JOB_STATUSES = [
  RECRUITER_JOB_STATUS.ACTIVE,
  "active",
];

export const CLOSED_RECRUITER_JOB_STATUSES = [
  RECRUITER_JOB_STATUS.CLOSED,
  "not active",
];

export const normalizeRecruiterJobStatus = (status) => {
  if (ACTIVE_RECRUITER_JOB_STATUSES.includes(status)) {
    return RECRUITER_JOB_STATUS.ACTIVE;
  }

  if (CLOSED_RECRUITER_JOB_STATUSES.includes(status)) {
    return RECRUITER_JOB_STATUS.CLOSED;
  }

  return status;
};

export const toRecruiterJobResponse = (jobDocument) => {
  const job =
    typeof jobDocument?.toObject === "function"
      ? jobDocument.toObject()
      : { ...jobDocument };

  delete job.requirements_vector;
  job.status = normalizeRecruiterJobStatus(job.status);

  return job;
};
