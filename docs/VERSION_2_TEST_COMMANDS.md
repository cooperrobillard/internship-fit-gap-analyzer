# Version 2 Test Commands

This document lists the main commands used to verify that Version 2 of the Internship Fit & Skill-Gap Analyzer is working correctly.

Version 2 adds optional SQLite database output, optional pandas summary output, and a database inspection script while preserving the original Version 1 command-line behavior.

## 1. Run all tests

```bash
python3 run_tests.py
```

Expected result:

```text
All tests passed.
```

This confirms that the core logic, output writers, CLI behavior, validation logic, database helpers, pandas helpers, and database inspection script are working.

## 2. Run the default analyzer

```bash
python3 src/main.py
```

Expected result:

```text
Analysis complete.
```

This runs the analyzer with the default sample resume and sample job descriptions.

It should create the original output files:

```text
data/outputs/gap_report.md
data/outputs/gap_summary.csv
data/outputs/recurring_gaps.csv
```

## 3. Run with optional pandas summaries

```bash
python3 src/main.py --pandas-summary
```

Expected result:

```text
Analysis complete.
```

This should create the original outputs plus pandas-generated summary files:

```text
data/outputs/gap_categories_pandas.csv
data/outputs/top_recurring_gaps_pandas.csv
```

## 4. Run with optional SQLite database output

```bash
python3 src/main.py --database data/outputs/analysis_results.db
```

Expected result:

```text
Analysis complete.
```

This should create the original outputs plus a SQLite database file:

```text
data/outputs/analysis_results.db
```

The database stores:

* analysis runs,
* job-level results,
* individual skill gaps.

## 5. Inspect the SQLite database

After creating a database file, run:

```bash
python3 scripts/inspect_database.py data/outputs/analysis_results.db
```

Expected result:

```text
Database summary
```

The output should include:

```text
Analysis runs:
Job results:
Skill gaps:
Latest run ID:
Top recurring gaps:
Jobs with most gaps:
```

This confirms that the database file can be opened and queried from the terminal.

## 6. Run with both SQLite and pandas output

```bash
python3 src/main.py --database data/outputs/analysis_results.db --pandas-summary
```

Expected result:

```text
Analysis complete.
```

This confirms that the optional SQLite and pandas features work together.

It should create:

```text
data/outputs/gap_report.md
data/outputs/gap_summary.csv
data/outputs/recurring_gaps.csv
data/outputs/gap_categories_pandas.csv
data/outputs/top_recurring_gaps_pandas.csv
data/outputs/analysis_results.db
```

## 7. Clean up generated database file

Because SQLite database files are generated outputs, they should not be committed to Git.

After testing database output, remove the local database file:

```bash
rm -f data/outputs/analysis_results.db
```

Then check Git status:

```bash
git status
```

Expected result:

```text
nothing to commit, working tree clean
```

## Full Version 2 smoke test sequence

Use this sequence when checking that the project is stable:

```bash
python3 run_tests.py
python3 src/main.py
python3 src/main.py --pandas-summary
python3 src/main.py --database data/outputs/analysis_results.db
python3 scripts/inspect_database.py data/outputs/analysis_results.db
python3 src/main.py --database data/outputs/analysis_results.db --pandas-summary
rm -f data/outputs/analysis_results.db
git status
```

If all commands work and Git status is clean, Version 2 is in a stable state.
