# Version 1 MVP Checklist

This document tracks whether the pure-Python MVP is complete enough to move toward the next phase of the Internship Fit & Skill-Gap Analyzer project.

## Version 1 goal

Version 1 should be a simple pure-Python command-line tool that:

* reads my resume from a text file,
* reads job descriptions from a folder,
* loads a skills taxonomy from JSON,
* loads skill aliases from JSON,
* finds skills in the resume and job descriptions,
* compares job skills against resume skills,
* identifies missing skills,
* summarizes recurring gaps,
* writes markdown and CSV outputs,
* includes basic tests,
* includes clear documentation.

Version 1 should not depend on pandas, SQLite, OpenAI API, Streamlit, FastAPI, Docker, or RAG.

## Current input files

Public sample inputs used by default:

* [x] `data/resume/sample_resume.txt`
* [x] `data/sample_jobs/sample_ai_engineering_internship.txt`
* [x] `data/skills_taxonomy.json`
* [x] `data/skill_aliases.json`

Private local inputs supported through command-line options:

* [x] `data/resume/resume.txt`
* [x] `data/jobs/`

## Current source files

* [x] `src/main.py`
* [x] `src/extract_keywords.py`
* [x] `src/compare_resume.py`
* [x] `src/summarize_gaps.py`
* [x] `src/report_writer.py`
* [x] `src/csv_writer.py`
* [x] `src/console_summary.py`

## Current output files

* [x] `data/outputs/gap_report.md`
* [x] `data/outputs/gap_summary.csv`
* [x] `data/outputs/recurring_gaps.csv`

## Current tests

* [x] `tests/test_core_logic.py`
* [x] `tests/test_output_writers.py`
* [x] `tests/test_cli.py`
* [x] `tests/test_validation.py`
* [x] `run_tests.py`

## Commands that should work

Run the analyzer:

```bash
python3 src/main.py
```

Run the analyzer with fewer terminal gaps:

```bash
python3 src/main.py --top-gaps 3
```

Show command-line help:

```bash
python3 src/main.py --help
```

Run all tests:

```bash
python3 run_tests.py
```

## What Version 1 currently does well

* Loads project inputs from text and JSON files.
* Uses a clear skills taxonomy.
* Supports skill aliases for alternate wording.
* Finds basic keyword matches in resumes and job descriptions.
* Compares job skills against resume skills.
* Generates a readable markdown report.
* Generates structured CSV outputs.
* Summarizes recurring gaps across multiple jobs.
* Prints a useful terminal summary.
* Has basic tests for logic, output files, CLI behavior, and input validation.
* Has a README and learning log.

## Current limitations

* Matching is still rule-based and keyword-based.
* The tool does not truly understand job descriptions.
* It does not distinguish required skills from preferred skills.
* It does not measure how strong the resume evidence is.
* It does not know whether a skill is beginner, intermediate, or advanced.
* It can miss skills if the wording is not in the taxonomy or aliases.
* It can still make imperfect matches.
* It does not store previous runs in a database.
* It does not use pandas yet.
* It does not use OpenAI API structured extraction yet.
* It does not have a dashboard yet.

## Before moving to Version 2

Before adding pandas or SQLite, I confirmed:

* [x] `python3 src/main.py` works.
* [x] `python3 src/main.py --help` works.
* [x] `python3 src/main.py --top-gaps 3` works.
* [x] `python3 run_tests.py` passes.
* [x] `README.md` matches the current project.
* [x] `LEARNING_LOG.md` is up to date.
* [x] Output files are readable and useful.
* [x] The sample job descriptions are realistic enough for testing.
* [x] I can explain what each source file does.
* [x] I can explain the overall input → analysis → output flow.

## Possible final Version 1 cleanup tasks

These are optional before moving to Version 2:

* Add one or two more real job descriptions.
* Improve the skills taxonomy with more realistic categories.
* Add more aliases for common wording differences.
* Add a small `examples/` folder.
* Add a short limitations document.
* Convert the manual tests to `pytest`.

## Version 2 direction

The likely next major phase is pandas and SQLite.

Version 2 should probably focus on:

* storing job analysis results in SQLite,
* querying recurring gaps with SQL,
* using pandas to summarize gap frequency,
* creating cleaner tables,
* improving the project’s data-analysis evidence.

Do not start Version 2 until Version 1 is stable, tested, documented, and understandable.

## Version 1 status

Version 1 is complete enough to serve as a working pure-Python MVP.

The project can be run from the command line, uses safe sample inputs by default, supports private local inputs through command-line options, generates markdown and CSV outputs, includes tests, and documents its current limitations.

The next major phase should be Version 2: adding pandas and SQLite in small steps.