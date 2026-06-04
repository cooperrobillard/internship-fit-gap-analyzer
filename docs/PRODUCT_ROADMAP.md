# Product Roadmap

This document describes a practical future path for the **Internship Fit & Skill-Gap Analyzer**: from the current CLI and local data-analysis tool toward a possible **private or unlisted web UI**, potentially linked from a personal site such as [cooperrobillard.com/jobfit](https://cooperrobillard.com/jobfit).

**This is planning documentation only.** The web app, hosting stack, authentication, and AI features described here are **not built yet** and should not be treated as current capabilities.

For what the project does today, see the [README](../README.md), [`VERSION_2_CHECKPOINT.md`](VERSION_2_CHECKPOINT.md), and [`LIMITATIONS.md`](LIMITATIONS.md).

---

## 1. Current project state

As of Version 2 on `main`, the project is a **stable, rule-based Python CLI tool** with tests passing and a clean public repo.

**What exists today:**

- Version 1 MVP: resume + job text files, JSON taxonomy and aliases, skill extraction, gap comparison, markdown/CSV outputs, terminal summary, manual test suite.
- Version 2 additions: optional SQLite (`--database`), optional pandas summary CSVs (`--pandas-summary`), `scripts/inspect_database.py`, expanded tests and docs, privacy-safe sample data vs. Git-ignored private inputs.
- CLI polish: clear user-facing errors for common invalid inputs (missing files, empty jobs folder, bad JSON, invalid database path).

**What does not exist today:**

- Web UI, API server, or deployment configuration
- User accounts or authentication
- OpenAI API or other LLM-based extraction
- Semantic matching, embeddings, or RAG
- Docker, CI deployment pipelines for the app itself
- Production hosting or a live product at cooperrobillard.com/jobfit

The analyzer uses **keyword and alias matching**, not AI understanding of resumes or job descriptions. Optional SQLite and pandas features **store and summarize** results locally; they do not add semantic job-fit judgment.

---

## 2. Long-term product vision

A **personal, private internship-search assistant** that:

- Accepts a resume and multiple job descriptions (paste, upload, or local files).
- Runs the same core gap-analysis logic the CLI uses today.
- Shows recurring skill gaps, per-job breakdowns, and run history over time.
- Stays **private by default**: real resumes and real postings never need to live in a public Git repo.
- Could eventually be reachable as a **small, unlisted tool** linked from a portfolio site (e.g. cooperrobillard.com/jobfit), without becoming a public multi-user SaaS.

The vision is **learning-first and scope-controlled**: a credible portfolio project and a tool I actually use during internship search—not a startup-scale platform.

---

## 3. Guiding principles

1. **Learning before features** — Understand each layer (CLI, data model, tests, then UI) before adding frameworks.
2. **Small branches and reviewable diffs** — One milestone per branch; merge when tests pass and behavior is documented.
3. **Tests stay green** — `python3 run_tests.py` remains the gate before new major work.
4. **Privacy by design** — Public repo holds samples only; real resume and job text stay local and Git-ignored.
5. **Honest portfolio narrative** — Describe rule-based matching accurately; do not imply AI, deployment, or production readiness that is not implemented.
6. **Reuse the CLI core** — Future UI should call the same analysis logic, not fork a second implementation.
7. **Defer expensive complexity** — Authentication, multi-tenant hosting, Docker, and LLM pipelines wait until the CLI/backend story is solid.

---

## 4. Recommended version milestones

### Version 3: CLI / backend polish and UI readiness

**Goal:** Make the existing tool easier to trust and easier to wrap in a future UI—without building the UI yet.

Possible work (pick small slices per branch):

- Refine CLI error messages and input validation where gaps remain.
- Clarify a stable “analysis result” shape (dict/JSON-friendly) returned from one function the UI could call later.
- Light refactor only where it improves readability (no large rewrites).
- Expand sample jobs and taxonomy/aliases for more realistic demos.
- Improve documentation (limitations, test commands, this roadmap).
- Optional: migrate tests to pytest **only if** it clearly helps learning and maintenance.

**Explicitly not Version 3:** Streamlit pages, FastAPI routes, Next.js, deployment, OpenAI API.

### Version 4: Local UI prototype

**Goal:** Prove that the analysis workflow feels useful in a browser **on localhost only**.

Likely direction (to be chosen after Version 3):

- **Streamlit** or a **minimal FastAPI/Flask** app that reads local files or pasted text and displays gaps and recurring summaries.
- Still **no public deployment**, no login, no cloud secrets in the repo.
- Reuse `src/` modules; keep business logic out of UI-only files as much as possible.

Success criteria: I can run the prototype locally, compare several jobs, and trust the output matches CLI behavior for the same inputs.

### Version 5: Private hosted web tool

**Goal:** A **private or unlisted** hosted instance for personal use, optionally linked from cooperrobillard.com/jobfit.

Possible characteristics:

- Hosted on a modest platform (e.g. Streamlit Community, Railway, Render, Fly.io, or static site + API)—**decision deferred until Version 4 teaches what the UI needs**.
- Environment variables for any secrets; no resume/job content committed to Git.
- Access control simple enough for one user (password gate, allowlist, or platform private app)—not full auth product engineering unless truly needed.
- HTTPS and clear privacy notice on the page.

**Explicitly not required for Version 5:** multi-user accounts, billing, RAG, or semantic search.

### Version 6: Optional AI-assisted extraction (maybe never)

**Goal:** Only if rule-based matching becomes a clear bottleneck **and** privacy/cost tradeoffs are acceptable.

Possible future additions (all optional):

- OpenAI API (or similar) for structured skill extraction from unstructured job text.
- Better handling of varied wording—not full “AI understands fit.”
- Still keep rule-based path as fallback and for offline/local use.

This version is **optional** and should not block Versions 3–5. The project remains valuable as a rule-based, explainable tool.

---

## 5. What should happen before hosted UI work

Treat these as **prerequisites**, not suggestions:

| Prerequisite | Why it matters |
|--------------|----------------|
| Stable CLI on `main` with passing tests | Hosted UI will break loudly if core logic is unstable |
| Clear separation: public samples vs. private inputs | Prevents accidental commit of real resume/job data |
| Documented limitations ([`LIMITATIONS.md`](LIMITATIONS.md)) | Sets correct expectations for users (including future-me) |
| Repeatable smoke-test commands | Fast verification after each UI experiment |
| Version 3 “UI readiness” (stable result shape, polished CLI) | Avoids rewriting analysis twice under UI pressure |
| Version 4 local prototype validated | Proves the workflow before paying hosting/complexity costs |
| Written privacy rules for hosted mode | Decide what never leaves the server, what is logged, retention |

**Do not start hosted UI work** until a local prototype answers: “Is this actually useful for my internship search workflow?”

---

## 6. UI / deployment options comparison

All options below are **future choices**, not current stack. None should be built immediately.

| Option | Pros | Cons | Fit for this project |
|--------|------|------|----------------------|
| **CLI-only / local use** | Simplest, private, already works, best for learning | No visual history dashboard, less “portfolio demo” flash | **Current default**; keep improving here first |
| **Local Streamlit prototype** | Fast UI, Python-only, good for solo tools | Easy to mix UI and logic; harder to style; scaling story weak | **Strong candidate for Version 4** |
| **Streamlit deployment** | Quick path to a hosted demo | Public-by-default risks; less control; app sleeps on free tiers | Possible **Version 5** if privacy controls are sufficient |
| **Local FastAPI/Flask app** | Clear API boundary; UI can be swapped later | More boilerplate than Streamlit for a solo learner | Good if I want API + separate frontend practice |
| **Next.js frontend + Python backend** | Professional split stack; great for portfolio sites | Two codebases, deployment glue, more than needed early | **Later**, if cooperrobillard.com needs a custom branded UI |
| **Separate hosted app linked from personal website** | Keeps main site simple; tool can stay unlisted | Extra DNS/path setup; two places to maintain | **Likely Version 5 shape** for cooperrobillard.com/jobfit |

**Not recommended near-term:** full Next.js + auth + Docker + LLM pipeline as the first UI step—that is overbuilding for a learning-first solo project.

---

## 7. Recommended path for this project

A conservative sequence that matches current skill level and repo state:

```text
Now (main)
  → stay CLI-first; use tool for real searches with private --resume / --jobs
Version 3 (small branches)
  → polish, docs, taxonomy/samples, optional pytest, UI-ready result interface
Version 4 (experiment branch)
  → local Streamlit OR minimal FastAPI + simple HTML; localhost only
Version 5 (only if Version 4 is useful)
  → private/unlisted deploy; link from cooperrobillard.com/jobfit; env-based secrets
Version 6 (optional, much later)
  → AI-assisted extraction experiments; never required for portfolio value
```

**Immediate recommendation:** Stay on CLI and documentation through Version 3. Treat any UI framework as a **deliberate experiment branch**, not the next merge to `main`.

---

## 8. Privacy and public repo rules

These rules apply now and in all future versions:

**Safe to commit (public repo):**

- `data/resume/sample_resume.txt`
- `data/sample_jobs/` sample postings
- `data/skills_taxonomy.json`, `data/skill_aliases.json`
- Source code, tests, docs, `requirements.txt`

**Never commit:**

- Real resume files (e.g. `data/resume/resume.txt`)
- Real job descriptions in `data/jobs/`
- Generated outputs under `data/outputs/` (reports, CSVs, `.db` files)
- API keys, `.env` files, deployment secrets

**Hosted UI (future):**

- Assume all pasted/uploaded content is sensitive.
- Do not log full resume text in analytics.
- Prefer processing in memory or short-lived storage with explicit deletion policy.
- Default to **unlisted URL + access gate**, not a public searchable app.

See also [`LIMITATIONS.md`](LIMITATIONS.md) for privacy-related limitations of keyword matching.

---

## 9. Features to avoid for now

Defer these until there is a concrete problem they solve:

| Feature | Why wait |
|---------|----------|
| **Production web app on main** | CLI and tests are not yet wrapped in a stable service layer |
| **User authentication / accounts** | Solo tool does not need multi-user auth complexity |
| **OpenAI API / LLM extraction** | Rule-based path still teachable; adds cost, privacy, and nondeterminism |
| **RAG / embeddings / vector DB** | No semantic layer today; huge scope jump |
| **Docker / Kubernetes** | Unnecessary for local CLI and early prototypes |
| **FastAPI + Next.js full stack** | High coordination cost before local UI proves value |
| **Public multi-tenant SaaS** | Conflicts with privacy-first internship search use case |
| **Automated resume rewriting** | Out of scope; risks misleading portfolio claims |
| **“AI understands job fit” marketing** | Inaccurate for current architecture |

---

## 10. Possible future resume / LinkedIn positioning (honest)

When the project is ready to cite publicly, describe it **accurately**:

**Reasonable claims:**

- Built a Python CLI tool that compares internship job descriptions to a resume using a configurable skills taxonomy and alias matching.
- Identifies per-job skill gaps and recurring gaps across multiple postings; outputs markdown, CSV, and optional SQLite/pandas summaries.
- Wrote tests for core logic, CLI behavior, validation, database output, and inspection scripts.
- Designed repo layout for **privacy**: public samples in Git, real resume/jobs local-only.
- Extended a Version 1 MVP with optional SQLite persistence and pandas summaries (Version 2).

**Avoid claiming (until actually built and deployed):**

- “AI-powered job matching” or “semantic understanding of resumes”
- “Production web application” or “live at cooperrobillard.com/jobfit” (until hosted)
- “Enterprise-ready” or “scalable microservices architecture”
- RAG, LLM extraction, or authentication (unless implemented and documented)

**Possible one-liner (today):**

> Rule-based Python CLI that surfaces recurring internship skill gaps from resume and job-description text, with optional SQLite/pandas outputs and a test-backed, privacy-conscious repo.

Update the one-liner when a local or hosted UI exists—still without overstating AI capabilities unless Version 6 is real.

---

## 11. Near-term next steps

Actionable items for the **docs/product-roadmap** era and immediate follow-ups—**no web app implementation yet**:

1. **Merge or review** this roadmap on branch `docs/product-roadmap` after human read-through.
2. **Keep using the CLI** for real searches with `--resume data/resume/resume.txt --jobs data/jobs` (private, local).
3. **Plan Version 3** as a short list of 1–2 item branches (e.g. more sample jobs, taxonomy tweaks, one small CLI/backend polish item).
4. **Run the usual gate** before any merge: `python3 run_tests.py` and `python3 src/main.py`.
5. **Update README “Planned next steps”** only when a milestone actually ships—avoid duplicating this entire roadmap in README.
6. **Revisit UI choice** after Version 3: compare local Streamlit vs. minimal FastAPI with written pros/cons from real usage.
7. **Register intent for cooperrobillard.com/jobfit** as a future landing path only—no deployment work until Version 4 succeeds locally.

---

## Document maintenance

- **Owner:** project author (learning portfolio).
- **Update when:** a version milestone ships, UI/deployment decision changes, or privacy rules evolve.
- **Related docs:** [`VERSION_2_CHECKPOINT.md`](VERSION_2_CHECKPOINT.md), [`LIMITATIONS.md`](LIMITATIONS.md), [`PORTFOLIO_SUMMARY.md`](PORTFOLIO_SUMMARY.md), [README](../README.md).

*Last aligned with: Version 2 stable CLI on `main`, tests passing, no web stack implemented.*
