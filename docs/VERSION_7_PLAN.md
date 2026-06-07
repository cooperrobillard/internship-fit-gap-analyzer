# Version 7 Plan

This document plans **Version 7** for the Internship Fit & Skill-Gap Analyzer: **saved-result organization and local data management** in the existing localhost Streamlit UI and local SQLite database.

**Status:** Planning only. **No Version 7 code is implemented yet.**

For what exists today, see [`VERSION_6_CHECKPOINT.md`](VERSION_6_CHECKPOINT.md). For long-term milestones (hosted UI, optional AI), see [`PRODUCT_ROADMAP.md`](PRODUCT_ROADMAP.md). For limitations, see [`LIMITATIONS.md`](LIMITATIONS.md).

---

## Version 7 theme

Version 7 will focus on **saved-result organization** and **local data management**.

The goal is to make the local saved-history system **easier to browse, distinguish, and maintain** after Version 6 added comparison and gap-priority views. Version 7 stays **localhost-only**, **read-first**, and **privacy-conscious**.

Version 7 does **not** try to deploy the app, add authentication, or turn the tool into a job-application tracker.

---

## Why this is the right next step

Versions 4–6 proved that the local UI can analyze jobs, optionally save runs to SQLite, and support small decision-support views. As real internship search continues, saved records can accumulate. Without better organization, it becomes harder to:

* find the right saved result in comparison pickers,
* tell similar job names apart,
* review more than the latest 10 recent rows,
* keep a local database useful without risky cleanup.

**Saved-data organization should come before deployment or authentication** because:

1. **Local workflow first** — If browsing and labeling saved results is awkward on localhost, a hosted app would repeat the same problems with more complexity.
2. **Privacy stays simple** — Organization features can work on the existing local `.db` file without cloud storage, accounts, or multi-user isolation.
3. **Small, reviewable steps** — Labeling, sorting, and filtering fit the project’s branch-and-test habit better than infrastructure work.
4. **Honest scope** — The project is still a rule-based learning portfolio tool, not a production SaaS. Version 7 improves **usability of what already exists**.

Deployment, custom domains, Clerk, and cloud databases remain **future architecture decisions**, not Version 7 deliverables.

---

## Current foundation from Version 6

Version 7 builds on completed local capabilities:

| Capability | What exists today |
|------------|-------------------|
| Local Streamlit UI | Sample job, pasted job, resume source selector (`streamlit_app.py`) |
| Optional SQLite saving | Checkbox → `data/outputs/analysis_results.db` |
| Saved Analysis History | Run/job/gap counts; top recurring gaps from **latest run** |
| Saved run details | Per-row fields in **Recent Saved Runs** (run ID, timestamp, job name, matched/missing counts) |
| Saved analysis comparison | **Compare Saved Analyses** — two pickers, shared/unique **missing** skills |
| Saved gap priority summary | **Saved Gap Priority Summary** — recurring missing skills across **all** saves (up to 10 rows) |

**SQLite schema today (no change planned for Step 1):**

* `analysis_runs` — run metadata and timestamp
* `job_results` — `id`, `run_id`, `job_filename`, matched/missing **counts**
* `skill_gaps` — individual **missing** skills per run and job name

Comparison pickers already label saved results with job name, run ID, timestamp, and result # (`job_results.id`). **Recent Saved Runs** shows up to **10** rows, newest first. Individual matched skill names are **not** stored in SQLite.

---

## Problems Version 7 should solve

Practical problems a solo user may hit during internship search:

1. **Saved jobs become hard to distinguish** — Long labels help, but many rows look similar at a glance.
2. **Duplicate job names appear** — The same filename or pasted-job label can be saved in multiple runs; users must rely on run ID and timestamp.
3. **Many saved records are hard to browse** — Recent Saved Runs caps at 10; comparison pickers list all results but without search or sort controls.
4. **Limited filtering and search** — No way to narrow by job name substring, date range, or missing-skill count.
5. **Sections feel scattered** — History, recent runs, comparison, and priority summary are separate blocks without a unified “saved data” story.
6. **Local cleanup may eventually be needed** — Test runs and duplicates can clutter a private `.db`; there is no safe delete path today.
7. **Empty states could be clearer** — Some messages overlap; a user with one saved result sees different guidance in comparison vs. history sections.

Version 7 should address these **incrementally**, not all at once.

---

## Candidate Version 7 features

### Must-have

Conservative features that should probably happen first:

* **Clearer saved-result labels** — More scannable display strings in Recent Saved Runs and comparison pickers (without requiring schema changes in Step 1).
* **Sorting saved results** — Sort by saved date (default), job name, or missing-skill count in at least one saved-history view.
* **Stronger tests** — Focused tests for new label/sort/filter helpers and any new database read helpers.
* **Better empty states** — Consistent, beginner-friendly messages when the database is missing, empty, or has only one saved result.
* **Privacy discipline** — Document and verify that `.db` files and private inputs stay Git-ignored.

### Nice-to-have

Useful but optional; pick one slice per branch:

* **Search or text filter** — Filter saved results by job name substring.
* **Browse more than 10 recent rows** — Pagination or “show all” for saved job results (read-only).
* **Lightweight metadata** — Optional company or role title notes **only if** a deliberate, minimal schema or UI-only approach is chosen and tested.
* **Unified saved-data section layout** — Group history, recent runs, comparison, and priority summary under clearer headings or tabs (UI-only).
* **Safe local cleanup** — Delete one saved job result or clear the database with explicit confirmation (local only, no undo cloud).
* **Resume path in labels** — Show which resume file was used for a run (already in `analysis_runs.resume_path`) when it helps distinguish saves.

### Not now

Features that should **stay out of Version 7**:

| Out of scope | Why |
|--------------|-----|
| Deployment, custom domain, `cooperrobillard.com/jobfit` | Infrastructure milestone; local UX not finished |
| Authentication, Clerk, user accounts | Solo local tool does not need multi-user auth |
| Cloud database, multi-user data separation | Conflicts with privacy-first local model |
| FastAPI, Flask, Next.js, Docker | New stacks before local organization is solid |
| OpenAI API, RAG, semantic matching | Does not solve browse/label problems |
| Fit scores, weighted scoring, automatic job ranking | Decision support stays descriptive |
| Full job application tracker | Different product scope |
| Resume tailoring | Out of scope |
| Charts and analytics dashboards | Not required for organization |
| Major schema redesign | Avoid unless a small metadata addition is explicitly planned |
| Matched-skill list storage | Separate decision; not required for organization |

---

## Recommended implementation sequence

Each step should fit **one branch** and end with passing tests and updated docs.

### Step 1 — Improve saved-result labels and sorting

**Branch theme:** `ui/saved-result-labels-sorting` (example)

* Improve display labels using existing fields (`job_filename`, `run_timestamp`, `run_id`, `job_result_id`, counts).
* Add user-controlled or sensible-default **sort order** in Recent Saved Runs and/or comparison option lists.
* Prefer **no schema migration**.
* Add pure helper tests and Streamlit display-builder tests.

### Step 2 — Add saved-result filtering or search

* Text filter on job name (and maybe result # or run ID).
* Preserve stable underlying IDs for comparison pickers.
* Friendly message when filter returns no rows.

### Step 3 — Optionally add lightweight saved-result metadata

* **Only if** a minimal approach is agreed (e.g. optional note column with a small, tested migration, or UI-only notes stored separately).
* Company/title fields are **optional** and should not block Steps 1–2.
* Document privacy implications if new fields can hold employer names.

### Step 4 — Optionally add safe local cleanup controls

* Explicit confirmation before delete.
* Delete scoped to one `job_result` row and related `skill_gaps`, or full local database reset.
* Never silent auto-delete.
* Tests for database helper behavior with temp files.

### Step 5 — Document Version 7

* Create `docs/VERSION_7_CHECKPOINT.md` when work ships.
* Update README and roadmap only as needed.

**Do not combine all steps in one large branch.**

---

## Testing plan

Run from the project root before merging any Version 7 branch.

### Automated

```bash
python3 run_tests.py
```

Note: `python3 -m unittest discover -s tests -p "test_*.py"` may report **0 tests** because most test files use plain functions. Prefer `run_tests.py` or direct `python3 tests/test_*.py` runs.

Add focused tests for:

* label formatting and sort order,
* filter logic (including empty filter results),
* any new database read helpers,
* cleanup helpers (if implemented), using temporary databases.

### CLI smoke tests (must still pass)

```bash
python3 src/main.py
python3 src/main.py --job-file data/sample_jobs/sample_ai_engineering_internship.txt
python3 src/main.py --database data/outputs/analysis_results.db
python3 scripts/inspect_database.py data/outputs/analysis_results.db
```

### Manual Streamlit checks

```bash
python3 -m streamlit run streamlit_app.py
```

Manual checklist:

* save at least two runs with the checkbox enabled,
* confirm labels are easier to scan,
* confirm sort/filter behaves predictably,
* confirm comparison and gap priority sections still work,
* confirm empty states do not crash the app.

### Git privacy checks

* Confirm `data/outputs/analysis_results.db` is ignored (`git check-ignore -v data/outputs/analysis_results.db`).
* Confirm `git status` does not list private resume, `data/jobs/`, or generated outputs before commit.

---

## Privacy and repo safety

Version 7 must preserve existing privacy rules:

| Keep local / Git-ignored | Safe in public Git |
|--------------------------|-------------------|
| `data/resume/resume.txt` | `data/resume/sample_resume.txt` |
| `data/jobs/` | `data/sample_jobs/` |
| `data/outputs/` (reports, CSVs, `.db`) | taxonomy and alias JSON |
| pasted job text in browser sessions | source, tests, docs |

**Discipline:**

* Generated SQLite databases are **local outputs** — do not commit them.
* Organization features must not upload saved data anywhere.
* If metadata fields are added, treat them as potentially sensitive (employer names, role titles).
* Cleanup features operate on **local files only** with clear user confirmation.

---

## Future hosted-product note

Deployment, authentication (including Clerk), cloud databases, and multi-user data separation are **future architecture decisions**.

They should be reconsidered only after:

1. local saved-data browsing feels reliable during real internship search, and
2. privacy rules for hosted mode are written down (what is stored, logged, and deleted).

Version 7 strengthens the **local** workflow. It does not commit the project to a specific hosting stack, domain, or auth provider.

See [`PRODUCT_ROADMAP.md`](PRODUCT_ROADMAP.md) for Version 8 (hosted) and Version 9 (optional AI) as **long-term ideas**, not immediate work.

---

## Proposed first Version 7 implementation task

**Version 7 Step 1: improve saved-result labels and sorting in the local UI**

**Why first:**

* Uses data already in SQLite (`job_filename`, `run_timestamp`, `run_id`, `job_result_id`, `matched_skills_count`, `missing_skills_count`, `resume_path` on the parent run).
* Avoids schema migrations in the first step.
* Directly helps comparison pickers and Recent Saved Runs—the views users touch most when saved data grows.
* Fits one small, reviewable branch with testable pure helpers.

**Step 1 should deliver:**

* More scannable saved-result labels (consistent format across Recent Saved Runs and Compare Saved Analyses).
* At least one sort option (e.g. newest first, oldest first, job name A–Z, missing-skill count high–low).
* Tests for label and sort helpers.
* No change to CLI behavior, save workflow, or comparison logic beyond clearer ordering/labels.

**Step 1 should not deliver:**

* Delete buttons, cloud sync, auth, deployment, or new database tables.

---

## Document maintenance

* **Owner:** project author (learning portfolio).
* **Update when:** a Version 7 step ships or scope changes.
* **Related docs:** [`VERSION_6_CHECKPOINT.md`](VERSION_6_CHECKPOINT.md), [`PRODUCT_ROADMAP.md`](PRODUCT_ROADMAP.md), [README](../README.md).

*Version 7 plan — planning only; aligned with local saved-history features through Version 6.*
