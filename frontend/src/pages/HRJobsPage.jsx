import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../api/axiosInstance";
import Modal from "../components/common/Modal";
import Button from "../components/common/Button";
import { EmptyState, ErrorState, InlineError } from "../components/common/States";
import { useToast } from "../components/common/Toast";
import JobCriteriaForm from "../components/hr/JobCriteriaForm";
import RecruiterJobCard from "../components/hr/RecruiterJobCard";

export default function HRJobsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [state, setState] = useState({ status: "loading", jobs: [] });
  const [editingJob, setEditingJob] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [statusError, setStatusError] = useState("");

  const loadJobs = useCallback(async () => {
    setState((current) =>
      current.status === "done"
        ? current
        : { status: "loading", jobs: [], message: "" },
    );

    try {
      const res = await api.get("/recruiter/my-jobs");
      const jobs = res.data?.data?.jobs ?? [];
      setState({ status: "done", jobs });
    } catch (err) {
      setState({
        status: "error",
        jobs: [],
        message: getErrorMessage(err, "Could not load your jobs."),
      });
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleEditSubmit = async (values) => {
    if (!editingJob) return;

    setEditSubmitting(true);
    setEditError("");

    try {
      await api.put(`/recruiter/job/${editingJob._id}`, values);
      toast("Job updated successfully.", "success");
      setEditingJob(null);
      await loadJobs();
    } catch (err) {
      setEditError(getErrorMessage(err, "Could not update that job."));
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleStatusSubmit = async () => {
    if (!statusTarget) return;

    setStatusSubmitting(true);
    setStatusError("");

    const nextStatus = statusTarget.status === "Closed" ? "Active" : "Closed";

    try {
      await api.patch(`/recruiter/job/${statusTarget._id}/status`, {
        status: nextStatus,
      });
      toast(
        nextStatus === "Closed"
          ? "Job closed successfully."
          : "Job reopened successfully.",
        "success",
      );
      setStatusTarget(null);
      await loadJobs();
    } catch (err) {
      setStatusError(getErrorMessage(err, "Could not update that job status."));
    } finally {
      setStatusSubmitting(false);
    }
  };

  return (
    <>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label">Recruiter</p>
            <h1 className="display mt-1 text-2xl">My Jobs</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Review, update, close, and reopen the roles you have already posted.
            </p>
          </div>

          {state.status === "done" && state.jobs.length > 0 && (
            <p className="text-sm text-muted">
              <span className="numeric text-ink">{state.jobs.length}</span>{" "}
              {state.jobs.length === 1 ? "job" : "jobs"}
            </p>
          )}
        </div>

        <div className="mt-8">
          {state.status === "loading" && (
            <div className="card px-8 py-12 text-center">
              <p className="text-sm text-muted">Loading your job postings…</p>
            </div>
          )}

          {state.status === "error" && (
            <ErrorState message={state.message} onRetry={loadJobs} />
          )}

          {state.status === "done" && state.jobs.length === 0 && (
            <EmptyState
              title="No jobs posted yet."
              description='Create your first job using the "Post a Role" tab.'
              action="Post a role"
              onAction={() => navigate("/hr")}
            />
          )}

          {state.status === "done" && state.jobs.length > 0 && (
            <div className="flex flex-col gap-4">
              {state.jobs.map((job) => (
                <RecruiterJobCard
                  key={job._id}
                  job={job}
                  onEdit={(selectedJob) => {
                    setEditError("");
                    setEditingJob(selectedJob);
                  }}
                  onToggleStatus={(selectedJob) => {
                    setStatusError("");
                    setStatusTarget(selectedJob);
                  }}
                  statusUpdating={
                    statusSubmitting && statusTarget?._id === job._id
                  }
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {editingJob && (
        <Modal onClose={() => !editSubmitting && setEditingJob(null)} labelledBy="edit-job-title">
          <JobCriteriaForm
            initialValues={editingJob}
            onSubmit={handleEditSubmit}
            submitting={editSubmitting}
            submitError={editError}
            onCancel={() => setEditingJob(null)}
            titleId="edit-job-title"
            title="Edit job"
            description="Update the role details below. Use the My Jobs action to close or reopen the job."
            submitLabel="Save changes"
            footerNote="Status can be changed only from the My Jobs actions."
          />
        </Modal>
      )}

      {statusTarget && (
        <Modal
          onClose={() => !statusSubmitting && setStatusTarget(null)}
          labelledBy="job-status-dialog-title"
        >
          <section className="card px-6 py-6">
            <h2 id="job-status-dialog-title" className="display text-lg">
              {statusTarget.status === "Closed"
                ? "Reopen this job posting?"
                : "Close this job posting?"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {statusTarget.status === "Closed"
                ? "Candidates will be able to find this job again as soon as it is reopened."
                : "Candidates will no longer be able to find this job."}
            </p>

            <div className="mt-4">
              <InlineError message={statusError} />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setStatusTarget(null)}
                disabled={statusSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant={statusTarget.status === "Closed" ? "primary" : "danger"}
                onClick={handleStatusSubmit}
                loading={statusSubmitting}
              >
                {statusTarget.status === "Closed" ? "Reopen Job" : "Close Job"}
              </Button>
            </div>
          </section>
        </Modal>
      )}
    </>
  );
}
