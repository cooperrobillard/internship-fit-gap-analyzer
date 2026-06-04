# Version 2 Checkpoint

This document summarizes the current state of Version 2 of the Internship Fit & Skill-Gap Analyzer.

For smoke-test commands, see [`VERSION_2_TEST_COMMANDS.md`](VERSION_2_TEST_COMMANDS.md). For limitations, see [`LIMITATIONS.md`](LIMITATIONS.md).

## Data layout

| Path | Role |
|------|------|
| `data/resume/sample_resume.txt` | Public sample resume (default) |
| `data/sample_jobs/` | Public sample job descriptions (default) |
| `data/resume/resume.txt` | Private local resume (Git-ignored) |
| `data/jobs/` | Private local job descriptions (Git-ignored; use `--jobs data/jobs`) |
| `data/outputs/` | Generated reports, CSVs, and optional SQLite DB (Git-ignored) |

## Version 2 goal

Version 2 builds on the pure-Python Version 1 MVP by adding:

* SQLite storage,
* SQL query helpers,
* optional database output,
* pandas-based summaries,
* optional pandas summary output,
* a database inspection script.

The goal is to strengthen the project as a data-analysis and software portfolio project while keeping the code understandable.

## Current Version 2 features

### SQLite

The project can now optionally save analysis results to a SQLite database.

The database stores:

* analysis runs,
* job-level results,
* individual skill gaps.

The SQLite database is created only when the user provides the `--database` option.

Example:

```bash
python3 src/main.py --database data/outputs/analysis_results.db
```

### Database helpers

The project includes database helper functions for:

* creating database tables,
* inserting analysis runs,
* inserting job results,
* inserting skill gaps,
* saving a full analysis result,
* querying recurring gaps,
* querying jobs with the most gaps.

### Database inspection script

The project includes a standalone script for inspecting a generated SQLite database.

Example:

```bash
python3 scripts/inspect_database.py data/outputs/analysis_results.db
```

This helps verify that analysis results were saved correctly.

### pandas

The project now uses pandas in a controlled way.

The pandas helpers can:

* load recurring gaps CSV data,
* load detailed gap summary CSV data,
* find top recurring gaps,
* summarize gaps by category,
* write pandas-generated summary CSV files.

### Optional pandas CLI output

The project can optionally create pandas-generated summary outputs.

Example:

```bash
python3 src/main.py --pandas-summary
```

This creates:

```text
data/outputs/gap_categories_pandas.csv
data/outputs/top_recurring_gaps_pandas.csv
```

## Commands that should work

Run the analyzer with default sample data:

```bash
python3 src/main.py
```

Run with optional SQLite output:

```bash
python3 src/main.py --database data/outputs/analysis_results.db
```

Run with optional pandas summary output:

```bash
python3 src/main.py --pandas-summary
```

Run with both SQLite and pandas output:

```bash
python3 src/main.py --database data/outputs/analysis_results.db --pandas-summary
```

Inspect a generated SQLite database:

```bash
python3 scripts/inspect_database.py data/outputs/analysis_results.db
```

Run all tests:

```bash
python3 run_tests.py
```

## Current source files added in Version 2

Version 2 added or significantly expanded:

```text
src/database.py
src/pandas_summary.py
scripts/inspect_database.py
tests/test_database.py
tests/test_pandas_summary.py
tests/test_inspect_database.py
requirements.txt
```

## Current outputs

The original outputs are still:

```text
data/outputs/gap_report.md
data/outputs/gap_summary.csv
data/outputs/recurring_gaps.csv
```

Optional pandas outputs are:

```text
data/outputs/gap_categories_pandas.csv
data/outputs/top_recurring_gaps_pandas.csv
```

Optional SQLite output is:

```text
data/outputs/analysis_results.db
```

Generated outputs and database files should not be committed to Git.

## What Version 2 does well now

Version 2 now shows evidence of:

* Python file handling,
* JSON loading,
* CSV writing,
* CLI arguments,
* input validation,
* testing,
* SQLite database design,
* SQL inserts,
* SQL queries,
* pandas DataFrame loading,
* pandas sorting,
* pandas grouping,
* documentation,
* Git branch workflow.

## Current limitations

The analyzer still uses rule-based keyword and alias matching.

It still does not:

* truly understand job descriptions,
* distinguish required skills from preferred skills,
* evaluate strength of resume evidence,
* detect beginner/intermediate/advanced skill level,
* use OpenAI API,
* use Streamlit,
* use FastAPI,
* use Docker,
* use RAG.

## Possible next steps

Good next options include:

1. Improve CLI polish and error handling.
2. Add tests for combined `--database` and `--pandas-summary` usage.
3. Add a small project demo script.
4. Improve sample data.
5. Add better documentation screenshots or example outputs.
6. Begin planning a future AI extraction phase, without implementing it yet.

## Version 2 status

Version 2 is now a meaningful data-analysis upgrade over Version 1.

The project can run the original analyzer, optionally save results to SQLite, optionally create pandas summaries, inspect saved database results, and pass the test suite.
