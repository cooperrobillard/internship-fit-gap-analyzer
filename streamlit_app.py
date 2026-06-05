# Local Streamlit prototype for the Internship Fit & Skill-Gap Analyzer.
#
# This file calls the same backend functions as the CLI (no subprocess).
# Run from the repo root:
#   python3 -m streamlit run streamlit_app.py
import sys
from pathlib import Path

# Add src/ so we can import analysis_runner like the CLI and tests do.
REPO_ROOT = Path(__file__).resolve().parent
SRC_FOLDER = REPO_ROOT / "src"
sys.path.insert(0, str(SRC_FOLDER))

from analysis_runner import run_single_job_analysis

# Safe sample inputs (public repo paths).
SAMPLE_RESUME_PATH = REPO_ROOT / "data/resume/sample_resume.txt"
PRIVATE_RESUME_PATH = REPO_ROOT / "data/resume/resume.txt"
DEFAULT_RESUME_PATH = SAMPLE_RESUME_PATH
DEFAULT_JOB_PATH = (
    REPO_ROOT / "data/sample_jobs/sample_ai_engineering_internship.txt"
)
DEFAULT_TAXONOMY_PATH = REPO_ROOT / "data/skills_taxonomy.json"
DEFAULT_ALIASES_PATH = REPO_ROOT / "data/skill_aliases.json"

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
                        use_container_width=True,
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
                        use_container_width=True,
                    )
            else:
                st.info("No missing skills found for this job.")

    st.subheader("Recurring gaps")

    if display["has_recurring_gaps"]:
        st.dataframe(
            display["recurring_gaps_rows"],
            hide_index=True,
            use_container_width=True,
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

    resume_or_mode_changed = (
        st.session_state.get("last_input_mode") != input_mode
        or st.session_state.get("last_resume_source") != resume_source_key
    )

    if resume_or_mode_changed:
        st.session_state["last_input_mode"] = input_mode
        st.session_state["last_resume_source"] = resume_source_key

        if input_mode == MODE_SAMPLE_JOB:
            st.session_state["analysis_result"] = run_sample_analysis(
                resume_path=selected_resume_path
            )
        else:
            st.session_state.pop("analysis_result", None)

    if input_mode == MODE_SAMPLE_JOB:
        st.info(
            f"Resume: `{resume_path_label(selected_resume_path)}`  \n"
            f"Job: `{DEFAULT_JOB_PATH.relative_to(REPO_ROOT)}`"
        )

        if st.button("Run sample analysis", type="primary"):
            st.session_state["analysis_result"] = run_sample_analysis(
                resume_path=selected_resume_path
            )

        if "analysis_result" not in st.session_state:
            st.session_state["analysis_result"] = run_sample_analysis(
                resume_path=selected_resume_path
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
                st.session_state["analysis_result"] = run_pasted_job_analysis(
                    pasted_job_text,
                    resume_path=selected_resume_path,
                )

    if "analysis_result" in st.session_state:
        display = build_display_summary(st.session_state["analysis_result"])
        render_analysis_results(st, display)
    elif input_mode == MODE_PASTE_JOB:
        st.write("Paste a job description above, then click **Analyze pasted job**.")


if __name__ == "__main__":
    main()
