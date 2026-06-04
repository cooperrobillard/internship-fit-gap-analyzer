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


if __name__ == "__main__":
    test_streamlit_app_imports_safely()
    test_build_display_summary_for_sample_analysis()
    print("All streamlit app tests passed.")
