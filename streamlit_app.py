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

# Safe sample inputs only (same paths as the CLI defaults for demos).
DEFAULT_RESUME_PATH = REPO_ROOT / "data/resume/sample_resume.txt"
DEFAULT_JOB_PATH = (
    REPO_ROOT / "data/sample_jobs/sample_ai_engineering_internship.txt"
)
DEFAULT_TAXONOMY_PATH = REPO_ROOT / "data/skills_taxonomy.json"
DEFAULT_ALIASES_PATH = REPO_ROOT / "data/skill_aliases.json"


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

    if not lines:
        lines.append("(none)")

    return lines


def format_recurring_gaps(recurring_gaps):
    """
    Turn recurring gap records into readable lines for the UI.
    """
    lines = []

    for gap in recurring_gaps:
        lines.append(
            f"{gap['gap_skill']} ({gap['category']}) — seen in {gap['count']} job(s)"
        )

    if not lines:
        lines.append("(none)")

    return lines


def build_display_summary(analysis_result):
    """
    Build a plain dict of display-friendly lists/strings from a backend result.

    Useful for tests and for keeping Streamlit rendering code small.
    """
    jobs = analysis_result["jobs"]
    job_summaries = []

    for job in jobs:
        job_summaries.append(
            {
                "job_name": job["job_name"],
                "matched_skills_lines": format_skills_by_category(
                    job["matched_skills"]
                ),
                "missing_skills_lines": format_skills_by_category(
                    job["missing_skills"]
                ),
                "matched_skills_count": job["matched_skills_count"],
                "missing_skills_count": job["missing_skills_count"],
            }
        )

    output_files = analysis_result.get("output_files", [])

    return {
        "jobs_analyzed_count": analysis_result["jobs_analyzed_count"],
        "jobs": job_summaries,
        "recurring_gaps_lines": format_recurring_gaps(
            analysis_result["recurring_gaps"]
        ),
        "output_files": output_files,
        "has_output_files": len(output_files) > 0,
    }


def main():
    import streamlit as st

    st.set_page_config(page_title="Internship Fit Analyzer (local)", layout="wide")

    st.title("Internship Fit & Skill-Gap Analyzer")
    st.caption(
        "Local prototype only. Uses safe sample resume and job files from this repo. "
        "Rule-based matching — not an AI job-fit score."
    )

    st.info(
        f"Resume: `{DEFAULT_RESUME_PATH.relative_to(REPO_ROOT)}`  \n"
        f"Job: `{DEFAULT_JOB_PATH.relative_to(REPO_ROOT)}`"
    )

    if st.button("Run sample analysis", type="primary"):
        st.session_state["analysis_result"] = run_sample_analysis()

    # Run once on first load so the page shows results without an extra click.
    if "analysis_result" not in st.session_state:
        st.session_state["analysis_result"] = run_sample_analysis()

    result = st.session_state["analysis_result"]
    display = build_display_summary(result)

    st.subheader("Summary")
    st.metric("Jobs analyzed", display["jobs_analyzed_count"])

    for job in display["jobs"]:
        st.markdown(f"### {job['job_name']}")

        col_matched, col_missing = st.columns(2)

        with col_matched:
            st.markdown(
                f"**Matched skills** ({job['matched_skills_count']} total)"
            )
            for line in job["matched_skills_lines"]:
                st.write(line)

        with col_missing:
            st.markdown(
                f"**Missing skills** ({job['missing_skills_count']} total)"
            )
            for line in job["missing_skills_lines"]:
                st.write(line)

    st.subheader("Recurring gaps")
    for line in display["recurring_gaps_lines"]:
        st.write(line)

    st.subheader("Output files")
    if display["has_output_files"]:
        for file_path in display["output_files"]:
            st.code(file_path)
    else:
        st.write(
            "No report files written for this preview run. "
            "Use the CLI with `--outputs` to generate markdown and CSV files."
        )


if __name__ == "__main__":
    main()
