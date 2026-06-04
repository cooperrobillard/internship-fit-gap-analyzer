# Local UI Plan (Version 4)

This document plans a **future local UI prototype** for the Internship Fit & Skill-Gap Analyzer.

**Nothing in this file is implemented yet.** There is no Streamlit app, no FastAPI server, and no hosted deployment in the repo today.

For what Version 3 delivered, see [`VERSION_3_CHECKPOINT.md`](VERSION_3_CHECKPOINT.md). For long-term milestones, see [`PRODUCT_ROADMAP.md`](PRODUCT_ROADMAP.md).

---

## 1. Version 4 goal

Build a **localhost-only** interface that proves the existing backend is useful for real internship search workflows—without deploying to the internet.

Version 4 should answer:

> Can I select or paste a job description, run the same analysis as the CLI, and understand matched skills, missing skills, and gaps faster than reading raw terminal output?

It should **not** try to become a full product, AI assistant, or public SaaS.

---

## 2. Why local UI should come before hosted deployment

| Reason | Explanation |
|--------|-------------|
| Lower risk | Private resume and job text stay on your machine during experiments. |
| Faster learning | One Python process, one repo, no DNS/HTTPS/auth glue. |
| Honest scope | Validates UX before paying for hosting or maintaining two codebases. |
| Backend reuse | Version 3 structured results are meant for this step—prove they work in a UI before adding deployment. |

Hosted tools (Streamlit Cloud, Railway, cooperrobillard.com/jobfit links, etc.) belong in **Version 5+**, after local use feels worthwhile.

---

## 3. Recommended first UI path

**Likely choice: Streamlit** (Python-only, quick forms and text areas, good for solo learning projects).

Why Streamlit first:

* same language as the CLI backend,
* easy text paste and file upload widgets,
* fast iteration on layout without building HTML/JS,
* fits a portfolio “local demo” story.

**Alternatives (defer unless Streamlit blocks you):**

* **FastAPI + minimal HTML** — more control, more boilerplate.
* **Flask** — similar tradeoff to FastAPI for a small tool.
* **Next.js + Python API** — professional split stack; too heavy for Version 4.

**Explicitly wait on:** Docker, authentication, OpenAI API, RAG, semantic search, production deployment config.

---

## 4. What the local UI should do in its first version

Minimum useful v1 (local only):

1. **Resume input**
   * Default to sample resume path, or
   * Let user pick a local file path, or
   * Optional: paste resume text (calls backend with `resume_text=`).

2. **Job input** (one job per run in v1)
   * Paste job description text, **or**
   * Upload / select one `.txt` file, **or**
   * Pick a known sample job file path.

3. **Run analysis**
   * Call `run_single_job_analysis()` for paste-only preview (no files), **or**
   * Call `run_analysis_job_file()` if user wants markdown/CSV outputs written to a chosen folder, **or**
   * Start with preview-only to keep v1 smallest.

4. **Display results** from structured dict:
   * jobs analyzed count,
   * resume skills (by category),
   * per job: matched skills, missing skills, counts,
   * recurring gaps list (for one job, same as per-job gaps),
   * optional: list of `output_files` if a full write run was triggered.

5. **Clear limitations on the page**
   * Rule-based matching only; not AI job-fit scoring.

Optional v1.1 (still local):

* Toggle to write outputs to `data/outputs/` or a temp folder.
* Button text that shows exact CLI equivalent for learning.

---

## 5. What the local UI should not do yet

Do **not** build in Version 4 v1:

* public URL or deployment pipeline,
* login, accounts, or API keys in the repo,
* OpenAI or other LLM calls,
* semantic / embedding search or RAG,
* multi-user data storage in the cloud,
* editing taxonomy/aliases in the UI (keep JSON in repo/files),
* analyzing a whole folder of jobs unless clearly scoped as v1.2,
* replacing the CLI—CLI remains the tested automation interface.

---

## 6. Backend functions and data to use

Import from `src/analysis_runner.py` (with `sys.path` or package layout as today’s tests do).

| UI scenario | Suggested backend call | Notes |
|-------------|------------------------|-------|
| Paste resume + paste job | `run_single_job_analysis(resume_text=..., job_text=...)` | Returns structured dict; `output_files` empty. |
| File resume + file job, show results only | `run_single_job_analysis(resume_path=..., job_path=...)` | Same. |
| File resume + file job + save reports | `run_analysis_job_file(...)` | Writes markdown/CSV; optional `--database` later in UI. |
| Many jobs (later) | `run_analysis(...)` | Folder mode; recurring gaps across jobs. |

**Fields to render (prefer `jobs` list):**

```text
results["jobs_analyzed_count"]
results["resume_skills"]          # dict by category
results["jobs"][i]["job_name"]
results["jobs"][i]["matched_skills"]
results["jobs"][i]["missing_skills"]
results["jobs"][i]["matched_skills_count"]
results["jobs"][i]["missing_skills_count"]
results["recurring_gaps"]         # list of {gap_skill, category, count}
results["output_files"]           # if outputs were written
results["analysis_mode"]          # single_text, single_file, folder
```

Keep UI logic thin: **no duplicate** `find_skills` / `find_gaps` in UI files.

---

## 7. Expected user flow (v1)

```text
Open terminal → streamlit run app.py (or similar)
    ↓
Page loads with short explanation (rule-based tool, local only)
    ↓
User chooses resume: sample / file / paste
    ↓
User chooses job: paste / file / sample
    ↓
User clicks "Analyze"
    ↓
UI calls run_single_job_analysis (or run_analysis_job_file)
    ↓
UI shows matched skills, missing skills, recurring gaps
    ↓
(Optional) UI shows output file paths if writes were enabled
```

No network calls required except Streamlit’s local server.

---

## 8. Privacy rules for local use

Same rules as the CLI and public repo:

**OK to use in demos (public sample data):**

* `data/resume/sample_resume.txt`
* files under `data/sample_jobs/`

**Private (real search data):**

* `data/resume/resume.txt`
* files under `data/jobs/`
* anything pasted into the UI that came from a real posting or resume

**Never commit:**

* pasted content saved into tracked files by mistake,
* `data/outputs/` reports, CSVs, SQLite `.db` files,
* screenshots or exports that contain real PII if sharing the repo publicly.

**Local UI discipline:**

* do not log full resume/job text to a cloud analytics service,
* prefer in-memory analysis for paste mode,
* if saving uploads to disk, use Git-ignored paths only.

---

## 9. Testing and smoke-check strategy

Before merging Version 4 UI work:

1. `python3 run_tests.py` — all existing tests must still pass (UI is additive).
2. CLI spot-check unchanged:
   * `python3 src/main.py`
   * `python3 src/main.py --job-file data/sample_jobs/sample_ai_engineering_internship.txt`
3. Manual UI checklist (same inputs as CLI):
   * sample resume + pasted job text → gap list appears,
   * sample resume + sample job file → counts match CLI order of magnitude,
   * empty paste → friendly error, no crash.
4. Optional: one small test that imports the UI helper function and mocks `run_single_job_analysis` (only if it stays simple).

Do not require pytest migration for Version 4 unless it clearly helps.

---

## 10. Future path after local UI

If local Streamlit v1 is useful:

| Later milestone | Direction |
|-----------------|-----------|
| Version 4.x | Folder mode in UI, optional SQLite toggle, better layout |
| Version 5 | Private hosted app, env-based secrets, link from portfolio site |
| Version 6 | Optional AI-assisted extraction—only if rule-based limits hurt |

See [`PRODUCT_ROADMAP.md`](PRODUCT_ROADMAP.md) for full milestone table.

---

## 11. Open questions to answer before implementation

Answer these in a short branch or notes **before** writing UI code:

1. **Preview vs full outputs in v1?**  
   Start with `run_single_job_analysis` only, or always write reports via `run_analysis_job_file`?

2. **Where does the Streamlit app live?**  
   e.g. `ui/app.py` or `streamlit_app.py` at repo root—one file vs small folder?

3. **Dependency:** add `streamlit` to `requirements.txt` when implementing—not in this planning doc pass.

4. **Resume/job file uploads:** save to temp dir under `data/outputs/` (ignored) or purely in-memory?

5. **Taxonomy paths:** hardcode defaults or expose advanced paths in an expander?

6. **Multi-job in UI:** defer until folder mode is needed, or include a simple “analyze folder” button in v1.2?

7. **Portfolio narrative:** how to describe the local UI in README without implying deployment?

---

## Summary

Version 4 = **local Streamlit (likely) + existing analysis runner + structured results display**.

Keep it small, private, rule-based, and honest. Ship learning value before shipping hosting complexity.

*Planning document only — no UI code in this milestone.*
