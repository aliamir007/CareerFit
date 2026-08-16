import { useState } from "react";
import Button from "../common/Button";
import { InlineError } from "../common/States";
import { useAuth } from "../../contexts/AuthContext";
import { getErrorMessage } from "../../api/axiosInstance";

// The value sent to the API must match the User schema enum exactly — note the
// space in "job seeker". The label is what the user reads; the value is the
// contract, and the two must not drift.
const ROLES = [
  {
    value: "job seeker",
    label: "Job seeker",
    description:
      "Upload your resume, have your skills extracted, and see which companies are hiring for them.",
  },
  {
    value: "recruiter",
    label: "HR / Recruiter",
    description:
      "Post the skills you need and get a ranked shortlist of candidates, each with their resume.",
  },
];

export default function RoleSelector({ onDone }) {
  const { chooseRole } = useAuth();
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError("");
    try {
      const user = await chooseRole(selected);
      onDone?.(user);
    } catch (err) {
      setError(getErrorMessage(err, "Could not save your role."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <h1 className="display text-2xl">How will you use Resume Matcher?</h1>
      <p className="mt-2 text-sm text-muted">
        This decides what you see. You cannot change it later from here, so pick
        the one that matches how you will use the platform.
      </p>

      <div className="mt-8 grid gap-3">
        {ROLES.map((role) => {
          const isSelected = selected === role.value;
          return (
            <button
              key={role.value}
              type="button"
              onClick={() => setSelected(role.value)}
              aria-pressed={isSelected}
              className={`card px-5 py-4 text-left transition-colors ${
                isSelected
                  ? "border-teal ring-1 ring-teal"
                  : "hover:border-ink/40"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-base font-medium text-ink">
                  {role.label}
                </span>
                <span
                  aria-hidden="true"
                  className={`h-3.5 w-3.5 rounded-full border ${
                    isSelected ? "border-teal bg-teal" : "border-hairline"
                  }`}
                />
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {role.description}
              </p>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mt-4">
          <InlineError message={error} />
        </div>
      )}

      <Button
        className="mt-6 w-full"
        onClick={handleSubmit}
        disabled={!selected}
        loading={submitting}
      >
        Continue
      </Button>
    </div>
  );
}
