import Button from "../common/Button";
import { SkillChip } from "../candidate/SkillsList";

const formatDate = (value) =>
  new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const badgeTone = {
  Active: "border-teal/40 bg-teal/5 text-teal",
  Closed: "border-brick/40 bg-brick/5 text-brick",
};

export default function RecruiterJobCard({
  job,
  onEdit,
  onToggleStatus,
  statusUpdating,
}) {
  const isClosed = job.status === "Closed";

  return (
    <article className="card animate-fade-up">
      <div className="flex flex-col gap-6 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="label">{job.company_name}</p>
            <h2 className="display mt-1 text-lg">{job.job_title}</h2>
          </div>

          <span
            className={`inline-flex items-center border px-2.5 py-1 text-xs font-medium ${badgeTone[job.status] ?? badgeTone.Active}`}
          >
            {job.status}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="label">Experience required</p>
            <p className="mt-1 text-sm text-ink">
              {job.experience_required || "Not specified"}
            </p>
          </div>
          <div>
            <p className="label">Date posted</p>
            <p className="mt-1 text-sm text-ink">{formatDate(job.createdAt)}</p>
          </div>
        </div>

        <div>
          <p className="label">Required skills</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {job.skills_req.map((skill) => (
              <SkillChip key={skill}>{skill}</SkillChip>
            ))}
          </div>
        </div>

        <div>
          <p className="label">Job description</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {job.job_description || "No job description added."}
          </p>
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-hairline px-6 py-4">
        <Button variant="secondary" onClick={() => onEdit(job)}>
          Edit
        </Button>
        <Button
          variant={isClosed ? "primary" : "danger"}
          onClick={() => onToggleStatus(job)}
          loading={statusUpdating}
        >
          {isClosed ? "Reopen Job" : "Close Job"}
        </Button>
      </footer>
    </article>
  );
}
