# Tests for single-job analysis in src/analysis_runner.py.
import sys
from pathlib import Path

sys.path.append(str(Path("src")))

from analysis_runner import analyze_job_text, run_single_job_analysis


def test_run_single_job_analysis_with_pasted_job_text():

    resume_text = "Python, Git, and technical documentation experience."
    job_text = """
    Intern role requiring Python, SQL, pandas, and FastAPI experience.
    """

    results = run_single_job_analysis(
        resume_text=resume_text,
        job_text=job_text,
        job_name="Pasted internship posting",
    )

    assert results["jobs_analyzed_count"] == 1
    assert results["job_name"] == "Pasted internship posting"
    assert len(results["job_results"]) == 1
    assert results["job_result"]["job_name"] == "Pasted internship posting"
    assert isinstance(results["resume_skills"], dict)
    assert isinstance(results["job_result"]["skill_gaps"], dict)
    assert isinstance(results["recurring_gaps"], list)


def test_run_single_job_analysis_with_resume_and_job_files():

    results = run_single_job_analysis(
        resume_path=Path("data/resume/sample_resume.txt"),
        job_path=Path("data/sample_jobs/sample_ai_engineering_internship.txt"),
    )

    assert results["jobs_analyzed_count"] == 1
    assert results["job_name"] == "sample_ai_engineering_internship.txt"
    assert results["resume_path"] == Path("data/resume/sample_resume.txt")
    assert results["job_path"] == Path(
        "data/sample_jobs/sample_ai_engineering_internship.txt"
    )
    assert len(results["recurring_gaps"]) >= 1


def test_analyze_job_text_matches_folder_workflow_shape():

    from analysis_runner import load_json_file, load_text_file

    resume_text = load_text_file(Path("data/resume/sample_resume.txt"))
    job_text = load_text_file(
        Path("data/sample_jobs/sample_ai_engineering_internship.txt")
    )
    taxonomy = load_json_file(Path("data/skills_taxonomy.json"))
    aliases = load_json_file(Path("data/skill_aliases.json"))

    from extract_keywords import find_skills

    resume_skills = find_skills(resume_text, taxonomy, aliases)
    job_result = analyze_job_text(
        job_text,
        "sample_ai_engineering_internship.txt",
        resume_skills,
        taxonomy,
        aliases,
    )

    assert "job_name" in job_result
    assert "job_skills" in job_result
    assert "skill_gaps" in job_result
    assert job_result["job_name"] == "sample_ai_engineering_internship.txt"


if __name__ == "__main__":
    test_run_single_job_analysis_with_pasted_job_text()
    test_run_single_job_analysis_with_resume_and_job_files()
    test_analyze_job_text_matches_folder_workflow_shape()
    print("All single-job analysis tests passed.")
