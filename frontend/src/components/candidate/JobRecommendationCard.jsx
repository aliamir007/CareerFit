import { useState } from "react";
import MatchMeter from "../common/MatchMeter";
import { SkillChip } from "./SkillsList";

export default function JobRecommendationCard({ match }) {
  const {
    companyName,
    jobTitle,
    job_description,
    email,
    matchPercentage,
    matchedSkills = [],
    missingSkills = [],
    aiExplanation,
  } = match;

  // State for expanding/collapsing job description
  const [isExpanded, setIsExpanded] = useState(false);

  // Character limit for truncation
  const DESCRIPTION_LIMIT = 200;

  // Check if description needs truncation
  const needsTruncation = job_description && job_description.length > DESCRIPTION_LIMIT;

  // Show truncated description with ellipsis
  const truncatedDescription = needsTruncation
    ? job_description.slice(0, DESCRIPTION_LIMIT) + "..."
    : job_description;

  // Toggle full description
  const toggleDescription = () => {
    setIsExpanded((prev) => !prev);
  };

  // There is no in-app apply endpoint; email is the real mechanism, so the
  // primary action is a pre-filled mailto.
  const mailto = `mailto:${email}?subject=${encodeURIComponent(
    `Application for ${jobTitle}`,
  )}`;

  return (
    <article className="card animate-fade-up">
      <div className="flex flex-col gap-6 px-6 py-5 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <p className="label">{companyName}</p>
          <h3 className="display mt-1 text-lg">{jobTitle}</h3>

          {job_description && (
            <>
              {/* Show truncated or full description based on expanded state */}
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {isExpanded || !needsTruncation ? job_description : truncatedDescription}
              </p>

              {/* Show More / Show Less link - only if truncation is needed */}
              {needsTruncation && (
                <button
                  onClick={toggleDescription}
                  className="mt-1 text-sm text-teal underline-offset-4 hover:underline cursor-pointer"
                >
                  {isExpanded ? "Show Less" : "Show More"}
                </button>
              )}
            </>
          )}

          {/* Best-effort: the Gemini call can fail and return nothing. */}
          {aiExplanation && (
            <p className="mt-3 border-l-2 border-gold pl-3 text-sm leading-relaxed text-ink">
              {aiExplanation}
            </p>
          )}
        </div>

        <div className="w-full shrink-0 sm:w-40">
          <MatchMeter value={matchPercentage} label="Skill match" />
        </div>
      </div>

      {(matchedSkills.length > 0 || missingSkills.length > 0) && (
        <div className="grid gap-4 border-t border-hairline px-6 py-4 sm:grid-cols-2">
          <div>
            <p className="label">
              You have{" "}
              <span className="numeric text-teal">{matchedSkills.length}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {matchedSkills.length === 0 ? (
                <span className="text-xs text-muted">None of the required skills.</span>
              ) : (
                matchedSkills.map((s) => (
                  <SkillChip key={s} tone="matched">
                    {s}
                  </SkillChip>
                ))
              )}
            </div>
          </div>

          <div>
            <p className="label">
              Missing{" "}
              <span className="numeric text-brick">{missingSkills.length}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {missingSkills.length === 0 ? (
                <span className="text-xs text-muted">Nothing — you match every skill.</span>
              ) : (
                missingSkills.map((s) => (
                  <SkillChip key={s} tone="missing">
                    {s}
                  </SkillChip>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="flex items-center justify-between gap-4 border-t border-hairline px-6 py-3">
        <span className="truncate text-xs text-muted">{email}</span>
        <a
          href={mailto}
          className="shrink-0 rounded bg-teal px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-teal-deep"
        >
          Email this recruiter
        </a>
      </footer>
    </article>
  );
}
