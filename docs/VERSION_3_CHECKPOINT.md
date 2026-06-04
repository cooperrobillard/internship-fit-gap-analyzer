# Version 3 Checkpoint

This document summarizes the current state of Version 3 of the Internship Fit & Skill-Gap Analyzer.

For day-to-day usage, see the [README](../README.md). For limitations, see [`LIMITATIONS.md`](LIMITATIONS.md). For longer-term UI plans, see [`PRODUCT_ROADMAP.md`](PRODUCT_ROADMAP.md).

## What Version 3 is for

Version 3 builds on the Version 2 CLI and data features by improving **backend structure** and **CLI polish** so a future local web UI can reuse the same analysis logic.

Version 3 is **not** a web app release. There is still no deployed UI, no authentication, no OpenAI API, and no semantic job matching.

## What has been added so far

### Reusable analysis runner (`src/analysis_runner.py`)

The full folder-based workflow lives in `run_analysis()`. It:

* validates inputs,
* loads resume, taxonomy, and aliases,
* analyzes job files,
* writes markdown and CSV outputs,
* optionally saves SQLite and pandas summary files,
* returns a structured dictionary (paths, skills, gaps, output file list).

The CLI calls this function instead of duplicating the workflow inside `src/main.py`.

### Single-job backend support

`run_single_job_analysis()` analyzes **one** job description against one resume. It accepts:

* resume and job content from **file paths** or **raw text strings**,
* the same taxonomy and alias JSON files.

`analyze_job_text()` holds the core text-only comparison logic (no folder reading), which future paste/upload UI code can call directly.

### Single-job file CLI mode (`--job-file`)

The CLI can analyze one job file without a jobs folder:

```bash
python3 src/main.py --job-file data/sample_jobs/sample_ai_engineering_internship.txt
```

`run_analysis_job_file()` connects the CLI to the single-job backend and writes the same output files as folder mode.

### CLI polish

* Clear user-facing errors for common invalid inputs (missing files, bad JSON, invalid database path).
* Nonzero exit codes for expected CLI mistakes (no full traceback for user input errors).
* `--jobs` and `--job-file` cannot be used together; the program prints a clear error instead of silently picking one.

## Why reusable backend functions matter before a UI

A future local UI (for example Streamlit) should call Python functions directly, not reimplement skill matching in the UI layer.

The analysis runner:

* keeps **one source of truth** for validation, analysis, and output writing,
* returns **structured results** a UI can display,
* separates **terminal printing** (CLI only) from analysis logic.

That makes later UI work a thin wrapper instead of a second copy of the project.

## Why single-job analysis matters

Many internship searches start with **one posting at a time**—pasted text or a single saved file—not a full folder of `.txt` files.

Single-job support prepares the backend for:

* analyzing one uploaded or pasted job description,
* showing gaps immediately,
* optionally saving the same markdown, CSV, and SQLite outputs as the folder workflow.

Paste mode in the CLI is **not** implemented yet; the backend functions are ready for a future UI to pass raw text.

## Data layout (unchanged from Version 2)

| Path | Role |
|------|------|
| `data/resume/sample_resume.txt` | Public sample resume (default) |
| `data/sample_jobs/` | Public sample job descriptions (default folder mode) |
| `data/resume/resume.txt` | Private local resume (Git-ignored) |
| `data/jobs/` | Private local job descriptions (Git-ignored) |
| `data/outputs/` | Generated reports, CSVs, and optional SQLite DB (Git-ignored) |

## Commands to test Version 3 behavior

Run from the project root.

### Tests

```bash
python3 run_tests.py
```

### Default sample-data run

```bash
python3 src/main.py
```

### Private local resume and jobs folder

```bash
python3 src/main.py --resume data/resume/resume.txt --jobs data/jobs
```

### Single job file

```bash
python3 src/main.py --job-file data/sample_jobs/sample_ai_engineering_internship.txt
```

### SQLite output

```bash
python3 src/main.py --database data/outputs/analysis_results.db
```

### pandas summary CSVs

```bash
python3 src/main.py --pandas-summary
```

### SQLite + pandas combined

```bash
python3 src/main.py --database data/outputs/analysis_results.db --pandas-summary
```

### Inspect saved database

```bash
python3 scripts/inspect_database.py data/outputs/analysis_results.db
```

### Conflict check (should fail with a clear error)

```bash
python3 src/main.py --jobs data/sample_jobs --job-file data/sample_jobs/sample_ai_engineering_internship.txt
```

Optional: run backend-focused test files directly (not all are wired into `run_tests.py` yet):

```bash
python3 tests/test_analysis_runner.py
python3 tests/test_single_job_analysis.py
```

## Limitations that still remain

Version 3 does **not** change the core matching approach. The tool still:

* uses **rule-based keyword and alias matching**,
* does not understand full job-description meaning,
* does not rank “fit” with AI or embeddings,
* does not provide a web UI or hosted deployment.

Optional SQLite and pandas features store and summarize results locally. They do not add semantic understanding.

See [`LIMITATIONS.md`](LIMITATIONS.md) for the full list.

## Likely next steps after this checkpoint

Small, learning-first follow-ups (see [`PRODUCT_ROADMAP.md`](PRODUCT_ROADMAP.md)):

* Finish remaining Version 3 polish (docs, samples, taxonomy tweaks) in small branches.
* Keep using the CLI with private local inputs during real internship search.
* Experiment with a **local UI prototype** only after the backend API feels stable.
* Defer OpenAI API, deployment, authentication, and paste-mode CLI unless there is a clear need.

## Privacy reminder

* Use public **sample** resume and jobs for demos and Git-tracked workflows.
* Keep real resume and job files in Git-ignored paths (`data/resume/resume.txt`, `data/jobs/`).
* Do not commit generated outputs or `.db` files under `data/outputs/`.
