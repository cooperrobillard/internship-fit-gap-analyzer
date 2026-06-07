# Version 7 Checkpoint

This document records what **Version 7** accomplished: **saved-result organization and local data management** in the local Streamlit UI, using the existing local SQLite database from Versions 5–6.

For usage commands, see the [README](../README.md). For the Version 6 decision-support baseline, see [`VERSION_6_CHECKPOINT.md`](VERSION_6_CHECKPOINT.md). For the original plan, see [`VERSION_7_PLAN.md`](VERSION_7_PLAN.md). For limitations, see [`LIMITATIONS.md`](LIMITATIONS.md). For longer-term milestones, see [`PRODUCT_ROADMAP.md`](PRODUCT_ROADMAP.md).

**Status:** Version 7 saved-result management work is **complete** as a **localhost-only** milestone. There is **no hosted deployment**, **no authentication**, **no bulk deletion**, and **no schema migration**.

---

## Version 7 goal

Version 7 focused on making local saved analyses **easier to identify, browse, search, and safely manage**.

It answers:

> After I save multiple analysis runs locally, can I find the right saved job result, compare matching records, review recurring gaps, and remove one outdated or duplicate save—without cloud storage, fit scoring, or editing the database schema?

Version 7 does **not** try to deploy the app, add authentication, or turn the tool into a job-application tracker.

---

## Foundation entering Version 7

Version 7 built on completed Version 6 local capabilities:

| Capability | What existed before Version 7 |
|------------|-------------------------------|
| Local Streamlit analysis | Sample job, pasted job, resume source selector |
| Optional SQLite saving | Checkbox → `data/outputs/analysis_results.db` |
| Saved Analysis History | Run/job/gap counts; top recurring gaps from **latest run** |
| Saved run details | Per-row fields in **Recent Saved Runs** (run ID, timestamp, job name, matched/missing counts) |
| Saved analysis comparison | **Compare Saved Analyses** — two pickers, shared/unique **missing** skills |
| Saved gap priority summary | **Saved Gap Priority Summary** — recurring missing skills across **all** saves (up to 10 rows) |

---

## Features completed

### Step 1 — Improved saved-result labels

Saved-result labels now use a shared formatter (`format_saved_result_label()`) across browsing, comparison, and deletion pickers.

**Label fields (stored data only):**

* job name (`job_filename`)
* formatted saved timestamp (`run_timestamp` from `analysis_runs`)
* analysis run ID (`run_id`)
* job result ID (`job_result_id` from `job_results.id`)
* missing-skill count (`missing_skills_count`, shown as `N gaps`)
* matched-skill count (`matched_skills_count`, shown as `N matched` when present)

**Example shape:**

```text
sample_ai_engineering_internship.txt | saved 2026-06-07 4:32 PM | run 3 | result 5 | 11 gaps | 17 matched
```

**Duplicate job names** stay distinct through run ID, result ID, saved timestamp, and gap/matched counts—not job name alone.

**Recent Saved Runs** table adds a **Saved result** column with the full label, plus **Result ID** and a formatted **Saved at** timestamp.

### Step 2 — Saved-result sorting

All saved-result lists use `sort_saved_results()` for **newest-first** ordering.

**Sort order (descending unless noted):**

1. `run_timestamp`
2. `run_id`
3. `job_result_id`
4. `job_filename` (alphabetical tie-breaker)

Newest-first ordering keeps recent internship analyses at the top of tables and select boxes. When timestamps tie, higher run/result IDs break ties deterministically.

**Recent Saved Runs** now loads **every** saved job result (via `get_all_saved_job_results()`), not only the 10 most recent rows.

### Step 3 — Saved-result text search

**Search control:** **Search saved analyses** — appears after **Saved Analysis History** when the database exists and has at least one saved job result.

**Guidance caption:** *Search by job name, saved date, run ID, or job-result ID.*

**Searchable text includes:**

* job name
* formatted saved timestamp
* raw ISO timestamp
* run ID
* job-result ID
* full formatted saved-result label

**Behavior:**

* **Case-insensitive** substring matching
* **Whitespace-tolerant** query normalization
* **Empty or whitespace-only query** → all saved results, existing sort preserved
* **Read-only** — search does not modify the database
* **Input collection not mutated** by `filter_saved_results()`

**Filtered sections:**

| Section | Uses search filter? |
|---------|---------------------|
| Recent Saved Runs | Yes |
| Compare Saved Analyses pickers | Yes |
| Delete Saved Analysis picker | Yes (with caption when filtered) |
| Saved Analysis History summary | No |
| Saved Gap Priority Summary | No — still summarizes **all** saved analyses |

**Match counts:**

| Matches | Recent Saved Runs | Comparison |
|---------|-------------------|------------|
| 0 | Friendly no-match message | No select boxes; no-match message |
| 1 | Shows the one row | Insufficient message (needs two to compare; search-specific wording when DB has ≥2 total) |
| 2+ | Normal table | Normal comparison pickers |

### Step 4 — Safe saved-result deletion

**Section:** **Delete Saved Analysis** — separated at the bottom of the saved-data area with a permanent-delete warning.

**User flow:**

1. Select **one** saved analysis from a select box (uses improved labels).
2. Read the warning that deletion is permanent.
3. Check: *I understand that this permanently deletes the selected saved analysis.*
4. Click **Delete selected saved analysis** (disabled until confirmed).

**Deletion rules:**

* **One record at a time** — no bulk delete, delete-all, or delete-by-search
* **Permanent** — no undo or archive
* **Explicit confirmation required**
* When search is active, the picker uses **only matching visible records** (caption explains this)
* Hidden records are **never** deleted automatically

**After successful deletion:**

* Success message stored in session state and shown on the next rerun
* UI reruns so history, search, comparison, and gap priority summary refresh
* Deleted record disappears from lists and pickers
* Confirmation checkbox resets to unchecked via a **pending-reset** pattern (see below)

**Database helper:** `delete_saved_job_result()` / `delete_saved_job_result_from_database()` in `src/database.py`.

### Step 5 — Streamlit confirmation state fix

Streamlit does not allow changing a widget-backed session key **after** that widget is created in the same script run.

**Lesson:** after a successful delete, the code must not assign `False` directly to the confirmation checkbox key in the same run where the checkbox already rendered.

**Fix:** a pending-reset lifecycle:

* On success → set `delete_saved_analysis_confirm_reset_pending` and `st.rerun()`
* On the **next** run → `apply_pending_delete_saved_analysis_confirmation_reset()` runs **before** the checkbox is created, sets confirm to `False`, clears the pending flag

Selection changes still reset confirmation **before** the checkbox renders when the user picks a different saved result.

---

## Database behavior

### Saved job result table

**`job_results`** — one row per saved job-analysis result. Stable ID: **`job_results.id`** (`job_result_id` in UI helpers).

### Related skill gaps

**`skill_gaps`** rows link to a job result through **`run_id` + `job_filename`** (there is no `job_result_id` column in `skill_gaps`).

Deletion removes gaps with:

```sql
DELETE FROM skill_gaps WHERE run_id = ? AND job_filename = ?
```

### Deletion mechanics

| Topic | Behavior |
|-------|----------|
| Foreign-key cascade | **Not used** — explicit `DELETE` statements |
| Parameterized queries | Yes (`?` placeholders) |
| Transaction | `commit` on success; `rollback` on not-found or exception |
| Unrelated records | Other `job_results` and `skill_gaps` rows preserved |
| Nonexistent ID | `deleted=False`, `reason="not_found"`; no data change |
| Missing database file | `deleted=False`, `reason="database_not_found"` |

### Parent analysis run cleanup

If deleting the selected job result leaves **zero** `job_results` for that `run_id`, the helper also deletes:

* any remaining `skill_gaps` for that `run_id`
* the `analysis_runs` row

If **other job results remain** in the same run (multi-job CLI save), the parent run is **kept**.

### Local privacy

* Default path: `data/outputs/analysis_results.db`
* Generated locally; covered by `.gitignore` (`*.db`)
* **Do not commit** the database file

---

## Existing behavior preserved

Version 7 preserved:

| Area | Still works |
|------|-------------|
| Sample job analysis | Bundled sample resume + sample job |
| Pasted job analysis | Paste one job description |
| Resume source selector | Sample or private `data/resume/resume.txt` |
| Optional SQLite save | Checkbox → local `.db` file |
| Saved Analysis History | Summary counts + latest-run recurring gaps |
| Saved comparison | Two-way missing-skill comparison |
| Saved gap priority summary | Global recurring gaps (up to 10 skills) |
| CLI | Folder mode, `--job-file`, `--database`, reports/CSVs |
| pandas summaries | Optional CLI `--pandas-summary` |
| Database inspection | `scripts/inspect_database.py` |
| Tests | `python3 run_tests.py` and per-file test modules |

---

## How to use Version 7

### Open the local UI

```bash
python3 -m streamlit run streamlit_app.py
```

Opens a browser tab on your machine (typically `http://localhost:8501`). Stop with `Ctrl+C`.

### Suggested workflow

1. Run analysis on a sample or pasted job with **Save this analysis to local SQLite database** checked.
2. Repeat for additional jobs so saved history grows.
3. Use **improved labels** in **Recent Saved Runs** to distinguish duplicate job names.
4. Type in **Search saved analyses** to narrow the list (optional).
5. Review per-row details in **Recent Saved Runs**.
6. Select two different matching analyses in **Compare Saved Analyses**.
7. Review **Saved Gap Priority Summary** across all saved data (not filtered by search).
8. To remove one unwanted save, scroll to **Delete Saved Analysis**, select the record, confirm, and delete.

### Create sample saved data from the CLI

```bash
python3 src/main.py --database data/outputs/analysis_results.db
python3 src/main.py --job-file data/sample_jobs/sample_ai_engineering_internship.txt --database data/outputs/analysis_results.db
```

### Inspect saved data

```bash
python3 scripts/inspect_database.py data/outputs/analysis_results.db
```

---

## Tests and verification

Run from the project root.

### Primary automated gate

```bash
python3 run_tests.py
```

Expected final line: `All tests passed.`

### Focused helper tests (Version 7 coverage)

```bash
python3 tests/test_streamlit_app.py
python3 tests/test_database.py
```

Version 7 tests cover label/sort/search helpers, deletion display builders, confirmation-reset lifecycle, and `delete_saved_job_result()` database behavior.

### About `unittest discover`

```bash
python3 -m unittest discover -s tests -p "test_*.py"
```

This command currently reports **0 tests** because most test files use plain `test_*()` functions executed as scripts, not `unittest.TestCase` classes. **Use `python3 run_tests.py` or run individual `tests/test_*.py` files** for verification today.

### CLI smoke tests (must still pass)

```bash
python3 src/main.py
python3 src/main.py --job-file data/sample_jobs/sample_ai_engineering_internship.txt
python3 src/main.py --database data/outputs/analysis_results.db
python3 scripts/inspect_database.py data/outputs/analysis_results.db
```

### Manual Streamlit checklist

* labels show run ID, result ID, timestamp, and gap counts
* search filters recent runs and pickers but not gap priority summary
* delete requires confirmation and removes only the selected record
* confirmation resets after successful delete
* success message appears once after rerun

---

## Version 7 limitations

Version 7 **does not** include:

* bulk deletion or delete-all controls
* undo, archive, or trash recovery
* saved-result editing
* tags, favorites, or saved searches
* advanced filters (date range, category, gap-count thresholds)
* company/title metadata fields
* job application tracking
* fit scores, weighted ranking, or automatic job recommendations
* semantic understanding or OpenAI API
* resume tailoring
* authentication, user accounts, or Clerk
* cloud persistence or multi-user data isolation
* deployment or a public URL
* schema migration (labels/search/delete use existing columns)

**Deletion specifics:**

* permanent and local-only
* one `job_result` at a time
* skill gaps matched by `run_id` + `job_filename` (normal save flow has one result per filename per run)

---

## Privacy and repository safety

| Safe in public Git | Keep local / Git-ignored |
|--------------------|---------------------------|
| `data/resume/sample_resume.txt` | `data/resume/resume.txt` |
| `data/sample_jobs/` | `data/jobs/` |
| taxonomy and alias JSON | `data/outputs/` reports, CSVs, `.db` files |

**Version 7 discipline:**

* SQLite files are generated outputs — **do not commit** them.
* Search and delete operate on local data only; nothing is uploaded.
* Pasted job text stays in the browser session unless explicitly saved to SQLite.

---

## Honest project description after Version 7

**Reasonable portfolio description:**

> Rule-based Python CLI and local Streamlit UI that compare internship job descriptions to a resume using a skills taxonomy and aliases, surface per-job and recurring skill gaps, optionally save runs to local SQLite, and provide searchable saved-history views with two-way saved-analysis comparison, a recurring gap priority summary, and guarded single-result deletion—test-backed and privacy-conscious, not deployed.

**Avoid claiming:**

* AI-powered or semantic job matching
* production web app, authentication, or cloud database
* bulk cleanup, undo, or application tracking

---

## Possible next phase

Version 8 is **not committed** to a specific implementation. Conservative directions to **evaluate in planning** (not shipped):

* test-suite modernization so standard `unittest discover` works
* limited optional saved-result metadata (only with deliberate schema design)
* local export/import or backup planning
* Streamlit UI maintenance (including deprecation cleanup)
* deployment-readiness **research** without deploying
* product-architecture planning for a possible future hosted version

See [`PRODUCT_ROADMAP.md`](PRODUCT_ROADMAP.md) for hosted and optional-AI milestones as **long-term ideas**.

---

## Version 7 summary

Version 7 extended the **local Streamlit prototype** with:

* improved saved-result labels and newest-first sorting across all saved records,
* case-insensitive text search for saved-result browsing and pickers,
* guarded deletion of one saved job result with related skill-gap cleanup,
* safe Streamlit confirmation reset after deletion.

**Not shipped:** bulk delete, undo, editing, tags, advanced filters, metadata schema changes, deployment, or auth.

---

*Version 7 checkpoint — documentation only; aligned with saved-result management features in `streamlit_app.py` and `src/database.py`.*
