# Version 2 Plan: Pandas + SQLite

> **Note:** This document is historical planning from before Version 2 was implemented. For the current project status, see [`docs/VERSION_2_CHECKPOINT.md`](docs/VERSION_2_CHECKPOINT.md).

Version 1 is a working pure-Python MVP. It reads a resume, reads job descriptions, finds skill matches, identifies missing skills, summarizes recurring gaps, and writes markdown/CSV outputs.

Version 2 will build on that foundation by adding basic data storage and data analysis tools.

## Version 2 goal

The goal of Version 2 is to make the project stronger as a data-analysis and software portfolio project by adding:

- SQLite for storing analysis results
- SQL queries for recurring gap analysis
- pandas for cleaner summaries and tables
- better tracking of analysis runs over time

Version 2 should still avoid advanced features like OpenAI API, Streamlit, FastAPI, Docker, and RAG until the pandas + SQLite workflow is stable and understandable.

## Why add SQLite?

Right now, the project writes output files, but it does not store past analysis results in a structured database.

SQLite will let the project save results from each run so they can be queried later.

This will make it possible to ask questions like:

- Which skills are missing most often across all jobs?
- Which categories have the most gaps?
- How many jobs were analyzed in a specific run?
- Did recurring gaps change after updating the resume?
- Which job descriptions produced the most missing skills?

## Why add pandas?

Right now, the project manually creates summaries using dictionaries and CSV writing.

pandas will make it easier to:

- load tabular data,
- summarize gap frequency,
- group results by skill or category,
- sort results,
- export cleaner CSV files,
- eventually prepare data for charts or dashboards.

## Proposed SQLite tables

These table designs may change as Version 2 develops, but they give us a starting point.

### 1. analysis_runs

Stores one row each time the analyzer runs.

Possible columns:

| Column | Meaning |
|---|---|
| id | Unique ID for the run |
| run_timestamp | Date and time when the analysis was run |
| resume_path | Path to the resume file used |
| jobs_path | Path to the jobs folder used |
| taxonomy_path | Path to the skills taxonomy file used |
| aliases_path | Path to the skill aliases file used |
| total_jobs | Number of jobs analyzed |

### 2. job_results

Stores one row for each job analyzed during a run.

Possible columns:

| Column | Meaning |
|---|---|
| id | Unique ID for this job result |
| run_id | Links this job result to an analysis run |
| job_filename | Name of the job description file |
| matched_skills_count | Number of skills found in the job description |
| missing_skills_count | Number of job skills not found in the resume |

### 3. skill_gaps

Stores one row for each missing skill found in each job.

Possible columns:

| Column | Meaning |
|---|---|
| id | Unique ID for this gap row |
| run_id | Links this gap to an analysis run |
| job_filename | Name of the job description file |
| skill | Missing skill name |
| category | Skill category from the taxonomy |

## Example relationship

One analysis run can have many job results.

One job result can have many skill gaps.

For example:

```text
analysis_runs
  id: 1

job_results
  run_id: 1
  job_filename: sample_job_1.txt

skill_gaps
  run_id: 1
  job_filename: sample_job_1.txt
  skill: sql
  category: data
Version 2 development steps

The planned steps are:

Create a small database module.
Learn how to connect to SQLite from Python.
Create the first SQLite database file.
Create the analysis_runs, job_results, and skill_gaps tables.
Insert one analysis run into the database.
Insert job-level results into the database.
Insert missing skills into the database.
Query recurring gaps using SQL.
Add tests for database behavior.
Add pandas summaries after the SQLite workflow works.
What Version 2 should not do yet

Version 2 should not add:

OpenAI API
Streamlit dashboard
FastAPI backend
Docker
RAG
authentication
cloud deployment
complex natural language understanding

Those may be useful later, but they are not needed until the data storage and analysis foundation is stronger.

Success criteria

Version 2 will be successful when the project can:

run the existing analysis,
save results to SQLite,
query recurring gaps from SQLite,
summarize results with pandas,
keep all existing Version 1 behavior working,
pass all tests,
remain understandable to a beginner Python learner.

---

# Explanation

This is still a **real development step**, even though it is not Python code yet.

Before adding a database, you need to understand what information belongs in the database.

Important concepts:

| Concept | Meaning |
|---|---|
| Database | A structured place to store data |
| SQLite | A simple database stored in a local file |
| Table | A spreadsheet-like structure inside a database |
| Row | One record in a table |
| Column | One field/category of information in a table |
| Primary key | A unique ID for a row |
| Relationship | A connection between rows in different tables |
| `run_id` | A value that connects job results and skill gaps back to one analysis run |

The most important idea is this:

```text
One run -> many jobs -> many skill gaps

That is the structure Version 2 will build around.