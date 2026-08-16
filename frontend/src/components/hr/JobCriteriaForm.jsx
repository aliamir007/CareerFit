import { useEffect, useState } from "react";
import Button from "../common/Button";
import Input from "../common/Input";
import { InlineError } from "../common/States";

const EMPTY_FORM = {
  company_name: "",
  job_title: "",
  job_description: "",
  experience_required: "",
};

const buildInitialState = (initialValues = {}) => ({
  form: {
    ...EMPTY_FORM,
    company_name: initialValues.company_name ?? "",
    job_title: initialValues.job_title ?? "",
    job_description: initialValues.job_description ?? "",
    experience_required: initialValues.experience_required ?? "",
  },
  skills: Array.isArray(initialValues.skills_req)
    ? [
        ...new Set(
          initialValues.skills_req
            .filter((skill) => typeof skill === "string")
            .map((skill) => skill.trim().toLowerCase())
            .filter(Boolean),
        ),
      ]
    : [],
});

export default function JobCriteriaForm({
  onSubmit,
  submitting,
  initialValues,
  title = "Post a role",
  description = "We shortlist candidates who match at least half of the skills you list.",
  submitLabel = "Find candidates",
  footerNote = "Scoring the shortlist can take up to a minute.",
  onCancel,
  cancelLabel = "Cancel",
  submitError = "",
  titleId,
}) {
  const initialState = buildInitialState(initialValues);
  const [form, setForm] = useState(initialState.form);
  const [skills, setSkills] = useState(initialState.skills);
  const [draft, setDraft] = useState("");
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    const nextState = buildInitialState(initialValues);
    setForm(nextState.form);
    setSkills(nextState.skills);
    setDraft("");
    setErrors({});
    setError("");
  }, [initialValues]);

  const update = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const addSkill = (raw) => {
    const value = raw.trim().toLowerCase();
    if (!value) return;
    // Deduped, because the backend normalises and would otherwise double-count.
    setSkills((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setDraft("");
  };

  const handleSkillKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addSkill(draft);
      return;
    }
    if (event.key === "Backspace" && draft === "" && skills.length > 0) {
      setSkills((prev) => prev.slice(0, -1));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    const next = {};
    if (!form.company_name.trim()) next.company_name = "Required.";
    if (!form.job_title.trim()) next.job_title = "Required.";
    setErrors(next);

    // Fold a half-typed skill in rather than silently dropping it.
    const finalSkills = draft.trim()
      ? [...new Set([...skills, draft.trim().toLowerCase()])]
      : skills;

    if (finalSkills.length === 0) {
      setError("Add at least one required skill.");
      return;
    }
    if (Object.keys(next).length > 0) return;

    setSkills(finalSkills);
    setDraft("");

    onSubmit({
      company_name: form.company_name.trim(),
      job_title: form.job_title.trim(),
      skills_req: finalSkills,
      ...(form.job_description.trim() && {
        job_description: form.job_description.trim(),
      }),
      ...(form.experience_required.trim() && {
        experience_required: form.experience_required.trim(),
      }),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="card animate-fade-up">
      <header className="border-b border-hairline px-6 py-4">
        <h2 id={titleId} className="display text-lg">
          {title}
        </h2>
        <p className="mt-0.5 text-sm text-muted">
          {description}
        </p>
      </header>

      <div className="flex flex-col gap-5 px-6 py-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Company name"
            value={form.company_name}
            onChange={update("company_name")}
            error={errors.company_name}
          />
          <Input
            label="Job title"
            value={form.job_title}
            onChange={update("job_title")}
            error={errors.job_title}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="skills" className="label">
            Required skills
          </label>
          <div
            onClick={() => document.getElementById("skills")?.focus()}
            className="flex min-h-[46px] w-full flex-wrap items-center gap-1.5 rounded border border-hairline bg-white px-2.5 py-2 focus-within:border-teal focus-within:ring-1 focus-within:ring-teal"
          >
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 border border-teal/40 bg-teal/5 px-2 py-0.5 text-xs text-teal"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => setSkills((p) => p.filter((s) => s !== skill))}
                  aria-label={`Remove ${skill}`}
                  className="text-teal/60 hover:text-teal"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              id="skills"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              onBlur={() => addSkill(draft)}
              placeholder={skills.length === 0 ? "react, node, mongodb…" : ""}
              className="min-w-[8rem] flex-1 border-0 bg-transparent text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-0"
            />
          </div>
          <p className="text-xs text-muted">
            Press Enter or comma after each skill.
          </p>
        </div>

        <Input
          label="Experience required (optional)"
          value={form.experience_required}
          onChange={update("experience_required")}
          placeholder="e.g. 3+ years"
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="jd" className="label">
            Job description (optional)
          </label>
          <textarea
            id="jd"
            rows={4}
            value={form.job_description}
            onChange={update("job_description")}
            className="w-full rounded border border-hairline bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
            placeholder="What the person will actually do."
          />
        </div>

        <InlineError message={error || submitError} />
      </div>

      <footer className="flex items-center justify-between gap-4 border-t border-hairline px-6 py-4">
        <p className="text-xs text-muted">{footerNote}</p>
        <div className="flex items-center gap-3">
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel}>
              {cancelLabel}
            </Button>
          )}
          <Button type="submit" loading={submitting}>
            {submitLabel}
          </Button>
        </div>
      </footer>
    </form>
  );
}
