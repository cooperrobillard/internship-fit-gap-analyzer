# Smoke tests for the local Streamlit app helpers (no Streamlit server required).
import importlib.util
from pathlib import Path
from tempfile import TemporaryDirectory


def _load_streamlit_app_module():
    """Load streamlit_app.py without running the Streamlit UI."""
    repo_root = Path(__file__).resolve().parent.parent
    module_path = repo_root / "streamlit_app.py"

    spec = importlib.util.spec_from_file_location("streamlit_app", module_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    return module


def test_streamlit_app_imports_safely():
    module = _load_streamlit_app_module()

    assert hasattr(module, "run_sample_analysis")
    assert hasattr(module, "run_pasted_job_analysis")
    assert hasattr(module, "get_resume_source_choices")
    assert hasattr(module, "resolve_resume_path")


def test_build_display_summary_for_sample_analysis():
    module = _load_streamlit_app_module()

    result = module.run_sample_analysis()
    display = module.build_display_summary(result)

    assert display["jobs_analyzed_count"] == 1
    assert len(display["jobs"]) == 1
    assert display["jobs"][0]["job_name"] == "sample_ai_engineering_internship.txt"
    assert display["jobs"][0]["matched_skills_count"] >= 1
    assert len(display["recurring_gaps_lines"]) >= 1
    assert display["has_output_files"] is False
    assert display["resume_path_label"] == "data/resume/sample_resume.txt"
    assert display["recurring_gaps_count"] >= 1
    assert display["has_recurring_gaps"] is True
    assert display["top_recurring_gap_skill"] is not None
    assert len(display["jobs"][0]["matched_skills_rows"]) >= 1


def test_validate_pasted_job_text_rejects_blank_input():
    module = _load_streamlit_app_module()

    is_valid, error_message = module.validate_pasted_job_text("")
    assert is_valid is False
    assert "empty" in error_message.lower()

    is_valid, _ = module.validate_pasted_job_text("   ")
    assert is_valid is False


def test_run_pasted_job_analysis_returns_display_data():
    module = _load_streamlit_app_module()

    job_text = """
    Summer internship requiring Python, SQL, pandas, and technical documentation.
    """

    result = module.run_pasted_job_analysis(job_text)
    display = module.build_display_summary(result)

    assert result["analysis_mode"] == "single_text"
    assert display["jobs_analyzed_count"] == 1
    assert display["jobs"][0]["job_name"] == module.PASTED_JOB_NAME
    assert display["jobs"][0]["matched_skills_count"] >= 1
    assert len(display["recurring_gaps_lines"]) >= 1
    assert display["has_output_files"] is False


def test_get_resume_source_choices_excludes_missing_private_file():
    module = _load_streamlit_app_module()

    with TemporaryDirectory() as temp_folder:
        temp_path = Path(temp_folder)
        sample_resume = temp_path / "sample_resume.txt"
        private_resume = temp_path / "resume.txt"
        sample_resume.write_text("Python and Git", encoding="utf-8")

        choices = module.get_resume_source_choices(sample_resume, private_resume)

        assert len(choices) == 1
        assert choices[0]["key"] == module.RESUME_SOURCE_SAMPLE


def test_get_resume_source_choices_includes_private_when_present():
    module = _load_streamlit_app_module()

    with TemporaryDirectory() as temp_folder:
        temp_path = Path(temp_folder)
        sample_resume = temp_path / "sample_resume.txt"
        private_resume = temp_path / "resume.txt"
        sample_resume.write_text("Python and Git", encoding="utf-8")
        private_resume.write_text("MATLAB and Python", encoding="utf-8")

        choices = module.get_resume_source_choices(sample_resume, private_resume)

        assert len(choices) == 2
        assert choices[1]["key"] == module.RESUME_SOURCE_PRIVATE


def test_build_recurring_gap_highlights_for_empty_list():
    module = _load_streamlit_app_module()

    highlights = module.build_recurring_gap_highlights([])

    assert highlights["recurring_gaps_count"] == 0
    assert highlights["has_recurring_gaps"] is False
    assert highlights["top_recurring_gap_skill"] is None


def test_skills_by_category_to_rows_returns_sorted_table_data():
    module = _load_streamlit_app_module()

    rows = module.skills_by_category_to_rows(
        {
            "data": ["pandas", "sql"],
            "programming": ["python"],
        }
    )

    assert rows == [
        {"Category": "data", "Skill": "pandas"},
        {"Category": "data", "Skill": "sql"},
        {"Category": "programming", "Skill": "python"},
    ]


def test_resolve_resume_path_uses_sample_by_default():
    module = _load_streamlit_app_module()

    with TemporaryDirectory() as temp_folder:
        temp_path = Path(temp_folder)
        sample_resume = temp_path / "sample_resume.txt"
        private_resume = temp_path / "resume.txt"
        sample_resume.write_text("Python", encoding="utf-8")

        resolved = module.resolve_resume_path(
            module.RESUME_SOURCE_SAMPLE,
            sample_resume_path=sample_resume,
            private_resume_path=private_resume,
        )

        assert resolved == sample_resume


if __name__ == "__main__":
    test_streamlit_app_imports_safely()
    test_build_display_summary_for_sample_analysis()
    test_validate_pasted_job_text_rejects_blank_input()
    test_run_pasted_job_analysis_returns_display_data()
    test_get_resume_source_choices_excludes_missing_private_file()
    test_get_resume_source_choices_includes_private_when_present()
    test_build_recurring_gap_highlights_for_empty_list()
    test_skills_by_category_to_rows_returns_sorted_table_data()
    test_resolve_resume_path_uses_sample_by_default()
    print("All streamlit app tests passed.")
