# Version 3 Checkpoint

This document records what **Version 3** accomplished and why it matters **before** starting a local UI (Version 4).

For usage commands, see the [README](../README.md). For limitations, see [`LIMITATIONS.md`](LIMITATIONS.md). For the Version 4 UI plan, see [`LOCAL_UI_PLAN.md`](LOCAL_UI_PLAN.md). For longer-term milestones, see [`PRODUCT_ROADMAP.md`](PRODUCT_ROADMAP.md).

**Status:** Version 3 is complete as a **CLI and backend** milestone. There is **no web UI**, **no deployed app**, and **no AI-based matching**.

---

## 1. Version 3 purpose

Version 3 extended Version 2 by making the analyzer **easier to run reliably from the terminal** and **easier to call from Python** for a future local UI.

Goals were:

* polish CLI error handling,
* centralize the analysis workflow in reusable functions,
* support one job at a time (file or pasted text in backend),
* return predictable structured results,
* document behavior honestly.

Version 3 deliberately **did not** add Streamlit, FastAPI, hosting, authentication, OpenAI API, Docker, or semantic matching.

---

## 2. What was added in Version 3

### CLI and error handling

* Clear user-facing messages for common mistakes (missing files, empty jobs folder, invalid JSON, invalid database path).
* Nonzero exit codes for expected input errors without full tracebacks.
* `--job-file` to analyze one job description file against the resume.
* Rule that `--jobs` and `--job-file` cannot be used together (explicit error).

### Reusable backend (`src/analysis_runner.py`)

* `run_analysis()` — folder of job `.txt` files, full outputs.
* `run_analysis_job_file()` — single job file, same markdown/CSV/optional SQLite/pandas outputs as folder mode.
* `run_single_job_analysis()` — one resume + one job from paths or **raw text** (no file writes; for previews and future paste UI).
* `analyze_job_text()` — text-only comparison (no folder reading).
* Shared output writing and validation helpers.

### Structured results

All main runners return a dictionary that includes:

* `jobs_analyzed_count`, `analysis_mode` (`folder`, `single_file`, `single_text`),
* `jobs` — UI-friendly list with `matched_skills`, `missing_skills`, and counts per job,
* `job_results` — raw per-job data used by report/CSV/database writers,
* `resume_skills`, `recurring_gaps`,
* `output_paths` / `output_files` (when files are written).

### Tests and documentation

* CLI tests for `--job-file`, conflicts, and error cases.
* Direct tests for analysis runner and single-job analysis (runnable outside `run_tests.py`).
* README and this checkpoint updated for Version 3 commands.

---

## 3. Why CLI/backend polish matters

The CLI is still the **primary interface** during internship search and development.

Polish matters because:

* real workflows use private files and easy-to-mistype paths,
* failures should be understandable without reading Python tracebacks,
* every UI feature will eventually call the same backend—if the CLI path is shaky, the UI path will be too.

Version 3 made the “happy path” and the “user mistake path” both predictable before adding UI complexity.

---

## 4. Why the reusable analysis runner matters

Previously, the full workflow lived mainly in `src/main.py` with terminal printing mixed in.

The analysis runner:

* is the **single place** for validate → analyze → write outputs,
* returns data instead of only printing it,
* lets `main.py` stay thin: parse args → call runner → print summary.

A future UI should import `run_analysis`, `run_analysis_job_file`, or `run_single_job_analysis` rather than copying skill-matching logic into UI files.

---

## 5. Why single-job analysis and `--job-file` matter

Most real searches start with **one posting**—a saved file or text to paste—not a folder of ten `.txt` files.

Backend single-job support means:

* `run_single_job_analysis(resume_text=..., job_text=...)` for paste workflows,
* `run_analysis_job_file(...)` for one file with full report outputs,
* `--job-file` on the CLI for the same one-file workflow from the terminal.

Folder mode (`--jobs` / default `data/sample_jobs/`) remains the way to compare **many** jobs and find **recurring** gaps across postings.

---

## 6. Why structured results matter for future UI work

A local UI needs simple Python data to render tables and lists—not ad hoc parsing of markdown reports.

The `jobs` list and `recurring_gaps` list are meant for display:

* matched skills and missing skills per job (by category),
* recurring gaps with counts,
* optional `output_files` strings for “reports saved here.”

Raw `job_results` remain for compatibility with existing writers and tests. New UI code should prefer the documented fields in `analysis_runner.py` module comments.

---

## 7. Current commands to verify Version 3 behavior

Run from the project root.

### Automated tests

```bash
python3 run_tests.py
```

Optional backend-focused tests:

```bash
python3 tests/test_analysis_runner.py
python3 tests/test_single_job_analysis.py
```

### Core CLI workflows

```bash
# Default public sample data
python3 src/main.py

# Private local inputs (Git-ignored paths)
python3 src/main.py --resume data/resume/resume.txt --jobs data/jobs

# Single job file
python3 src/main.py --job-file data/sample_jobs/sample_ai_engineering_internship.txt

# SQLite
python3 src/main.py --database data/outputs/analysis_results.db

# pandas summaries
python3 src/main.py --pandas-summary

# Combined
python3 src/main.py --database data/outputs/analysis_results.db --pandas-summary

# Inspect database after a DB run
python3 scripts/inspect_database.py data/outputs/analysis_results.db
```

### Expected failure (conflict)

```bash
python3 src/main.py --jobs data/sample_jobs --job-file data/sample_jobs/sample_ai_engineering_internship.txt
```

Should print a clear error and exit nonzero.

---

## 8. What Version 3 still does not do

Version 3 **does not** provide:

* a web UI or browser-based workflow,
* hosted deployment or cooperrobillard.com/jobfit integration,
* user accounts or authentication,
* OpenAI API or LLM extraction,
* semantic matching, embeddings, or RAG,
* Docker or production infrastructure,
* automatic “job fit score” or required-vs-preferred skill judgment.

The analyzer is still **rule-based**: it matches taxonomy keywords and aliases in resume and job text. It can miss skills and can match keywords without strong evidence.

Optional SQLite and pandas features **store and summarize** results locally; they do not add understanding of meaning.

See [`LIMITATIONS.md`](LIMITATIONS.md) for details.

---

## 9. Recommended next milestone: Version 4 local UI prototype

**Next step:** Plan and build a **localhost-only** UI experiment—see [`LOCAL_UI_PLAN.md`](LOCAL_UI_PLAN.md).

Likely first path: a small **Streamlit** app that calls existing backend functions and displays structured results. No hosting, no auth, no new AI pipeline in v1 of the UI.

Success for Version 4:

* paste or select one job description,
* select or use a resume input,
* run analysis and see matched skills, missing skills, and recurring gaps,
* optionally note where output files were written,
* behavior matches CLI/backend for the same inputs on the same machine.

Defer until after Version 4: public deployment, FastAPI/Next.js split stack, OpenAI API, Docker, multi-user auth.

---

## Privacy reminder

| Safe in public Git | Keep local / Git-ignored |
|--------------------|---------------------------|
| `data/resume/sample_resume.txt` | `data/resume/resume.txt` |
| `data/sample_jobs/` | `data/jobs/` |
| taxonomy and alias JSON | `data/outputs/` reports, CSVs, `.db` files |

Do not commit real resumes, real job postings, generated outputs, or database files.

---

*Version 3 checkpoint — documentation only; aligned with rule-based CLI on `main` with UI-readiness backend.*
