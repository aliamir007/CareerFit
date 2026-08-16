import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MatchMeter from "../components/common/MatchMeter";
import { SkillChip } from "../components/candidate/SkillsList";
import Loader from "../components/common/Loader";
import { EmptyState, ErrorState } from "../components/common/States";
import api, { getErrorMessage } from "../api/axiosInstance";

export default function JobDetailsPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    const loadJobDetails = async () => {
      setState({ status: "loading" });
      try {
        const res = await api.get(`/findJob/job/${jobId}`);
        const data = res.data?.data;
        setState({ status: "done", job: data });
      } catch (err) {
        setState({ status: "error", message: getErrorMessage(err) });
      }
    };

    loadJobDetails();
  }, [jobId]);

  const {
    companyName,
    jobTitle,
    job_description,
    email,
    matchPercentage,
    matchedSkills = [],
    missingSkills = [],
    aiExplanation,
    status,
    experience_required,
  } = state.job || {};

  const isJobClosed = status === "Closed";

  const mailto = `mailto:${email}?subject=${encodeURIComponent(
    `Application for ${jobTitle}`,
  )}`;

  if (state.status === "loading") {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <div className="card px-8 py-16">
          <Loader fullscreen={false} label="Loading job details..." />
        </div>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <ErrorState message={state.message} onRetry={() => window.location.reload()} />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-teal hover:underline"
        >
          ← Back
        </button>
      </div>

      <article className="card">
        <div className="flex flex-col gap-6 px-6 py-5 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="label">{companyName}</p>
                <h1 className="display mt-1 text-2xl">{jobTitle}</h1>
                
                {/* Job Status Badge */}
                <div className="mt-3">
                  {isJobClosed ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brick/10 px-3 py-1 text-sm font-medium text-brick">
                      <span className="h-2 w-2 rounded-full bg-brick" />
                      Closed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-3 py-1 text-sm font-medium text-teal">
                      <span className="h-2 w-2 rounded-full bg-teal" />
                      Active
                    </span>
                  )}
                </div>
              </div>

              <div className="w-full shrink-0 sm:w-40">
                <MatchMeter value={matchPercentage} label="Skill match" />
              </div>
            </div>

            {experience_required && (
              <p className="mt-3 text-sm text-muted">
                <span className="font-medium text-ink">Experience Required:</span> {experience_required}
              </p>
            )}

            {job_description && (
              <div className="mt-4">
                <h2 className="label mb-2">Job Description</h2>
                <p className="text-sm leading-relaxed text-ink">
                  {job_description}
                </p>
              </div>
            )}

            {aiExplanation && (
              <p className="mt-4 border-l-2 border-gold pl-3 text-sm leading-relaxed text-ink">
                {aiExplanation}
              </p>
            )}
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
          {!isJobClosed ? (
            <a
              href={mailto}
              className="shrink-0 rounded bg-teal px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-teal-deep"
            >
              Email this recruiter
            </a>
          ) : (
            <span className="text-sm text-muted">This job is closed to applications</span>
          )}
        </footer>
      </article>
    </main>
  );
}
