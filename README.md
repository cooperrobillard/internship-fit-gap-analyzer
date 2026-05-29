# Internship Fit & Skill-Gap Analyzer

A beginner-friendly Python project that compares internship job descriptions against my resume to identify skill gaps and recurring learning priorities.

The goal of this project is not just to make a finished tool. The goal is to build real Python and software-development understanding while creating honest portfolio evidence for internship and co-op applications.

## What the project does

The current version:

* reads my resume from a text file,
* reads job descriptions from a folder,
* loads a skills taxonomy from JSON,
* uses keyword matching to find skills in the resume and job descriptions,
* compares job skills against resume skills,
* identifies missing skills,
* writes a markdown gap report,
* writes a CSV file of all missing skills,
* writes a CSV file summarizing recurring gaps across jobs.

## Current version

This is the pure-Python MVP.

It does not use:

* OpenAI API,
* pandas,
* SQLite,
* Streamlit,
* FastAPI,
* Docker,
* RAG,
* vector databases.

Those may be added later after the basic version is working and understood.

## Project structure

```text
internship-fit-gap-analyzer/
  data/
    jobs/
      sample_job_1.txt
      sample_job_2.txt
    outputs/
      gap_report.md
      gap_summary.csv
      recurring_gaps.csv
    resume/
      resume.txt
    skill_aliases.json
    skills_taxonomy.json
  src/
    compare_resume.py
    csv_writer.py
    extract_keywords.py
    main.py
    report_writer.py
    summarize_gaps.py
  tests/
  LEARNING_LOG.md
  README.md
```

## Input files

### `data/resume/resume.txt`

This file contains the resume text that the analyzer compares against job descriptions.

### `data/jobs/`

This folder contains job descriptions as `.txt` files.

Each `.txt` file is treated as one job posting.

### `data/skills_taxonomy.json`

This file defines which skills the analyzer looks for.

Example:

```json
{
  "programming": ["python", "matlab", "typescript", "javascript", "java"],
  "data": ["sql", "pandas", "jupyter", "excel"]
}
```

### `data/skill_aliases.json`

This file defines alternate phrases for certain skills.

Example:

```json
{
  "fastapi": ["fastapi", "fast api"],
  "rag": ["rag", "retrieval-augmented generation", "retrieval augmented generation"]
}
```

The official skill name is what appears in the report. The aliases are extra phrases the program searches for.

## Source files

### `src/main.py`

Controls the full workflow.

It loads the resume, taxonomy, aliases, and job descriptions, then calls the helper functions that perform the analysis and write the outputs.

### `src/extract_keywords.py`

Finds skills from the taxonomy that appear in a block of text.

This is used for both the resume and job descriptions.

### `src/compare_resume.py`

Compares skills found in a job description against skills found in the resume.

It returns the skills that appear in the job description but not in the resume.

### `src/summarize_gaps.py`

Counts how often each missing skill appears across all analyzed jobs.

This helps identify recurring skill gaps.

### `src/report_writer.py`

Writes the markdown report at:

```text
data/outputs/gap_report.md
```

### `src/csv_writer.py`

Writes CSV output files:

```text
data/outputs/gap_summary.csv
data/outputs/recurring_gaps.csv
```

## How to run

From the project root folder, run:

```bash
python3 src/main.py
```

Expected terminal output:

```text
Gap report written to data/outputs/gap_report.md
Gap CSV written to data/outputs/gap_summary.csv
Recurring gaps CSV written to data/outputs/recurring_gaps.csv
```

## Output files

### `data/outputs/gap_report.md`

A human-readable markdown report showing:

* skills found in the resume,
* skills found in each job description,
* skill gaps for each job,
* most common recurring skill gaps.

### `data/outputs/gap_summary.csv`

A detailed CSV file with one row per missing skill per job.

Columns:

```text
job_name, category, gap_skill
```

### `data/outputs/recurring_gaps.csv`

A summary CSV file showing which missing skills appear most often across jobs.

Columns:

```text
gap_skill, category, count
```

## Current limitations

This version uses rule-based keyword matching.

That means it can miss skills if a job uses wording that is not in the taxonomy or alias file.

It can also make imperfect matches because it does not truly understand the meaning of the text.

For example:

* it may miss a skill if the wording is too different,
* it does not distinguish required skills from preferred skills yet,
* it does not judge skill strength,
* it does not understand whether resume evidence is strong or weak,
* it does not use AI extraction yet.

The output should be treated as a helpful first-pass analysis, not a final judgment.

## Learning purpose

This project is being built to improve my understanding of:

* Python basics,
* file paths,
* reading and writing files,
* JSON,
* dictionaries,
* lists,
* functions,
* loops,
* imports,
* CSV writing,
* basic text matching,
* project organization,
* documentation,
* Git/GitHub workflow.

AI tools are helping me write and understand the code, but I am using the project to learn how the pieces fit together and to build more independent software-development fluency.

## Planned next steps

Possible next improvements:

* clean up the terminal output,
* add simple tests,
* improve skill matching,
* distinguish required vs. preferred skills,
* add pandas summaries,
* store job results in SQLite,
* add OpenAI API structured extraction,
* build a Streamlit dashboard,
* add responsible AI and limitations documentation.

The project will only move to these later phases after the current pure-Python MVP is working and understandable.
