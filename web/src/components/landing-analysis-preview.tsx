const matchedSkills = ["Python", "SQL", "Git", "REST APIs"];
const missingSkills = ["Docker", "AWS", "CI/CD"];

function SkillRows({
  label,
  skills,
  tone,
}: {
  label: string;
  skills: string[];
  tone: "matched" | "missing";
}) {
  const markerClasses =
    tone === "matched"
      ? "border-emerald-700 bg-emerald-50 text-emerald-800"
      : "border-amber-700 bg-amber-50 text-amber-800";

  return (
    <section aria-labelledby={`${tone}-skills-heading`} className="min-w-0">
      <h3 id={`${tone}-skills-heading`} className="text-sm font-semibold text-[var(--color-text)]">
        {label}
      </h3>
      <ul className="mt-3 space-y-2" aria-label={`${label} in the fictional result`}>
        {skills.map((skill) => (
          <li key={skill} className="flex min-w-0 items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[0.68rem] font-bold leading-none ${markerClasses}`}
              aria-hidden="true"
            >
              {tone === "matched" ? "✓" : "!"}
            </span>
            <span className="min-w-0 break-words">{skill}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LandingAnalysisPreview() {
  return (
    <figure className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
      <figcaption className="text-sm font-medium text-[var(--color-text-muted)]">
        Fictional example · Structured skill result
      </figcaption>

      <div className="mt-5 border-b border-[var(--color-divider)] pb-5">
        <p className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
          Product Engineering Intern
        </p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Example Company</p>
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">4 matched · 3 missing</p>
      </div>

      <div className="mt-5 grid gap-6 sm:grid-cols-2">
        <SkillRows label="Matched" skills={matchedSkills} tone="matched" />
        <SkillRows label="Missing" skills={missingSkills} tone="missing" />
      </div>
    </figure>
  );
}
