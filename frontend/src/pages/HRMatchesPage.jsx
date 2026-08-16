import { useLocation, useNavigate } from "react-router-dom";
import CandidateCard from "../components/hr/CandidateCard";
import { EmptyState } from "../components/common/States";

export default function HRMatchesPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // The shortlist arrives with the navigation from HRDashboard. There is no
  // endpoint to re-fetch a past job's matches, so a direct visit (or a browser
  // refresh, which drops history state) has nothing to show — say so plainly
  // instead of rendering an empty list that looks like "no candidates".
  const hasResults = Array.isArray(state?.candidates);
  const candidates = state?.candidates ?? [];
  const job = state?.job;

  if (!hasResults) {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <p className="label">Recruiter</p>
        <h1 className="display mt-1 text-2xl">Shortlist</h1>

        <div className="mt-8">
          <EmptyState
            title="No shortlist to show"
            description="Shortlists are generated when you post a role. Post one to see the candidates who match it."
            action="Post a role"
            onAction={() => navigate("/hr")}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Recruiter</p>
          <h1 className="display mt-1 text-2xl">
            {job?.job_title ?? "Shortlist"}
          </h1>
          {job?.company_name && (
            <p className="mt-1 text-sm text-muted">{job.company_name}</p>
          )}
        </div>

        {candidates.length > 0 && (
          <p className="text-sm text-muted">
            <span className="numeric text-ink">{candidates.length}</span>{" "}
            {candidates.length === 1 ? "candidate" : "candidates"}, best first
          </p>
        )}
      </div>

      <div className="mt-8">
        {candidates.length === 0 ? (
          <EmptyState
            title="No candidates matched this requirement yet"
            description="Nobody currently clears the 50% match bar for these skills. Try listing fewer must-have skills, or broader ones, and post again."
            action="Adjust the requirements"
            onAction={() => navigate("/hr")}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {candidates.map((candidate) => (
              <CandidateCard key={candidate.email} candidate={candidate} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
