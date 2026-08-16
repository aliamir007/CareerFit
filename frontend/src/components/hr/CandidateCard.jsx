import MatchMeter from "../common/MatchMeter";
import { SkillChip } from "../candidate/SkillsList";

// The backend's getRecommendation() produces these labels. Matching loosely on
// the text keeps this working if the wording is tweaked server-side.
const toneFor = (recommendation = "") => {
  const value = recommendation.toLowerCase();
  if (value.includes("highly")) return "border-teal bg-teal text-paper";
  if (value.includes("not")) return "border-brick text-brick";
  if (value.includes("potential")) return "border-hairline text-muted";
  return "border-gold text-ink"; // "Recommended"
};

export default function CandidateCard({ candidate }) {
  const {
    username,
    email,
    skillMatchPercentage,
    finalScore,
    atsScore,
    recommendation,
    matchedSkills = [],
    missingSkills = [],
    resume,
    aiExplanation,
  } = candidate;

  return (
    <article className="card animate-fade-up">
      <div className="flex flex-col gap-6 px-6 py-5 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="display text-lg">{username}</h3>
            {recommendation && (
              <span
                className={`border px-2 py-0.5 text-xs font-medium ${toneFor(recommendation)}`}
              >
                {recommendation}
              </span>
            )}
          </div>

          <p className="mt-1 truncate text-sm text-muted">{email}</p>

          {aiExplanation && (
            <p className="mt-3 border-l-2 border-gold pl-3 text-sm leading-relaxed text-ink">
              {aiExplanation}
            </p>
          )}

          <div className="mt-4 flex gap-8">
            <div>
              <p className="label">Final score</p>
              <p className="numeric mt-0.5 text-base text-ink">
                {Math.round(finalScore ?? 0)}
              </p>
            </div>
            <div>
              <p className="label">ATS</p>
              <p className="numeric mt-0.5 text-base text-ink">
                {Math.round(atsScore ?? 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="w-full shrink-0 sm:w-40">
          {/* Same meter as the candidate side, so match strength always reads
              the same way whichever side of the platform you are on. */}
          <MatchMeter value={skillMatchPercentage} label="Skill match" />
        </div>
      </div>

      {(matchedSkills.length > 0 || missingSkills.length > 0) && (
        <div className="grid gap-4 border-t border-hairline px-6 py-4 sm:grid-cols-2">
          <div>
            <p className="label">
              Has{" "}
              <span className="numeric text-teal">{matchedSkills.length}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {matchedSkills.map((s) => (
                <SkillChip key={s} tone="matched">
                  {s}
                </SkillChip>
              ))}
            </div>
          </div>
          <div>
            <p className="label">
              Missing{" "}
              <span className="numeric text-brick">{missingSkills.length}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {missingSkills.length === 0 ? (
                <span className="text-xs text-muted">Nothing.</span>
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
        <a
          href={`mailto:${email}`}
          className="text-sm text-teal underline-offset-4 hover:underline"
        >
          Email {username}
        </a>

        {resume?.path ? (
          <a
            href={resume.path}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded border border-hairline px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
          >
            View resume
          </a>
        ) : (
          <span className="text-xs text-muted">No resume on file</span>
        )}
      </footer>
    </article>
  );
}
