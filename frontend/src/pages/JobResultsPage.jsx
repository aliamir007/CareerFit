import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import JobRecommendationCard from "../components/candidate/JobRecommendationCard";
import Loader from "../components/common/Loader";
import { EmptyState, ErrorState } from "../components/common/States";
import api, { LONG_RUNNING_TIMEOUT, getErrorMessage } from "../api/axiosInstance";

export default function JobResultsPage() {
  const navigate = useNavigate();
  const [state, setState] = useState({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await api.get("/findJob/find_recruiter", {
        // Skill matching plus a Gemini call per match — this is not a fast call.
        timeout: LONG_RUNNING_TIMEOUT,
      });
      const data = res.data?.data;
      setState({ status: "done", matches: data?.matches ?? [] });
    } catch (err) {
      // The API answers 404 when nothing clears the 50% bar. That is an empty
      // result, not a failure, and it should not look like one.
      if (err?.response?.status === 404) {
        setState({ status: "done", matches: [] });
        return;
      }
      setState({ status: "error", message: getErrorMessage(err) });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Candidate</p>
          <h1 className="display mt-1 text-2xl">Hiring for your skills</h1>
        </div>

        {state.status === "done" && state.matches.length > 0 && (
          <p className="text-sm text-muted">
            <span className="numeric text-ink">{state.matches.length}</span>{" "}
            {state.matches.length === 1 ? "match" : "matches"}, best first
          </p>
        )}
      </div>

      <div className="mt-8">
        {state.status === "loading" && (
          <div className="card px-8 py-16">
            <Loader
              fullscreen={false}
              label="Scoring your skills against open roles. This can take up to a minute"
            />
          </div>
        )}

        {state.status === "error" && (
          <ErrorState message={state.message} onRetry={load} />
        )}

        {state.status === "done" && state.matches.length === 0 && (
          <EmptyState
            title="No recruiters are hiring for your skill set yet"
            description="Nothing currently clears the 50% match bar. Adding more skills to your resume — or re-uploading a fuller version — widens what you match against."
            action="Update your resume"
            onAction={() => navigate("/candidate")}
          />
        )}

        {state.status === "done" && state.matches.length > 0 && (
          <div className="flex flex-col gap-4">
            {state.matches.map((match) => (
              <JobRecommendationCard key={match.recruiterId} match={match} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
