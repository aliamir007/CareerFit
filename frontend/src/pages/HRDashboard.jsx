import { useState } from "react";
import { useNavigate } from "react-router-dom";
import JobCriteriaForm from "../components/hr/JobCriteriaForm";
import { InlineError } from "../components/common/States";
import { useToast } from "../components/common/Toast";
import api, { LONG_RUNNING_TIMEOUT, getErrorMessage } from "../api/axiosInstance";

export default function HRDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (criteria) => {
    setSubmitting(true);
    setError("");
    try {
      const res = await api.post("/recruit/postJob", criteria, {
        // Posting the role also runs the whole matching + AI scoring pass.
        timeout: LONG_RUNNING_TIMEOUT,
      });
      const data = res.data?.data;

      toast("Role posted.", "success");

      // postJob returns the shortlist in the same response, so we hand it
      // straight to the results page rather than re-fetching it.
      navigate("/hr/matches", {
        state: {
          candidates: data?.eligible_candidates ?? [],
          job: data?.job ?? null,
          requiredSkills: data?.requiredSkills ?? [],
        },
      });
    } catch (err) {
      setError(getErrorMessage(err, "Could not post that role."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <p className="label">Recruiter</p>
      <h1 className="display mt-1 text-2xl">Find candidates</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        List the skills the role actually needs. We rank every candidate who
        matches at least half of them and show you what they are missing.
      </p>

      {error && (
        <div className="mt-6">
          <InlineError message={error} />
        </div>
      )}

      <div className="mt-8">
        <JobCriteriaForm onSubmit={handleSubmit} submitting={submitting} />
      </div>

      {submitting && (
        <p className="mt-4 text-center text-sm text-muted" role="status">
          Posting the role and scoring candidates. This can take up to a minute…
        </p>
      )}
    </main>
  );
}
