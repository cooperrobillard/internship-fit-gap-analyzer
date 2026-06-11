# Version 10 Plan

This document plans **Version 10** for the Internship Fit & Skill-Gap Analyzer: **saved-analysis metadata** (especially optional **source URL** and **notes**).

**Status:** **Planning / audit only.** No schema changes, code changes, or implementation have started on this branch.

For the Version 9 baseline, see [`VERSION_9_CHECKPOINT.md`](VERSION_9_CHECKPOINT.md). For long-term milestones, see [`PRODUCT_ROADMAP.md`](PRODUCT_ROADMAP.md). For the canonical testing guide, see [`TESTING.md`](TESTING.md). For limitations, see [`LIMITATIONS.md`](LIMITATIONS.md).

---

## Version 10 goal

Version 10 will likely focus on **richer saved-analysis metadata** so local saved job results are easier to remember and revisit during an internship search.

The primary candidates are:

* **source_url** — optional link to the original job posting (or similar source),
* **notes** — optional free-text notes the user adds (e.g. deadline, referral, follow-up reminder).

The goal is to improve **saved-record usefulness** without turning the project into a full application tracker, without storing raw resume or job-description text, and without deployment or cloud architecture.

**Important:** Implementation should **not** start until this plan is reviewed and the current SQLite schema and saved-analysis flow are understood. This document is Step 0.

---

## Why this version matters

Version 9 made the local Streamlit UI portable and practical: pasted/uploaded inputs, clearer job labels from title/company metadata, downloads, and saved-data exports. Those labels help distinguish saved results, but they still do not answer common follow-up questions:

* Where did I find this posting?
* What did I want to remember about this role?

Version 9 deliberately avoided a SQLite schema change by encoding readable names in the existing `job_filename` field. **Source URL and notes are different kinds of data**—they are optional user-provided metadata that should persist in the database, not be folded into the job name string.

Adding metadata is also the **first planned feature that requires a schema decision**. Getting that decision right protects:

* existing local databases created before Version 10,
* saved-history search, comparison, deletion, and exports,
* privacy rules established in Versions 5–9.

Metadata should come **before** restore/import, deployment research, or semantic matching because it is smaller in scope and directly improves day-to-day local use.

---

## Current verified repository state entering Version 10

Verified state at the start of Version 10 planning (from code and [`VERSION_9_CHECKPOINT.md`](VERSION_9_CHECKPOINT.md)):

| Item | State |
|------|--------|
| Version 9 | Complete — portable inputs, UI polish, current downloads, saved exports/backup |
| Test gate | `python3 run_tests.py` auto-discovers every top-level `tests/test_*.py` file |
| SQLite schema | Unchanged since Version 2 — three tables: `analysis_runs`, `job_results`, `skill_gaps` |
| Saved metadata today | Job display name via `job_results.job_filename`; optional title/company composed in UI only |
| Streamlit tabs | Analyze, Results, Saved analyses, Data management |
| Exports | Saved analyses summary CSV, saved skill gaps CSV, SQLite backup download |
| Not implemented | `source_url`, `notes`, tags, status, restore/import, schema migration |

---

## Current saved-analysis architecture based on the code

The saved-analysis system splits responsibilities across three layers:

```text
Streamlit UI (streamlit_app.py)
  → analysis helpers, display builders, search/filter, exports
  → calls save_analysis_to_database() when user enables SQLite save

Analysis runner (src/analysis_runner.py)
  → run_single_job_analysis() produces structured analysis_result dict
  → save_analysis_to_database() validates paths and calls database layer

Database layer (src/database.py)
  → initialize_database() / create_tables()
  → save_analysis_results() inserts run + job rows + skill gap rows
  → read helpers (summary, all results, comparison, deletion)
```

**Key design facts today:**

* The **unit users browse, search, compare, and delete** is a **`job_results` row** (exposed as `job_result_id`).
* An **`analysis_runs` row** groups one analyzer execution (timestamp, resume/jobs path labels, total job count).
* **`skill_gaps` rows** store missing skills but link to jobs via **`run_id` + `job_filename`**, not `job_result_id`.
* The Streamlit UI uses **single-job analysis** almost exclusively; the CLI can save **multiple jobs per run** in folder mode.
* **Raw resume and job text are not stored** in SQLite; only path/label strings and skill-gap results are persisted.

---

## Current SQLite tables and likely responsibilities

Schema defined in `create_tables()` in `src/database.py` (Version 2 structure, still in use):

### `analysis_runs`

| Column | Role |
|--------|------|
| `id` | Primary key; referenced as `run_id` elsewhere |
| `run_timestamp` | ISO timestamp when the run was saved |
| `resume_path` | Resume source label or file path string (e.g. sample path, `Pasted resume`, `Uploaded resume: name.txt`) |
| `jobs_path` | Jobs folder path, job file path, or job name string for in-memory jobs |
| `taxonomy_path` | Path to skills taxonomy JSON used |
| `aliases_path` | Path to skill aliases JSON used |
| `total_jobs` | Number of jobs analyzed in this run |

**Responsibility:** Run-level provenance and grouping. One run can contain multiple `job_results` rows (CLI folder mode).

### `job_results`

| Column | Role |
|--------|------|
| `id` | Primary key; exposed as `job_result_id` in UI and tests |
| `run_id` | Foreign key to `analysis_runs` |
| `job_filename` | **Display name** for the job (filename, pasted label, or title/company metadata label) |
| `matched_skills_count` | Count only — individual matched skill names are **not** stored |
| `missing_skills_count` | Count of missing skills for this job |

**Responsibility:** Per-job saved summary row — the main handle for history, search labels, comparison pickers, and deletion.

### `skill_gaps`

| Column | Role |
|--------|------|
| `id` | Primary key |
| `run_id` | Foreign key to `analysis_runs` |
| `job_filename` | Matches `job_results.job_filename` for the same logical job |
| `skill` | Missing skill name |
| `category` | Taxonomy category for the skill |

**Responsibility:** Detailed missing-skill storage. Deletion and export join on `run_id` + `job_filename` because `job_result_id` is not stored here.

---

## Current saved-result insertion flow

End-to-end path when the Streamlit user saves an analysis:

1. **Analyze** — `run_single_job_analysis()` in `src/analysis_runner.py` returns an `analysis_result` dict with `resume_path`, `job_results` (list of per-job skill data), taxonomy/alias paths, etc.
2. **Optional UI metadata (today)** — `build_pasted_job_name()` may set `job_name` from title/company or upload filename before analysis; that name becomes `job_results[].job_name` in the result dict.
3. **UI save toggle** — `store_analysis_result()` in `streamlit_app.py` calls `save_analysis_to_database()` when the checkbox is enabled.
4. **Runner wrapper** — `save_analysis_to_database()`:
   * validates `database_path` is a file path, not a directory,
   * requires `resume_path` on the result,
   * resolves `jobs_path` via `_resolve_jobs_path_for_database()` (job path, folder, `job_name`, or first job name),
   * opens DB with `initialize_database()` (creates tables if missing).
5. **Database insert** — `save_analysis_results()`:
   * `insert_analysis_run()` → one `analysis_runs` row,
   * for each job in `job_results`: `insert_job_result()` with `job_filename=job_result["job_name"]`,
   * for each missing skill: `insert_skill_gap()` with same `run_id` and `job_filename`.

CLI folder/single-job saves follow the same `save_analysis_results()` path via `write_analysis_outputs()` when `--database` is passed.

**Gap for Version 10:** No step today accepts or persists `source_url` or `notes`.

---

## Current saved-result query/display/export flow

### Read path (database → Python dicts)

| Helper | Purpose |
|--------|---------|
| `get_database_summary()` | Counts + latest-run recurring gaps for history panel |
| `get_all_saved_job_results()` / `query_all_saved_job_results()` | All job results joined with run timestamp |
| `get_saved_job_result_for_comparison()` | One result + missing skill list |
| `get_saved_gap_priority_summary()` | Recurring gaps across all saves |
| `get_recent_saved_jobs()` | Limited recent list (DB helper; UI uses full list via `load_all_sorted_saved_results()`) |

Returned job dict keys today: `job_result_id`, `run_id`, `run_timestamp`, `job_filename`, `matched_skills_count`, `missing_skills_count`.

### Display path (Streamlit)

| Helper | Purpose |
|--------|---------|
| `load_all_sorted_saved_results()` | Newest-first list for UI builders |
| `format_saved_result_label()` | Selectbox/table labels |
| `build_saved_result_search_text()` / `filter_saved_results()` | Case-insensitive search |
| `build_recent_saved_runs_display()` | Recent runs table |
| `build_compare_saved_analyses_options()` | Comparison pickers |
| `build_delete_saved_analysis_display()` | Deletion picker |
| `build_saved_history_display()` | Summary metrics panel |

Search today matches: job name, formatted timestamp, run ID, job result ID, and formatted label text. **No URL or notes fields exist.**

### Export path (Streamlit, in memory)

| Helper | CSV columns today |
|--------|-------------------|
| `build_saved_analyses_csv_download()` | `run_id`, `job_result_id`, `run_timestamp`, `job_name`, `matched_skills_count`, `missing_skills_count` |
| `build_saved_skill_gaps_csv_download()` | `run_id`, `job_result_id`, `job_name`, `category`, `skill` |
| `read_database_backup_bytes()` | Full SQLite file bytes |

### Deletion path

`delete_saved_job_result()` deletes skill gaps by `run_id` + `job_filename`, then the `job_results` row, then optionally the parent `analysis_runs` row if empty. **Metadata columns on `job_results` would be removed with the row automatically** — no separate metadata cleanup needed if stored there.

---

## Proposed metadata fields for Version 10

| Field | Type (proposed) | Required? | Purpose |
|-------|-----------------|-----------|---------|
| **source_url** | Text (URL string) | No | Link to original posting, company careers page, or handout URL |
| **notes** | Text (plain) | No | User reminders: deadline, contact, referral, interview stage, etc. |

**Defer unless deliberately chosen in planning review:**

| Field | Why defer |
|-------|-----------|
| **status** (applied, rejected, interviewing, etc.) | Starts application-tracker scope; needs enum/design discussion |
| **tags** | Needs taxonomy, multi-value storage, and UI filtering — larger than V10 |
| **fit score** | Explicitly out of project scope |
| **raw job text / raw resume text** | Privacy violation — must never be added |

**Validation ideas (implementation phase, not now):**

* Trim whitespace; treat blank as `NULL`/empty.
* Optional light URL format check for `source_url` (warn in UI, do not block save on minor issues).
* Reasonable max length for `notes` to avoid accidental huge pastes (e.g. job description pasted into notes field).

---

## Storage options considered

### Option A — Add columns to `job_results`

Add `source_url` and `notes` as nullable columns on `job_results`.

| Pros | Cons |
|------|------|
| Metadata is naturally **per saved job result** — matches UI browse/compare/delete unit | Requires `ALTER TABLE` migration for existing DBs |
| Simple reads — existing joins already return job rows | `insert_job_result()` and all job-result queries need updates |
| Deletion stays simple — metadata deleted with the job row | Folder-mode CLI runs need per-job metadata strategy if CLI ever exposes these fields |
| Aligns with Version 9 mental model (one Streamlit save ≈ one job result) | |

### Option B — Add columns to `analysis_runs`

Add `source_url` and `notes` at the run level.

| Pros | Cons |
|------|------|
| One ALTER on a smaller table | **Wrong granularity** when one run has multiple jobs (CLI folder mode) |
| | Streamlit single-job saves would still map 1:1, but CLI multi-job runs could not have per-job URLs/notes |
| | Comparison and search operate on `job_result_id`, not `run_id` alone |

### Option C — Create a separate metadata table

Example: `job_result_metadata (job_result_id, source_url, notes)` with foreign key to `job_results.id`.

| Pros | Cons |
|------|------|
| Keeps `job_results` column set stable for readers who expect the old shape | Extra join on every list/query/export path |
| Could extend later without widening `job_results` | Deletion must also delete metadata row (or rely on FK cascade) |
| | More moving parts for a two-field feature |

---

## Recommended storage approach

**Recommend Option A: add nullable `source_url` and `notes` columns to `job_results`.**

Reasons:

1. **Correct granularity** — Users think in terms of saved job analyses, which map to `job_results` rows.
2. **Minimal join churn** — `query_all_saved_job_results()` and related queries already select from `job_results`; extend the SELECT list once.
3. **Deletion compatibility** — Guarded delete already targets `job_result_id`; metadata disappears with the row.
4. **Export compatibility** — Saved analyses CSV can add two columns without a new join pattern.
5. **Small scope** — Two optional text columns are simpler than a new table for Version 10.

**CLI note:** Version 10 can implement Streamlit-first metadata entry. CLI saves may leave both fields empty until a later step explicitly adds CLI flags — that is acceptable for a conservative V10.

---

## Migration considerations

Existing users may already have `data/outputs/analysis_results.db` files from Versions 5–9.

**Planning assumptions:**

* `CREATE TABLE IF NOT EXISTS` in `create_tables()` does **not** add new columns to existing tables.
* A deliberate **migration step** is required on first open after upgrade, or lazy migration when `initialize_database()` runs.

**Likely migration approach (to implement in Step 1):**

1. After connecting, check whether `job_results` has `source_url` and `notes` (e.g. `PRAGMA table_info(job_results)`).
2. If missing, run `ALTER TABLE job_results ADD COLUMN source_url TEXT;` and `ALTER TABLE job_results ADD COLUMN notes TEXT;` (both nullable).
3. Do **not** rewrite or delete existing rows; old rows simply have `NULL` metadata.
4. Keep migration logic in `src/database.py` alongside `create_tables()` — single place for schema evolution.

**Risks to address in implementation:**

* Duplicate migration if not idempotent — guard with column-exists check.
* Backup before migration during manual testing — Version 9 already supports downloading a backup.
* Tests should use **temporary databases** and cover both fresh DB and pre-migration DB shapes.

---

## Backward compatibility plan

| Area | Plan |
|------|------|
| **Existing `.db` files** | Migrate with nullable columns; no data loss |
| **Old code reading new DBs** | Not supported — upgrade is one-repo version at a time |
| **New code reading old DBs** | Migration adds columns on open |
| **NULL metadata** | Treated as empty in UI labels, search, and CSV (omit or blank column) |
| **Version 9 exports** | Remain valid; new CSV columns append at end or documented order update |
| **SQLite backup restore** | Out of scope for V10 — backup download only, no import |
| **Tests** | Add migration tests in `tests/test_database.py`; extend streamlit helper tests |

**Do not** require users to delete their database to upgrade.

---

## Privacy rules

Version 10 metadata must follow the same privacy model as Versions 5–9.

| Rule | Requirement |
|------|-------------|
| **No raw resume text in SQLite** | Unchanged — only resume path/label strings |
| **No raw job-description text in SQLite** | Unchanged — only job name/label in `job_filename` |
| **source_url and notes are optional** | User-provided; never auto-filled from job posting body |
| **Do not paste job description into notes by default** | UI should label notes as short reminders, not a second job-text store |
| **Exports** | CSV may include `source_url` and `notes` when present — user chose to save them; still no raw resume/job body |
| **SQLite backup** | Still private local data; may now include URLs and notes |
| **Git** | Do not commit `.db` files or exported backups |

---

## Testing plan

Follow [`TESTING.md`](TESTING.md): retain script-style tests; **`python3 run_tests.py`** remains the canonical gate.

### `tests/test_database.py` (planned)

* Fresh database created after schema change includes new columns.
* Migration adds columns to a Version-9-shaped temporary database without losing rows.
* `insert_job_result()` / `save_analysis_results()` persist `source_url` and `notes` when provided.
* `query_all_saved_job_results()` returns metadata fields (or empty/None when absent).
* Deletion still removes job row and related skill gaps; no orphan metadata.
* Existing tests continue to pass without requiring metadata on every insert.

### `tests/test_streamlit_app.py` (planned)

* Display builders include metadata in labels or detail text when present.
* Search can find saved results by URL substring or notes substring (if implemented).
* Export CSV helpers include new columns with headers.
* Empty/NULL metadata handled safely in CSV and display helpers.
* Privacy: raw job/resume text from analysis still not written to DB or exports.

### Per-step gates

```bash
python3 tests/test_database.py
python3 tests/test_streamlit_app.py
python3 run_tests.py
python3 -m py_compile src/database.py streamlit_app.py tests/test_database.py tests/test_streamlit_app.py
```

Manual Streamlit smoke test after UI steps: save with/without metadata, search, compare, delete, export.

---

## Streamlit UI plan

Conservative UI changes — no full redesign.

### Analyze tab (input)

* Add optional **Source URL** text input near existing optional job title/company fields (custom job workflows).
* Add optional **Notes** text area (short, not job-description-sized by default).
* Sample analysis workflow may omit metadata fields or keep them collapsed — **decide in Step 2**; default recommendation: show only for paste/upload workflows.
* Pass metadata through analysis result dict into save path (requires runner/database changes in Step 1).

### Saved analyses tab (display)

* Show URL and notes in **recent saved runs** table and/or expandable detail — keep table readable (truncate long values).
* Include metadata in **search text** if low effort (`build_saved_result_search_text()`).
* Comparison and gap priority summary **need not** show metadata — optional caption only.

### Data management tab

* No change required for deletion flow if metadata lives on `job_results`.

### Session state

* Avoid storing metadata in session state longer than needed; persist on save only.

---

## Export plan

Update in-memory export helpers in `streamlit_app.py` (Step 3 or alongside Step 2):

| Export | Planned change |
|--------|----------------|
| **Saved analyses summary CSV** | Add `source_url` and `notes` columns (after existing columns or documented order) |
| **Saved skill gaps CSV** | Likely **unchanged** — gaps are per skill, not per metadata |
| **SQLite backup** | Automatically includes new columns once migrated — no separate export logic |
| **Current-analysis Markdown/CSV** | Optional: include metadata in Markdown/CSV for current run if user entered them before save — **lower priority** than saved exports |

Exports remain **in memory only** — no writes to `data/outputs/` from the UI.

---

## Risks and safeguards

| Risk | Safeguard |
|------|-----------|
| Schema migration breaks existing DB | Idempotent `ALTER TABLE`; migration tests on temp copy of old shape |
| Metadata scope creep (status, tags, tracker) | Explicit non-goals; defer status/tags |
| Users paste full job text into notes | UI labels + reasonable length limit; document privacy rule |
| Search/label clutter | Truncate display; optional expander for full notes |
| `skill_gaps` still keyed by `job_filename` | Do not rename `job_filename` when adding metadata — metadata is separate columns |
| CLI/runner not passing metadata | Streamlit-first; CLI leaves NULL until explicitly designed |
| Breaking export consumers | Append CSV columns; document column order in checkpoint |
| Forgetting deletion/export paths | Checklist in Step 1 code review: insert, query, delete, export |

---

## Proposed Version 10 sequence

Each step should fit **one branch**, end with passing tests, and avoid mixing unrelated scope.

| Step | Status | Outcome |
|------|--------|---------|
| **Step 0** — Planning / audit | **In progress** | This document; no code changes |
| **Step 1** — Schema-safe metadata storage | Planned | Nullable `source_url` and `notes` on `job_results`; idempotent migration; insert/query updates in `src/database.py` and `save_analysis_to_database()` path; database tests |
| **Step 2** — Streamlit source URL / notes inputs and display | Planned | Optional inputs on Analyze tab; persist on save; show in saved history / recent runs; helper tests |
| **Step 3** — Exports / search / details updates | Planned | CSV columns; search includes metadata; any detail views not done in Step 2 |
| **Step 4** — Version 10 checkpoint | Planned | `docs/VERSION_10_CHECKPOINT.md`; narrow roadmap/README updates if needed |

**Do not combine all steps in one large branch.**

---

## Explicit non-goals

Version 10 is **saved-analysis metadata only**. The following are out of scope:

| Non-goal | Notes |
|----------|--------|
| **Deployment** | Localhost Streamlit only |
| **Authentication** | Solo local tool |
| **Cloud database** | SQLite local files only |
| **AI / semantic matching** | Rule-based taxonomy matching unchanged |
| **Full application tracker** | No pipeline stages, reminders engine, or calendar |
| **Status fields** | Defer unless explicitly pulled into scope later |
| **Tags / favorites** | Defer to a later version |
| **PDF/DOCX parsing** | Text and UTF-8 `.txt` upload only |
| **Restore / import from backup** | Version 9 backup download only; no import UI |
| **Fit scores / ranking** | Not planned |
| **Editing metadata after save** | Optional future step — not assumed in V10 unless added during Step 2 review |
| **pytest / test-framework migration** | Retain script-style tests per [`TESTING.md`](TESTING.md) |

---

## Document maintenance

* **Owner:** project author (learning portfolio).
* **Update when:** a Version 10 step ships, storage decision changes, or scope is narrowed/expanded.
* **Related docs:** [`VERSION_9_CHECKPOINT.md`](VERSION_9_CHECKPOINT.md), [`PRODUCT_ROADMAP.md`](PRODUCT_ROADMAP.md), [`TESTING.md`](TESTING.md), [README](../README.md).

*Version 10 plan — planning/audit only; no implementation on this branch.*
