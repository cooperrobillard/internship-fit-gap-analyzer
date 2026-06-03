# Internship Fit & Skill-Gap Analyzer

A pure-Python tool that compares internship job descriptions against a resume, identifies skill gaps, and summarizes recurring learning priorities across multiple roles.

This project is being built as both a practical internship-search tool and a learning project to strengthen my Python, software-development, testing, documentation, and data-analysis fundamentals.

## Current status

Version 2 now includes optional SQLite and pandas features.

The project can:

* run the original pure-Python analysis,
* generate markdown and CSV outputs,
* optionally save analysis results to a SQLite database,
* optionally generate pandas-based summary CSV files.

It still does not use OpenAI API, Streamlit, FastAPI, Docker, or RAG.

The project currently:

* reads a resume from a text file,
* reads multiple job descriptions from a folder,
* loads a skills taxonomy from JSON,
* loads skill aliases from JSON,
* finds skills mentioned in the resume and job descriptions,
* compares job skills against resume skills,
* identifies missing skills for each job,
* counts recurring gaps across all jobs,
* writes a markdown gap report,
* writes CSV summary files,
* prints a clean terminal summary,
* includes tests for core logic, output writers, CLI behavior, input validation, database output, and pandas summaries.

## Project structure

```text
internship-fit-gap-analyzer/
  data/
    jobs/
      private local job files go here
    sample_jobs/
      sample_job_1.txt
      sample_job_2.txt
    outputs/
      gap_report.md
      gap_summary.csv
      recurring_gaps.csv
    resume/
      sample_resume.txt
      resume.txt
    skill_aliases.json
    skills_taxonomy.json
  docs/
    LIMITATIONS.md
  src/
    compare_resume.py
    console_summary.py
    csv_writer.py
    database.py
    extract_keywords.py
    main.py
    pandas_summary.py
    report_writer.py
    summarize_gaps.py
  tests/
    test_cli.py
    test_core_logic.py
    test_database.py
    test_output_writers.py
    test_pandas_summary.py
    test_validation.py
  LEARNING_LOG.md
  README.md
  requirements.txt
  run_tests.py
```

## How it works

At a high level, the project follows this flow:

```text
resume text + job descriptions + skills taxonomy + skill aliases
→ find skills in resume
→ find skills in each job description
→ compare job skills against resume skills
→ identify gaps
→ count recurring gaps
→ write markdown and CSV outputs
→ optionally save to SQLite
→ optionally write pandas summary CSV files
```

## Setup

This project uses Python 3.

Install dependencies with:

```bash
python3 -m pip install -r requirements.txt
```

The main external dependency is:

* pandas

## Input files

### `data/resume/sample_resume.txt`

This file contains the safe sample resume used by default.

### `data/resume/resume.txt`

This file can be used locally for a private real resume. This file is ignored by Git.

### `data/sample_jobs/`

This folder contains safe sample job descriptions that are tracked in Git and used by default.

### `data/jobs/`

This folder can be used locally for private real job descriptions. Files in this folder are ignored by Git.

### `data/skills_taxonomy.json`

This file defines the official skills the analyzer looks for.

Example:

```json
{
  "programming": ["python", "matlab", "typescript", "javascript", "java"],
  "data": ["sql", "pandas", "jupyter", "excel"]
}
```

### `data/skill_aliases.json`

This file defines alternate phrases for official skill names.

Example:

```json
{
  "fastapi": ["fastapi", "fast api"],
  "rag": ["rag", "retrieval-augmented generation", "retrieval augmented generation"]
}
```

The official skill name is what appears in the output. The aliases are extra phrases the program searches for.

## Source files

### `src/main.py`

Controls the full program workflow.

It reads command-line options, validates inputs, loads files, analyzes jobs, writes outputs, and prints the terminal summary.

### `src/extract_keywords.py`

Finds taxonomy skills in a block of text.

It uses skill aliases and basic pattern matching to reduce some false matches.

### `src/compare_resume.py`

Compares job skills against resume skills and returns the missing skills.

### `src/summarize_gaps.py`

Counts how often each missing skill appears across all analyzed jobs.

### `src/report_writer.py`

Writes the markdown report:

```text
data/outputs/gap_report.md
```

### `src/csv_writer.py`

Writes CSV output files:

```text
data/outputs/gap_summary.csv
data/outputs/recurring_gaps.csv
```

### `src/console_summary.py`

Prints a clean terminal summary after the analysis runs.

### `src/database.py`

Provides optional SQLite helpers for saving analysis runs, job-level results, and skill gaps.

### `src/pandas_summary.py`

Provides optional pandas helpers for loading gap CSV data and writing extra summary CSV files.

## How to run

From the project root folder, run:

```bash
python3 src/main.py
```

By default, the analyzer runs on the sample resume and sample job descriptions.

To run it with private local inputs:

```bash
python3 src/main.py --resume data/resume/resume.txt --jobs data/jobs
```

Expected terminal output will look similar to:

```text
Analysis complete.

Jobs analyzed: 2

Top recurring gaps:
1. sql (data): 2 job(s)
2. langchain (ai_ml): 2 job(s)

Output files:
- data/outputs/gap_report.md
- data/outputs/gap_summary.csv
- data/outputs/recurring_gaps.csv
```

## Command-line options

The project supports optional command-line arguments.

Show help:

```bash
python3 src/main.py --help
```

Show only the top 3 recurring gaps in the terminal:

```bash
python3 src/main.py --top-gaps 3
```

Use a custom output folder:

```bash
python3 src/main.py --outputs data/outputs_test
```

Use private local inputs:

```bash
python3 src/main.py --resume data/resume/resume.txt --jobs data/jobs
```

Save analysis results to a SQLite database:

```bash
python3 src/main.py --database data/outputs/analysis_results.db
```

When `--database` is provided, the analyzer saves the run, job-level results, and skill gaps to a local SQLite database file.

Create extra pandas-generated summary files:

```bash
python3 src/main.py --pandas-summary
```

This creates two additional CSV files:

```text
data/outputs/gap_categories_pandas.csv
data/outputs/top_recurring_gaps_pandas.csv
```

Use SQLite and pandas summaries together:

```bash
python3 src/main.py --database data/outputs/analysis_results.db --pandas-summary
```

Available options include:

```text
--resume
--jobs
--taxonomy
--aliases
--outputs
--top-gaps
--database
--pandas-summary
```

Short descriptions:

* `--resume` — path to the resume text file
* `--jobs` — path to the folder containing job description `.txt` files
* `--taxonomy` — path to the skills taxonomy JSON file
* `--aliases` — path to the skill aliases JSON file
* `--outputs` — path to the folder where output files should be saved
* `--top-gaps` — number of top recurring gaps to show in the terminal summary
* `--database` — optional path to a SQLite database file where analysis results should be saved
* `--pandas-summary` — create extra pandas-generated summary CSV files

## Output files

### `data/outputs/gap_report.md`

A human-readable markdown report showing:

* most common skill gaps,
* skills found in the resume,
* skills found in each job,
* gaps for each job.

### `data/outputs/gap_summary.csv`

A detailed CSV file with one row per missing skill per job.

Columns:

```text
job_name,category,gap_skill
```

### `data/outputs/recurring_gaps.csv`

A summary CSV file showing which missing skills appear most often across job descriptions.

Columns:

```text
gap_skill,category,count
```

### `data/outputs/gap_categories_pandas.csv`

A pandas-generated CSV that counts total gaps by category. Created only when `--pandas-summary` is used.

Columns:

```text
category,gap_count
```

### `data/outputs/top_recurring_gaps_pandas.csv`

A pandas-generated CSV showing the top recurring gaps. Created only when `--pandas-summary` is used.

Columns:

```text
gap_skill,category,count
```

### `data/outputs/analysis_results.db`

An optional SQLite database file created only when `--database` is used.

This stores:

* analysis runs,
* job-level results,
* skill gaps.

## How to run tests

Run all tests:

```bash
python3 run_tests.py
```

This runs:

```text
tests/test_core_logic.py
tests/test_output_writers.py
tests/test_cli.py
tests/test_validation.py
tests/test_database.py
tests/test_pandas_summary.py
```

The tests currently check:

* skill matching,
* gap comparison,
* recurring gap counting,
* markdown and CSV output writing,
* command-line behavior,
* input validation,
* SQLite database output,
* pandas summary helpers and CLI behavior.

Expected final output:

```text
All tests passed.
```

## Commands to test

After updating `src/main.py` and `README.md`, run the default sample-data version:

```bash
python3 src/main.py
```

Then run the tests:

```bash
python3 run_tests.py
```

## Current limitations

This version uses rule-based keyword matching.

That means it can miss skills if a job description uses wording that is not included in the taxonomy or alias file.

It can also make imperfect matches because it does not truly understand meaning or context.

Current limitations include:

* does not distinguish required skills from preferred skills,
* does not evaluate how strong resume evidence is,
* does not understand synonyms unless they are manually added as aliases,
* does not use AI extraction yet,
* does not have a dashboard yet.

The output should be treated as a helpful first-pass analysis, not a final judgment.

## Limitations documentation

A more detailed explanation of the tool's current limitations is available in:

```text
docs/LIMITATIONS.md
```

## Learning purpose

This project is being built to improve my understanding of:

* Python fundamentals,
* file paths,
* reading and writing files,
* JSON,
* dictionaries,
* lists,
* functions,
* loops,
* imports,
* command-line arguments,
* CSV writing,
* simple testing,
* project organization,
* documentation,
* Git/GitHub workflow.

AI tools are helping me build and understand the code, but I am using the project to learn how the system works piece by piece and to develop more independent software-development fluency.

## Limitations

This is a rule-based Version 1 MVP. It uses keyword and alias matching to identify skills, so it does not fully understand job descriptions or evaluate the strength of resume evidence.

For a more detailed explanation, see [LIMITATIONS.md](LIMITATIONS.md).

## Planned next steps

Possible next improvements:

* clean up sample data,
* add more realistic job descriptions,
* improve matching accuracy,
* convert tests to pytest,
* add OpenAI API structured extraction,
* add responsible AI / limitations documentation,
* build a Streamlit dashboard.

The project will only move to later phases after the current version is stable and understandable.
