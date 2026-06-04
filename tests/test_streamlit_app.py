# Smoke tests for the local Streamlit app helpers (no Streamlit server required).
import importlib.util
from pathlib import Path


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
    assert hasattr(module, "validate_pasted_job_text")
    assert hasattr(module, "build_display_summary")


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


if __name__ == "__main__":
    test_streamlit_app_imports_safely()
    test_build_display_summary_for_sample_analysis()
    test_validate_pasted_job_text_rejects_blank_input()
    test_run_pasted_job_analysis_returns_display_data()
    print("All streamlit app tests passed.")
