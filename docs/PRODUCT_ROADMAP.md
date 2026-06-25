# Product Roadmap

> **Historical roadmap notice (current as of Version 11 only).** This file preserves the early local/CLI/Streamlit roadmap through Version 11. The hosted Next.js/FastAPI/Clerk/Supabase stack now exists, and later project status is tracked elsewhere. For current status, use [`PUBLIC_PRODUCT_ROADMAP.md`](PUBLIC_PRODUCT_ROADMAP.md), the root [`README.md`](../README.md), and [`VERSION_22_CHECKPOINT.md`](VERSION_22_CHECKPOINT.md).

This document is a **historical roadmap through Version 11** for the **Internship Fit & Skill-Gap Analyzer**: from the CLI and local data-analysis tool toward a possible **private or unlisted web UI**, potentially linked from a personal site such as [cooperrobillard.com/jobfit](https://cooperrobillard.com/jobfit).

The hosted **Next.js / FastAPI / Clerk / Supabase** stack now exists. Sections below that describe hosting, authentication, or deployment as future work are **retained historical text** from the Version 11 planning era and should not be read as current status.

**AI functionality remains unbuilt** and would require a separate product and privacy design decision before implementation.

For current project status, see [`PUBLIC_PRODUCT_ROADMAP.md`](PUBLIC_PRODUCT_ROADMAP.md), the root [`README.md`](../README.md), and [`VERSION_22_CHECKPOINT.md`](VERSION_22_CHECKPOINT.md).

---

## 1. Current project state

As of **Version 11**, the project is a **stable, rule-based Python CLI tool** with a **local Streamlit UI prototype**, portable pasted/uploaded text workflows, optional SQLite persistence in both CLI and UI, optional saved-analysis **source URL and notes** metadata, saved-analysis comparison, searchable saved-history management, guarded single-result deletion, in-memory current-analysis downloads, saved-data CSV exports and SQLite backup download, README quickstart clarity, and a deployment-readiness checklist ([`DEPLOYMENT_READINESS.md`](DEPLOYMENT_READINESS.md)). The test gate remains `python3 run_tests.py` on a clean public repo.

**What exists today:**

- Version 1 MVP: resume + job text files, JSON taxonomy and aliases, skill extraction, gap comparison, markdown/CSV outputs, terminal summary, manual test suite.
- Version 2 additions: optional SQLite (`--database`), optional pandas summary CSVs (`--pandas-summary`), `scripts/inspect_database.py`, expanded tests and docs, privacy-safe sample data vs. Git-ignored private inputs.
- Version 3 additions: reusable `src/analysis_runner.py`, single-job analysis, `--job-file`, structured results, CLI/backend polish.
- Version 4 additions: local Streamlit UI (`streamlit_app.py`) for sample job and pasted job analysis, resume source selector, polished results display.
- Version 5 additions: optional SQLite save from the UI, read-only **Saved Analysis History** summary panel, read-only **Recent Saved Runs** table (localhost only).
- Version 6 additions: read-only **Compare Saved Analyses** (two saved job results, missing-skill comparison), read-only **Saved Gap Priority Summary** across all saved analyses (localhost only).
- Version 7 additions: improved saved-result labels, newest-first sorting across all saves, **Search saved analyses**, guarded **Delete Saved Analysis** (one record at a time, localhost only).
- Version 8 additions: auto-discovering `run_tests.py` (every top-level `tests/test_*.py` file), documented script-style test architecture ([`TESTING.md`](TESTING.md)), Streamlit `width="stretch"` maintenance (replacing deprecated `use_container_width`).
- Version 9 additions: portable resume input (pasted and uploaded UTF-8 `.txt`), optional job title/company metadata labels, uploaded job-description input, simplified Streamlit layout and analysis input flow, current-analysis Markdown/CSV downloads, saved-analysis CSV exports and SQLite backup download (localhost only).
- Version 10 additions: optional saved-analysis **source URL** and **notes** on `job_results`, idempotent SQLite migration, Streamlit metadata inputs and save flow, search/display/CSV support (localhost only).
- Version 11 additions: README quickstart and portfolio-ready overview, safe demo workflow, privacy/limitations summary, [`DEPLOYMENT_READINESS.md`](DEPLOYMENT_READINESS.md) checklist (documentation only).

**What does not exist today:**

- Hosted web UI, API server, or deployment configuration
- User accounts or authentication (including Clerk)
- OpenAI API or other LLM-based extraction
- Semantic matching, embeddings, or RAG
- Docker, CI deployment pipelines for the app itself
- Production hosting or a live product at cooperrobillard.com/jobfit
- Bulk delete, undo/archive, saved-record editing, tags/favorites, fit-score ranking, or restore/import from backup in the UI
- Hosted deployment, authentication, or cloud database
- Matched-skill list comparison from saved SQLite data (only counts are stored)

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

### Version 4: Local UI prototype — **complete**

**Goal:** Prove that the analysis workflow feels useful in a browser **on localhost only**.

Detailed plan: [`LOCAL_UI_PLAN.md`](LOCAL_UI_PLAN.md). Checkpoint: [`VERSION_4_CHECKPOINT.md`](VERSION_4_CHECKPOINT.md).

Delivered: Streamlit app with sample job, pasted job, resume selector, and polished results display. No deployment.

### Version 5: Local UI persistence — **complete**

**Goal:** Let the local UI **optionally save** analysis runs to SQLite and show **small read-only saved-history views**.

Checkpoint: [`VERSION_5_CHECKPOINT.md`](VERSION_5_CHECKPOINT.md).

Delivered:

- optional SQLite save checkbox (default path `data/outputs/analysis_results.db`),
- Saved Analysis History summary panel,
- Recent Saved Runs table (up to 10 rows),
- backend read/save helpers in `src/` (no duplicated SQL in the UI).

**Explicitly not Version 5:** hosted deployment, auth, full history browser, run comparison, charts, semantic matching.

### Version 6: Saved-run comparison and decision support — **complete**

**Goal:** Use the local SQLite database to support **read-only comparison** and **simple decision-support views** without fit scoring, job ranking, or semantic matching.

Checkpoint: [`VERSION_6_CHECKPOINT.md`](VERSION_6_CHECKPOINT.md).

Delivered:

- **Compare Saved Analyses** — two select boxes, stable `job_result_id` labels, shared/unique missing skills,
- **Saved Gap Priority Summary** — top recurring missing skills across all saved job results (up to 10 rows),
- database read helpers in `src/database.py` and display builders in `streamlit_app.py`.

**Explicitly not Version 6:** fit scores, weighted rankings, matched-skill list comparison from SQLite, charts, deployment, auth, more than two-way comparison, edit/delete controls.

### Version 7: Local saved-result organization — **complete**

**Goal:** Improve how saved analyses are browsed, labeled, sorted, searched, and safely cleaned up **locally**.

Plan: [`VERSION_7_PLAN.md`](VERSION_7_PLAN.md). Checkpoint: [`VERSION_7_CHECKPOINT.md`](VERSION_7_CHECKPOINT.md).

Delivered:

- improved saved-result labels (job name, timestamp, run/result IDs, gap/matched counts),
- newest-first sorting across **all** saved job results,
- case-insensitive **Search saved analyses** for browsing and pickers,
- guarded **Delete Saved Analysis** (one record, explicit confirmation, related skill-gap cleanup),
- safe Streamlit confirmation reset after deletion.

**Explicitly not Version 7:** bulk delete, undo, editing, tags, advanced filters, metadata schema changes, hosted deployment, auth, fit scores.

### Version 8: Testing and maintenance reliability — **complete**

**Goal:** Make the test gate honest and reduce known maintenance debt before new product features.

Plan: [`VERSION_8_PLAN.md`](VERSION_8_PLAN.md). Checkpoint: [`VERSION_8_CHECKPOINT.md`](VERSION_8_CHECKPOINT.md). Testing guide: [`TESTING.md`](TESTING.md).

Delivered:

- `run_tests.py` auto-discovers every top-level `tests/test_*.py` file (alphabetical, subprocess per file, fail-fast),
- documented decision to **retain script-style tests**; `python3 run_tests.py` is the canonical full-suite command,
- Streamlit `width="stretch"` replacing deprecated `use_container_width` on dataframe calls,
- regression test guarding against deprecated Streamlit width API in `streamlit_app.py`.

**Explicitly not Version 8:** pytest adoption, unittest migration, deployment, auth, new product features, fit scores, semantic matching.

### Version 9: Local UI usability and portability — **complete**

**Goal:** Make the local Streamlit app more usable, portable, and closer to a practical private or publishable tool.

Checkpoint: [`VERSION_9_CHECKPOINT.md`](VERSION_9_CHECKPOINT.md).

Delivered:

- **portable resume input** — pasted and uploaded UTF-8 `.txt` resume (in memory only),
- **optional job title/company metadata** — clearer saved labels without schema change,
- **uploaded job-description input** — UTF-8 `.txt` upload alongside paste,
- **UI layout cleanup** — tabbed Analyze / Results / Saved analyses / Data management flow,
- **simplified analysis input flow** — sample, paste, and upload workflows,
- **current-analysis downloads** — in-memory Markdown report and skill-gap CSV,
- **saved-data exports and backup** — saved analyses summary CSV, saved skill gaps CSV, SQLite backup download.

**Explicitly not Version 9:** semantic matching, fit scores, deployment, auth, cloud persistence, source URL/notes/tags, PDF/DOCX parsing, restore/import from backup, SQLite schema migration.

### Version 10: Saved-analysis metadata — **complete**

**Goal:** Store optional **source URL** and **notes** per saved job result locally.

Plan: [`VERSION_10_PLAN.md`](VERSION_10_PLAN.md). Checkpoint: [`VERSION_10_CHECKPOINT.md`](VERSION_10_CHECKPOINT.md).

Delivered:

- nullable `source_url` and `notes` on `job_results` with idempotent migration,
- Streamlit optional inputs and save-flow wiring,
- saved-history table, detail view, search, and CSV export support.

**Explicitly not Version 10:** statuses, tags, application tracker, post-save editing, restore/import, deployment, auth, semantic matching.

### Version 11: Publish-readiness and deployment-readiness docs — **complete**

**Goal:** Make the project easier to understand, run, demo, and evaluate before any hosted work.

Delivered:

- README quickstart, capabilities, privacy notes, limitations, and future direction,
- [`DEPLOYMENT_READINESS.md`](DEPLOYMENT_READINESS.md) practical checklist (no deployment implemented).

**Explicitly not Version 11:** deployment, auth, cloud database, Docker, FastAPI, app rewrites.

### Future versions (not committed)

The project is moving from **local demo polish** toward evaluating a **larger hosted web-app path** with **accounts**, **Clerk-style authentication**, and a **cloud database**. That is the next major direction—not more Streamlit feature work by default.

The items below are **candidates for future steps**. Scope is not fully committed until Version 12 Step 0.

| Candidate area | Notes |
|----------------|--------|
| **Version 12 Step 0: hosted architecture decision** | Document/prototype plan for account-based version; auth + DB + UI split (see [`DEPLOYMENT_READINESS.md`](DEPLOYMENT_READINESS.md)) |
| **Hosted account-based web app** | Separate frontend/app layer, auth layer, cloud DB, analysis service—after architecture decision |
| **Restore/import planning** | Research only; Version 9 shipped backup download, not import |
| **Richer saved-analysis organization** | Tags, filters, favorites—only with clear scope |
| **Test-framework migration** | unittest or pytest **only if** triggers in [`TESTING.md`](TESTING.md) are met |
| **Streamlit / UI maintenance** | Ongoing deprecation and layout fixes |
| **Deployment-readiness research** | [`DEPLOYMENT_READINESS.md`](DEPLOYMENT_READINESS.md) shipped in Version 11; implementation still not started |
| **Authentication / cloud architecture** | **Next major direction** after Version 11—Clerk-style auth + cloud DB, not bolted onto Streamlit |
| **Private hosted UI** | Unlisted or access-gated hosted instance—**only after** Version 12 architecture decision |
| **Semantic matching** | Embeddings/RAG/LLM—**much later**; rule-based path remains valuable |
| **Optional AI-assisted extraction** | LLM-based skill extraction—**maybe never**; rule-based path remains fallback |

**Explicitly not committed:** production multi-user SaaS, Clerk/auth by default, cloud database, fit-score ranking, automatic restore/import, or automatic implementation of any row above.

Optional AI-assisted extraction (e.g. OpenAI API for structured skill extraction) remains a **maybe-never** candidate: only if rule-based matching becomes a clear bottleneck and privacy/cost tradeoffs are acceptable. The rule-based path would remain as fallback.

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
| Version 5 local persistence validated | Optional save + read-only history without overbuilding a dashboard |
| Version 6 comparison validated | Two-way missing-skill comparison + gap priority summary feel useful locally |
| Version 7 organization validated | Labels, search, and guarded deletion work during real local use |
| Version 8 testing reliability validated | `run_tests.py` runs full suite; test architecture documented |
| Version 9 usability/portability validated | Pasted/uploaded workflows, downloads, exports feel useful locally |
| Version 10 metadata validated | Optional source URL/notes save, search, and export work locally |
| Written privacy rules for hosted mode | Decide what never leaves the server, what is logged, retention |

**Do not start hosted UI work** until a local prototype answers: “Is this actually useful for my internship search workflow?”

---

## 6. UI / deployment options comparison

All options below are **future choices**, not current stack. None should be built immediately.

| Option | Pros | Cons | Fit for this project |
|--------|------|------|----------------------|
| **CLI-only / local use** | Simplest, private, already works, best for learning | No visual history dashboard, less “portfolio demo” flash | **Current default**; keep improving here first |
| **Local Streamlit prototype** | Fast UI, Python-only, good for solo tools | Easy to mix UI and logic; harder to style; scaling story weak | **Implemented in Version 4** |
| **Streamlit deployment** | Quick path to a hosted demo | Public-by-default risks; less control; app sleeps on free tiers | Possible **future hosted milestone** if privacy controls are sufficient |
| **Local FastAPI/Flask app** | Clear API boundary; UI can be swapped later | More boilerplate than Streamlit for a solo learner | Good if I want API + separate frontend practice |
| **Next.js frontend + Python backend** | Professional split stack; great for portfolio sites | Two codebases, deployment glue, more than needed early | **Later**, if cooperrobillard.com needs a custom branded UI |
| **Separate hosted app linked from personal website** | Keeps main site simple; tool can stay unlisted | Extra DNS/path setup; two places to maintain | **Likely future hosted shape** for cooperrobillard.com/jobfit |

**Not recommended near-term:** full Next.js + auth + Docker + LLM pipeline as the first UI step—that is overbuilding for a learning-first solo project.

---

## 7. Recommended path for this project

A conservative sequence that matches current skill level and repo state:

```text
Now (main)
  → stay CLI-first; use tool for real searches with private --resume / --jobs
Version 3 (small branches)
  → polish, docs, taxonomy/samples, optional pytest, UI-ready result interface
Version 4 (complete)
  → local Streamlit; localhost only
Version 5 (complete)
  → optional UI SQLite save + read-only saved-history views
Version 6 (complete)
  → saved-analysis comparison + saved gap priority summary
Version 7 (complete)
  → labels, sorting, search, guarded single-result deletion
Version 8 (complete)
  → full test-runner coverage, TESTING.md, Streamlit width maintenance
Version 9 (complete)
  → portable inputs, UI polish, current downloads, saved exports/backup
Version 10 (complete)
  → optional source URL/notes metadata on saved job results
Version 11 (complete)
  → README quickstart, deployment-readiness checklist
Next (not committed)
  → Version 12 Step 0: hosted architecture decision / prototype plan for account-based version
Future (optional, much later)
  → hosted web app with auth + cloud DB, semantic matching; never required for portfolio value
```

**Immediate recommendation:** Keep `python3 run_tests.py` green; use the CLI and local Streamlit UI during real internship search. **Next major direction:** evaluate a hosted account-based web app (Clerk-style auth, cloud database, standalone UI)—starting with **Version 12 Step 0** architecture planning, not blind deployment of the current Streamlit app. See [`DEPLOYMENT_READINESS.md`](DEPLOYMENT_READINESS.md).

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
- Built a local Streamlit UI with optional SQLite save, searchable saved-history views, saved-analysis comparison, a recurring gap priority summary, and guarded single-result deletion (Versions 4–7).
- Improved test reliability with auto-discovering `run_tests.py` and documented script-style test architecture (Version 8).
- Polished the local Streamlit UI with portable pasted/uploaded text workflows, in-memory downloads, and saved-data exports/backup (Version 9).
- Added optional saved-analysis source URL and notes metadata with SQLite migration (Version 10).

**Avoid claiming (until actually built and deployed):**

- “AI-powered job matching” or “semantic understanding of resumes”
- “Production web application” or “live at cooperrobillard.com/jobfit” (until hosted)
- “Enterprise-ready” or “scalable microservices architecture”
- RAG, LLM extraction, or authentication (unless implemented and documented)

**Possible one-liner (today):**

> Rule-based Python CLI and local Streamlit UI that surface recurring internship skill gaps from resume and job-description text, with optional SQLite/pandas outputs, portable pasted/uploaded text workflows, searchable saved-history views, two-way saved-analysis comparison, a gap priority summary, guarded local deletion, and in-memory downloads/exports—test-backed and privacy-conscious, not deployed.

Update the one-liner when a hosted UI exists—still without overstating AI capabilities unless an AI milestone is real.

---

## 11. Near-term next steps

Actionable items after **Version 11 complete**—**no automatic next implementation**:

1. **Run the usual gate** before any merge: `python3 run_tests.py` and `python3 src/main.py`.
2. **Keep using the CLI and local Streamlit UI** for real internship search with private resume/job inputs, downloads, exports, and optional metadata.
3. **Start Version 12 Step 0** — hosted architecture decision document / prototype plan for an account-based version (auth, cloud DB, UI split). See [`DEPLOYMENT_READINESS.md`](DEPLOYMENT_READINESS.md) section 10.
4. **Do not bolt auth onto Streamlit + local SQLite** without that architecture step.
5. **Register intent for cooperrobillard.com/jobfit** as a future landing path only—no deployment until Version 12 planning is done.

---

## Document maintenance

- **Owner:** project author (learning portfolio).
- **Update when:** a version milestone ships, UI/deployment decision changes, or privacy rules evolve.
- **Related docs:** [`VERSION_2_CHECKPOINT.md`](VERSION_2_CHECKPOINT.md), [`LIMITATIONS.md`](LIMITATIONS.md), [`PORTFOLIO_SUMMARY.md`](PORTFOLIO_SUMMARY.md), [README](../README.md).

*Last aligned with: Version 11 complete (README + deployment-readiness docs); Version 12 Step 0 hosted architecture decision next; no hosted deployment yet.*