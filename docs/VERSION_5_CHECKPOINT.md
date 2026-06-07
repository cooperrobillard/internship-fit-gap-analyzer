# Version 5 Checkpoint

This document records what **Version 5** accomplished: **local SQLite persistence and read-only saved-history views** in the Streamlit UI, on top of the Version 4 local prototype and Version 3 backend.

For usage commands, see the [README](../README.md). For the Version 4 UI baseline, see [`VERSION_4_CHECKPOINT.md`](VERSION_4_CHECKPOINT.md). For limitations, see [`LIMITATIONS.md`](LIMITATIONS.md). For longer-term milestones, see [`PRODUCT_ROADMAP.md`](PRODUCT_ROADMAP.md).

**Status:** Version 5 local persistence work is **complete** as a **localhost-only** milestone. There is **no hosted deployment**, **no authentication**, and **no AI-based matching**.

---

## 1. Version 5 goal

Let the local Streamlit UI **optionally save analysis runs** to the same SQLite database the CLI can use, then **read back a small saved-history summary** without building a full history browser or comparison dashboard.

Version 5 answers:

> Can I save a UI analysis run locally, then see honest counts and recent saved job results from `data/outputs/analysis_results.db` without leaving the browser prototype?

It does **not** try to become a deployed product, multi-user app, or semantic job-fit engine.

---

## 2. What was added in Version 5

### Step 1 — Optional SQLite save from the UI

* Checkbox: **Save this analysis to local SQLite database** (default off).
* Uses existing backend helper `save_analysis_to_database()` in `src/analysis_runner.py`.
* Default database path: `data/outputs/analysis_results.db` (same path family as CLI `--database`).
* When checked, saves after sample-job or pasted-job analysis runs.
* Shows a success message with the database file path when a save happens.
* When unchecked, preview behavior stays the same (no database write).

### Step 2 — Saved Analysis History summary panel

* Read-only section: **Saved Analysis History**.
* Reads `data/outputs/analysis_results.db` via `get_database_summary()` in `src/database.py`.
* When the database exists, shows:
  * database path (repo-relative label),
  * count of analysis runs,
  * count of job results,
  * count of saved skill gaps,
  * latest run ID,
  * top recurring gaps from the **latest** saved run (table + optional text list).
* When the database does not exist, shows a friendly info message explaining how to create one.

### Step 3 — Recent Saved Runs list

* Read-only section: **Recent Saved Runs**.
* Reads recent rows via `get_recent_saved_jobs()` in `src/database.py`.
* When the database exists and has data, shows up to **10** most recent saved **job results** in a table with:
  * Run ID
  * Saved at (timestamp)
  * Job (filename or pasted-job label)
  * Matched skills count
  * Missing skills count
* Ordered newest-first across all saved runs.
* When the database is missing or empty, shows a friendly message without crashing.

### Step 4 — Saved run / job details (read-only, small scope)

* Version 5 does **not** add a full run browser, run comparison, or edit/delete controls.
* **Details appear in two honest, limited places:**
  * **Saved Analysis History** — latest-run summary numbers and top recurring gaps for the most recent save.
  * **Recent Saved Runs** — per-row job-result details (run ID, timestamp, job name, matched/missing counts).
* Together these give enough context to understand what was saved recently without building a complex history UI.

### Backend helpers added (reused by UI; not duplicated in `streamlit_app.py`)

| Module | Helper | Role |
|--------|--------|------|
| `src/analysis_runner.py` | `save_analysis_to_database()` | Save structured analysis results to SQLite |
| `src/database.py` | `get_database_summary()` | Table counts + top recurring gaps (latest run) |
| `src/database.py` | `get_recent_saved_jobs()` | Recent saved job-result rows |

### Tests

* `tests/test_analysis_runner.py` — save helper smoke tests
* `tests/test_database.py` — summary and recent-jobs read helpers
* `tests/test_streamlit_app.py` — display-builder helpers (no full UI automation)

---

## 3. What the local UI can do now (Version 4 + Version 5)

| Feature | How it works |
|---------|----------------|
| Sample job analysis | Bundled sample resume + sample job file |
| Pasted job analysis | Paste one job description; analyze against selected resume |
| Resume source | Sample resume (default) or private `data/resume/resume.txt` if present |
| Live results display | Matched skills, missing skills, recurring gaps |
| Optional SQLite save | Checkbox saves run to `data/outputs/analysis_results.db` |
| Saved history summary | Read-only counts + latest-run recurring gaps |
| Recent saved runs | Read-only table of up to 10 recent saved job results |

The **CLI** remains the primary interface for folder mode, full report writes, `--pandas-summary`, and scripted automation.

---

## 4. What Version 5 did not add

Version 5 **does not** provide:

* hosted deployment or a public URL,
* user accounts or authentication,
* OpenAI API or LLM extraction,
* semantic matching, embeddings, or RAG,
* cloud database or multi-user storage,
* full saved-run history browser with search/filters/pagination,
* saved run comparison dashboard,
* delete, edit, or re-run controls for saved rows,
* charts or analytics dashboards,
* resume tailoring or AI job-fit scoring,
* automatic markdown/CSV report writing from the UI (preview + optional DB save only).

---

## 5. Local persistence workflow

```text
User runs analysis in Streamlit (sample job or pasted job)
    ↓
Optional: check "Save this analysis to local SQLite database"
    ↓
If checked → save_analysis_to_database() writes to data/outputs/analysis_results.db
    ↓
Success banner shows database path
    ↓
Saved Analysis History reads summary counts + latest-run recurring gaps
    ↓
Recent Saved Runs reads up to 10 newest saved job-result rows
```

**Database path (UI default):** `data/outputs/analysis_results.db`

**CLI equivalent:**

```bash
python3 src/main.py --database data/outputs/analysis_results.db
```

**Inspect from terminal:**

```bash
python3 scripts/inspect_database.py data/outputs/analysis_results.db
```

---

## 6. Commands tested for Version 5

Run from the project root.

### Automated tests

```bash
python3 run_tests.py
```

Optional helper tests:

```bash
python3 tests/test_streamlit_app.py
python3 tests/test_analysis_runner.py
python3 tests/test_database.py
```

### CLI workflows (unchanged; must still pass)

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

Opens a browser tab on your machine (default `http://localhost:8501`). Stop the server with `Ctrl+C` when finished.

**Manual persistence checklist:**

* run analysis with save checkbox **off** → no new DB file required; history sections show friendly empty messages,
* run analysis with save checkbox **on** → success message appears; summary and recent-runs sections update on rerun,
* sample job + pasted job + resume selector still work as in Version 4.

---

## 7. Privacy notes

| Safe in public Git | Keep local / Git-ignored |
|--------------------|---------------------------|
| `data/resume/sample_resume.txt` | `data/resume/resume.txt` |
| `data/sample_jobs/` | `data/jobs/` |
| taxonomy and alias JSON | `data/outputs/` reports, CSVs, `.db` files |

**Version 5 discipline:**

* SQLite database files under `data/outputs/` are generated outputs — **do not commit** them.
* Pasted job text is still session-only unless you explicitly save a run to SQLite.
* Private resume is read from a Git-ignored path only when selected.
* Saved history panels are **read-only**; they do not upload data anywhere.

---

## 8. Limitations (still honest)

The local UI still uses the same **rule-based** backend as the CLI. SQLite persistence **stores counts and gap rows** from prior runs; it does **not** add semantic understanding, required-vs-preferred skill judgment, or resume evidence scoring.

Saved-history views are intentionally **small**:

* no cross-run comparison,
* no full drill-down into every saved skill list from the UI,
* top recurring gaps in the summary panel refer to the **latest** run only.

See [`LIMITATIONS.md`](LIMITATIONS.md) for full detail.

---

## 9. Likely next steps (after Version 5)

| Direction | Notes |
|-----------|--------|
| Version 5.x / UI polish | Optional UI report-file toggle, folder mode in UI |
| Hosted deployment (later milestone) | Private/unlisted app only after local UX feels worthwhile |
| Optional AI-assisted extraction (much later) | Only if rule-based limits become a real bottleneck |

See [`PRODUCT_ROADMAP.md`](PRODUCT_ROADMAP.md) for the full milestone table.

---

## 10. Version 5 summary

Version 5 extended the **local Streamlit prototype** with:

* optional SQLite saving from the UI,
* a read-only saved database summary panel,
* a read-only recent saved runs table with per-job detail fields,
* backend read/save helpers reused from `src/` (no duplicated SQL in the UI layer).

**Not shipped:** deployment, auth, AI pipeline, semantic matching, full history browser, or comparison dashboard.

---

*Version 5 checkpoint — documentation only; aligned with local persistence features in `streamlit_app.py` and `src/database.py`.*
