# Tests for the reusable analysis workflow in src/analysis_runner.py.
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

sys.path.append(str(Path("src")))

from analysis_runner import run_analysis, run_analysis_job_file, validate_inputs


def test_run_analysis_returns_structured_results():

    with TemporaryDirectory() as temp_folder:
        output_folder = Path(temp_folder) / "outputs"

        results = run_analysis(
            resume_path=Path("data/resume/sample_resume.txt"),
            jobs_folder=Path("data/sample_jobs"),
            taxonomy_path=Path("data/skills_taxonomy.json"),
            aliases_path=Path("data/skill_aliases.json"),
            outputs_folder=output_folder,
        )

        assert results["jobs_analyzed_count"] >= 1
        assert len(results["job_results"]) == results["jobs_analyzed_count"]
        assert isinstance(results["resume_skills"], dict)
        assert isinstance(results["recurring_gaps"], list)
        assert len(results["output_paths"]) == 3

        gap_report_path = output_folder / "gap_report.md"
        gap_summary_path = output_folder / "gap_summary.csv"
        recurring_gaps_path = output_folder / "recurring_gaps.csv"

        assert gap_report_path.exists()
        assert gap_summary_path.exists()
        assert recurring_gaps_path.exists()
        assert gap_report_path in results["output_paths"]

        _assert_structured_result_shape(results, expected_mode="folder")


def test_run_analysis_job_file_returns_structured_results():

    with TemporaryDirectory() as temp_folder:
        output_folder = Path(temp_folder) / "outputs"

        results = run_analysis_job_file(
            resume_path=Path("data/resume/sample_resume.txt"),
            job_path=Path("data/sample_jobs/sample_ai_engineering_internship.txt"),
            taxonomy_path=Path("data/skills_taxonomy.json"),
            aliases_path=Path("data/skill_aliases.json"),
            outputs_folder=output_folder,
        )

        assert results["analysis_mode"] == "single_file"
        assert results["jobs_analyzed_count"] == 1
        _assert_structured_result_shape(results, expected_mode="single_file")
        assert results["jobs"][0]["job_name"] == "sample_ai_engineering_internship.txt"
        assert results["jobs"][0]["missing_skills_count"] >= 1


def _assert_structured_result_shape(results, expected_mode):

    assert results["analysis_mode"] == expected_mode
    assert results["jobs_analyzed_count"] == len(results["jobs"])
    assert results["jobs_analyzed_count"] == len(results["job_results"])
    assert isinstance(results["resume_skills"], dict)
    assert isinstance(results["recurring_gaps"], list)
    assert isinstance(results["output_files"], list)
    assert len(results["output_files"]) == len(results["output_paths"])

    for gap in results["recurring_gaps"]:
        assert "gap_skill" in gap
        assert "category" in gap
        assert "count" in gap

    for job in results["jobs"]:
        assert "job_name" in job
        assert "matched_skills" in job
        assert "missing_skills" in job
        assert "matched_skills_count" in job
        assert "missing_skills_count" in job
        assert isinstance(job["matched_skills"], dict)
        assert isinstance(job["missing_skills"], dict)


def test_run_analysis_with_database_and_pandas_summary():

    with TemporaryDirectory() as temp_folder:
        output_folder = Path(temp_folder) / "outputs"
        database_path = Path(temp_folder) / "analysis_results.db"

        results = run_analysis(
            resume_path=Path("data/resume/sample_resume.txt"),
            jobs_folder=Path("data/sample_jobs"),
            taxonomy_path=Path("data/skills_taxonomy.json"),
            aliases_path=Path("data/skill_aliases.json"),
            outputs_folder=output_folder,
            database_path=database_path,
            pandas_summary=True,
        )

        assert database_path.exists()
        assert len(results["output_paths"]) == 6
        assert database_path in results["output_paths"]
        assert (output_folder / "gap_categories_pandas.csv").exists()
        assert (output_folder / "top_recurring_gaps_pandas.csv").exists()


def test_validate_inputs_still_available_from_main():

    # test_validation.py imports validate_inputs from main.py.
    from main import validate_inputs as validate_from_main

    with TemporaryDirectory() as temp_folder:
        temp_path = Path(temp_folder)
        resume_path = temp_path / "resume.txt"
        taxonomy_path = temp_path / "skills_taxonomy.json"
        aliases_path = temp_path / "skill_aliases.json"
        jobs_folder = temp_path / "jobs"

        jobs_folder.mkdir()
        resume_path.write_text("Python resume text", encoding="utf-8")
        taxonomy_path.write_text('{"programming": ["python"]}', encoding="utf-8")
        aliases_path.write_text("{}", encoding="utf-8")
        (jobs_folder / "job_1.txt").write_text("Python job text", encoding="utf-8")

        validate_from_main(resume_path, taxonomy_path, aliases_path, jobs_folder)


if __name__ == "__main__":
    test_run_analysis_returns_structured_results()
    test_run_analysis_job_file_returns_structured_results()
    test_run_analysis_with_database_and_pandas_summary()
    test_validate_inputs_still_available_from_main()
    print("All analysis runner tests passed.")
