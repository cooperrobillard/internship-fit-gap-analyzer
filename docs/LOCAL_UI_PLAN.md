# Local UI Plan (Version 4)

This document planned and now records the **local Streamlit UI prototype** for the Internship Fit & Skill-Gap Analyzer.

**Status:** Version 4 local UI work and **Version 5 local persistence** are **implemented** in `streamlit_app.py`. This is a **localhost-only** prototype—not a hosted web app.

For what was delivered, see [`VERSION_4_CHECKPOINT.md`](VERSION_4_CHECKPOINT.md) and [`VERSION_5_CHECKPOINT.md`](VERSION_5_CHECKPOINT.md). For Version 3 backend work, see [`VERSION_3_CHECKPOINT.md`](VERSION_3_CHECKPOINT.md). For long-term milestones, see [`PRODUCT_ROADMAP.md`](PRODUCT_ROADMAP.md).

---

## 1. Version 4 goal

Build a **localhost-only** interface that proves the existing backend is useful for real internship search workflows—without deploying to the internet.

Version 4 answers:

> Can I select or paste a job description, run the same analysis as the CLI, and understand matched skills, missing skills, and gaps faster than reading raw terminal output?

It should **not** try to become a full product, AI assistant, or public SaaS.

**Result:** Goal met for a minimal v1 prototype.

---

## 2. Why local UI should come before hosted deployment

| Reason | Explanation |
|--------|-------------|
| Lower risk | Private resume and job text stay on your machine during experiments. |
| Faster learning | One Python process, one repo, no DNS/HTTPS/auth glue. |
| Honest scope | Validates UX before paying for hosting or maintaining two codebases. |
| Backend reuse | Version 3 structured results power the UI without duplicating analysis logic. |

Hosted tools (Streamlit Cloud, Railway, portfolio-site links, etc.) belong in a **later deployment milestone**, after local use feels worthwhile.

---

## 3. UI path chosen

**Streamlit** at the repo root: `streamlit_app.py`

Why Streamlit:

* same language as the CLI backend,
* quick text areas and radio buttons,
* fast iteration without HTML/JS,
* fits a portfolio “local demo” story.

**Deferred:** FastAPI, Flask, Next.js, Docker, authentication, OpenAI API, RAG, semantic search, production deployment config.

---

## 4. What was implemented (Version 4 + Version 5 steps)

### Version 4 — local UI prototype

| Step | Feature | Status |
|------|---------|--------|
| 1 | Streamlit skeleton + sample job analysis | Done |
| 2 | Pasted job description analysis | Done |
| 3 | Resume source selector (sample + private local file) | Done |
| 4 | Results display polish (metrics, tables, empty states) | Done |

### Version 5 — local persistence and saved history

| Step | Feature | Status |
|------|---------|--------|
| 1 | Optional SQLite save checkbox (`data/outputs/analysis_results.db`) | Done |
| 2 | Saved Analysis History summary panel (counts + latest-run gaps) | Done |
| 3 | Recent Saved Runs table (up to 10 rows, read-only) | Done |
| 4 | Per-row saved job details in recent-runs table (run ID, timestamp, counts) | Done |

### Resume input

* **Done:** Sample resume (`data/resume/sample_resume.txt`) as default.
* **Done:** Private local resume (`data/resume/resume.txt`) when the file exists on disk.
* **Not in v1:** Paste resume text, file upload, or custom path picker.

### Job input (one job per run)

* **Done:** Sample job file (`data/sample_jobs/sample_ai_engineering_internship.txt`).
* **Done:** Paste job description text.
* **Not in v1:** Upload job file, pick from `data/jobs/`, or folder mode.

### Run analysis

* **Done:** `run_single_job_analysis()` for preview runs (no report files written from UI).
* **Not in v1:** `run_analysis_job_file()` toggle for markdown/CSV outputs, or `run_analysis()` folder mode.
* **Done (Version 5):** Optional SQLite save via `save_analysis_to_database()`; read-only saved summary and recent runs via `src/database.py` helpers.

### Display results

* **Done:** Jobs analyzed, matched skills, missing skills, recurring gaps, output file note.
* **Done:** Summary metrics, tables, expanders, empty-state messages.
* **Done:** Rule-based / local-only disclaimer on the page.

---

## 5. What the local UI still should not do yet

Do **not** build next without a clear scope:

* public URL or deployment pipeline,
* login, accounts, or API keys in the repo,
* OpenAI or other LLM calls,
* semantic / embedding search or RAG,
* multi-user data storage in the cloud,
* editing taxonomy/aliases in the UI,
* analyzing a whole folder of jobs from the UI,
* replacing the CLI—CLI remains the tested automation interface.

---

## 6. Backend functions used

Import from `src/analysis_runner.py` (via `sys.path` in `streamlit_app.py`).

| UI scenario | Backend call used | Notes |
|-------------|-------------------|-------|
| Sample resume + sample job file | `run_single_job_analysis(resume_path=..., job_path=...)` | Preview; `output_files` empty |
| Selected resume + pasted job | `run_single_job_analysis(resume_path=..., job_text=...)` | Preview; `output_files` empty |
| Many jobs (future) | `run_analysis(...)` | CLI today; UI not yet |
| Full report writes (future) | `run_analysis_job_file(...)` | CLI today; UI not yet |

**Fields rendered** (from `build_display_summary()` helpers):

```text
jobs_analyzed_count
recurring_gaps_count, top_recurring_gap_skill
jobs[i].job_name, matched_skills, missing_skills, counts
recurring_gaps (table + text list)
output_files (empty in preview mode)
resume_path_label (path only — never resume contents)
```

UI logic stays thin: **no duplicate** `find_skills` / `find_gaps` in UI files.

---

## 7. Current user flow

```text
Open terminal → python3 -m streamlit run streamlit_app.py
    ↓
Page loads with local-prototype note (rule-based, not AI scoring)
    ↓
User chooses resume: sample (default) or private local file if available
    ↓
User chooses job mode: sample job file OR paste job description
    ↓
User clicks Analyze (or sample mode auto-runs on first load)
    ↓
UI calls run_single_job_analysis()
    ↓
UI shows summary metrics, matched skills, missing skills, recurring gaps
    ↓
Output files section notes preview mode (no markdown/CSV reports unless CLI used)
    ↓
Optional: save run to SQLite (Version 5 checkbox)
    ↓
Saved Analysis History + Recent Saved Runs read local .db (read-only)
```

No network calls required except Streamlit’s local server on your machine.

---

## 8. Privacy rules for local use

Same rules as the CLI and public repo:

**OK to use in demos (public sample data):**

* `data/resume/sample_resume.txt`
* files under `data/sample_jobs/`

**Private (real search data):**

* `data/resume/resume.txt`
* files under `data/jobs/` (CLI only today)
* anything pasted into the UI from a real posting

**Never commit:**

* pasted content saved into tracked files by mistake,
* `data/outputs/` reports, CSVs, SQLite `.db` files,
* screenshots or exports that contain real PII if sharing the repo publicly.

**Local UI discipline:**

* do not log full resume/job text to a cloud analytics service,
* pasted job text stays in the Streamlit session (in-memory for the run),
* private resume is read from a Git-ignored path only when selected.

---

## 9. Testing and smoke-check strategy

Verified for Version 4:

1. `python3 run_tests.py` — all existing tests pass (UI is additive).
2. CLI spot-check unchanged:
   * `python3 src/main.py`
   * `python3 src/main.py --job-file data/sample_jobs/sample_ai_engineering_internship.txt`
3. Local UI:
   * `python3 -m streamlit run streamlit_app.py`
4. Helper tests: `python3 tests/test_streamlit_app.py`

Manual UI checklist (same backend as CLI preview):

* sample resume + sample job → results appear,
* sample resume + pasted job → gap list appears,
* empty paste → friendly error, no crash,
* private resume option appears only when `data/resume/resume.txt` exists.

---

## 10. Future path after local UI v1

| Later milestone | Direction |
|-----------------|-----------|
| Version 5.x | Optional report-file toggle, folder mode in UI |
| Later hosted milestone | Private/unlisted app, env-based secrets, link from portfolio site |
| Optional AI milestone | AI-assisted extraction—only if rule-based limits hurt |

See [`PRODUCT_ROADMAP.md`](PRODUCT_ROADMAP.md) for full milestone table.

---

## 11. Implementation decisions (answered)

| Question | Decision |
|----------|----------|
| Preview vs full outputs in v1? | Preview only (`run_single_job_analysis`); no UI file writes yet |
| Where does the Streamlit app live? | `streamlit_app.py` at repo root |
| Dependency | `streamlit` in `requirements.txt` |
| Resume/job uploads | Not in v1; paste job text only |
| Taxonomy paths | Hardcoded defaults (same as CLI) |
| Multi-job in UI | Deferred; CLI folder mode remains |
| Portfolio narrative | Local prototype; not deployed; rule-based |

---

## Summary

Version 4 delivered **local Streamlit + existing analysis runner + structured results display**.

Version 5 added **optional local SQLite saving + read-only saved-history views** (summary panel, recent runs table).

Keep it small, private, rule-based, and honest. Ship learning value before shipping hosting complexity.

*Plan updated to reflect implemented local UI — see `streamlit_app.py`, [`VERSION_4_CHECKPOINT.md`](VERSION_4_CHECKPOINT.md), and [`VERSION_5_CHECKPOINT.md`](VERSION_5_CHECKPOINT.md).*
