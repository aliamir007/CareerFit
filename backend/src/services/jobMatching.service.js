import { job_seeker } from "../models/job_seeker.model.js";
import { calculateSkillMatch, calculateMatchPercentage } from "../utils/skillNormalizer.js";

/**
 * Reuses the existing skill matching helpers so the recruiter shortlist and the
 * candidate notification worker agree on what "50% match" means.
 */
export async function findCandidatesMatchingJob(requiredSkills) {
  const candidates = await job_seeker.find({
    skills: { $exists: true, $ne: [] },
  });

  return candidates.reduce((matches, candidate) => {
    const candidateSkills = Array.isArray(candidate.skills) ? candidate.skills : [];
    const { matchedSkills, missingSkills } = calculateSkillMatch(
      candidateSkills,
      requiredSkills,
    );
    const matchScore = calculateMatchPercentage(
      matchedSkills.length,
      requiredSkills.length,
    );

    if (matchScore >= 50) {
      matches.push({
        candidate,
        matchedSkills,
        missingSkills,
        matchScore,
      });
    }

    return matches;
  }, []);
}
