# Version 4 Checkpoint

This document records what **Version 4** accomplished: a **local-only Streamlit UI prototype** on top of the Version 3 CLI and backend.

For usage commands, see the [README](../README.md). For limitations, see [`LIMITATIONS.md`](LIMITATIONS.md). For the original UI plan (now mostly implemented), see [`LOCAL_UI_PLAN.md`](LOCAL_UI_PLAN.md). For longer-term milestones, see [`PRODUCT_ROADMAP.md`](PRODUCT_ROADMAP.md).

**Status:** Version 4 is complete as a **local UI prototype** milestone. There is **no hosted deployment**, **no authentication**, and **no AI-based matching**.

---

## 1. Version 4 goal

Build a **localhost-only** interface that proves the existing backend is useful for internship search workflows—without deploying to the internet.

Version 4 answers:

> Can I analyze a job description against a resume in a browser, using the same backend as the CLI, and understand matched skills, missing skills, and gaps faster than reading raw terminal output?

It does **not** try to become a full product, AI assistant, or public SaaS.

---

## 2. What was added in Version 4

### Local Streamlit app (`streamlit_app.py`)

* Calls `run_single_job_analysis()` from `src/analysis_runner.py` directly (no subprocess, no duplicated skill logic).
* Runs only on your machine via Streamlit’s local server.
* Shows a short note that the app is a local prototype with rule-based matching.

### Step 1 — UI skeleton and sample-data analysis

* Default inputs: `data/resume/sample_resume.txt` and `data/sample_jobs/sample_ai_engineering_internship.txt`.
* Displays structured results: jobs analyzed, matched skills, missing skills, recurring gaps, and output file paths when available.

### Step 2 — Pasted job description analysis

* **Paste job description** mode with a text area and **Analyze pasted job** button.
* Blank paste validation with a friendly error message.
* Analyzes pasted text against the selected resume using backend `job_text=` mode (preview only; no report files written).

### Step 3 — Safe local resume source selector

* **Sample resume (safe for repo)** — default, always available.
* **Private local resume** — only shown when `data/resume/resume.txt` exists on your machine.
* Clear UI messages: private resume is local-only and must not be committed.
* Does not display resume contents in the UI.

### Step 4 — Results display polish

* Summary metrics: jobs analyzed, recurring gaps count, top recurring gap.
* Matched and missing skills shown in readable tables (with empty-state messages).
* Recurring gaps table plus optional text list.
* Output files section with a friendly message when preview mode writes no files.

### Dependencies and tests

* `streamlit` added to `requirements.txt`.
* Simple helper tests in `tests/test_streamlit_app.py` (import smoke tests and formatting helpers; no full UI automation).

---

## 3. What the local UI can do now

| Feature | How it works |
|---------|----------------|
| Sample job analysis | Bundled sample resume + sample job file; auto-runs on first load |
| Pasted job analysis | Paste one job description; analyze against selected resume |
| Resume source | Sample resume (default) or private `data/resume/resume.txt` if present |
| Results display | Matched skills, missing skills, recurring gaps, output file note |
| Backend reuse | Same `run_single_job_analysis()` as CLI preview workflows |

---

## 4. What the local UI does not do yet

Version 4 **does not** provide:

* hosted deployment or a public URL,
* user accounts or authentication,
* OpenAI API or LLM extraction,
* semantic matching, embeddings, or RAG,
* file upload for resume or job files,
* private job folder selection (`data/jobs/` is CLI-only),
* folder mode (many jobs in one UI run),
* SQLite or pandas toggles from the UI,
* automatic report file writing from the UI (preview mode only),
* resume tailoring or job-fit scoring,
* saved run history in the UI.

The CLI remains the primary interface for folder mode, `--job-file` with full outputs, `--database`, and `--pandas-summary`.

---

## 5. Commands tested for Version 4

Run from the project root.

### Automated tests

```bash
python3 run_tests.py
```

Optional Streamlit helper tests:

```bash
python3 tests/test_streamlit_app.py
```

### CLI workflows (unchanged; must still pass)

```bash
python3 src/main.py
python3 src/main.py --job-file data/sample_jobs/sample_ai_engineering_internship.txt
```

### Local UI

```bash
python3 -m streamlit run streamlit_app.py
```

Opens a browser tab on your machine (default `http://localhost:8501`). Stop the server with `Ctrl+C` in the terminal when finished.

---

## 6. Privacy notes

| Safe in public Git | Keep local / Git-ignored |
|--------------------|---------------------------|
| `data/resume/sample_resume.txt` | `data/resume/resume.txt` |
| `data/sample_jobs/` | `data/jobs/` |
| taxonomy and alias JSON | `data/outputs/` reports, CSVs, `.db` files |

**UI-specific discipline:**

* Pasted job text stays in the Streamlit session; it is not saved to tracked repo files by the app.
* Private resume is read from disk only when you select that option and the file exists locally.
* Do not commit real resumes, real job postings, generated outputs, or database files.
* Generated outputs under `data/outputs/` remain Git-ignored.

---

## 7. Limitations (still honest)

The local UI uses the same **rule-based** backend as the CLI. It:

* does not truly understand job descriptions,
* does not distinguish required vs. preferred skills,
* does not judge resume evidence strength,
* can miss skills not in the taxonomy/aliases,
* can match keywords without real experience.

Optional SQLite and pandas features are CLI-only today; the UI preview path does not add semantic understanding.

See [`LIMITATIONS.md`](LIMITATIONS.md) for full detail.

---

## 8. Likely next steps (Version 4.x / Version 5)

| Direction | Notes |
|-----------|--------|
| UI: optional output writing | Toggle to call `run_analysis_job_file()` and show saved file paths |
| UI: folder mode | Analyze many jobs from `data/sample_jobs/` or a chosen folder |
| UI: SQLite toggle | Mirror CLI `--database` for local history |
| Version 5 | Private hosted app, env-based secrets, portfolio link—only after local UX feels worthwhile |
| Later | Optional AI-assisted extraction—only if rule-based limits hurt |

See [`PRODUCT_ROADMAP.md`](PRODUCT_ROADMAP.md) for the full milestone table.

---

## 9. Version 4 summary

Version 4 shipped a **small, honest, local Streamlit prototype** that:

* reuses the Version 3 analysis runner,
* supports sample job and pasted job workflows,
* supports sample and private local resume selection,
* displays structured results in a readable layout,
* keeps the CLI and tests stable.

**Not shipped:** deployment, auth, AI pipeline, semantic matching, or production readiness claims.

---

*Version 4 checkpoint — documentation only; aligned with local Streamlit prototype on `streamlit_app.py`.*
