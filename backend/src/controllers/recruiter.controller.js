import { job_seeker } from "../models/job_seeker.model.js";
import { recruiter } from "../models/recruiter.model.js";
import { APIError } from "../utils/APIerror.js";
import { APIresponse } from "../utils/APIresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { normalizeSkillsArray, calculateSkillMatch } from "../utils/skillNormalizer.js";
import { generateContent, embedContent } from "../utils/gemini.js";
import { enqueueJobNotificationProcessing } from "../queues/jobNotification.queue.js";
import {
  RECRUITER_JOB_STATUS,
  RECRUITER_JOB_STATUS_VALUES,
  toRecruiterJobResponse,
} from "../utils/recruiterJob.js";
import {
  calculateFinalScore,
  getRecommendation,
  calculateSkillMatchPercentage,
  meetsMinimumCriteria
} from "../utils/candidateScoring.js";

import dotenv from "dotenv";
dotenv.config();

const AI_RANKING_LIMIT = 5;

async function getEmbedding(text, isQuery = false) {
  const response = await embedContent({
    contents: text,
    config: {
      taskType: isQuery ? "RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT",
      outputDimensionality: 768,
    },
  });
  return response.embeddings[0].values;
}

async function getAICandidateRanking(candidateSkills, recruiterSkills, jobTitle, candidateATS) {
  try {
    const prompt = `
      You are an expert HR recruiter. Evaluate the compatibility between a candidate and a job.
      
      Candidate Skills: ${candidateSkills.join(', ')}
      Recruiter Required Skills: ${recruiterSkills.join(', ')}
      Job Title: ${jobTitle}
      Candidate ATS Score: ${candidateATS}
      
      Provide a JSON response with:
      1. overall_score: A number from 0-100 representing overall compatibility
      2. strengths: Array of key strengths the candidate has for this role
      3. missing_skills: Array of critical skills the candidate is missing
      4. explanation: A brief explanation (max 2 sentences) of why this is a good or bad match
      
      Return ONLY valid JSON, no additional text.
    `;

    const response = await generateContent({
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    return null;
  }
}

function buildRecruiterJobPayload(body) {
  const companyName =
    typeof body.company_name === "string" ? body.company_name.trim() : "";
  const jobTitle =
    typeof body.job_title === "string" ? body.job_title.trim() : "";
  const experienceRequired =
    typeof body.experience_required === "string"
      ? body.experience_required.trim()
      : "";
  const jobDescription =
    typeof body.job_description === "string"
      ? body.job_description.trim()
      : "";

  if (!body.skills_req || !Array.isArray(body.skills_req) || body.skills_req.length === 0) {
    throw new APIError(
      400,
      "Please provide required skills for this job opening.",
    );
  }

  if (!companyName || !jobTitle) {
    throw new APIError(
      400,
      "Please provide company name and job title for this job opening.",
    );
  }

  const normalizedSkills = normalizeSkillsArray(body.skills_req);

  if (normalizedSkills.length === 0) {
    throw new APIError(
      400,
      "Please provide at least one valid required skill for this job opening.",
    );
  }

  return {
    normalizedSkills,
    jobPayload: {
      company_name: companyName,
      job_title: jobTitle,
      skills_req: normalizedSkills,
      ...(experienceRequired && { experience_required: experienceRequired }),
      ...(jobDescription && { job_description: jobDescription }),
    },
  };
}

function mapRecruiterJobError(
  error,
  fallbackMessage = "We could not save that job right now. Please try again.",
) {
  if (error instanceof APIError) {
    throw error;
  }

  if (error?.name === "ValidationError") {
    const message =
      Object.values(error.errors || {})[0]?.message ||
      "Please review the job details and try again.";
    throw new APIError(400, message);
  }

  throw new APIError(
    500,
    fallbackMessage,
  );
}

async function getOwnedJob(jobId, recruiterId) {
  if (!jobId || !jobId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new APIError(400, "Invalid job identifier.");
  }

  const job = await recruiter.findOne({
    _id: jobId,
    user_id: recruiterId,
  });

  if (!job) {
    throw new APIError(404, "Job not found.");
  }

  return job;
}


const search_employees = asyncHandler(async (req, res) => {
  try {
    const { normalizedSkills, jobPayload } = buildRecruiterJobPayload(req.body);
    const skillsString = normalizedSkills.join(", ");
    const documentVector = await getEmbedding(skillsString, false);

    const newJob = await recruiter.create({
      user_id: req.user._id,
      ...jobPayload,
      requirements_vector: documentVector,
    });

    try {
      await enqueueJobNotificationProcessing(newJob._id);
    } catch (queueError) {
      await recruiter.findByIdAndDelete(newJob._id);
      throw new APIError(
        500,
        "We could not queue job notifications right now. Please try posting the job again.",
      );
    }

    const jobResponse = toRecruiterJobResponse(newJob);

    const potentialCandidates = await job_seeker.aggregate([
      {
        $match: {
          skills: { $in: normalizedSkills }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $unwind: "$userDetails"
      }
    ]);

    if (!potentialCandidates || potentialCandidates.length === 0) {
      return res.status(201).json(
        new APIresponse(
          201,
          "Job opening published but no matching candidates found.",
          {
            job: jobResponse,
            message: "No candidates found with matching skills."
          },
        ),
      );
    }

    const scoredCandidates = [];

    for (const candidate of potentialCandidates) {
      const candidateSkills = candidate.skills || [];
    
      const { matchedSkills, missingSkills } = calculateSkillMatch(
        candidateSkills,
        normalizedSkills
      );

      const skillMatchPercentage = calculateSkillMatchPercentage(
        matchedSkills.length,
        normalizedSkills.length
      );

      if (meetsMinimumCriteria(skillMatchPercentage, matchedSkills.length)) {
        const atsScore = candidate.atsScore || 0;
        const finalScore = calculateFinalScore(skillMatchPercentage, atsScore);
        const recommendation = getRecommendation(finalScore);

        scoredCandidates.push({
          username: candidate.userDetails.username,
          email: candidate.userDetails.email,
          skillMatchPercentage: skillMatchPercentage,
          finalScore: finalScore,
          recommendation: recommendation,
          matchedSkills: matchedSkills,
          missingSkills: missingSkills,
          atsScore: atsScore,
          resume: candidate.resume || null,
          // aiScore: null,
          // aiExplanation: null,
          // aiStrengths: null,
          // aiMissingSkills: null,
        });
      }
    }

    if (scoredCandidates.length === 0) {
      return res.status(201).json(
        new APIresponse(
          201,
          "Job opening published but no candidates meet minimum criteria.",
          {
            job: jobResponse,
            eligible_candidates: [],
            message: "No candidates meet the minimum matching criteria (50% match or 4+ skills)."
          },
        ),
      );
    }

    scoredCandidates.sort((a, b) => {
      if (b.finalScore !== a.finalScore) {
        return b.finalScore - a.finalScore;
      }
      if (b.skillMatchPercentage !== a.skillMatchPercentage) {
        return b.skillMatchPercentage - a.skillMatchPercentage;
      }
      return b.atsScore - a.atsScore;
    });

    const topCandidates = scoredCandidates.slice(0, AI_RANKING_LIMIT);

    // Scored concurrently: sequential Gemini calls made this endpoint take
    // 10-60s. A failed call leaves aiScore null and the card still renders.
    await Promise.all(
      topCandidates.map(async (candidate) => {
        const aiResult = await getAICandidateRanking(
          candidate.matchedSkills.concat(candidate.missingSkills),
          normalizedSkills,
          jobPayload.job_title,
          candidate.atsScore
        );

        if (aiResult) {
          candidate.aiScore = aiResult.overall_score;
          candidate.aiExplanation = aiResult.explanation;
          candidate.aiStrengths = aiResult.strengths;
          candidate.aiMissingSkills = aiResult.missing_skills;
        }
      })
    );

    scoredCandidates.sort((a, b) => {
      const aRank = a.aiScore ?? a.finalScore;
      const bRank = b.aiScore ?? b.finalScore;
      if (bRank !== aRank) {
        return bRank - aRank;
      }
      return b.atsScore - a.atsScore;
    });

    return res.status(201).json(
      new APIresponse(
        201,
        "Job opening published and eligible candidates matched successfully based on skill compatibility and ATS score.",
        {
          job: jobResponse,
          totalMatches: scoredCandidates.length,
          requiredSkills: normalizedSkills,
          eligible_candidates: scoredCandidates
        },
      ),
    );
  } catch (error) {
    mapRecruiterJobError(error);
  }
});

const get_my_jobs = asyncHandler(async (req, res) => {
  try {
    const jobs = await recruiter
      .find({ user_id: req.user._id })
      .sort({ createdAt: -1 });

    return res.status(200).json(
      new APIresponse(
        200,
        "Recruiter jobs fetched successfully.",
        {
          jobs: jobs.map((job) => toRecruiterJobResponse(job)),
        },
      ),
    );
  } catch (error) {
    mapRecruiterJobError(
      error,
      "We could not load your jobs right now. Please try again.",
    );
  }
});

const update_job = asyncHandler(async (req, res) => {
  if (Object.prototype.hasOwnProperty.call(req.body, "status")) {
    throw new APIError(
      400,
      "Status must be updated using the dedicated status endpoint.",
    );
  }

  try {
    const job = await getOwnedJob(req.params.id, req.user._id);
    const { normalizedSkills, jobPayload } = buildRecruiterJobPayload(req.body);

    job.company_name = jobPayload.company_name;
    job.job_title = jobPayload.job_title;
    job.skills_req = normalizedSkills;
    job.experience_required = jobPayload.experience_required;
    job.job_description = jobPayload.job_description;
    job.requirements_vector = await getEmbedding(normalizedSkills.join(", "), false);

    await job.save();

    return res.status(200).json(
      new APIresponse(
        200,
        "Job updated successfully.",
        {
          job: toRecruiterJobResponse(job),
        },
      ),
    );
  } catch (error) {
    mapRecruiterJobError(error);
  }
});

const update_job_status = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!RECRUITER_JOB_STATUS_VALUES.includes(status)) {
    throw new APIError(
      400,
      `Invalid status. Allowed values are ${RECRUITER_JOB_STATUS_VALUES.join(" and ")}.`,
    );
  }

  try {
    const job = await getOwnedJob(req.params.id, req.user._id);
    job.status = status;
    await job.save();

    const message =
      status === RECRUITER_JOB_STATUS.CLOSED
        ? "Job closed successfully."
        : "Job reopened successfully.";

    return res.status(200).json(
      new APIresponse(
        200,
        message,
        {
          job: toRecruiterJobResponse(job),
        },
      ),
    );
  } catch (error) {
    mapRecruiterJobError(error);
  }
});

export { search_employees, get_my_jobs, update_job, update_job_status };
