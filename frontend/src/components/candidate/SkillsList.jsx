// The seven categories the API returns, in the order we want to read them.
const CATEGORIES = [
  { key: "languages", label: "Languages" },
  { key: "frameworks", label: "Frameworks" },
  { key: "databases", label: "Databases" },
  { key: "cloud", label: "Cloud" },
  { key: "tools", label: "Tools" },
  { key: "concepts", label: "Concepts" },
  { key: "softSkills", label: "Soft skills" },
];

export function SkillChip({ children, tone = "neutral" }) {
  const tones = {
    neutral: "border-hairline text-ink",
    matched: "border-teal/40 bg-teal/5 text-teal",
    missing: "border-brick/40 bg-brick/5 text-brick",
  };
  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 text-xs ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export default function SkillsList({ parsedSkills, skillsCount, atsScore }) {
  const populated = CATEGORIES.filter(
    (c) => Array.isArray(parsedSkills?.[c.key]) && parsedSkills[c.key].length > 0,
  );

  return (
    <section className="card animate-fade-up">
      <header className="flex items-center justify-between gap-6 border-b border-hairline px-6 py-4">
        <div>
          <h2 className="display text-lg">Your skills</h2>
          <p className="mt-0.5 text-sm text-muted">
            Extracted from your resume, grouped by category.
          </p>
        </div>

        <div className="flex shrink-0 gap-8 text-right">
          <div>
            <p className="label">Skills</p>
            <p className="numeric mt-0.5 text-xl text-ink">{skillsCount ?? 0}</p>
          </div>
          <div>
            <p className="label">ATS score</p>
            <p className="numeric mt-0.5 text-xl text-ink">
              {Math.round(atsScore ?? 0)}
              <span className="ml-0.5 text-xs text-muted">/100</span>
            </p>
          </div>
        </div>
      </header>

      {populated.length === 0 ? (
        <p className="px-6 py-8 text-sm text-muted">
          We could not find any recognisable skills in that resume. Try a version
          with a clear skills section.
        </p>
      ) : (
        <div className="divide-y divide-hairline">
          {populated.map((category) => (
            <div
              key={category.key}
              className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:gap-6"
            >
              <div className="sm:w-32 sm:shrink-0">
                <p className="label">{category.label}</p>
                <p className="numeric mt-0.5 text-xs text-muted">
                  {parsedSkills[category.key].length}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {parsedSkills[category.key].map((skill) => (
                  <SkillChip key={skill}>{skill}</SkillChip>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
