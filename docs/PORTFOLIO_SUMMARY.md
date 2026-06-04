# Internship Fit & Skill-Gap Analyzer — Portfolio Summary

## 1. Project name and purpose

**Internship Fit & Skill-Gap Analyzer** is a Python command-line tool I built as both a practical internship-search helper and a learning project.

The goal is to compare internship or co-op job descriptions against a resume, surface matched and missing skills, and highlight recurring skill gaps across multiple roles. The project is designed to help prioritize what to learn or document more clearly on a resume — not to replace human judgment in hiring decisions.

It is a portfolio and learning project with a deliberately scoped feature set: rule-based analysis, optional local data storage, and clear separation between public sample data and private local inputs.

---

## 2. What problem the project solves

Applying to internships often means reading many similar job postings and trying to spot patterns: which tools keep appearing, which requirements repeat, and where my resume may be thin.

Doing that manually across several postings is slow and easy to lose track of. This tool automates a **first-pass, structured comparison**:

- Which skills from a defined taxonomy appear in my resume?
- Which skills appear in each job description?
- Which job skills are missing from my resume?
- Which missing skills show up most often across postings?

The output is a starting point for learning priorities and resume updates, not a final fit score.

---

## 3. What the tool currently does

From the project root, the default workflow is:

```bash
python3 src/main.py
```

The analyzer:

1. Reads a resume text file and one or more job description text files.
2. Loads a skills taxonomy and skill alias map from JSON.
3. Finds taxonomy skills in the resume and each job using keyword and alias matching.
4. Compares job skills against resume skills to identify gaps per job.
5. Counts recurring gaps across all analyzed jobs.
6. Writes a markdown report and CSV summary files.
7. Prints a terminal summary of top recurring gaps.

Optional flags add SQLite persistence (`--database`) and pandas-generated summary CSVs (`--pandas-summary`). A separate script can inspect saved database results.

The tool does **not** use large language models, semantic search, or a web interface. Matching is rule-based.

---

## 4. Version 1 summary

Version 1 was a pure-Python MVP focused on a complete CLI workflow:

- Text-file inputs (resume + job descriptions)
- JSON-driven skills taxonomy and aliases
- Modular source files for extraction, comparison, gap summarization, and output writing
- Markdown and CSV outputs
- Command-line options for custom paths and terminal summary control
- Manual test suite covering core logic, output writers, CLI behavior, and input validation

Version 1 proved the end-to-end pipeline: **load inputs → extract skills → compare → summarize gaps → write outputs → test behavior**.

It intentionally avoided pandas, SQLite, dashboards, and external AI APIs so the core Python fundamentals stayed clear.

---

## 5. Version 2 summary

Version 2 extended the MVP with optional data-analysis and storage features while keeping Version 1 behavior intact:

| Addition | Purpose |
|----------|---------|
| `src/database.py` | SQLite helpers for analysis runs, job results, and skill gaps |
| `--database` CLI flag | Optionally persist each run to a local `.db` file |
| `src/pandas_summary.py` | Load gap CSVs and write category/top-gap summary files |
| `--pandas-summary` CLI flag | Optionally create pandas-generated summary CSVs |
| `scripts/inspect_database.py` | Terminal script to verify and query saved database results |
| Additional tests | Database, pandas, and inspection-script coverage |
| Documentation & repo hygiene | Checkpoint docs, limitations docs, public/private data separation |

Version 2 strengthens the project as **data-analysis portfolio evidence** (SQLite schema design, SQL inserts/queries, pandas grouping/sorting) without changing the underlying matching logic.

---

## 6. Technical skills demonstrated

**Python fundamentals**

- File I/O with `pathlib`
- JSON loading and dictionary/list processing
- Functions, modules, and imports
- Command-line argument parsing
- Input validation and clear error handling patterns

**Software engineering**

- Modular project layout (`src/`, `tests/`, `scripts/`, `data/`, `docs/`)
- Separation of analysis logic, output writers, storage, and CLI orchestration
- Git workflow with feature branches and documentation checkpoints
- `.gitignore` design for private inputs and generated artifacts

**Data analysis**

- CSV reading and writing (stdlib and pandas)
- pandas DataFrames for grouping, sorting, and summary tables
- SQLite table design with related records (runs → jobs → gaps)
- SQL inserts and query helpers for recurring-gap analysis

**Testing and documentation**

- Multi-file test runner (`run_tests.py`)
- Tests for logic, outputs, CLI, validation, database, pandas, and inspection script
- README, limitations docs, smoke-test commands, and learning log

**Responsible scope**

- Clear documentation of what the tool cannot do
- Public sample data vs private local inputs
- No overclaiming of AI capabilities or production readiness

---

## 7. Current inputs and outputs

### Inputs

| Path | Role |
|------|------|
| `data/resume/sample_resume.txt` | Public sample resume (default) |
| `data/sample_jobs/` | Public sample job descriptions (default) |
| `data/skills_taxonomy.json` | Official skills grouped by category |
| `data/skill_aliases.json` | Alternate phrases mapped to official skill names |
| `data/resume/resume.txt` | Private local resume (Git-ignored) |
| `data/jobs/*.txt` | Private local job descriptions (Git-ignored) |

Private inputs are used via CLI flags, for example:

```bash
python3 src/main.py --resume data/resume/resume.txt --jobs data/jobs
```

### Standard outputs (always written to `data/outputs/` by default)

| File | Contents |
|------|----------|
| `gap_report.md` | Human-readable report: resume skills, per-job skills, gaps, recurring gaps |
| `gap_summary.csv` | One row per missing skill per job (`job_name`, `category`, `gap_skill`) |
| `recurring_gaps.csv` | Gap frequency across jobs (`gap_skill`, `category`, `count`) |

### Optional outputs

| File | When created |
|------|--------------|
| `gap_categories_pandas.csv` | `--pandas-summary` — gap counts by category |
| `top_recurring_gaps_pandas.csv` | `--pandas-summary` — sorted top recurring gaps |
| `analysis_results.db` | `--database` — SQLite file with runs, job results, and skill gaps |

Generated outputs and database files are Git-ignored and should not be committed, especially when based on private data.

---

## 8. SQLite / database functionality

When `--database` is provided, the analyzer saves structured results to a local SQLite file.

**Tables (conceptual model):**

- **analysis_runs** — one row per CLI run (timestamp, input paths, job count)
- **job_results** — one row per job analyzed (filename, matched/missing counts)
- **skill_gaps** — one row per missing skill per job (skill name, category)

**What this enables:**

- Persist analysis history across runs on my local machine
- Query recurring gaps with SQL
- Identify which jobs produced the most missing skills
- Inspect results via `scripts/inspect_database.py`

SQLite is optional. The default CLI run works fully without a database. The database layer is a storage and query extension — it does not change how skills are matched.

---

## 9. pandas / data-analysis functionality

pandas is the project's only external dependency (`requirements.txt`). It is used in a controlled, optional way:

- Load existing gap CSV files into DataFrames
- Group gaps by category and count totals
- Sort and export top recurring gaps
- Write two optional summary CSV files when `--pandas-summary` is used

Core analysis and CSV writing in Version 1 use Python's standard library. pandas adds a practical summary layer on top of data the tool already produces — useful for portfolio evidence of tabular data handling without making pandas required for the base workflow.

---

## 10. Testing and validation

Tests are run with:

```bash
python3 run_tests.py
```

The suite includes seven test modules:

| Test file | Focus |
|-----------|-------|
| `test_core_logic.py` | Skill extraction, gap comparison, recurring gap counting |
| `test_output_writers.py` | Markdown and CSV output writing |
| `test_cli.py` | Command-line behavior |
| `test_validation.py` | Input path and file validation |
| `test_database.py` | SQLite table creation, inserts, and queries |
| `test_pandas_summary.py` | pandas summary helpers and CLI integration |
| `test_inspect_database.py` | Database inspection script behavior |

Tests use Python's built-in testing patterns (not pytest). A documented smoke-test sequence in `docs/VERSION_2_TEST_COMMANDS.md` covers the full CLI workflow including optional SQLite and pandas flags.

---

## 11. Privacy / public repo design

This project is public on GitHub but meant to support private real resumes and job postings locally.

**Design choices:**

- **Public by default:** `data/resume/sample_resume.txt` and `data/sample_jobs/` are safe sample inputs tracked in Git.
- **Private locally:** `data/resume/resume.txt` and `data/jobs/*.txt` are listed in `.gitignore`.
- **Generated artifacts ignored:** `data/outputs/*.md`, `data/outputs/*.csv`, and `*.db` files are ignored.
- **Explicit CLI paths:** Private analysis requires passing `--resume` and `--jobs` explicitly.

This layout keeps the repo shareable for portfolio review while reducing the risk of committing personal application materials or private analysis outputs.

---

## 12. Current limitations

The analyzer uses **rule-based keyword and alias matching**. It does not understand job descriptions semantically.

**It does not:**

- Distinguish required vs preferred skills
- Judge whether resume evidence is strong or weak
- Detect skill level (beginner / intermediate / advanced)
- Recognize transferable experience unless the keyword appears
- Use LLMs, embeddings, or structured AI extraction
- Provide a web UI or deployed service

**Matching limitations:**

- **False negatives:** A job may require API experience described without the exact phrase "rest api" unless an alias exists.
- **False positives:** A skill mentioned once on a resume is treated as present, regardless of depth.

Optional SQLite and pandas features store and summarize results; they do not add semantic understanding.

For full detail, see [`docs/LIMITATIONS.md`](LIMITATIONS.md).

---

## 13. Future directions

Planned directions (not yet implemented):

- **Better matching logic** — reduce false positives/negatives within a still-rule-based approach
- **Required vs preferred detection** — simple heuristics before any AI layer
- **Richer sample data** — more public job descriptions in `data/sample_jobs/`
- **pytest migration** — modernize the test runner while keeping coverage
- **Private web UI** — long-term idea for uploading job descriptions, selecting a master resume, viewing fit/gaps, and tracking runs over time (e.g. on a personal site); would reuse the existing separation between analysis logic, storage, and interface
- **Structured extraction phase** — only after the core workflow remains stable and well-documented; would require responsible-AI considerations

The project deliberately avoids scope creep into deployment, authentication, or advanced AI until the fundamentals are solid.

---

## 14. Honest resume / LinkedIn positioning

Below are accurate ways to describe this project. Wording can be adapted to fit a resume bullet, LinkedIn project entry, or interview talking point.

### Short description (1–2 sentences)

Built a Python CLI tool that compares internship job descriptions against a resume using a JSON skills taxonomy, identifies recurring skill gaps, and exports markdown/CSV reports with optional SQLite persistence and pandas summaries.

### Resume bullet examples

- Developed a Python command-line internship fit analyzer that matches resume and job-description text against a configurable skills taxonomy, identifies missing skills and recurring gaps, and exports markdown/CSV reports.
- Extended the tool with optional SQLite storage (analysis runs, job results, skill gaps) and pandas summary outputs, plus a test suite covering core logic, CLI behavior, database, and data-analysis helpers.
- Designed a public/private data layout with Git-ignored local inputs and generated outputs to keep the repo portfolio-safe while supporting real application materials locally.

### What to say in an interview

- "It's rule-based keyword matching, not AI — I wanted to build a working pipeline first and document what it can and can't do."
- "Version 1 proved the analysis workflow; Version 2 added SQLite and pandas so I could practice structured storage and tabular summaries."
- "I separated core logic from outputs and storage so a future web UI could call the same analysis without rewriting everything."
- "I treat the output as a first-pass guide for learning priorities, not a hiring decision."

### What **not** to claim

- "AI-powered job matching" or "semantic resume analysis"
- "Production-ready" or "deployed application"
- "LLM/RAG integration" (taxonomy includes related terms as skills to detect, but the tool does not call external AI APIs)
- "Automated resume optimization" or "guaranteed fit scoring"

### Skills keywords (accurate)

Python · CLI development · file I/O · JSON · CSV · SQLite · SQL · pandas · software testing · Git · documentation · data analysis · responsible scope · portfolio project

---

## Related documentation

| Document | Purpose |
|----------|---------|
| [`README.md`](../README.md) | Setup, usage, and command reference |
| [`docs/LIMITATIONS.md`](LIMITATIONS.md) | Detailed limitations and privacy notes |
| [`docs/VERSION_2_CHECKPOINT.md`](VERSION_2_CHECKPOINT.md) | Version 2 feature summary |
| [`docs/VERSION_2_TEST_COMMANDS.md`](VERSION_2_TEST_COMMANDS.md) | Smoke-test command sequence |
| [`docs/VERSION_1_CHECKLIST.md`](VERSION_1_CHECKLIST.md) | Historical Version 1 milestone |
