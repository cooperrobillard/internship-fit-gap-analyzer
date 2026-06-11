# Internship Fit & Skill-Gap Analyzer

A **rule-based** Python tool that compares internship or co-op job descriptions against a resume, surfaces **missing skills** (gaps), and summarizes **recurring gaps** across multiple postings.

This is a **local, private** internship fit and skill-gap analyzer—a learning and portfolio project you run on your own machine. It is **not** a deployed web app, an AI job matcher, or a semantic search tool.

## What it does

The analyzer:

- loads resume and job-description text (files, CLI paths, or Streamlit paste/upload),
- matches skills using a JSON **taxonomy** and **aliases** (keyword-based, not semantic),
- reports skills found in the resume and each job,
- lists **gaps per job** and **recurring gaps** across jobs,
- writes markdown and CSV reports (CLI),
- optionally saves results to **local SQLite** with searchable history, comparison, and deletion,
- supports optional **source URL** and **notes** metadata on saved analyses (Streamlit),
- offers **current-analysis downloads** and **saved-data CSV exports** plus SQLite backup (Streamlit).

Matching is **keyword- and alias-based**. It does not judge overall fit, required vs. preferred skills, or how strong resume evidence is.

## Main capabilities

| Area | What you get |
|------|----------------|
| **Core analysis** | Rule-based resume vs. job skill comparison using taxonomy + aliases |
| **CLI** | Folder or single-job analysis, markdown/CSV outputs, optional SQLite and pandas summaries |
| **Local Streamlit UI** | Sample, pasted, and uploaded workflows on localhost only |
| **SQLite persistence** | Optional save of analysis runs to a local `.db` file (CLI or UI) |
| **Saved-analysis management** | Search, two-way comparison, gap priority summary, guarded single-result deletion |
| **Metadata** | Optional source URL and notes per saved job result (no raw posting text stored) |
| **Downloads & exports** | In-memory report/CSV for current runs; summary CSVs and DB backup for saved data |
| **Tests** | Auto-discovering `run_tests.py` gate across 10 test files |

## Quickstart

Run all commands from the **project root**. Python 3 is required.

### 1. Virtual environment (recommended)

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
```

### 2. Install dependencies

```bash
python3 -m pip install -r requirements.txt
```

Main packages: **pandas** (optional summary CSVs) and **streamlit** (local UI).

### 3. Run tests

```bash
python3 run_tests.py
```

Expected final line: `All tests passed.`

### 4. CLI sample analysis

```bash
python3 src/main.py
```

Uses public sample resume and sample jobs (see [Safe demo workflow](#safe-demo-workflow) below).

### 5. Local Streamlit UI

```bash
python3 -m streamlit run streamlit_app.py
```

Opens a browser tab on your machine only—not a public website.

For deployment readiness and what is *not* ready to host yet, see [`docs/DEPLOYMENT_READINESS.md`](docs/DEPLOYMENT_READINESS.md).

## Safe demo workflow

Use **bundled public sample data** for portfolio demos, screenshots, and first-time exploration:

| Path | Role |
|------|------|
| `data/resume/sample_resume.txt` | Default sample resume |
| `data/sample_jobs/` | Default sample job descriptions |

**CLI (safe default):**

```bash
python3 src/main.py
python3 src/main.py --job-file data/sample_jobs/sample_ai_engineering_internship.txt
```

**Streamlit (safe default):** choose **Try sample analysis** on the Analyze tab. It uses the same public sample files and does not require your real resume.

For your own internship search, use Git-ignored private paths (never commit these):

```bash
python3 src/main.py --resume data/resume/resume.txt --jobs data/jobs
```

Place private job `.txt` files in `data/jobs/` and your real resume at `data/resume/resume.txt`.

## Privacy

- **Do not commit** private resume or job files, generated outputs under `data/outputs/`, or SQLite `.db` files.
- **Pasted and uploaded** resume/job text in Streamlit is handled **in memory** for that session; it is not written to tracked repo files by default.
- **SQLite saving is local and private** on your machine when you opt in (CLI `--database` or UI checkbox).
- **Raw resume and job-description text is not stored** in SQLite—only analysis results, gap lists, counts, and optional metadata.
- **Source URL and notes** are optional saved metadata you enter; they are not auto-extracted from posting body text.

See also [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md) and [`docs/VERSION_10_CHECKPOINT.md`](docs/VERSION_10_CHECKPOINT.md).

## Current limitations

Be honest about what this project is today:

- **Rule-based matching only** — taxonomy and alias keywords, not meaning or evidence strength
- **No semantic or AI matching** — no embeddings, RAG, or LLM extraction
- **No authentication** — single-user local tool
- **No cloud database** — SQLite is local filesystem only
- **No multi-user data separation** — one shared local DB path if you use persistence
- **No production deployment** — Streamlit runs on localhost; nothing is hosted for public use

Details: [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md).

## Future direction

After local demo polish (Version 11), the next major step is evaluating a **hosted account-based web app**—not bolting auth onto the current Streamlit + local SQLite stack.

Likely future work (not built yet):

- hosted web application (separate from localhost Streamlit),
- user **accounts and authentication** (e.g. Clerk-style integration),
- **cloud database** with per-user data isolation,
- cleaner **standalone UI** decoupled from Streamlit,
- careful **privacy and security redesign** before any public multi-user launch.

See [`docs/PRODUCT_ROADMAP.md`](docs/PRODUCT_ROADMAP.md) and [`docs/DEPLOYMENT_READINESS.md`](docs/DEPLOYMENT_READINESS.md).

## Current status

**Version 10** added optional saved-analysis **source URL** and **notes** metadata. **Version 11** focuses on README quickstart clarity and deployment-readiness documentation.

The project can:

- run CLI analysis on sample or private inputs (folder or `--job-file`),
- run the **local Streamlit UI** with sample, pasted, and uploaded workflows,
- **optionally save** to `data/outputs/analysis_results.db` and manage saved history (search, compare, delete),
- **download** current-analysis reports and **export** saved summary CSVs and SQLite backup from the UI,
- pass automated tests via `python3 run_tests.py`.

The Streamlit app is a **localhost prototype only**. It does not use OpenAI API, semantic matching, FastAPI, Docker, authentication, or production deployment.

## Project structure

```text
internship-fit-gap-analyzer/
  data/
    jobs/                  private local job files (Git-ignored)
    sample_jobs/           public sample job files (default)
    outputs/               generated reports and CSVs (Git-ignored)
    resume/
      sample_resume.txt    public sample resume (default)
      resume.txt           private local resume (Git-ignored)
    skill_aliases.json
    skills_taxonomy.json
  docs/
    DEPLOYMENT_READINESS.md
    LIMITATIONS.md
    PRODUCT_ROADMAP.md
    TESTING.md
    VERSION_*_CHECKPOINT.md
  scripts/
    inspect_database.py
  src/
    analysis_runner.py     shared workflow (CLI + UI)
    main.py                CLI entry point
    database.py            optional SQLite helpers
    ...
  tests/
    test_*.py
  streamlit_app.py         local Streamlit UI (localhost only)
  run_tests.py             full test gate
  requirements.txt
```

## How it works

```text
resume + job description(s) + taxonomy + aliases
→ find skills in resume
→ find skills in each job
→ compare job skills vs resume skills → gaps per job
→ count recurring gaps
→ write markdown + CSV outputs (CLI)
→ optionally SQLite + pandas summaries
→ terminal summary (CLI) or Streamlit display
```

## CLI reference

### Common commands

```bash
# Default sample-data run
python3 src/main.py

# Single job file
python3 src/main.py --job-file data/sample_jobs/sample_ai_engineering_internship.txt

# Private resume and jobs folder
python3 src/main.py --resume data/resume/resume.txt --jobs data/jobs

# SQLite output
python3 src/main.py --database data/outputs/analysis_results.db

# pandas summary CSVs
python3 src/main.py --pandas-summary

# Inspect saved database
python3 scripts/inspect_database.py data/outputs/analysis_results.db

# Help
python3 src/main.py --help
```

Do **not** pass `--jobs` and `--job-file` together.

### Command-line options

| Option | Purpose |
|--------|---------|
| `--resume` | Path to resume text file |
| `--jobs` | Folder of job description `.txt` files |
| `--job-file` | Path to one job description file |
| `--taxonomy` | Skills taxonomy JSON path |
| `--aliases` | Skill aliases JSON path |
| `--outputs` | Output folder for reports and CSVs |
| `--top-gaps` | Recurring gaps to show in terminal |
| `--database` | Optional SQLite database file path |
| `--pandas-summary` | Create extra pandas summary CSV files |

### Output files (CLI)

| File | Description |
|------|-------------|
| `data/outputs/gap_report.md` | Human-readable report |
| `data/outputs/gap_summary.csv` | One row per missing skill per job |
| `data/outputs/recurring_gaps.csv` | Gap counts across jobs |
| `data/outputs/analysis_results.db` | Optional SQLite run history |

## Streamlit UI (localhost)

```bash
python3 -m streamlit run streamlit_app.py
```

The UI supports:

- **Try sample analysis** (public sample files),
- **paste** or **upload** job descriptions and resumes (UTF-8 `.txt`),
- optional **job title, company, source URL, and notes** before save,
- **Results** tab with current-analysis Markdown and CSV downloads,
- **Saved analyses** tab with search, two-way comparison, and gap priority summary,
- **Data management** tab with exports, SQLite backup download, and guarded deletion.

Preview runs do not write report files to `data/outputs/` unless you use the CLI. Optional SQLite saving uses the same local database path family as `--database`.

## Testing

Canonical full-suite command:

```bash
python3 run_tests.py
```

Focused runs:

```bash
python3 tests/test_streamlit_app.py
python3 tests/test_database.py
```

`python3 -m unittest discover -s tests -p "test_*.py"` reports **0 tests** because most files are script-style tests, not `unittest.TestCase` classes. See [`docs/TESTING.md`](docs/TESTING.md).

## Documentation

| Document | Purpose |
|----------|---------|
| [`docs/DEPLOYMENT_READINESS.md`](docs/DEPLOYMENT_READINESS.md) | What is demo-ready vs. not deployment-ready |
| [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md) | Limitations and privacy notes |
| [`docs/TESTING.md`](docs/TESTING.md) | Canonical testing guide |
| [`docs/PRODUCT_ROADMAP.md`](docs/PRODUCT_ROADMAP.md) | Version milestones and future direction |
| [`docs/VERSION_10_CHECKPOINT.md`](docs/VERSION_10_CHECKPOINT.md) | Saved-analysis metadata (source URL, notes) |

## Learning purpose

This project supports learning Python, CLI design, testing, file I/O, JSON, project structure, documentation, Git workflow, and optional SQLite/pandas usage—while building something useful for internship search planning.
