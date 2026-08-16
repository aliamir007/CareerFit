/**
 * Candidate Scoring Utility
 * 
 * This utility provides helper functions for calculating candidate scores,
 * generating recommendation labels, and ranking candidates for recruiters.
 */

/**
 * Calculate final weighted score combining skill match and ATS score
 * Formula: 70% * Skill Match + 30% * ATS Score
 * 
 * @param {number} skillMatchPercentage - Skill match percentage (0-100)
 * @param {number} atsScore - ATS score (0-100)
 * @returns {number} - Final weighted score (0-100)
 */
function calculateFinalScore(skillMatchPercentage, atsScore) {
  // Weight formula: 70% skill match + 30% ATS score
  const finalScore = (skillMatchPercentage * 0.7) + (atsScore * 0.3);
  
  // Round to nearest integer and ensure it's between 0-100
  return Math.min(100, Math.max(0, Math.round(finalScore)));
}

/**
 * Generate recommendation label based on final score
 * 
 * @param {number} finalScore - Final weighted score (0-100)
 * @returns {string} - Recommendation label
 */
function getRecommendation(finalScore) {
  if (finalScore >= 90) {
    return "Highly Recommended";
  } else if (finalScore >= 75) {
    return "Recommended";
  } else if (finalScore >= 60) {
    return "Potential Match";
  } else {
    return "Not Recommended";
  }
}

/**
 * Calculate skill match percentage
 * 
 * @param {number} matchedCount - Number of matched skills
 * @param {number} requiredCount - Total number of required skills
 * @returns {number} - Match percentage (0-100)
 */
function calculateSkillMatchPercentage(matchedCount, requiredCount) {
  if (requiredCount === 0) {
    return 0;
  }
  return Math.round((matchedCount / requiredCount) * 100);
}

/**
 * Check if candidate meets minimum matching criteria
 * Criteria: Match Percentage >= 50% OR Matched Skills >= 4
 * 
 * @param {number} matchPercentage - Skill match percentage
 * @param {number} matchedCount - Number of matched skills
 * @returns {boolean} - Whether candidate meets criteria
 */
function meetsMinimumCriteria(matchPercentage, matchedCount) {
  return matchPercentage >= 50 || matchedCount >= 4;
}

export {
  calculateFinalScore,
  getRecommendation,
  calculateSkillMatchPercentage,
  meetsMinimumCriteria
};
