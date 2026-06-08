# Version 8 Plan

This document plans **Version 8** for the Internship Fit & Skill-Gap Analyzer: **testing and maintenance reliability**.

**Status:** **Planning.** No Version 8 implementation has started yet.

For the Version 7 baseline, see [`VERSION_7_CHECKPOINT.md`](VERSION_7_CHECKPOINT.md). For long-term product milestones (hosted UI, optional AI), see [`PRODUCT_ROADMAP.md`](PRODUCT_ROADMAP.md). For limitations, see [`LIMITATIONS.md`](LIMITATIONS.md).

---

## Version 8 theme

Version 8 will focus on **testing reliability** and **low-risk maintenance** so the project can keep evolving without a false sense of safety from a partial test run.

The goal is to make **one command run every existing test file**, decide deliberately whether to keep or evolve the current script-style test architecture, and clean up known Streamlit deprecation warnings—without feature work, deployment, or framework churn.

Version 8 does **not** try to deploy the app, add authentication, introduce pytest by default, or rewrite the entire test suite in one pass.

---

## Current project status entering Version 8

Verified state at the start of Version 8:

| Item | State |
|------|--------|
| `main` branch | Clean and up to date with `origin/main` |
| Version 7 | Complete and documented in [`VERSION_7_CHECKPOINT.md`](VERSION_7_CHECKPOINT.md) |
| Core product | Rule-based CLI + local Streamlit UI with optional SQLite save, saved-history organization, comparison, gap priority, search, and guarded single-result deletion |
| Primary test gate | `python3 run_tests.py` passes |
| Full test coverage via runner | **Not verified** — three test files pass when run directly but are excluded from `run_tests.py` |
| Standard unittest discovery | `python3 -m unittest discover -s tests -p "test_*.py"` reports **0 tests** |

The project is **functionally stable** after Version 7, but the **test runner does not reflect the full test surface**. That gap is the main reason Version 8 exists.

---

## Why testing reliability is the recommended next focus

Versions 4–7 added substantial UI, database, and saved-history behavior on top of a growing test suite. The habit of running `python3 run_tests.py` before merging gives confidence—but only for the files the runner actually invokes.

Without fixing that, the project risks:

1. **False green builds** — `run_tests.py` can pass while `test_analysis_runner.py`, `test_single_job_analysis.py`, or `test_streamlit_app.py` regress unnoticed.
2. **Growing blind spots** — New tests added in script style may be run manually once and never wired into the main gate.
3. **Friction before real feature work** — Deployment, metadata, export/backup, and hosted UI research all depend on trustworthy regression checks.
4. **Maintenance debt** — Streamlit deprecation warnings (`use_container_width`) signal upcoming breakage; fixing them early is cheaper than debugging UI failures later.

**Testing reliability should come before deployment, authentication, or new product features** because:

* It is **small, reviewable work** that fits one branch per step.
* It **protects everything already shipped** in Versions 1–7 without changing user-facing behavior.
* It **does not require new dependencies** unless deliberately chosen in Step 2.
* It **strengthens the learning portfolio** by making the test story honest and repeatable.

See [`PRODUCT_ROADMAP.md`](PRODUCT_ROADMAP.md) for hosted and optional-AI milestones as **long-term ideas**, not Version 8 deliverables.

---

## Current test architecture

The project intentionally uses a **script-style** test pattern today. Version 8 **does not change this architecture yet**; it documents and stabilizes what exists.

### Script-style tests

* Test files live under `tests/` and use plain functions named `test_*`.
* Assertions use standard `assert` statements.
* Most files end with an `if __name__ == "__main__":` block that calls test functions directly and prints a success message.
* There is no requirement that tests inherit from `unittest.TestCase`.

**Example pattern (conceptual):**

```python
def test_something():
    assert expected == actual

if __name__ == "__main__":
    test_something()
    print("All tests passed.")
```

### `run_tests.py` as the main runner

* `run_tests.py` is the **documented gate** in README and version checkpoints.
* It loops through a **hard-coded list** of test file paths.
* For each file, it runs `subprocess.run([sys.executable, str(test_file)])` and exits on the first non-zero return code.
* It prints `All tests passed.` only if every listed file succeeds.

### Direct execution of individual test files

* Any test file can be run standalone: `python3 tests/test_<name>.py`.
* This is how excluded files are validated today when run manually.
* Direct execution is valid and should keep working regardless of runner changes.

### Unittest discovery currently finds zero tests

* `python3 -m unittest discover -s tests -p "test_*.py"` reports **0 tests**.
* That is expected: plain functions without `unittest.TestCase` subclasses are **not discoverable** by the default unittest loader.
* This is **not a failure of the test files**; it is a mismatch between architecture and discovery tooling.

**Test files in the repo (10 total):**

| File | In `run_tests.py` today |
|------|-------------------------|
| `tests/test_core_logic.py` | Yes |
| `tests/test_output_writers.py` | Yes |
| `tests/test_cli.py` | Yes |
| `tests/test_validation.py` | Yes |
| `tests/test_database.py` | Yes |
| `tests/test_pandas_summary.py` | Yes |
| `tests/test_inspect_database.py` | Yes |
| `tests/test_analysis_runner.py` | **No** |
| `tests/test_single_job_analysis.py` | **No** |
| `tests/test_streamlit_app.py` | **No** |

---

## The main testing issue

**`run_tests.py` currently excludes three test files that pass when run directly:**

1. `tests/test_analysis_runner.py` — reusable analysis workflow (`src/analysis_runner.py`)
2. `tests/test_single_job_analysis.py` — single-job analysis path
3. `tests/test_streamlit_app.py` — Streamlit UI helpers and display logic

**Symptoms:**

* `python3 run_tests.py` prints success without running these files.
* A developer may assume full regression coverage when only seven of ten files ran.
* CI or future automation that copies `run_tests.py` would inherit the same blind spot.

**Likely cause (for planning):** the hard-coded `test_files` list in `run_tests.py` was not updated when analysis-runner, single-job, and Streamlit test files were added in later versions.

**Version 8 Step 1 goal:** one command runs **every** existing `tests/test_*.py` file, with clear per-file output and fail-fast behavior preserved.

---

## Recommended Version 8 sequence

Each step should fit **one branch**, end with passing tests, and avoid mixing unrelated scope.

### Step 1 — Update `run_tests.py` so one command runs every existing test file

**Branch theme:** `tests/run-all-test-files` (example)

* Add the three missing files to the runner **or** replace the hard-coded list with automatic discovery of `tests/test_*.py` (stable sort order).
* Preserve fail-fast behavior: first failure stops the run with a non-zero exit code.
* Preserve per-file `Running tests/...` output so logs stay readable.
* Verify: `python3 run_tests.py` executes all **10** test files and still passes on a clean tree.

**Step 1 should deliver:**

* Full runner coverage of the current test suite.
* No changes to individual test logic unless a newly included file exposes a real failure (fix the failure, do not skip the file).

**Step 1 should not deliver:**

* pytest adoption, `unittest.TestCase` migration, or CI setup.

### Step 2 — Decide whether to keep script-style tests or incrementally move toward discoverable unittest tests

**Branch theme:** planning + optional small pilot (example: `tests/architecture-decision`)

* **Option A — Keep script-style tests (minimal change):** Continue `run_tests.py` subprocess execution; document that `unittest discover` is not the gate; optionally add a short note in [`VERSION_8_CHECKPOINT.md`](VERSION_8_CHECKPOINT.md) when done.
* **Option B — Incremental unittest migration:** Convert one file at a time to `unittest.TestCase` (or a thin wrapper) so `unittest discover` eventually finds tests; keep `run_tests.py` as the primary gate until discovery parity is proven.
* **Option C — Deliberate pytest (deferred by default):** Only if explicitly chosen; treat as a separate decision with dependency and tooling implications—not the default Version 8 path.

**Decision criteria:**

| Criterion | Script-style + `run_tests.py` | Incremental unittest |
|-----------|------------------------------|----------------------|
| Learning curve | Lowest; matches current code | Moderate; standard library only |
| `unittest discover` | Still 0 until migration | Improves over time |
| Refactor risk | Lowest | Low if one file per branch |
| Portfolio story | Honest subprocess runner | Closer to industry convention |

**Do not** rewrite all ten files in one branch. If migration is chosen, pick **one** pilot file after Step 1 is green.

### Step 3 — Clean up Streamlit deprecation warnings related to `use_container_width`

**Branch theme:** `ui/streamlit-width-deprecation` (example)

* Address `use_container_width` deprecation warnings in `streamlit_app.py` (multiple call sites).
* Follow current Streamlit guidance for the installed version (e.g. `width` parameter or equivalent replacement).
* Re-run `python3 run_tests.py` and manual `streamlit run` smoke check.
* No new UI features; maintenance only.

### Step 4 — Document the Version 8 checkpoint

* Create `docs/VERSION_8_CHECKPOINT.md` when work ships.
* Record: runner coverage, architecture decision from Step 2, deprecation cleanup status, and verified commands.
* Update README or roadmap **only if** the documented test gate or commands change.

**Do not combine all steps in one large branch.**

---

## What Version 8 should avoid

Version 8 is a **reliability and maintenance** milestone. Keep scope narrow.

| Out of scope | Why |
|--------------|-----|
| **pytest dependency** (unless deliberately chosen later in Step 2) | Adds tooling and convention shift without fixing the immediate runner gap |
| **Large test-framework rewrite** | High churn, easy to break green tests; conflicts with incremental learning |
| **Deployment** | Infrastructure before honest regression coverage |
| **Authentication** | Unrelated to test gate |
| **Cloud database** | Unrelated; privacy model stays local |
| **OpenAI API** | Feature expansion, not maintenance |
| **Semantic matching** | Feature expansion |
| **Fit scores** | Feature expansion |
| **Unrelated feature work** | Labels, search, deletion, comparison, etc. are Version 7-complete |

---

## Testing plan (Version 8)

Run from the project root before merging any Version 8 branch.

### Automated (primary gate)

```bash
python3 run_tests.py
```

After Step 1, this command must run **all** `tests/test_*.py` files.

### Direct file runs (sanity check)

```bash
python3 tests/test_analysis_runner.py
python3 tests/test_single_job_analysis.py
python3 tests/test_streamlit_app.py
```

### Unittest discovery (informational until Step 2 migration)

```bash
python3 -m unittest discover -s tests -p "test_*.py"
```

Expect **0 tests** until discoverable unittest structure is adopted. Do not treat this as the Version 8 gate unless Step 2 explicitly changes that.

### CLI smoke tests (must still pass)

```bash
python3 src/main.py
python3 src/main.py --job-file data/sample_jobs/sample_ai_engineering_internship.txt
python3 src/main.py --database data/outputs/analysis_results.db
python3 scripts/inspect_database.py data/outputs/analysis_results.db
```

### Manual Streamlit check (after Step 3)

```bash
python3 -m streamlit run streamlit_app.py
```

Confirm no `use_container_width` deprecation warnings in the terminal during a basic analyze-and-browse flow.

---

## Success criteria for Version 8

Version 8 is **complete** when all of the following are true:

1. **Full runner coverage** — `python3 run_tests.py` executes every `tests/test_*.py` file (10 files today) and passes on a clean checkout.
2. **No silent exclusions** — The runner list or discovery logic cannot drift from the filesystem without a deliberate doc/code change; missing files are not omitted by accident.
3. **Documented test architecture decision** — Step 2 outcome is recorded (keep script-style, pilot unittest migration, or explicit deferral with rationale) in [`VERSION_8_CHECKPOINT.md`](VERSION_8_CHECKPOINT.md).
4. **Streamlit maintenance** — `use_container_width` deprecation warnings are resolved or documented with a blocked upstream reason after Step 3.
5. **Regression safety** — CLI smoke commands still work; no user-facing feature changes required for Version 8 completion.
6. **Scope discipline** — No deployment, auth, cloud DB, OpenAI, semantic matching, fit scores, or unrelated features shipped under the Version 8 label.
7. **Checkpoint doc** — `docs/VERSION_8_CHECKPOINT.md` exists and links back to this plan.

---

## Proposed first Version 8 implementation task

**Version 8 Step 1: update `run_tests.py` to run every existing test file**

**Why first:**

* Fixes the highest-risk problem immediately (false green `run_tests.py`).
* Does not require choosing unittest vs. script-style long term.
* Is a small, reviewable diff with an objective pass/fail outcome.
* Unblocks trustworthy gates before Streamlit cleanup or architecture migration.

**Step 1 should deliver:**

* All 10 current test files invoked by `python3 run_tests.py`.
* Fail-fast subprocess behavior unchanged.
* Clear console output per file.

**Step 1 should not deliver:**

* Test rewrites, pytest, CI, deployment, or UI features.

---

## Document maintenance

* **Owner:** project author (learning portfolio).
* **Update when:** a Version 8 step ships or scope changes.
* **Related docs:** [`VERSION_7_CHECKPOINT.md`](VERSION_7_CHECKPOINT.md), [`PRODUCT_ROADMAP.md`](PRODUCT_ROADMAP.md), [README](../README.md).

*Version 8 plan — planning only; testing and maintenance reliability after Version 7.*
