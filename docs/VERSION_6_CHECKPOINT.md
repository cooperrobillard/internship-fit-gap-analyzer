# Version 6 Checkpoint

This document records what **Version 6** accomplished: **read-only saved-analysis comparison and simple decision-support views** in the local Streamlit UI, using the existing local SQLite database from Version 5.

For usage commands, see the [README](../README.md). For the Version 5 persistence baseline, see [`VERSION_5_CHECKPOINT.md`](VERSION_5_CHECKPOINT.md). For limitations, see [`LIMITATIONS.md`](LIMITATIONS.md). For longer-term milestones, see [`PRODUCT_ROADMAP.md`](PRODUCT_ROADMAP.md).

**Status:** Version 6 decision-support work is **complete** as a **localhost-only** milestone. There is **no hosted deployment**, **no authentication**, **no fit scoring**, and **no AI-based matching**.

---

## Version 6 goal

Version 6 focused on **saved-run comparison** and **simple decision support** using the existing local SQLite database (`data/outputs/analysis_results.db`).

It answers:

> After I save multiple analysis runs locally, can I compare two saved job results and see which missing skills recur most often across my saved analyses—without ranking jobs, scoring fit, or adding semantic understanding?

Version 6 does **not** try to become a recommendation engine, hosted product, or multi-user app.

---

## Features completed

### Step 1 — Compare Saved Analyses

Read-only section: **Compare Saved Analyses**.

* Two select boxes: **First saved analysis** and **Second saved analysis**.
* Each option is labeled with job name, run ID, saved timestamp, and **result #** (`job_results.id`) so the same job name saved in different runs stays distinct.
* Underlying selection uses stable **`job_result_id`** values from `job_results.id`.
* When two **different** saved results are selected, the UI shows:
  * first job name,
  * second job name,
  * first missing-skill count,
  * second missing-skill count,
  * **shared missing skills** (alphabetically sorted),
  * **missing skills unique to the first** saved result (sorted),
  * **missing skills unique to the second** saved result (sorted).
* Empty skill groups display **`None`**.
* Comparison language is **descriptive only**—it does not claim one job is a better fit.

**Empty and edge states:**

| State | Behavior |
|-------|----------|
| Database file missing | Friendly info message; no select boxes |
| Fewer than two saved job results | Friendly message that at least two saved analyses are needed; no select boxes |
| Same saved result selected twice | Friendly message asking for two different analyses; no comparison shown |

**Matched-skill comparison:** **Not implemented.** The database stores `matched_skills_count` per job result but does **not** store individual matched skill names. Comparison uses **missing skills only**, read from `skill_gaps`.

### Step 2 — Saved Gap Priority Summary

Read-only section: **Saved Gap Priority Summary**.

* Shows up to **10** recurring missing skills **across all saved job analyses** (not just the latest run).
* For each row:
  * **Skill** name,
  * **Category** (from `skill_gaps.category`),
  * **Saved job results missing this skill** — count of distinct saved job results (`run_id` + `job_filename`),
  * **Example jobs** — distinct `job_filename` values from saved data (or `None` when empty).
* Sorted by recurrence count **descending**, then skill name **alphabetically**.
* Includes descriptive guidance (not a recommendation): *These recurring gaps can help you decide what to study, practice, or build projects around next.*
* Table plus optional text-list expander.

**Empty states:**

| State | Behavior |
|-------|----------|
| Database file missing | Friendly info message |
| Database exists but no `skill_gaps` rows | Friendly message to save an analysis run first |

### Backend helpers added (reused by UI)

| Module | Helper | Role |
|--------|--------|------|
| `src/database.py` | `query_all_saved_job_results()` | List every saved job result with stable IDs for pickers |
| `src/database.py` | `query_missing_skills_for_job_result()` | Missing skill names for one `job_results.id` |
| `src/database.py` | `get_all_saved_job_results()` | File-exists wrapper for comparison pickers |
| `src/database.py` | `get_saved_job_result_for_comparison()` | One saved result + its missing skills |
| `src/database.py` | `query_saved_gap_priorities()` | Recurring gaps across all saved analyses |
| `src/database.py` | `get_saved_gap_priority_summary()` | File-exists / empty-gaps wrapper for priority table |
| `streamlit_app.py` | `compare_skill_collections()` | Pure helper: shared / unique missing-skill sets |
| `streamlit_app.py` | `build_compare_saved_analyses_*()` | Display builders for comparison section |
| `streamlit_app.py` | `build_saved_gap_priority_display()` | Display builder for priority summary |

### Tests

* `tests/test_database.py` — comparison and gap-priority query helpers
* `tests/test_streamlit_app.py` — comparison logic, display builders, empty states (no full browser automation)

---

## Existing behavior preserved

Version 6 preserved all prior workflows:

| Area | Still works |
|------|-------------|
| Sample job analysis | Bundled sample resume + sample job file |
| Pasted job analysis | Paste one job description |
| Resume source selector | Sample or private `data/resume/resume.txt` |
| Optional SQLite save | Checkbox → `data/outputs/analysis_results.db` |
| Saved Analysis History | Run/job/gap counts + latest-run recurring gaps |
| Recent Saved Runs | Up to 10 recent saved job-result rows |
| Saved-run details | Per-row fields in Recent Saved Runs; summary numbers in Saved Analysis History |
| CLI | Folder mode, `--job-file`, `--database`, `--pandas-summary`, reports/CSVs |
| pandas workflows | Optional summary CSVs via CLI |
| Database inspection | `scripts/inspect_database.py` |
| Tests | `python3 run_tests.py` and per-file test modules |

---

## Database behavior

### Tables used

| Table | Version 6 role |
|-------|----------------|
| `analysis_runs` | Run timestamps and metadata; joined for labels |
| `job_results` | Stable **`id`** (`job_result_id`), `run_id`, `job_filename`, matched/missing **counts** |
| `skill_gaps` | Individual **missing** skills (`skill`, `category`) per run and job name |

### What is stored for comparison

* **Missing skills** — one row per missing skill in `skill_gaps` (primary comparison data).
* **Matched skills** — only **`matched_skills_count`** in `job_results`; individual matched skill names are **not** persisted.

### How duplicate job names are distinguished

The same job filename analyzed and saved in different runs gets:

* a unique **`job_results.id`** (result #),
* a distinct **run ID** and **saved timestamp** in the select-box label.

Comparison and gap queries key missing skills by **`run_id` + `job_filename`**, not by job name alone.

### Local and generated

* Default path: `data/outputs/analysis_results.db`
* Created by CLI `--database` or UI save checkbox
* Covered by `.gitignore` (`*.db`) — **do not commit**

---

## How to use Version 6

### Open the local UI

```bash
python3 -m streamlit run streamlit_app.py
```

Opens a browser tab on your machine (typically `http://localhost:8501`). Stop with `Ctrl+C`.

### Simple workflow

1. Open the local UI.
2. Run analysis on a **sample job** or **pasted job** with **Save this analysis to local SQLite database** checked.
3. Repeat for at least one more job (second sample run, pasted job, or CLI save) so you have **two or more** saved job results.
4. Scroll to **Compare Saved Analyses**.
5. Choose **First saved analysis** and **Second saved analysis** (two different results).
6. Review shared and unique missing skills and counts.
7. Scroll to **Saved Gap Priority Summary** to see recurring missing skills across all saved analyses.

### Create sample saved data from the CLI

```bash
python3 src/main.py --database data/outputs/analysis_results.db
python3 src/main.py --job-file data/sample_jobs/sample_ai_engineering_internship.txt --database data/outputs/analysis_results.db
```

Run the command again with a different job file or after pasting/saving from the UI to build comparison data.

### Inspect saved data in the terminal

```bash
python3 scripts/inspect_database.py data/outputs/analysis_results.db
```

---

## Tests and verification

Run from the project root.

### Automated tests

```bash
python3 run_tests.py
```

Optional focused helper tests:

```bash
python3 tests/test_streamlit_app.py
python3 tests/test_database.py
```

Note: `python3 -m unittest discover -s tests -p "test_*.py"` may report **0 tests** because most test files use plain functions rather than `unittest.TestCase`. Use `run_tests.py` or run individual `tests/test_*.py` files directly.

### CLI workflows (must still pass)

```bash
python3 src/main.py
python3 src/main.py --job-file data/sample_jobs/sample_ai_engineering_internship.txt
python3 src/main.py --database data/outputs/analysis_results.db
python3 scripts/inspect_database.py data/outputs/analysis_results.db
```

### Local UI

```bash
python3 -m streamlit run streamlit_app.py
```

**Manual checklist:**

* comparison section hidden (messages only) until two saved results exist,
* same-result selection shows a friendly warning, not a fake comparison,
* gap priority summary shows after at least one saved run with gaps,
* Version 4–5 sections still behave as before.

---

## Version 6 limitations

Version 6 **does not** add:

* fit scores or automatic job ranking,
* weighted recommendations,
* semantic understanding of job text,
* required-versus-preferred skill extraction,
* resume evidence-strength evaluation,
* resume tailoring or application tracking,
* authentication, user accounts, or Clerk,
* cloud storage or multi-user data isolation,
* deployment or a public URL,
* OpenAI API or LLM extraction,
* charts or analytics dashboards,
* comparison of more than two saved results at once,
* edit or delete controls for saved runs,
* matched-skill list comparison (schema stores counts only).

### Schema-related limitations (honest)

| Limitation | Detail |
|------------|--------|
| Missing-skill comparison only | Individual matched skill names are not stored in SQLite |
| Saved Analysis History gaps | Top recurring gaps there still refer to the **latest run only** |
| Gap priority example jobs | Shows distinct **filenames** only; same filename in multiple runs may appear once in examples even when count > 1 |
| Gap priority cap | Shows up to **10** skills (same scale as Recent Saved Runs) |
| Rule-based matching | All saved data reflects keyword/alias matching from prior runs |

See [`LIMITATIONS.md`](LIMITATIONS.md) for general project limitations.

---

## Privacy and repository safety

| Safe in public Git | Keep local / Git-ignored |
|--------------------|---------------------------|
| `data/resume/sample_resume.txt` | `data/resume/resume.txt` |
| `data/sample_jobs/` | `data/jobs/` |
| taxonomy and alias JSON | `data/outputs/` reports, CSVs, `.db` files |

**Version 6 discipline:**

* SQLite files are **local and generated** — do not commit `data/outputs/analysis_results.db`.
* Real resumes and job descriptions stay in Git-ignored paths or browser session (pasted jobs).
* Comparison and priority panels are **read-only** and do not upload data anywhere.

---

## Honest project description after Version 6

**Reasonable portfolio description:**

> Rule-based Python CLI and local Streamlit UI that compare internship job descriptions to a resume using a skills taxonomy and aliases, surface per-job and recurring skill gaps, optionally save runs to local SQLite, and provide read-only saved-history views—including comparison of two saved analyses and a recurring gap priority summary—test-backed and privacy-conscious, not deployed.

**Avoid claiming:**

* AI-powered or semantic job matching,
* automatic “best job” or “best skill to learn” recommendations,
* production web app, authentication, or cloud database,
* matched-skill comparison from saved SQLite data (not stored at skill-name level).

---

## Possible next phase

Version 7 is **not committed** to a specific feature set. Conservative directions that fit the current architecture:

* improved saved-result organization (search, filters, pagination),
* clearer saved-job labels or metadata in the UI,
* safe **local** deletion or cleanup of saved rows (only if deliberately planned and tested),
* stronger tests and code organization,
* deployment **planning research** without deploying yet.

Hosted deployment, authentication, and optional AI-assisted extraction remain **later milestones**—see [`PRODUCT_ROADMAP.md`](PRODUCT_ROADMAP.md).

---

## Version 6 summary

Version 6 extended the **local Streamlit prototype** with:

* read-only **Compare Saved Analyses** (two saved job results, missing-skill comparison),
* read-only **Saved Gap Priority Summary** (recurring missing skills across all saves),
* small, focused database and pure Python helpers reused from `src/` and `streamlit_app.py` display builders.

**Not shipped:** fit scores, job ranking, matched-skill list comparison from SQLite, deployment, auth, AI pipeline, or semantic matching.

---

*Version 6 checkpoint — documentation only; aligned with comparison and decision-support features in `streamlit_app.py` and `src/database.py`.*
