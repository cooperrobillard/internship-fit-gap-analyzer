# Reusable analysis workflow for the CLI and future local UI code.
#
# This module runs validation, analysis, and output writing.
# It returns structured results instead of printing to the terminal.
#
# Main return shape (run_analysis / run_analysis_job_file / run_single_job_analysis):
#   jobs_analyzed_count  - int
#   jobs                 - list of per-job UI-friendly dicts (see _format_job_for_ui)
#   job_results          - raw per-job dicts (job_name, job_skills, skill_gaps)
#   resume_skills        - dict of skills found in the resume, by category
#   recurring_gaps       - list of {gap_skill, category, count}
#   output_paths         - list of Path objects (empty for run_single_job_analysis)
#   output_files         - same paths as strings
#   analysis_mode        - "folder", "single_file", or "single_text"
#   plus input path fields (resume_path, jobs_folder, job_path, etc.)
from pathlib import Path
import json

from extract_keywords import find_skills
from compare_resume import find_gaps
from report_writer import write_gap_report
from csv_writer import write_gap_csv, write_recurring_gap_csv
from summarize_gaps import count_recurring_gaps
from database import initialize_database, save_analysis_results
from pandas_summary import write_pandas_summary_outputs


def validate_inputs(resume_path, taxonomy_path, aliases_path, jobs_folder):

    required_files = [
        resume_path,
        taxonomy_path,
        aliases_path,
    ]

    for file_path in required_files:
        if not file_path.exists():
            raise FileNotFoundError(f"Missing required file: {file_path}")

    if not jobs_folder.exists():
        raise FileNotFoundError(f"Missing jobs folder: {jobs_folder}")

    if not jobs_folder.is_dir():
        raise NotADirectoryError(
            f"Expected a folder but found something else: {jobs_folder}"
        )

    job_files = list(jobs_folder.glob("*.txt"))

    if not job_files:
        raise FileNotFoundError(
            f"No .txt job description files found in: {jobs_folder}"
        )


def validate_database_path(database_path):

    if database_path.exists() and database_path.is_dir():
        raise ValueError(
            f"Database path must be a file, not a folder: {database_path}"
        )


def load_text_file(file_path):

    return file_path.read_text(encoding="utf-8")


def load_json_file(file_path):

    json_text = file_path.read_text(encoding="utf-8")

    try:
        return json.loads(json_text)

    except json.JSONDecodeError as error:
        raise ValueError(f"Invalid JSON in file: {file_path}") from error


def _count_skills_by_category(skills_by_category):

    skill_count = 0

    for skill_list in skills_by_category.values():
        skill_count += len(skill_list)

    return skill_count


def _format_job_for_ui(job_result):
    """
    Build a simple per-job summary for future UI display.

    matched_skills and missing_skills stay grouped by category.
    """
    matched_skills = job_result["job_skills"]
    missing_skills = job_result["skill_gaps"]

    return {
        "job_name": job_result["job_name"],
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "matched_skills_count": _count_skills_by_category(matched_skills),
        "missing_skills_count": _count_skills_by_category(missing_skills),
    }


def _build_analysis_result(
    analysis_mode,
    resume_skills,
    job_results,
    recurring_gaps,
    output_paths,
    taxonomy_path,
    aliases_path,
    resume_path=None,
    jobs_folder=None,
    job_path=None,
    job_name=None,
    outputs_folder=None,
    database_path=None,
):
    """Combine raw analysis data into one predictable result dictionary."""
    output_paths = list(output_paths)
    jobs_analyzed_count = len(job_results)

    result = {
        "analysis_mode": analysis_mode,
        "jobs_analyzed_count": jobs_analyzed_count,
        "jobs": [_format_job_for_ui(job_result) for job_result in job_results],
        "resume_skills": resume_skills,
        "job_results": job_results,
        "recurring_gaps": recurring_gaps,
        "output_paths": output_paths,
        "output_files": [str(path) for path in output_paths],
        "taxonomy_path": Path(taxonomy_path),
        "aliases_path": Path(aliases_path),
        "resume_path": Path(resume_path) if resume_path is not None else None,
        "jobs_folder": Path(jobs_folder) if jobs_folder is not None else None,
        "job_path": Path(job_path) if job_path is not None else None,
        "outputs_folder": Path(outputs_folder) if outputs_folder is not None else None,
        "database_path": Path(database_path) if database_path is not None else None,
    }

    if job_name is not None:
        result["job_name"] = job_name

    if len(job_results) == 1:
        result["job_result"] = job_results[0]

    return result


def analyze_job_text(job_text, job_name, resume_skills, taxonomy, aliases):
    """
    Analyze one job description text against resume skills already loaded.

    This function does not read files. Future UI code can pass pasted job text here.
    """
    job_skills = find_skills(job_text, taxonomy, aliases)
    skill_gaps = find_gaps(job_skills, resume_skills)

    return {
        "job_name": job_name,
        "job_skills": job_skills,
        "skill_gaps": skill_gaps,
    }


def analyze_jobs(job_folder, resume_skills, taxonomy, aliases):

    job_results = []

    for job_file in job_folder.glob("*.txt"):
        job_text = load_text_file(job_file)
        job_results.append(
            analyze_job_text(job_text, job_file.name, resume_skills, taxonomy, aliases)
        )

    return job_results


def _load_resume_text(resume_path=None, resume_text=None):

    if resume_text is not None:
        if not str(resume_text).strip():
            raise ValueError("Resume text cannot be empty.")
        return resume_text

    if resume_path is None:
        raise ValueError("Provide resume_path or resume_text.")

    resume_path = Path(resume_path)

    if not resume_path.exists():
        raise FileNotFoundError(f"Missing required file: {resume_path}")

    return load_text_file(resume_path)


def _load_job_text(job_path=None, job_text=None):

    if job_text is not None:
        if not str(job_text).strip():
            raise ValueError("Job description text cannot be empty.")
        return job_text

    if job_path is None:
        raise ValueError("Provide job_path or job_text.")

    job_path = Path(job_path)

    if not job_path.exists():
        raise FileNotFoundError(f"Missing required file: {job_path}")

    return load_text_file(job_path)


def _default_job_name(job_path=None, job_name=None):

    if job_name is not None:
        return job_name

    if job_path is not None:
        return Path(job_path).name

    return "Job description"


def run_single_job_analysis(
    resume_path=None,
    resume_text=None,
    job_path=None,
    job_text=None,
    job_name=None,
    taxonomy_path=Path("data/skills_taxonomy.json"),
    aliases_path=Path("data/skill_aliases.json"),
):
    """
    Analyze one job description against one resume.

    Provide resume and job content from file paths or raw text strings.
    Does not write report files or use a jobs folder.

    Returns a dictionary with resume skills, one job result, and recurring gaps.
    """
    taxonomy_path = Path(taxonomy_path)
    aliases_path = Path(aliases_path)

    for file_path in [taxonomy_path, aliases_path]:
        if not file_path.exists():
            raise FileNotFoundError(f"Missing required file: {file_path}")

    resume_path = Path(resume_path) if resume_path is not None else None
    job_path = Path(job_path) if job_path is not None else None

    resume_text_loaded = _load_resume_text(resume_path=resume_path, resume_text=resume_text)
    job_text_loaded = _load_job_text(job_path=job_path, job_text=job_text)
    job_name_used = _default_job_name(job_path=job_path, job_name=job_name)

    taxonomy = load_json_file(taxonomy_path)
    aliases = load_json_file(aliases_path)

    resume_skills = find_skills(resume_text_loaded, taxonomy, aliases)
    job_result = analyze_job_text(
        job_text_loaded, job_name_used, resume_skills, taxonomy, aliases
    )
    recurring_gaps = count_recurring_gaps([job_result])
    analysis_mode = "single_text" if job_text is not None else "single_file"

    return _build_analysis_result(
        analysis_mode=analysis_mode,
        resume_skills=resume_skills,
        job_results=[job_result],
        recurring_gaps=recurring_gaps,
        output_paths=[],
        taxonomy_path=taxonomy_path,
        aliases_path=aliases_path,
        resume_path=resume_path,
        job_path=job_path,
        job_name=job_name_used,
    )


def _write_analysis_outputs(
    outputs_folder,
    resume_path,
    jobs_path,
    taxonomy_path,
    aliases_path,
    resume_skills,
    job_results,
    recurring_gaps,
    database_path=None,
    pandas_summary=False,
):
    """Write markdown, CSV, and optional pandas/database outputs for a completed run."""
    outputs_folder = Path(outputs_folder)
    resume_path = Path(resume_path)
    jobs_path = Path(jobs_path)
    taxonomy_path = Path(taxonomy_path)
    aliases_path = Path(aliases_path)

    gap_report_output_path = outputs_folder / "gap_report.md"
    gap_csv_output_path = outputs_folder / "gap_summary.csv"
    recurring_gaps_csv_output_path = outputs_folder / "recurring_gaps.csv"

    write_gap_report(
        gap_report_output_path, resume_skills, job_results, recurring_gaps
    )
    write_gap_csv(gap_csv_output_path, job_results)
    write_recurring_gap_csv(recurring_gaps_csv_output_path, recurring_gaps)

    output_paths = [
        gap_report_output_path,
        gap_csv_output_path,
        recurring_gaps_csv_output_path,
    ]

    if pandas_summary:
        pandas_output_paths = write_pandas_summary_outputs(
            gap_summary_csv_path=gap_csv_output_path,
            recurring_gaps_csv_path=recurring_gaps_csv_output_path,
            outputs_folder=outputs_folder,
        )
        output_paths.extend(pandas_output_paths)

    if database_path is not None:
        database_path = Path(database_path)
        validate_database_path(database_path)
        connection = initialize_database(database_path)

        try:
            save_analysis_results(
                connection=connection,
                resume_path=resume_path,
                jobs_path=jobs_path,
                taxonomy_path=taxonomy_path,
                aliases_path=aliases_path,
                job_results=job_results,
            )
        finally:
            connection.close()

        output_paths.append(database_path)

    return output_paths


def run_analysis_job_file(
    resume_path,
    job_path,
    taxonomy_path,
    aliases_path,
    outputs_folder,
    database_path=None,
    pandas_summary=False,
):
    """
    Run the full analysis workflow for one job description file.

    Reuses run_single_job_analysis, then writes the same outputs as run_analysis.
    """
    resume_path = Path(resume_path)
    job_path = Path(job_path)
    taxonomy_path = Path(taxonomy_path)
    aliases_path = Path(aliases_path)
    outputs_folder = Path(outputs_folder)

    if database_path is not None:
        database_path = Path(database_path)

    if not resume_path.exists():
        raise FileNotFoundError(f"Missing required file: {resume_path}")

    single_job_results = run_single_job_analysis(
        resume_path=resume_path,
        job_path=job_path,
        taxonomy_path=taxonomy_path,
        aliases_path=aliases_path,
    )

    output_paths = _write_analysis_outputs(
        outputs_folder=outputs_folder,
        resume_path=resume_path,
        jobs_path=job_path,
        taxonomy_path=taxonomy_path,
        aliases_path=aliases_path,
        resume_skills=single_job_results["resume_skills"],
        job_results=single_job_results["job_results"],
        recurring_gaps=single_job_results["recurring_gaps"],
        database_path=database_path,
        pandas_summary=pandas_summary,
    )

    return _build_analysis_result(
        analysis_mode="single_file",
        resume_skills=single_job_results["resume_skills"],
        job_results=single_job_results["job_results"],
        recurring_gaps=single_job_results["recurring_gaps"],
        output_paths=output_paths,
        taxonomy_path=taxonomy_path,
        aliases_path=aliases_path,
        resume_path=resume_path,
        jobs_folder=job_path.parent,
        job_path=job_path,
        job_name=single_job_results.get("job_name"),
        outputs_folder=outputs_folder,
        database_path=database_path,
    )


def run_analysis(
    resume_path,
    jobs_folder,
    taxonomy_path,
    aliases_path,
    outputs_folder,
    database_path=None,
    pandas_summary=False,
):
    """
    Run the full analysis workflow and return structured results.

    Inputs are Path objects (or values Path() accepts).
    Optional database_path saves results to SQLite when provided.
    Set pandas_summary=True to create extra pandas CSV files.

    Returns a dictionary with paths, skills, gaps, and output file paths.
    """
    resume_path = Path(resume_path)
    jobs_folder = Path(jobs_folder)
    taxonomy_path = Path(taxonomy_path)
    aliases_path = Path(aliases_path)
    outputs_folder = Path(outputs_folder)

    if database_path is not None:
        database_path = Path(database_path)

    validate_inputs(resume_path, taxonomy_path, aliases_path, jobs_folder)

    resume_text = load_text_file(resume_path)
    taxonomy = load_json_file(taxonomy_path)
    aliases = load_json_file(aliases_path)

    resume_skills = find_skills(resume_text, taxonomy, aliases)
    job_results = analyze_jobs(jobs_folder, resume_skills, taxonomy, aliases)
    recurring_gaps = count_recurring_gaps(job_results)

    output_paths = _write_analysis_outputs(
        outputs_folder=outputs_folder,
        resume_path=resume_path,
        jobs_path=jobs_folder,
        taxonomy_path=taxonomy_path,
        aliases_path=aliases_path,
        resume_skills=resume_skills,
        job_results=job_results,
        recurring_gaps=recurring_gaps,
        database_path=database_path,
        pandas_summary=pandas_summary,
    )

    return _build_analysis_result(
        analysis_mode="folder",
        resume_skills=resume_skills,
        job_results=job_results,
        recurring_gaps=recurring_gaps,
        output_paths=output_paths,
        taxonomy_path=taxonomy_path,
        aliases_path=aliases_path,
        resume_path=resume_path,
        jobs_folder=jobs_folder,
        outputs_folder=outputs_folder,
        database_path=database_path,
    )
