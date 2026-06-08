# Testing Guide

This document is the **canonical testing guide** for the Internship Fit & Skill-Gap Analyzer. It describes how to run tests today, how the test suite is structured, and why the project keeps its current script-style architecture.

For Version 8 planning context, see [`VERSION_8_PLAN.md`](VERSION_8_PLAN.md). For older smoke-test commands (CLI, SQLite, pandas), see [`VERSION_2_TEST_COMMANDS.md`](VERSION_2_TEST_COMMANDS.md).

---

## Purpose

This guide answers:

* How do I run the **full test suite**?
* How do I run **one test file** while working on a change?
* What **test style** does this project use?
* Why does **`unittest discover`** report zero tests?
* What should **new tests** look like?

The project is a local, learning-focused portfolio tool. Testing should stay **readable**, **dependency-free**, and **honest** about what is and is not covered.

---

## Canonical full-suite command

Run every top-level test file from the project root:

```bash
python3 run_tests.py
```

Expected final line:

```text
All tests passed.
```

### What `run_tests.py` does

1. **Discovers** every top-level file matching `tests/test_*.py` (currently **10** files).
2. **Sorts** discovered files alphabetically for deterministic order.
3. **Runs each file** as a separate Python process using the same interpreter that launched `run_tests.py`.
4. **Resolves paths** from the location of `run_tests.py`, so tests still work even if the command is launched from another directory.
5. **Prints** which file is running before each subprocess starts.
6. **Stops on first failure** — if any test file exits with a nonzero status, the runner prints which file failed, returns a nonzero exit code, and does not run remaining files.
7. **Fails clearly** if no matching test files are found (it does not silently report success).

### Current discovered files (alphabetical)

```text
tests/test_analysis_runner.py
tests/test_cli.py
tests/test_core_logic.py
tests/test_database.py
tests/test_inspect_database.py
tests/test_output_writers.py
tests/test_pandas_summary.py
tests/test_single_job_analysis.py
tests/test_streamlit_app.py
tests/test_validation.py
```

New top-level files named `tests/test_*.py` are picked up automatically. Nested test folders are **not** included.

---

## Direct focused testing

Any test file can be run on its own:

```bash
python3 tests/test_database.py
python3 tests/test_streamlit_app.py
python3 tests/test_analysis_runner.py
```

### When focused runs are useful

* **Debugging one area** — You changed database helpers and only want `test_database.py` while iterating.
* **Faster feedback** — The full suite runs every file; a single file is quicker during development.
* **Narrow reproduction** — A failure in one module is easier to inspect in isolation.
* **UI/helper work** — Streamlit display builders and saved-history helpers are heavily covered in `test_streamlit_app.py`.

Focused runs use the same script-style tests as the full runner. A file that passes alone should also pass when invoked by `run_tests.py`.

**Requirement:** Each test file must exit with status **0** on success and **nonzero** on failure so both direct execution and `run_tests.py` behave correctly.

---

## Current test architecture

The project uses **script-style tests**:

| Pattern | Description |
|---------|-------------|
| Plain test functions | Functions named `test_*` in files under `tests/` |
| `assert` statements | Standard Python assertions; no custom assertion library |
| Direct-execution blocks | `if __name__ == "__main__":` calls test functions and prints a success message |
| No pytest | pytest is not a project dependency |
| No `unittest.TestCase` yet | Tests are not written as discoverable unittest classes |

**Typical shape:**

```python
def test_something():
    assert expected == actual

if __name__ == "__main__":
    test_something()
    print("All something tests passed.")
```

Representative files: `tests/test_core_logic.py`, `tests/test_database.py`, `tests/test_streamlit_app.py`.

This style matches how the suite grew across Versions 1–7: small, explicit functions that read like ordinary Python scripts.

---

## unittest discovery limitation

This command is **not** the project's official test gate:

```bash
python3 -m unittest discover -s tests -p "test_*.py"
```

**Current result:** zero tests found.

**Why:** Python's unittest loader discovers tests in `unittest.TestCase` subclasses (and a few related patterns). This project's tests are plain functions executed from `if __name__ == "__main__"` blocks. They are valid tests for this repo, but they are **not** unittest-discoverable in their current form.

Use **`python3 run_tests.py`** for the full suite, or run individual files directly. Treat `unittest discover` as informational only unless the project later adopts discoverable unittest structure.

---

## Architecture decision

**Decision (Version 8 Step 2):** Retain script-style tests for now.

**Rationale:**

* **Readable** — Tests look like normal Python; easy to follow while learning.
* **Dependency-free** — No pytest or extra test tooling required.
* **Adequately supported** — After Version 8 Step 1, `run_tests.py` automatically runs every top-level `tests/test_*.py` file, which solves the immediate reliability problem (partial runner coverage).
* **Low churn** — Migrating all tests to `unittest.TestCase` or pytest now would touch many files without fixing a broken gate.

**Canonical full-suite command:** `python3 run_tests.py`

**Deferred:** Framework migration (unittest or pytest) until there is a clear, concrete need—not by default in Version 8.

---

## When to revisit the decision

Re-evaluate script-style tests if one or more of these become true:

* **Repetitive setup or teardown** across many tests
* **Fixtures** become necessary to share expensive setup safely
* **Parameterized tests** would remove large amounts of duplication
* **Mocking needs** grow beyond a few manual patches
* **Test count and complexity** make manual `__main__` blocks hard to maintain
* **CI tooling** would benefit from a standard framework interface
* **Broader production use** raises the bar for isolation, reporting, and conventions

Any future migration should be **incremental** (one file or one area per branch), not a single large rewrite.

---

## Expectations for future tests

When adding tests, follow these conventions:

1. **Filename** — Top-level `tests/test_*.py` so `run_tests.py` picks up the file automatically.
2. **Exit status** — Success exits **0**; failure exits **nonzero** (failed `assert` raises `AssertionError` and exits nonzero when unhandled).
3. **Privacy** — Use sample data under `data/sample_jobs/`, `data/resume/sample_resume.txt`, and temp directories. Do not read private resume or job paths from `data/jobs/` or real user outputs.
4. **Generated data** — Prefer `tempfile.TemporaryDirectory()` or similar for databases, CSVs, and reports created during tests.
5. **Determinism** — Tests should not depend on wall-clock timing, network, or machine-specific paths outside controlled temp dirs.
6. **Independent runs** — Each file should pass when run alone: `python3 tests/test_your_module.py`.
7. **Registration** — No manual list in `run_tests.py`; discovery is automatic.

---

## Current limitations

Be accurate about what this test setup does **not** provide:

| Limitation | Notes |
|------------|--------|
| **No coverage reporting** | No `coverage.py` or equivalent gate |
| **No pytest fixtures** | pytest is not installed or required |
| **No unittest discovery** | `unittest discover` finds 0 tests with the current architecture |
| **No CI requirement** | This repository does not currently define GitHub Actions or other CI pipelines |
| **No nested test discovery** | Only top-level `tests/test_*.py` files run via `run_tests.py` |
| **No parallel execution** | Files run one subprocess at a time, in alphabetical order |

Do not claim pytest, coverage, CI, or unittest discovery as project capabilities unless they are explicitly added later.

---

## Related commands (not the full suite)

CLI and UI smoke checks are documented elsewhere and complement—but do not replace—the automated test suite:

* [`VERSION_2_TEST_COMMANDS.md`](VERSION_2_TEST_COMMANDS.md) — CLI, SQLite, pandas smoke sequence
* [README](../README.md) — Streamlit localhost run and project overview

Before merging substantive changes, run:

```bash
python3 run_tests.py
```

---

*Testing guide — canonical as of Version 8 Step 2; script-style architecture retained.*
