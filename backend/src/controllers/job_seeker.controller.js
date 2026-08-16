import mongoose from "mongoose";
import { job_seeker } from "../models/job_seeker.model.js";
import { recruiter } from "../models/recruiter.model.js";
import { User } from "../models/user.model.js";
import { APIError } from "../utils/APIerror.js";
import { APIresponse } from "../utils/APIresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { PdfReader } from "pdfreader";
import dotenv from "dotenv";
import {
  uploadResumeBuffer,
  isCloudinaryConfigured,
} from "../config/cloudinary.js";
import {
  normalizeSkillsArray,
  buildCompleteSkillsArray,
  calculateSkillMatch,
  calculateMatchPercentage
} from "../utils/skillNormalizer.js";
import { ACTIVE_RECRUITER_JOB_STATUSES } from "../utils/recruiterJob.js";
import { calculateATSScore } from "../utils/atsCalculator.js";
import { generateContent, embedContent } from "../utils/gemini.js";
dotenv.config();

const AI_RANKING_LIMIT = 8;


async function getDocumentEmbedding(text) {
  const response = await embedContent({
    contents: text,
    config: {
      taskType: "RETRIEVAL_DOCUMENT", // for saving profiles
      outputDimensionality: 768,
    },
  });
  return response.embeddings[0].values;
}

const parseWithPdfReader = (buffer) =>
  new Promise((resolve, reject) => {
    const rows = {};

    new PdfReader().parseBuffer(buffer, (err, item) => {
      if (err) return reject(err);

      if (!item) {
        const text = Object.keys(rows)
          .sort((a, b) => parseFloat(a) - parseFloat(b))
          .map((y) => {
            const line = rows[y].sort((a, b) => a.x - b.x);
            return line
              .map((glyph, i) => {
                const previous = line[i - 1];
                const gap =
                  previous && glyph.x - (previous.x + (previous.w || 0)) > 0.4;
                return (gap ? " " : "") + glyph.text;
              })
              .join("");
          })
          .join("\n");
        return resolve(text);
      }

      if (item.text) {
        const yKey = item.y.toFixed(2);
        (rows[yKey] ||= []).push(item);
      }
    });
  });

const parsePdfText = async (buffer) => {
  try {
    const { default: pdfParse } = await import("pdf-parse/lib/pdf-parse.js");
    const { text } = await pdfParse(buffer);

    if (text && text.trim().length > 100) return text;
  } catch {
    // fall through to the reader below
  }

  return parseWithPdfReader(buffer);
};

const upload_resume = asyncHandler(async (req, res) => {
  try {
    if (!req.file || req.file.mimetype !== "application/pdf") {
      throw new APIError(400, "Please upload a valid PDF file.");
    }

    if (!isCloudinaryConfigured()) {
      throw new APIError(
        500,
        "Resume storage is not configured. Set the CLOUDINARY_* variables in backend/.env",
      );
    }

    // multer.memoryStorage() means the file is already in memory: there is no
    // path on disk to read back.
    const pdfBuffer = req.file.buffer;
    const rawPdfText = await parsePdfText(pdfBuffer); //extracting text from pdf

    const uploaded = await uploadResumeBuffer(pdfBuffer, req.file.originalname);

    const resumeInfo = {
      originalName: req.file.originalname,
      path: uploaded.path, // Cloudinary secure_url
      publicId: uploaded.publicId,
      uploadedAt: new Date()
    };

    const response = await generateContent({
      contents: `You are an expert ATS (Applicant Tracking System) parser. Analyze the following resume text and extract technical skills ONLY.

CRITICAL RULES:
1. Extract ONLY skills explicitly mentioned in the resume
2. DO NOT guess or infer skills not mentioned
3. DO NOT add related technologies (e.g., if "Java" is mentioned, DO NOT add "Spring Boot")
4. DO NOT add version numbers (e.g., "JavaScript (ES6+)" → "javascript")
5. Return ONLY valid JSON, no markdown, no explanations, no comments
6. Work through EVERY category below and fill it from the resume. Return an
   empty array for a category only if the resume genuinely mentions nothing that
   fits it. Skipping a category that has matches is a failure.

Categorize skills into these exact categories:
- languages: Programming languages (Python, Java, JavaScript, Go, C++, C#, etc.)
- frameworks: Frameworks and libraries (React, Angular, Express, Spring Boot, FastAPI, Django, Next.js, etc.)
- databases: MongoDB, Redis, MySQL, PostgreSQL, Oracle, SQL Server, etc.
- cloud: AWS, Azure, Google Cloud, EC2, Lambda, S3, RDS, etc.
- tools: Docker, Git, Terraform, GitHub Actions, Jira, Postman, Kafka, Spark, etc.
- concepts: Data Structures, Algorithms, REST API, Microservices, Distributed Systems, OOP, Networking, etc.
- softSkills: Agile, Scrum, Communication, Leadership, Problem Solving, Teamwork, etc.

Resume Text:
${rawPdfText}

Return JSON in this exact format:
{
  "languages": [],
  "frameworks": [],
  "databases": [],
  "cloud": [],
  "tools": [],
  "concepts": [],
  "softSkills": []
}`,
      config: {
        temperature: 0, // for deterministic output
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          required: [
            "languages",
            "frameworks",
            "databases",
            "cloud",
            "tools",
            "concepts",
            "softSkills",
          ],
          properties: {
            languages: { type: "ARRAY", items: { type: "STRING" } },
            frameworks: { type: "ARRAY", items: { type: "STRING" } },
            databases: { type: "ARRAY", items: { type: "STRING" } },
            cloud: { type: "ARRAY", items: { type: "STRING" } },
            tools: { type: "ARRAY", items: { type: "STRING" } },
            concepts: { type: "ARRAY", items: { type: "STRING" } },
            softSkills: { type: "ARRAY", items: { type: "STRING" } },
          },
        },
      },
    });

    const categorizedSkills = JSON.parse(response.text);
    const normalizedParsedSkills = {
      languages: normalizeSkillsArray(categorizedSkills.languages || []),
      frameworks: normalizeSkillsArray(categorizedSkills.frameworks || []),
      databases: normalizeSkillsArray(categorizedSkills.databases || []),
      cloud: normalizeSkillsArray(categorizedSkills.cloud || []),
      tools: normalizeSkillsArray(categorizedSkills.tools || []),
      concepts: normalizeSkillsArray(categorizedSkills.concepts || []),
      softSkills: normalizeSkillsArray(categorizedSkills.softSkills || []),
    };

    const completeSkillsArray = buildCompleteSkillsArray(normalizedParsedSkills);

    const atsScore = calculateATSScore(rawPdfText, completeSkillsArray.length);

    const skillsString = completeSkillsArray.join(", ");
    const candidateVector = await getDocumentEmbedding(skillsString);

    const savedProfile = await job_seeker
      .findOneAndUpdate(
        { user_id: req.user._id },
        {
          atsScore: atsScore,
          parsedSkills: normalizedParsedSkills,
          skills: completeSkillsArray,
          skills_vector: candidateVector, // Storing for future semantic search
          resume: resumeInfo, // Save uploaded resume information (replaces previous resume if exists)
        },
        {
          upsert: true, // create a new document if one do not exist
          new: true, // update the original document if it already exists
          runValidators: true,
        },
      )
      .select("-skills_vector"); 

    return res.status(200).json(
      new APIresponse(
        200,
        "Resume processed successfully with categorized skills, ATS score, and normalized skill matching.",
        {
          profileId: savedProfile._id,
          atsScore: savedProfile.atsScore,
          parsedSkills: savedProfile.parsedSkills,
          skillsCount: savedProfile.skills.length,
          resume: savedProfile.resume, 
        },
      ),
    );
  } catch (error) {
    console.error("Resume processing failed:", error);
    if (error instanceof APIError) throw error;
    if (error?.status === 429 || /quota|RESOURCE_EXHAUSTED/i.test(error?.message || "")) {
      throw new APIError(
        429,
        "The AI service has hit its daily limit, so skills cannot be extracted right now. Try again tomorrow, or enable billing on the Gemini API key.",
      );
    }

    throw new APIError(
      500,
      "We could not process that resume. Please try uploading it again.",
    );
  }
});
async function getEmbedding(text) {
  const response = await embedContent({
    contents: text,
    config: { taskType: "RETRIEVAL_QUERY", outputDimensionality: 768 },
  });
  return response.embeddings[0].values;
}

async function getAICompatibilityScore(candidateSkills, recruiterSkills, jobTitle) {
  try {
    const prompt = `
      You are an expert HR recruiter. Evaluate the compatibility between a candidate and a job.
      
      Candidate Skills: ${candidateSkills.join(", ")}
      Recruiter Required Skills: ${recruiterSkills.join(", ")}
      Job Title: ${jobTitle}
      
      Provide a JSON response with:
      1. overall_score: A number from 0-100 representing overall compatibility
      2. strengths: Array of key strengths the candidate has for this role
      3. missing_skills: Array of critical skills the candidate is missing
      4. explanation: A brief explanation (max 2 sentences) of why this is a good or bad match. Address the candidate directly using second-person pronouns ("you", "your").
      
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

const find_recruiter = asyncHandler(async (req, res) => {
  const user = req.user._id;
  const profile = await job_seeker.findOne({ user_id: user }).select("skills");
  if (!profile || !profile.skills || profile.skills.length === 0) {
    throw new APIError(404, "Could not find any skills for your profile. Please upload a resume first.");
  }

  const normalizedCandidateSkills = normalizeSkillsArray(profile.skills); // for removing duplicates(Nodejs, node.js => nodejs)

  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate()-14);

  const potentialMatches = await recruiter.aggregate([
    {
      $match: {
        status: { $in: ACTIVE_RECRUITER_JOB_STATUSES },
        $or: [
          { createdAt: { $gte: twoWeeksAgo } },
          { updatedAt: { $gte: twoWeeksAgo } }
        ],
        skills_req: { $in: normalizedCandidateSkills }
      }
    },
    {
      // Join with users collection to get email and username
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "userDetails"
      }
    },
    {
      // Convert userDetails array to single object
      $unwind: "$userDetails"
    }
  ]);

  if (!potentialMatches || potentialMatches.length === 0) {
    throw new APIError(404, "No matching recruiters found for your skills right now.");
  }

  const scoredRecruiters = [];

  for (const recruiterData of potentialMatches) {
    // Normalize recruiter required skills
    const normalizedRecruiterSkills = normalizeSkillsArray(recruiterData.skills_req);

    // Calculate which skills match and which are missing
    const { matchedSkills, missingSkills } = calculateSkillMatch(
      normalizedCandidateSkills,
      normalizedRecruiterSkills
    );

    const matchPercentage = calculateMatchPercentage(
      matchedSkills.length,
      normalizedRecruiterSkills.length
    );

    if (matchPercentage >= 50) {
      scoredRecruiters.push({
        recruiterId: recruiterData._id,
        companyName: recruiterData.company_name,
        jobTitle: recruiterData.job_title,
        job_description: recruiterData.job_description,
        email: recruiterData.userDetails.email,
        matchPercentage: matchPercentage,
        matchedSkills: matchedSkills,
        missingSkills: missingSkills,
        createdAt: recruiterData.createdAt,
        // aiScore: null,
        // aiExplanation: null,
        // aiStrengths: null,
        // aiMissingSkills: null,
      });
    }
  }

  if (scoredRecruiters.length === 0) {
    throw new APIError(404, "No recruiters meet the minimum matching criteria (50% match or 4+ skills).");
  }

  scoredRecruiters.sort((a, b) => {
    if (b.matchPercentage !== a.matchPercentage) {
      return b.matchPercentage - a.matchPercentage;
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const topRecruiters = scoredRecruiters.slice(0, AI_RANKING_LIMIT);
  await Promise.all(
    topRecruiters.map(async (recruiter) => {
      const aiResult = await getAICompatibilityScore(
        normalizedCandidateSkills,
        recruiter.matchedSkills.concat(recruiter.missingSkills),
        recruiter.jobTitle
      );

      if (aiResult) {
        recruiter.aiScore = aiResult.overall_score;
        recruiter.aiExplanation = aiResult.explanation;
        recruiter.aiStrengths = aiResult.strengths;
        recruiter.aiMissingSkills = aiResult.missing_skills;
      }
    })
  );

  scoredRecruiters.sort((a, b) => {
    const aRank = a.aiScore ?? a.matchPercentage;
    const bRank = b.aiScore ?? b.matchPercentage;
    if (bRank !== aRank) {
      return bRank - aRank;
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return res
    .status(200)
    .json(
      new APIresponse(
        200,
        "Recruiters matched successfully based on skill compatibility.",
        {
          totalMatches: scoredRecruiters.length,
          matches: scoredRecruiters
        },
      ),
    );
});

const get_job_by_id = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  if (!jobId || !jobId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new APIError(400, "Invalid job identifier.");
  }

  const job = await recruiter.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(jobId) }
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

  if (!job || job.length === 0) {
    throw new APIError(404, "Job not found.");
  }

  const jobData = job[0];
  const user = req.user._id;
  const profile = await job_seeker.findOne({ user_id: user }).select("skills");

  if (!profile || !profile.skills || profile.skills.length === 0) {
    throw new APIError(404, "Could not find your skills. Please upload a resume first.");
  }

  const normalizedCandidateSkills = normalizeSkillsArray(profile.skills);
  const normalizedRecruiterSkills = normalizeSkillsArray(jobData.skills_req);

  const { matchedSkills, missingSkills } = calculateSkillMatch(
    normalizedCandidateSkills,
    normalizedRecruiterSkills
  );

  const matchPercentage = calculateMatchPercentage(
    matchedSkills.length,
    normalizedRecruiterSkills.length
  );

  let aiResult = null;
  try {
    aiResult = await getAICompatibilityScore(
      normalizedCandidateSkills,
      matchedSkills.concat(missingSkills),
      jobData.job_title
    );
  } catch (error) {
    // AI scoring failure is not critical; continue without it
  }

  return res.status(200).json(
    new APIresponse(
      200,
      "Job fetched successfully.",
      {
        recruiterId: jobData._id,
        companyName: jobData.company_name,
        jobTitle: jobData.job_title,
        job_description: jobData.job_description,
        email: jobData.userDetails.email,
        experience_required: jobData.experience_required,
        status: jobData.status,
        matchPercentage: matchPercentage,
        matchedSkills: matchedSkills,
        missingSkills: missingSkills,
        aiExplanation: aiResult?.explanation || null,
        createdAt: jobData.createdAt,
      },
    ),
  );
});

export {upload_resume, find_recruiter, get_job_by_id}
