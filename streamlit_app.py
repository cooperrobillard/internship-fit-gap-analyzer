# Local Streamlit prototype for the Internship Fit & Skill-Gap Analyzer.
#
# This file calls the same backend functions as the CLI (no subprocess).
# Run from the repo root:
#   python3 -m streamlit run streamlit_app.py
import sys
from datetime import datetime
from pathlib import Path

# Add src/ so we can import analysis_runner like the CLI and tests do.
REPO_ROOT = Path(__file__).resolve().parent
SRC_FOLDER = REPO_ROOT / "src"
sys.path.insert(0, str(SRC_FOLDER))

from analysis_runner import run_single_job_analysis, save_analysis_to_database
from database import delete_saved_job_result_from_database
from database import get_all_saved_job_results
from database import get_database_summary
from database import get_saved_gap_priority_summary
from database import get_saved_job_result_for_comparison

# Safe sample inputs (public repo paths).
SAMPLE_RESUME_PATH = REPO_ROOT / "data/resume/sample_resume.txt"
PRIVATE_RESUME_PATH = REPO_ROOT / "data/resume/resume.txt"
DEFAULT_RESUME_PATH = SAMPLE_RESUME_PATH
DEFAULT_JOB_PATH = (
    REPO_ROOT / "data/sample_jobs/sample_ai_engineering_internship.txt"
)
DEFAULT_TAXONOMY_PATH = REPO_ROOT / "data/skills_taxonomy.json"
DEFAULT_ALIASES_PATH = REPO_ROOT / "data/skill_aliases.json"
DEFAULT_DATABASE_PATH = REPO_ROOT / "data/outputs/analysis_results.db"

RESUME_SOURCE_SAMPLE = "sample"
RESUME_SOURCE_PRIVATE = "private"

MODE_SAMPLE_JOB = "Analyze sample job"
MODE_PASTE_JOB = "Paste job description"
PASTED_JOB_NAME = "Pasted job description"


def private_resume_exists(private_resume_path=PRIVATE_RESUME_PATH):
    """Return True when the local private resume file is present."""
    return Path(private_resume_path).is_file()


def get_resume_source_choices(
    sample_resume_path=SAMPLE_RESUME_PATH,
    private_resume_path=PRIVATE_RESUME_PATH,
):
    """
    Build resume source options for the UI.

    The private option appears only when the local file exists.
    """
    choices = [
        {
            "key": RESUME_SOURCE_SAMPLE,
            "label": "Sample resume (safe for repo)",
            "path": Path(sample_resume_path),
        }
    ]

    if private_resume_exists(private_resume_path):
        choices.append(
            {
                "key": RESUME_SOURCE_PRIVATE,
                "label": "Private local resume",
                "path": Path(private_resume_path),
            }
        )

    return choices


def resolve_resume_path(
    resume_source_key,
    sample_resume_path=SAMPLE_RESUME_PATH,
    private_resume_path=PRIVATE_RESUME_PATH,
):
    """
    Map a resume source key to the file path used for analysis.
    """
    if resume_source_key == RESUME_SOURCE_PRIVATE:
        private_path = Path(private_resume_path)

        if not private_resume_exists(private_path):
            raise ValueError(
                "Private resume file is not available. "
                f"Expected: {private_path.relative_to(REPO_ROOT)}"
            )

        return private_path

    return Path(sample_resume_path)


def resume_path_label(resume_path, repo_root=REPO_ROOT):
    """Return a short repo-relative label for display in the UI."""
    resume_path = Path(resume_path)

    try:
        return str(resume_path.relative_to(repo_root))
    except ValueError:
        return str(resume_path)


def run_sample_analysis(
    resume_path=DEFAULT_RESUME_PATH,
    job_path=DEFAULT_JOB_PATH,
    taxonomy_path=DEFAULT_TAXONOMY_PATH,
    aliases_path=DEFAULT_ALIASES_PATH,
):
    """
    Run one-job analysis on the bundled sample files.

    Returns the same structured dictionary as the CLI backend helpers.
    """
    return run_single_job_analysis(
        resume_path=resume_path,
        job_path=job_path,
        taxonomy_path=taxonomy_path,
        aliases_path=aliases_path,
    )


def validate_pasted_job_text(job_text):
    """
    Return (is_valid, error_message) for pasted job description text.
    """
    if not str(job_text).strip():
        return False, "Job description cannot be empty. Paste some text first."

    return True, None


def get_default_database_path(repo_root=REPO_ROOT):
    """Return the default SQLite database path for UI saves."""
    return Path(repo_root) / "data/outputs/analysis_results.db"


def format_database_save_message(database_path, repo_root=REPO_ROOT):
    """Build a short success message showing where the run was saved."""
    database_path = Path(database_path)

    try:
        path_label = str(database_path.relative_to(repo_root))
    except ValueError:
        path_label = str(database_path)

    return (
        "Analysis saved to the local SQLite database. "
        f"Database file: `{path_label}`"
    )


def store_analysis_result(
    analysis_result,
    save_to_database,
    database_path=DEFAULT_DATABASE_PATH,
):
    """
    Optionally save an analysis result for session state.

    Returns (result, save_message). save_message is None when nothing was saved.
    """
    if not save_to_database:
        return analysis_result, None

    saved_path = save_analysis_to_database(analysis_result, database_path)
    updated_result = dict(analysis_result)
    updated_result["database_path"] = Path(saved_path)

    return updated_result, format_database_save_message(saved_path)


def run_pasted_job_analysis(
    job_text,
    job_name=PASTED_JOB_NAME,
    resume_path=DEFAULT_RESUME_PATH,
    taxonomy_path=DEFAULT_TAXONOMY_PATH,
    aliases_path=DEFAULT_ALIASES_PATH,
):
    """
    Analyze pasted job text against the selected resume file.

    Uses the backend's resume_path + job_text mode (no files written).
    """
    is_valid, error_message = validate_pasted_job_text(job_text)

    if not is_valid:
        raise ValueError(error_message)

    return run_single_job_analysis(
        resume_path=resume_path,
        job_text=job_text,
        job_name=job_name,
        taxonomy_path=taxonomy_path,
        aliases_path=aliases_path,
    )


def skills_by_category_has_data(skills_by_category):
    """Return True when at least one skill exists in the category dict."""
    for skills in skills_by_category.values():
        if skills:
            return True

    return False


def skills_by_category_to_rows(skills_by_category):
    """
    Turn a {category: [skills]} dict into table rows for st.dataframe.
    """
    rows = []

    for category in sorted(skills_by_category.keys()):
        for skill in sorted(skills_by_category[category]):
            rows.append({"Category": category, "Skill": skill})

    return rows


def format_skills_by_category(skills_by_category):
    """
    Turn a {category: [skills]} dict into simple text lines for the UI.

    Returns a list of strings like "Category: skill1, skill2".
    """
    lines = []

    for category in sorted(skills_by_category.keys()):
        skills = skills_by_category[category]

        if not skills:
            continue

        skill_text = ", ".join(sorted(skills))
        lines.append(f"{category}: {skill_text}")

    return lines


def recurring_gaps_to_rows(recurring_gaps):
    """Turn recurring gap records into table rows for st.dataframe."""
    rows = []

    for gap in recurring_gaps:
        rows.append(
            {
                "Skill": gap["gap_skill"],
                "Category": gap["category"],
                "Jobs missing this skill": gap["count"],
            }
        )

    return rows


def format_recurring_gaps(recurring_gaps):
    """
    Turn recurring gap records into readable lines for the UI.
    """
    lines = []

    for gap in recurring_gaps:
        lines.append(
            f"{gap['gap_skill']} ({gap['category']}) — seen in {gap['count']} job(s)"
        )

    return lines


def build_recurring_gap_highlights(recurring_gaps):
    """
    Build summary numbers for the recurring gaps section.
    """
    recurring_gaps_count = len(recurring_gaps)

    if recurring_gaps_count == 0:
        return {
            "recurring_gaps_count": 0,
            "top_recurring_gap_skill": None,
            "top_recurring_gap_caption": "No recurring gaps found.",
            "has_recurring_gaps": False,
        }

    top_gap = recurring_gaps[0]

    return {
        "recurring_gaps_count": recurring_gaps_count,
        "top_recurring_gap_skill": top_gap["gap_skill"],
        "top_recurring_gap_caption": (
            f"{top_gap['category']} — missing in {top_gap['count']} job(s)"
        ),
        "has_recurring_gaps": True,
    }


SAVED_HISTORY_MISSING_MESSAGE = (
    "No saved analysis database found yet. "
    "Run an analysis with SQLite saving enabled to create one."
)
RECENT_SAVED_RUNS_MISSING_MESSAGE = "No recent saved runs to display yet."
SAVED_COMPARISON_MISSING_MESSAGE = (
    "No saved analysis database found yet. "
    "Run an analysis with SQLite saving enabled to create one."
)
SAVED_COMPARISON_INSUFFICIENT_MESSAGE = (
    "At least two saved analyses are needed for comparison. "
    "Save another analysis run to compare results."
)
SAVED_COMPARISON_SAME_SELECTION_MESSAGE = (
    "Choose two different saved analyses to compare."
)
EMPTY_SKILL_LIST_LABEL = "None"
SAVED_GAP_PRIORITY_LIMIT = 10
SAVED_GAP_PRIORITY_MISSING_MESSAGE = (
    "No saved analysis database found yet. "
    "Run an analysis with SQLite saving enabled to create one."
)
SAVED_GAP_PRIORITY_EMPTY_MESSAGE = (
    "No saved skill gaps yet. Save an analysis run to build a priority summary."
)
SAVED_GAP_PRIORITY_GUIDANCE = (
    "These recurring gaps can help you decide what to study, practice, "
    "or build projects around next."
)
SAVED_SEARCH_GUIDANCE = (
    "Search by job name, saved date, run ID, or job-result ID."
)
SAVED_SEARCH_NO_MATCH_MESSAGE = "No saved analyses match this search."
SAVED_COMPARISON_SEARCH_INSUFFICIENT_MESSAGE = (
    "At least two saved analyses match this search. "
    "Try a broader search or clear the search box."
)
DELETE_SAVED_ANALYSIS_MISSING_MESSAGE = (
    "No saved analysis database found yet. "
    "Run an analysis with SQLite saving enabled to create one."
)
DELETE_SAVED_ANALYSIS_EMPTY_MESSAGE = (
    "No saved analyses are available to delete yet."
)
DELETE_SAVED_ANALYSIS_WARNING = (
    "This permanently deletes the selected saved analysis from your local "
    "SQLite database. This cannot be undone."
)
DELETE_SAVED_CONFIRM_LABEL = (
    "I understand that this permanently deletes the selected saved analysis."
)
DELETE_SAVED_BUTTON_LABEL = "Delete selected saved analysis"
DELETE_SAVED_SUCCESS_MESSAGE = (
    "Selected saved analysis deleted from the local database."
)
DELETE_SAVED_NOT_FOUND_MESSAGE = (
    "That saved analysis could not be found. It may have already been deleted."
)
DELETE_SAVED_FILTERED_CAPTION = (
    "Choosing from saved analyses that match your current search."
)
DELETE_SAVED_CONFIRM_SESSION_KEY = "delete_saved_analysis_confirm"
DELETE_SAVED_CONFIRM_RESET_PENDING_SESSION_KEY = (
    "delete_saved_analysis_confirm_reset_pending"
)
DELETE_SAVED_SELECTED_SESSION_KEY = "delete_saved_analysis_selected_id"
DELETE_SAVED_SUCCESS_SESSION_KEY = "delete_saved_analysis_success_message"


def normalize_saved_result(saved_result):
    """Return a saved-result dict with consistent keys for labels and sorting."""
    normalized = dict(saved_result)

    if "job_result_id" not in normalized and "id" in normalized:
        normalized["job_result_id"] = normalized["id"]

    return normalized


def format_saved_timestamp(run_timestamp):
    """Turn an ISO run timestamp into a shorter readable label."""
    if not run_timestamp:
        return "unknown time"

    timestamp_text = str(run_timestamp).strip()

    try:
        parsed = datetime.fromisoformat(timestamp_text)
    except ValueError:
        return timestamp_text

    hour = parsed.hour % 12 or 12
    return (
        f"{parsed.year:04d}-{parsed.month:02d}-{parsed.day:02d} "
        f"{hour}:{parsed.minute:02d} "
        f"{'AM' if parsed.hour < 12 else 'PM'}"
    )


def format_saved_result_label(saved_result):
    """
    Build a readable label for one saved job result.

    Uses stored fields only. Duplicate job names stay distinct via run and
    result IDs plus the saved timestamp.
    """
    saved_result = normalize_saved_result(saved_result)

    job_name = saved_result.get("job_filename") or "Unknown job"
    timestamp_label = format_saved_timestamp(saved_result.get("run_timestamp"))
    run_id = saved_result.get("run_id", "?")
    job_result_id = saved_result.get("job_result_id", "?")
    missing_count = saved_result.get("missing_skills_count", 0)
    matched_count = saved_result.get("matched_skills_count")

    label_parts = [
        job_name,
        f"saved {timestamp_label}",
        f"run {run_id}",
        f"result {job_result_id}",
        f"{missing_count} gaps",
    ]

    if matched_count is not None:
        label_parts.append(f"{matched_count} matched")

    return " | ".join(label_parts)


def sort_saved_results(saved_results):
    """
    Sort saved job results newest first with stable tie-breakers.

    Uses run timestamp when available, then run ID, job result ID, and job name.
    """
    normalized_results = [
        normalize_saved_result(saved_result) for saved_result in saved_results
    ]

    def sort_key(saved_result):
        timestamp = str(saved_result.get("run_timestamp") or "")
        run_id = int(saved_result.get("run_id") or 0)
        job_result_id = int(saved_result.get("job_result_id") or 0)
        job_name = str(saved_result.get("job_filename") or "")

        return (timestamp, run_id, job_result_id, job_name)

    return sorted(normalized_results, key=sort_key, reverse=True)


def normalize_search_query(search_query):
    """Normalize search text for case-insensitive, whitespace-tolerant matching."""
    return " ".join(str(search_query).strip().lower().split())


def build_saved_result_search_text(saved_result):
    """Build lowercase searchable text for one saved job result."""
    saved_result = normalize_saved_result(saved_result)

    searchable_parts = [
        saved_result.get("job_filename", ""),
        format_saved_timestamp(saved_result.get("run_timestamp")),
        str(saved_result.get("run_timestamp") or ""),
        str(saved_result.get("run_id", "")),
        str(saved_result.get("job_result_id", "")),
        format_saved_result_label(saved_result),
    ]

    return " ".join(str(part) for part in searchable_parts if part).lower()


def filter_saved_results(saved_results, search_query):
    """
    Return saved results that match a search query.

    Empty or whitespace-only queries return all results in their existing order.
    The input collection is not mutated.
    """
    normalized_query = normalize_search_query(search_query)

    if not normalized_query:
        return list(saved_results)

    filtered_results = []

    for saved_result in saved_results:
        if normalized_query in build_saved_result_search_text(saved_result):
            filtered_results.append(saved_result)

    return filtered_results


def load_all_sorted_saved_results(database_path=DEFAULT_DATABASE_PATH):
    """
    Load every saved job result from SQLite in newest-first order.

    Returns a dict for saved-history UI builders and for tests.
    """
    saved_data = get_all_saved_job_results(database_path)

    if not saved_data["exists"]:
        return {
            "exists": False,
            "database_path": saved_data["database_path"],
            "saved_jobs": [],
        }

    return {
        "exists": True,
        "database_path": saved_data["database_path"],
        "saved_jobs": sort_saved_results(saved_data["saved_jobs"]),
    }


def recent_saved_jobs_to_rows(recent_jobs):
    """Turn recent saved job records into table rows for st.dataframe."""
    rows = []

    for job in sort_saved_results(recent_jobs):
        normalized_job = normalize_saved_result(job)

        rows.append(
            {
                "Saved result": format_saved_result_label(normalized_job),
                "Run ID": normalized_job["run_id"],
                "Saved at": format_saved_timestamp(normalized_job["run_timestamp"]),
                "Job": normalized_job["job_filename"],
                "Result ID": normalized_job.get("job_result_id"),
                "Matched skills": normalized_job["matched_skills_count"],
                "Missing skills": normalized_job["missing_skills_count"],
            }
        )

    return rows


def build_recent_saved_runs_display(
    database_path=DEFAULT_DATABASE_PATH,
    search_query="",
):
    """
    Build a display-friendly saved-runs list from the SQLite database.

    Uses every saved job result (not a limited recent subset), optionally
    filtered by search_query. Returns a dict for render_recent_saved_runs().
    """
    saved_data = load_all_sorted_saved_results(database_path)

    if not saved_data["exists"]:
        return {
            "database_exists": False,
            "missing_message": RECENT_SAVED_RUNS_MISSING_MESSAGE,
        }

    all_saved_jobs = saved_data["saved_jobs"]
    filtered_jobs = filter_saved_results(all_saved_jobs, search_query)
    is_filtered = bool(normalize_search_query(search_query))

    if len(all_saved_jobs) == 0:
        return {
            "database_exists": True,
            "has_recent_jobs": False,
            "total_saved_count": 0,
            "is_filtered": is_filtered,
        }

    if is_filtered and len(filtered_jobs) == 0:
        return {
            "database_exists": True,
            "has_recent_jobs": True,
            "search_no_match": True,
            "no_match_message": SAVED_SEARCH_NO_MATCH_MESSAGE,
            "total_saved_count": len(all_saved_jobs),
            "is_filtered": True,
        }

    return {
        "database_exists": True,
        "recent_jobs": filtered_jobs,
        "recent_jobs_rows": recent_saved_jobs_to_rows(filtered_jobs),
        "has_recent_jobs": True,
        "filtered_count": len(filtered_jobs),
        "total_saved_count": len(all_saved_jobs),
        "is_filtered": is_filtered,
    }


def compare_skill_collections(first_skills, second_skills):
    """
    Compare two skill collections and return sorted comparison groups.

    Duplicate values in either input are normalized safely.
    """
    first_set = set(first_skills)
    second_set = set(second_skills)

    return {
        "shared": sorted(first_set & second_set),
        "unique_to_first": sorted(first_set - second_set),
        "unique_to_second": sorted(second_set - first_set),
    }


def format_skill_list_for_display(skills):
    """Turn a skill list into a friendly UI string."""
    if not skills:
        return EMPTY_SKILL_LIST_LABEL

    return ", ".join(skills)


def build_compare_saved_analyses_options(
    database_path=DEFAULT_DATABASE_PATH,
    search_query="",
):
    """
    Build selectable saved-job options for the comparison section.

    Uses the full saved-result collection, optionally filtered by search_query.
    Returns a dict for render_compare_saved_analyses() and for tests.
    """
    saved_data = load_all_sorted_saved_results(database_path)

    if not saved_data["exists"]:
        return {
            "database_exists": False,
            "missing_message": SAVED_COMPARISON_MISSING_MESSAGE,
        }

    all_saved_jobs = saved_data["saved_jobs"]
    saved_jobs = filter_saved_results(all_saved_jobs, search_query)
    is_filtered = bool(normalize_search_query(search_query))

    if len(all_saved_jobs) == 0:
        return {
            "database_exists": True,
            "can_compare": False,
            "insufficient_message": SAVED_COMPARISON_INSUFFICIENT_MESSAGE,
            "saved_jobs_count": 0,
            "total_saved_count": 0,
            "is_filtered": is_filtered,
        }

    if is_filtered and len(saved_jobs) == 0:
        return {
            "database_exists": True,
            "can_compare": False,
            "search_no_match": True,
            "no_match_message": SAVED_SEARCH_NO_MATCH_MESSAGE,
            "saved_jobs_count": 0,
            "total_saved_count": len(all_saved_jobs),
            "is_filtered": True,
        }

    if len(saved_jobs) < 2:
        if is_filtered and len(all_saved_jobs) >= 2:
            insufficient_message = SAVED_COMPARISON_SEARCH_INSUFFICIENT_MESSAGE
        else:
            insufficient_message = SAVED_COMPARISON_INSUFFICIENT_MESSAGE

        return {
            "database_exists": True,
            "can_compare": False,
            "insufficient_message": insufficient_message,
            "saved_jobs_count": len(saved_jobs),
            "total_saved_count": len(all_saved_jobs),
            "is_filtered": is_filtered,
        }

    options = []

    for saved_job in saved_jobs:
        options.append(
            {
                "job_result_id": saved_job["job_result_id"],
                "label": format_saved_result_label(saved_job),
            }
        )

    return {
        "database_exists": True,
        "can_compare": True,
        "options": options,
        "default_first_id": options[0]["job_result_id"],
        "default_second_id": options[1]["job_result_id"],
        "saved_jobs_count": len(saved_jobs),
        "total_saved_count": len(all_saved_jobs),
        "is_filtered": is_filtered,
    }


def build_delete_saved_analysis_display(
    database_path=DEFAULT_DATABASE_PATH,
    search_query="",
):
    """
    Build selectable saved-job options for the deletion section.

    Uses the same filtered collection as other saved-result pickers when search
    is active. Returns a dict for render_delete_saved_analysis() and tests.
    """
    saved_data = load_all_sorted_saved_results(database_path)

    if not saved_data["exists"]:
        return {
            "database_exists": False,
            "missing_message": DELETE_SAVED_ANALYSIS_MISSING_MESSAGE,
        }

    all_saved_jobs = saved_data["saved_jobs"]
    selectable_jobs = filter_saved_results(all_saved_jobs, search_query)
    is_filtered = bool(normalize_search_query(search_query))

    if len(all_saved_jobs) == 0:
        return {
            "database_exists": True,
            "can_delete": False,
            "empty_message": DELETE_SAVED_ANALYSIS_EMPTY_MESSAGE,
            "total_saved_count": 0,
            "is_filtered": is_filtered,
        }

    if is_filtered and len(selectable_jobs) == 0:
        return {
            "database_exists": True,
            "can_delete": False,
            "search_no_match": True,
            "no_match_message": SAVED_SEARCH_NO_MATCH_MESSAGE,
            "total_saved_count": len(all_saved_jobs),
            "is_filtered": True,
        }

    options = []

    for saved_job in selectable_jobs:
        options.append(
            {
                "job_result_id": saved_job["job_result_id"],
                "label": format_saved_result_label(saved_job),
            }
        )

    return {
        "database_exists": True,
        "can_delete": True,
        "options": options,
        "default_job_result_id": options[0]["job_result_id"],
        "selectable_count": len(options),
        "total_saved_count": len(all_saved_jobs),
        "is_filtered": is_filtered,
    }


def apply_pending_delete_saved_analysis_confirmation_reset(session_state):
    """
    Apply a pending confirmation reset before the checkbox widget renders.

    Returns True when a pending reset was applied.
    """
    if not session_state.get(DELETE_SAVED_CONFIRM_RESET_PENDING_SESSION_KEY):
        return False

    session_state[DELETE_SAVED_CONFIRM_SESSION_KEY] = False
    del session_state[DELETE_SAVED_CONFIRM_RESET_PENDING_SESSION_KEY]
    session_state.pop(DELETE_SAVED_SELECTED_SESSION_KEY, None)
    return True


def request_delete_saved_analysis_confirmation_reset(session_state):
    """Request a confirmation reset on the next render after deletion."""
    session_state[DELETE_SAVED_CONFIRM_RESET_PENDING_SESSION_KEY] = True
    session_state.pop(DELETE_SAVED_SELECTED_SESSION_KEY, None)


def build_compare_saved_analyses_result(
    first_job_result_id,
    second_job_result_id,
    database_path=DEFAULT_DATABASE_PATH,
):
    """
    Build a missing-skill comparison between two saved job results.

    Returns a dict with status codes for the UI and for tests.
    """
    if first_job_result_id == second_job_result_id:
        return {
            "status": "same_selection",
            "message": SAVED_COMPARISON_SAME_SELECTION_MESSAGE,
        }

    first_result = get_saved_job_result_for_comparison(
        database_path,
        first_job_result_id,
    )
    second_result = get_saved_job_result_for_comparison(
        database_path,
        second_job_result_id,
    )

    if first_result is None or second_result is None:
        return {
            "status": "missing_selection",
            "message": "One or both saved analyses could not be found.",
        }

    comparison = compare_skill_collections(
        first_result["missing_skills"],
        second_result["missing_skills"],
    )

    return {
        "status": "ready",
        "first_job_name": first_result["job_filename"],
        "second_job_name": second_result["job_filename"],
        "first_missing_skills_count": first_result["missing_skills_count"],
        "second_missing_skills_count": second_result["missing_skills_count"],
        "shared_missing_skills": comparison["shared"],
        "missing_skills_unique_to_first": comparison["unique_to_first"],
        "missing_skills_unique_to_second": comparison["unique_to_second"],
        "shared_missing_skills_label": format_skill_list_for_display(
            comparison["shared"]
        ),
        "missing_skills_unique_to_first_label": format_skill_list_for_display(
            comparison["unique_to_first"]
        ),
        "missing_skills_unique_to_second_label": format_skill_list_for_display(
            comparison["unique_to_second"]
        ),
    }


def render_compare_saved_analyses(st, options_display, database_path=DEFAULT_DATABASE_PATH):
    """Show a read-only comparison between two saved job results."""
    st.subheader("Compare Saved Analyses")

    if not options_display["database_exists"]:
        st.info(options_display["missing_message"])
        return

    if options_display.get("search_no_match"):
        st.info(options_display["no_match_message"])
        return

    if not options_display["can_compare"]:
        st.info(options_display["insufficient_message"])
        return

    option_labels = [option["label"] for option in options_display["options"]]
    label_to_id = {
        option["label"]: option["job_result_id"]
        for option in options_display["options"]
    }

    first_label = st.selectbox(
        "First saved analysis",
        option_labels,
        key="compare_saved_first",
    )
    second_label = st.selectbox(
        "Second saved analysis",
        option_labels,
        index=1,
        key="compare_saved_second",
    )

    comparison = build_compare_saved_analyses_result(
        label_to_id[first_label],
        label_to_id[second_label],
        database_path=database_path,
    )

    if comparison["status"] == "same_selection":
        st.info(comparison["message"])
        return

    if comparison["status"] != "ready":
        st.warning(comparison["message"])
        return

    st.markdown(f"**First job:** {comparison['first_job_name']}")
    st.markdown(f"**Second job:** {comparison['second_job_name']}")

    first_count_col, second_count_col = st.columns(2)

    with first_count_col:
        st.metric(
            "First missing-skill count",
            comparison["first_missing_skills_count"],
        )

    with second_count_col:
        st.metric(
            "Second missing-skill count",
            comparison["second_missing_skills_count"],
        )

    st.markdown("**Shared missing skills**")
    st.write(comparison["shared_missing_skills_label"])

    st.markdown("**Missing skills unique to the first saved result**")
    st.write(comparison["missing_skills_unique_to_first_label"])

    st.markdown("**Missing skills unique to the second saved result**")
    st.write(comparison["missing_skills_unique_to_second_label"])


def render_delete_saved_analysis(
    st,
    display,
    database_path=DEFAULT_DATABASE_PATH,
):
    """Show a guarded, one-at-a-time delete control for saved job results."""
    st.subheader("Delete Saved Analysis")

    success_message = st.session_state.pop(DELETE_SAVED_SUCCESS_SESSION_KEY, None)
    if success_message:
        st.success(success_message)

    apply_pending_delete_saved_analysis_confirmation_reset(st.session_state)

    st.warning(DELETE_SAVED_ANALYSIS_WARNING)

    if not display["database_exists"]:
        st.info(display["missing_message"])
        return

    if display.get("search_no_match"):
        st.info(display["no_match_message"])
        return

    if not display.get("can_delete"):
        st.info(display["empty_message"])
        return

    if display.get("is_filtered"):
        st.caption(DELETE_SAVED_FILTERED_CAPTION)

    option_labels = [option["label"] for option in display["options"]]
    label_to_id = {
        option["label"]: option["job_result_id"] for option in display["options"]
    }

    selected_label = st.selectbox(
        "Saved analysis to delete",
        option_labels,
        key="delete_saved_analysis_selectbox",
    )
    selected_job_result_id = label_to_id[selected_label]

    if (
        st.session_state.get(DELETE_SAVED_SELECTED_SESSION_KEY)
        != selected_job_result_id
    ):
        st.session_state[DELETE_SAVED_CONFIRM_SESSION_KEY] = False
        st.session_state[DELETE_SAVED_SELECTED_SESSION_KEY] = selected_job_result_id

    confirm_delete = st.checkbox(
        DELETE_SAVED_CONFIRM_LABEL,
        key=DELETE_SAVED_CONFIRM_SESSION_KEY,
    )

    if st.button(
        DELETE_SAVED_BUTTON_LABEL,
        type="primary",
        disabled=not confirm_delete,
        key="delete_saved_analysis_button",
    ):
        delete_result = delete_saved_job_result_from_database(
            database_path,
            selected_job_result_id,
        )

        if delete_result["deleted"]:
            st.session_state[DELETE_SAVED_SUCCESS_SESSION_KEY] = (
                DELETE_SAVED_SUCCESS_MESSAGE
            )
            request_delete_saved_analysis_confirmation_reset(st.session_state)
            st.rerun()
            return

        st.warning(DELETE_SAVED_NOT_FOUND_MESSAGE)


def format_example_job_names(job_names):
    """Turn example job filenames into a readable comma-separated string."""
    if not job_names:
        return EMPTY_SKILL_LIST_LABEL

    return ", ".join(job_names)


def saved_gap_priorities_to_rows(priorities):
    """Turn saved gap priority records into table rows for st.dataframe."""
    rows = []

    for priority in priorities:
        rows.append(
            {
                "Skill": priority["gap_skill"],
                "Category": priority["category"],
                "Saved job results missing this skill": priority["count"],
                "Example jobs": format_example_job_names(
                    priority["example_job_names"]
                ),
            }
        )

    return rows


def format_saved_gap_priority_lines(priorities):
    """Turn saved gap priority records into readable lines for the UI."""
    lines = []

    for priority in priorities:
        example_jobs = format_example_job_names(priority["example_job_names"])
        lines.append(
            f"{priority['gap_skill']} ({priority['category']}) — "
            f"missing in {priority['count']} saved job result(s); "
            f"example jobs: {example_jobs}"
        )

    return lines


def build_saved_gap_priority_display(
    database_path=DEFAULT_DATABASE_PATH,
    limit=SAVED_GAP_PRIORITY_LIMIT,
):
    """
    Build a display-friendly saved gap priority summary from SQLite.

    Returns a dict for render_saved_gap_priority_summary() and for tests.
    """
    summary = get_saved_gap_priority_summary(database_path, limit=limit)

    if not summary["exists"]:
        return {
            "database_exists": False,
            "missing_message": SAVED_GAP_PRIORITY_MISSING_MESSAGE,
        }

    if not summary["has_saved_gaps"]:
        return {
            "database_exists": True,
            "has_saved_gaps": False,
            "empty_message": SAVED_GAP_PRIORITY_EMPTY_MESSAGE,
        }

    priorities = summary["priorities"]

    return {
        "database_exists": True,
        "has_saved_gaps": True,
        "priorities": priorities,
        "priority_rows": saved_gap_priorities_to_rows(priorities),
        "priority_lines": format_saved_gap_priority_lines(priorities),
        "has_priorities": len(priorities) > 0,
        "limit": summary["limit"],
        "guidance": SAVED_GAP_PRIORITY_GUIDANCE,
    }


def render_saved_gap_priority_summary(st, display):
    """Show recurring missing-skill priorities across saved analyses."""
    st.subheader("Saved Gap Priority Summary")

    if not display["database_exists"]:
        st.info(display["missing_message"])
        return

    if not display["has_saved_gaps"]:
        st.info(display["empty_message"])
        return

    st.caption(display["guidance"])

    if not display["has_priorities"]:
        st.info(display["empty_message"])
        return

    st.caption(
        f"Showing up to {display['limit']} recurring missing skills "
        "across all saved job analyses."
    )
    st.dataframe(
        display["priority_rows"],
        hide_index=True,
        width="stretch",
    )

    with st.expander("View saved gap priorities as a text list"):
        for line in display["priority_lines"]:
            st.write(line)


def render_saved_result_search_input(st, saved_history_display):
    """
    Show the saved-result search box when saved data exists.

    Returns the current search query (empty string when search is hidden).
    """
    if not saved_history_display.get("database_exists"):
        return ""

    if saved_history_display.get("job_results_count", 0) == 0:
        return ""

    search_query = st.text_input(
        "Search saved analyses",
        placeholder=SAVED_SEARCH_GUIDANCE,
        key="saved_results_search",
    )
    st.caption(SAVED_SEARCH_GUIDANCE)

    return search_query


def render_recent_saved_runs(st, display):
    """Show a read-only table of saved job results."""
    st.subheader("Recent Saved Runs")

    if not display["database_exists"]:
        st.info(display["missing_message"])
        return

    if not display.get("has_recent_jobs"):
        st.info("No saved job results yet.")
        return

    if display.get("search_no_match"):
        st.info(display["no_match_message"])
        return

    if display.get("is_filtered"):
        st.caption(
            f"Showing {display['filtered_count']} saved job result(s) "
            "that match your search, newest first."
        )
    else:
        st.caption(
            f"Showing all {display['total_saved_count']} saved job results, "
            "newest first."
        )

    st.dataframe(
        display["recent_jobs_rows"],
        hide_index=True,
        width="stretch",
    )


def build_saved_history_display(
    database_path=DEFAULT_DATABASE_PATH,
    repo_root=REPO_ROOT,
):
    """
    Build a display-friendly saved-history summary from the SQLite database.

    Returns a dict for render_saved_analysis_history() and for tests.
    """
    summary = get_database_summary(database_path)

    if not summary["exists"]:
        return {
            "database_exists": False,
            "missing_message": SAVED_HISTORY_MISSING_MESSAGE,
        }

    top_recurring_gaps = summary["top_recurring_gaps"]

    return {
        "database_exists": True,
        "database_path_label": resume_path_label(summary["database_path"], repo_root),
        "analysis_runs_count": summary["analysis_runs_count"],
        "job_results_count": summary["job_results_count"],
        "skill_gaps_count": summary["skill_gaps_count"],
        "latest_run_id": summary["latest_run_id"],
        "top_recurring_gaps_rows": recurring_gaps_to_rows(top_recurring_gaps),
        "top_recurring_gaps_lines": format_recurring_gaps(top_recurring_gaps),
        "has_top_recurring_gaps": len(top_recurring_gaps) > 0,
    }


def render_saved_analysis_history(st, display):
    """Show a read-only summary of saved analysis runs in SQLite."""
    st.subheader("Saved Analysis History")

    if not display["database_exists"]:
        st.info(display["missing_message"])
        return

    st.caption(f"Database file: `{display['database_path_label']}`")

    runs_col, jobs_col, gaps_col = st.columns(3)

    with runs_col:
        st.metric("Analysis runs", display["analysis_runs_count"])

    with jobs_col:
        st.metric("Job results", display["job_results_count"])

    with gaps_col:
        st.metric("Saved skill gaps", display["skill_gaps_count"])

    if display["latest_run_id"] is not None:
        st.caption(f"Latest run ID: {display['latest_run_id']}")

    st.markdown("**Top recurring gaps (latest run)**")

    if display["has_top_recurring_gaps"]:
        st.dataframe(
            display["top_recurring_gaps_rows"],
            hide_index=True,
            width="stretch",
        )

        with st.expander("View top recurring gaps as a text list"):
            for line in display["top_recurring_gaps_lines"]:
                st.write(line)
    else:
        st.info("No recurring gaps saved yet.")


def build_display_summary(analysis_result):
    """
    Build a plain dict of display-friendly lists/strings from a backend result.

    Useful for tests and for keeping Streamlit rendering code small.
    """
    jobs = analysis_result["jobs"]
    job_summaries = []

    for job in jobs:
        matched_skills = job["matched_skills"]
        missing_skills = job["missing_skills"]

        job_summaries.append(
            {
                "job_name": job["job_name"],
                "matched_skills_lines": format_skills_by_category(matched_skills),
                "missing_skills_lines": format_skills_by_category(missing_skills),
                "matched_skills_rows": skills_by_category_to_rows(matched_skills),
                "missing_skills_rows": skills_by_category_to_rows(missing_skills),
                "has_matched_skills": skills_by_category_has_data(matched_skills),
                "has_missing_skills": skills_by_category_has_data(missing_skills),
                "matched_skills_count": job["matched_skills_count"],
                "missing_skills_count": job["missing_skills_count"],
            }
        )

    output_files = analysis_result.get("output_files", [])
    recurring_gaps = analysis_result["recurring_gaps"]
    gap_highlights = build_recurring_gap_highlights(recurring_gaps)

    return {
        "jobs_analyzed_count": analysis_result["jobs_analyzed_count"],
        "jobs": job_summaries,
        "recurring_gaps_lines": format_recurring_gaps(recurring_gaps),
        "recurring_gaps_rows": recurring_gaps_to_rows(recurring_gaps),
        "output_files": output_files,
        "has_output_files": len(output_files) > 0,
        "resume_path_label": resume_path_label(analysis_result["resume_path"]),
        **gap_highlights,
    }


def render_analysis_results(st, display):
    """Show structured analysis results in the Streamlit page."""
    st.subheader("Analysis results")
    st.caption(f"Resume used: `{display['resume_path_label']}`")

    summary_col_jobs, summary_col_gaps, summary_col_top_gap = st.columns(3)

    with summary_col_jobs:
        st.metric("Jobs analyzed", display["jobs_analyzed_count"])

    with summary_col_gaps:
        st.metric("Recurring gaps", display["recurring_gaps_count"])

    with summary_col_top_gap:
        top_gap_skill = display["top_recurring_gap_skill"]
        st.metric(
            "Top recurring gap",
            top_gap_skill if top_gap_skill else "None",
        )
        st.caption(display["top_recurring_gap_caption"])

    for job in display["jobs"]:
        st.markdown(f"#### {job['job_name']}")

        matched_col, missing_col = st.columns(2)

        with matched_col:
            st.markdown(f"**Matched skills** ({job['matched_skills_count']} total)")

            if job["has_matched_skills"]:
                with st.expander("View matched skills table", expanded=True):
                    st.dataframe(
                        job["matched_skills_rows"],
                        hide_index=True,
                        width="stretch",
                    )
            else:
                st.info("No matched skills found for this job.")

        with missing_col:
            st.markdown(f"**Missing skills** ({job['missing_skills_count']} total)")

            if job["has_missing_skills"]:
                with st.expander("View missing skills table", expanded=True):
                    st.dataframe(
                        job["missing_skills_rows"],
                        hide_index=True,
                        width="stretch",
                    )
            else:
                st.info("No missing skills found for this job.")

    st.subheader("Recurring gaps")

    if display["has_recurring_gaps"]:
        st.dataframe(
            display["recurring_gaps_rows"],
            hide_index=True,
            width="stretch",
        )

        with st.expander("View recurring gaps as a text list"):
            for line in display["recurring_gaps_lines"]:
                st.write(line)
    else:
        st.info("No recurring gaps to show for this run.")

    st.subheader("Output files")

    if display["has_output_files"]:
        st.table(
            [{"File path": file_path} for file_path in display["output_files"]]
        )
    else:
        st.info(
            "No report files written for this preview run. "
            "Use the CLI with `--outputs` to generate markdown and CSV files."
        )


def _render_resume_source_selector(st):
    """Show resume source controls and return the selected resume file path."""
    resume_choices = get_resume_source_choices()
    choice_labels = [choice["label"] for choice in resume_choices]
    label_to_choice = {choice["label"]: choice for choice in resume_choices}

    if not private_resume_exists():
        st.info(
            "Private resume option is unavailable. To use your own resume locally, "
            f"create `{resume_path_label(PRIVATE_RESUME_PATH)}` on your machine. "
            "Keep that file local and do not commit it to Git."
        )
    else:
        st.warning(
            f"Private resume mode reads `{resume_path_label(PRIVATE_RESUME_PATH)}` "
            "from your computer only. Do not commit that file or paste resume text "
            "into the repo."
        )

    selected_label = st.radio(
        "Resume source",
        choice_labels,
        horizontal=True,
    )
    selected_choice = label_to_choice[selected_label]
    selected_resume_path = selected_choice["path"]

    st.caption(f"Selected resume file: `{resume_path_label(selected_resume_path)}`")

    return selected_choice["key"], selected_resume_path


def main():
    import streamlit as st

    st.set_page_config(page_title="Internship Fit Analyzer (local)", layout="wide")

    st.title("Internship Fit & Skill-Gap Analyzer")
    st.caption(
        "Local prototype only. Choose a sample or private local resume file, "
        "then analyze a sample job or pasted job text. Rule-based matching — "
        "not an AI job-fit score."
    )

    resume_source_key, selected_resume_path = _render_resume_source_selector(st)

    input_mode = st.radio(
        "How do you want to provide the job?",
        [MODE_SAMPLE_JOB, MODE_PASTE_JOB],
        horizontal=True,
    )

    save_to_database = st.checkbox(
        "Save this analysis to local SQLite database",
        value=False,
    )

    def apply_analysis_result(analysis_result):
        result, save_message = store_analysis_result(
            analysis_result,
            save_to_database=save_to_database,
        )
        st.session_state["analysis_result"] = result

        if save_message:
            st.session_state["database_save_message"] = save_message
        else:
            st.session_state.pop("database_save_message", None)

    resume_or_mode_changed = (
        st.session_state.get("last_input_mode") != input_mode
        or st.session_state.get("last_resume_source") != resume_source_key
    )

    if resume_or_mode_changed:
        st.session_state["last_input_mode"] = input_mode
        st.session_state["last_resume_source"] = resume_source_key

        if input_mode == MODE_SAMPLE_JOB:
            apply_analysis_result(
                run_sample_analysis(resume_path=selected_resume_path)
            )
        else:
            st.session_state.pop("analysis_result", None)
            st.session_state.pop("database_save_message", None)

    if input_mode == MODE_SAMPLE_JOB:
        st.info(
            f"Resume: `{resume_path_label(selected_resume_path)}`  \n"
            f"Job: `{DEFAULT_JOB_PATH.relative_to(REPO_ROOT)}`"
        )

        if st.button("Run sample analysis", type="primary"):
            apply_analysis_result(
                run_sample_analysis(resume_path=selected_resume_path)
            )

        if "analysis_result" not in st.session_state:
            apply_analysis_result(
                run_sample_analysis(resume_path=selected_resume_path)
            )

    else:
        st.info(f"Resume: `{resume_path_label(selected_resume_path)}`")

        pasted_job_text = st.text_area(
            "Paste one job description",
            height=220,
            placeholder="Paste an internship posting here...",
        )

        if st.button("Analyze pasted job", type="primary"):
            is_valid, error_message = validate_pasted_job_text(pasted_job_text)

            if not is_valid:
                st.error(error_message)
            else:
                apply_analysis_result(
                    run_pasted_job_analysis(
                        pasted_job_text,
                        resume_path=selected_resume_path,
                    )
                )

    if st.session_state.get("database_save_message"):
        st.success(st.session_state["database_save_message"])

    if "analysis_result" in st.session_state:
        display = build_display_summary(st.session_state["analysis_result"])
        render_analysis_results(st, display)
    elif input_mode == MODE_PASTE_JOB:
        st.write("Paste a job description above, then click **Analyze pasted job**.")

    saved_history_display = build_saved_history_display()
    render_saved_analysis_history(st, saved_history_display)

    saved_results_search_query = render_saved_result_search_input(
        st,
        saved_history_display,
    )

    recent_saved_runs_display = build_recent_saved_runs_display(
        search_query=saved_results_search_query,
    )
    render_recent_saved_runs(st, recent_saved_runs_display)

    compare_saved_analyses_options = build_compare_saved_analyses_options(
        search_query=saved_results_search_query,
    )
    render_compare_saved_analyses(
        st,
        compare_saved_analyses_options,
        database_path=DEFAULT_DATABASE_PATH,
    )

    saved_gap_priority_display = build_saved_gap_priority_display()
    render_saved_gap_priority_summary(st, saved_gap_priority_display)

    delete_saved_analysis_display = build_delete_saved_analysis_display(
        search_query=saved_results_search_query,
    )
    render_delete_saved_analysis(
        st,
        delete_saved_analysis_display,
        database_path=DEFAULT_DATABASE_PATH,
    )


if __name__ == "__main__":
    main()
