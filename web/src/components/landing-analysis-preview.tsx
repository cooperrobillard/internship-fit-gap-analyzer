const matchedSkills = ["Python", "SQL", "Git", "REST APIs"];
const missingSkills = ["Docker", "AWS", "CI/CD"];

function SkillList({
  label,
  skills,
  tone,
}: {
  label: string;
  skills: string[];
  tone: "matched" | "missing";
}) {
  const toneClasses =
    tone === "matched"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : "border-amber-200 bg-amber-50 text-amber-950";

  return (
    <section aria-labelledby={`${tone}-skills-heading`} className="min-w-0">
      <div className="flex items-baseline justify-between gap-3 border-b border-[var(--color-divider)] pb-2">
        <h3
          id={`${tone}-skills-heading`}
          className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]"
        >
          {label}
        </h3>
        <span className="text-sm font-semibold text-[var(--color-text)]">
          {skills.length}
        </span>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2" aria-label={`${label} in the illustrative result`}>
        {skills.map((skill) => (
          <li
            key={skill}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${toneClasses}`}
          >
            {skill}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LandingAnalysisPreview() {
  return (
    <figure className="relative overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-soft)] sm:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-[var(--color-primary-soft)] opacity-70"
      />
      <div className="relative">
        <figcaption className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          Illustrative example result
        </figcaption>

        <div className="mt-5 rounded-3xl border border-[var(--color-divider)] bg-[var(--color-canvas)] p-4 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
            Job metadata
          </p>
          <p className="mt-2 text-xl font-bold tracking-tight text-[var(--color-text)]">
            Product Engineering Intern
          </p>
          <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
            Example Company · Fictional posting
          </p>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <SkillList label="Matched skills" skills={matchedSkills} tone="matched" />
          <SkillList label="Missing skills" skills={missingSkills} tone="missing" />
        </div>

        <dl className="mt-6 grid gap-3 border-t border-[var(--color-divider)] pt-5 text-sm sm:grid-cols-3">
          <div>
            <dt className="font-semibold text-[var(--color-text)]">Output type</dt>
            <dd className="mt-1 text-[var(--color-text-muted)]">Structured skill names</dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--color-text)]">Method</dt>
            <dd className="mt-1 text-[var(--color-text-muted)]">Taxonomy and aliases</dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--color-text)]">Purpose</dt>
            <dd className="mt-1 text-[var(--color-text-muted)]">Planning guidance</dd>
          </div>
        </dl>

        <p className="mt-5 rounded-2xl bg-[var(--color-primary-soft)] px-4 py-3 text-sm leading-relaxed text-[var(--color-primary-hover)]">
          This static preview uses fictional data. It is not a live form, score, or hiring decision.
        </p>
      </div>
    </figure>
  );
}
