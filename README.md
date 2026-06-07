# Internship Fit & Skill-Gap Analyzer

A **rule-based** Python command-line tool that compares internship or co-op job descriptions against a resume, finds skills mentioned in each text, identifies **missing skills** (gaps), and summarizes **recurring gaps** across multiple postings.

This is a learning and portfolio project. It is **not** an AI-powered job matcher, a semantic search tool, or a deployed web application.

## What the project does

The analyzer:

* loads a resume and one or more job descriptions (text files),
* uses a JSON **skills taxonomy** and **skill aliases** to find known skills in each text,
* reports skills found in the resume and in each job,
* compares job skills against resume skills to list **gaps per job**,
* counts **recurring gaps** across all analyzed jobs,
* writes a markdown report and CSV summaries,
* optionally saves results to SQLite and optional pandas summary CSVs,
* prints a short terminal summary.

Matching is **keyword- and alias-based**. It does not understand meaning, required vs. preferred skills, or how strong resume evidence is.

## Current status

**Version 6** adds **read-only saved-analysis comparison and a saved gap priority summary** to the Version 5 local Streamlit UI, on top of the Version 3 CLI and backend.

The project can:

* run analysis on a **folder of job files** (default sample data or private `--jobs` folder),
* run analysis on a **single job file** with `--job-file`,
* call shared backend functions (`src/analysis_runner.py`) that return structured results,
* run a **local Streamlit UI** (`streamlit_app.py`) for sample job and pasted job analysis,
* **optionally save UI runs** to `data/outputs/analysis_results.db` and view **read-only saved-history views** (summary, recent runs, **two-way comparison**, and **recurring gap priority summary**) in the UI,
* generate markdown and CSV outputs (CLI),
* optionally save to SQLite (`--database`),
* optionally create pandas summary CSVs (`--pandas-summary`),
* inspect saved databases with `scripts/inspect_database.py`,
* run automated tests for core logic, CLI behavior, validation, database, pandas output, and Streamlit helpers.

The Streamlit app is a **localhost prototype only**—not a hosted web app. It does **not** use OpenAI API, semantic matching, FastAPI, Docker, RAG, authentication, or production deployment.

## Project structure

```text
internship-fit-gap-analyzer/
  data/
    jobs/                  private local job files (Git-ignored)
    sample_jobs/           public sample job files (used by default)
    outputs/               generated reports and CSV files (Git-ignored)
    resume/
      sample_resume.txt    public sample resume (used by default)
      resume.txt           private local resume (Git-ignored)
    skill_aliases.json
    skills_taxonomy.json
  docs/
    LIMITATIONS.md
    PRODUCT_ROADMAP.md
    VERSION_1_CHECKLIST.md
    VERSION_2_CHECKPOINT.md
    VERSION_2_TEST_COMMANDS.md
    VERSION_3_CHECKPOINT.md
    VERSION_4_CHECKPOINT.md
    VERSION_5_CHECKPOINT.md
    VERSION_6_CHECKPOINT.md
    VERSION_7_PLAN.md
    LOCAL_UI_PLAN.md
  scripts/
    inspect_database.py
  src/
    analysis_runner.py     reusable analysis workflow (CLI + future UI)
    compare_resume.py
    console_summary.py
    csv_writer.py
    database.py
    extract_keywords.py
    main.py                CLI entry point
    pandas_summary.py
    report_writer.py
    summarize_gaps.py
  tests/
    test_analysis_runner.py
    test_cli.py
    test_core_logic.py
    test_database.py
    test_inspect_database.py
    test_output_writers.py
    test_pandas_summary.py
    test_single_job_analysis.py
    test_streamlit_app.py
    test_validation.py
  LEARNING_LOG.md
  README.md
  requirements.txt
  run_tests.py
  streamlit_app.py       local Streamlit UI (localhost only)
```

## How it works

```text
resume + job description(s) + taxonomy + aliases
→ find skills in resume
→ find skills in each job
→ compare job skills vs resume skills → gaps per job
→ count recurring gaps
→ write markdown + CSV outputs
→ optionally SQLite + pandas summaries
→ terminal summary (CLI)
```

Folder mode reads every `.txt` file in a jobs folder. Single-file mode (`--job-file`) analyzes one job path. The local Streamlit UI calls the same backend for sample job and pasted job preview runs.

## Setup

Python 3 is required.

```bash
python3 -m pip install -r requirements.txt
```

Main external dependencies: **pandas** (optional summary CSVs) and **streamlit** (local UI only).

## Input files and privacy

### Public sample inputs (tracked in Git, used by default)

| Path | Role |
|------|------|
| `data/resume/sample_resume.txt` | Default resume when you run `python3 src/main.py` |
| `data/sample_jobs/` | Default job descriptions folder |

### Private local inputs (Git-ignored)

| Path | Role |
|------|------|
| `data/resume/resume.txt` | Your real resume — use `--resume data/resume/resume.txt` |
| `data/jobs/` | Your real job `.txt` files — use `--jobs data/jobs` |

**Do not commit** private resume or job files, generated files under `data/outputs/`, or SQLite `.db` files.

### Taxonomy and aliases

**`data/skills_taxonomy.json`** — official skills grouped by category.

**`data/skill_aliases.json`** — alternate phrases mapped to official skill names.

## How to run (main commands)

Run all commands from the **project root**.

### Default sample-data run

```bash
python3 src/main.py
```

Uses `data/resume/sample_resume.txt` and all `.txt` files in `data/sample_jobs/`.

### Private local resume and jobs folder

```bash
python3 src/main.py --resume data/resume/resume.txt --jobs data/jobs
```

### Single job file (Version 3)

Analyze one job description file without a jobs folder:

```bash
python3 src/main.py --job-file data/sample_jobs/sample_ai_engineering_internship.txt
```

Do **not** pass `--jobs` and `--job-file` together; the program exits with a clear error.

### SQLite output

```bash
python3 src/main.py --database data/outputs/analysis_results.db
```

### pandas summary CSVs

```bash
python3 src/main.py --pandas-summary
```

Creates `gap_categories_pandas.csv` and `top_recurring_gaps_pandas.csv` under the outputs folder.

### SQLite + pandas combined

```bash
python3 src/main.py --database data/outputs/analysis_results.db --pandas-summary
```

### Inspect a saved database

After a run with `--database`:

```bash
python3 scripts/inspect_database.py data/outputs/analysis_results.db
```

### Run tests

```bash
python3 run_tests.py
```

Expected final line: `All tests passed.`

### Local Streamlit UI (Versions 4–6)

Run from the project root. Opens a browser tab on your machine only—not a public website.

```bash
python3 -m streamlit run streamlit_app.py
```

The UI can:

* analyze the **sample job file** against a selected resume,
* analyze a **pasted job description** against a selected resume,
* use the **sample resume** (`data/resume/sample_resume.txt`) by default,
* use your **private local resume** (`data/resume/resume.txt`) if that file exists on your machine,
* **optionally save** an analysis run to `data/outputs/analysis_results.db` (checkbox),
* show read-only **Saved Analysis History** and **Recent Saved Runs** when that database exists,
* **compare two saved analyses** (shared and unique missing skills; requires at least two saved job results),
* show a **Saved Gap Priority Summary** of recurring missing skills across all saved analyses.

Comparison uses **missing skills stored in SQLite** only—it does not compare matched-skill lists because individual matched skill names are not saved to the database. The gap priority summary is descriptive, not a ranked recommendation engine.

Preview runs do not write markdown/CSV report files unless you use the CLI. Optional UI SQLite saving uses the same local database path family as `--database`.

**Privacy:** Do not commit `data/resume/resume.txt`, pasted job text, or generated files under `data/outputs/` (including `.db` files). See [`docs/VERSION_5_CHECKPOINT.md`](docs/VERSION_5_CHECKPOINT.md) for persistence and [`docs/VERSION_6_CHECKPOINT.md`](docs/VERSION_6_CHECKPOINT.md) for comparison and decision-support workflows.

### Help and other options

```bash
python3 src/main.py --help
python3 src/main.py --top-gaps 3
python3 src/main.py --outputs data/outputs_test
```

Example terminal output:

```text
Analysis complete.

Jobs analyzed: 1

Top recurring gaps:
1. sql (data): 1 job(s)
2. pandas (data): 1 job(s)

Output files:
- data/outputs/gap_report.md
- data/outputs/gap_summary.csv
- data/outputs/recurring_gaps.csv
```

## Command-line options

| Option | Purpose |
|--------|---------|
| `--resume` | Path to resume text file |
| `--jobs` | Folder of job description `.txt` files (folder mode) |
| `--job-file` | Path to one job description file (single-job mode) |
| `--taxonomy` | Skills taxonomy JSON path |
| `--aliases` | Skill aliases JSON path |
| `--outputs` | Output folder for reports and CSVs |
| `--top-gaps` | Number of recurring gaps to show in the terminal |
| `--database` | Optional SQLite database file path |
| `--pandas-summary` | Create extra pandas summary CSV files |

**Folder mode:** default, or explicit `--jobs data/sample_jobs`.

**Single-job mode:** `--job-file path/to/job.txt` (do not also pass `--jobs`).

## Source files (high level)

| File | Role |
|------|------|
| `src/main.py` | Parses CLI arguments, calls the analysis runner, prints terminal summary |
| `src/analysis_runner.py` | `run_analysis()`, `run_analysis_job_file()`, `run_single_job_analysis()` — shared workflow |
| `src/extract_keywords.py` | Find taxonomy skills in text |
| `src/compare_resume.py` | Job vs resume gap comparison |
| `src/summarize_gaps.py` | Recurring gap counts |
| `src/report_writer.py` / `src/csv_writer.py` | Markdown and CSV outputs |
| `src/database.py` | Optional SQLite helpers |
| `src/pandas_summary.py` | Optional pandas summary CSVs |
| `scripts/inspect_database.py` | Inspect a saved `.db` file |

## Output files

| File | Description |
|------|-------------|
| `data/outputs/gap_report.md` | Human-readable report: recurring gaps, resume skills, per-job skills and gaps |
| `data/outputs/gap_summary.csv` | One row per missing skill per job (`job_name`, `category`, `gap_skill`) |
| `data/outputs/recurring_gaps.csv` | Gap counts across jobs (`gap_skill`, `category`, `count`) |
| `data/outputs/gap_categories_pandas.csv` | Optional; gaps by category (`--pandas-summary`) |
| `data/outputs/top_recurring_gaps_pandas.csv` | Optional; top recurring gaps (`--pandas-summary`) |
| `data/outputs/analysis_results.db` | Optional; SQLite run history (`--database`) |

## Documentation

| Document | Purpose |
|----------|---------|
| [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md) | Limitations and privacy notes |
| [`docs/VERSION_4_CHECKPOINT.md`](docs/VERSION_4_CHECKPOINT.md) | Version 4 local UI summary and test commands |
| [`docs/VERSION_5_CHECKPOINT.md`](docs/VERSION_5_CHECKPOINT.md) | Version 5 local UI persistence and saved-history views |
| [`docs/VERSION_6_CHECKPOINT.md`](docs/VERSION_6_CHECKPOINT.md) | Version 6 saved-analysis comparison and gap priority summary |
| [`docs/VERSION_7_PLAN.md`](docs/VERSION_7_PLAN.md) | Version 7 planning: saved-result organization (not implemented yet) |
| [`docs/LOCAL_UI_PLAN.md`](docs/LOCAL_UI_PLAN.md) | Local UI plan and implementation status |
| [`docs/VERSION_3_CHECKPOINT.md`](docs/VERSION_3_CHECKPOINT.md) | Version 3 summary and test commands |
| [`docs/VERSION_2_CHECKPOINT.md`](docs/VERSION_2_CHECKPOINT.md) | Version 2 feature summary |
| [`docs/VERSION_2_TEST_COMMANDS.md`](docs/VERSION_2_TEST_COMMANDS.md) | Version 2 smoke-test sequence |
| [`docs/PRODUCT_ROADMAP.md`](docs/PRODUCT_ROADMAP.md) | Future UI and milestone planning |
| [`docs/VERSION_1_CHECKLIST.md`](docs/VERSION_1_CHECKLIST.md) | Version 1 MVP milestone |
| [`LIMITATIONS.md`](LIMITATIONS.md) | Pointer to `docs/LIMITATIONS.md` |

## Current limitations

Rule-based matching can miss skills not in the taxonomy or aliases and may match keywords without real evidence. The tool does not judge overall job fit, seniority, or required vs. preferred skills.

Optional SQLite and pandas features store and summarize results locally; they do not add semantic understanding.

Details: [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md).

## Learning purpose

This project supports learning Python, CLI design, testing, file I/O, JSON, project structure, documentation, Git workflow, and optional SQLite/pandas usage—while building something useful for internship search planning.

## Planned next steps

See [`docs/VERSION_7_PLAN.md`](docs/VERSION_7_PLAN.md) and [`docs/PRODUCT_ROADMAP.md`](docs/PRODUCT_ROADMAP.md). Near term: Version 7 planning targets **saved-result organization** on localhost (labels, sorting, filtering)—not deployment. **Hosted deployment** and optional AI-assisted extraction remain later milestones.
