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


def test_get_default_database_path_points_to_outputs_db():
    module = _load_streamlit_app_module()

    with TemporaryDirectory() as temp_folder:
        repo_root = Path(temp_folder)
        expected = repo_root / "data/outputs/analysis_results.db"

        assert module.get_default_database_path(repo_root) == expected


def test_format_database_save_message_uses_repo_relative_path():
    module = _load_streamlit_app_module()

    with TemporaryDirectory() as temp_folder:
        repo_root = Path(temp_folder)
        database_path = repo_root / "data/outputs/analysis_results.db"

        message = module.format_database_save_message(database_path, repo_root)

        assert "data/outputs/analysis_results.db" in message
        assert "saved" in message.lower()


def test_store_analysis_result_skips_save_when_disabled():
    module = _load_streamlit_app_module()

    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "analysis_results.db"
        analysis_result = module.run_sample_analysis()

        result, save_message = module.store_analysis_result(
            analysis_result,
            save_to_database=False,
            database_path=database_path,
        )

        assert result == analysis_result
        assert save_message is None
        assert not database_path.exists()


def test_store_analysis_result_saves_when_enabled():
    module = _load_streamlit_app_module()

    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "analysis_results.db"
        analysis_result = module.run_sample_analysis()

        result, save_message = module.store_analysis_result(
            analysis_result,
            save_to_database=True,
            database_path=database_path,
        )

        assert database_path.exists()
        assert result["database_path"] == database_path
        assert save_message is not None
        assert str(database_path) in save_message


def test_build_saved_history_display_when_database_missing():
    module = _load_streamlit_app_module()

    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "analysis_results.db"

        display = module.build_saved_history_display(database_path)

        assert display["database_exists"] is False
        assert "sqlite saving enabled" in display["missing_message"].lower()


def test_build_saved_history_display_when_database_exists():
    module = _load_streamlit_app_module()

    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "analysis_results.db"
        analysis_result = module.run_sample_analysis()

        module.store_analysis_result(
            analysis_result,
            save_to_database=True,
            database_path=database_path,
        )

        display = module.build_saved_history_display(
            database_path,
            repo_root=Path(temp_folder),
        )

        assert display["database_exists"] is True
        assert display["analysis_runs_count"] == 1
        assert display["job_results_count"] == 1
        assert display["skill_gaps_count"] >= 1
        assert display["has_top_recurring_gaps"] is True
        assert len(display["top_recurring_gaps_rows"]) >= 1


def test_build_recent_saved_runs_display_when_database_missing():
    module = _load_streamlit_app_module()

    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "analysis_results.db"

        display = module.build_recent_saved_runs_display(database_path)

        assert display["database_exists"] is False
        assert "recent saved runs" in display["missing_message"].lower()


def test_build_recent_saved_runs_display_when_database_exists():
    module = _load_streamlit_app_module()

    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "analysis_results.db"
        analysis_result = module.run_sample_analysis()

        module.store_analysis_result(
            analysis_result,
            save_to_database=True,
            database_path=database_path,
        )

        display = module.build_recent_saved_runs_display(database_path)

        assert display["database_exists"] is True
        assert display["has_recent_jobs"] is True
        assert len(display["recent_jobs_rows"]) == 1
        assert display["recent_jobs_rows"][0]["Job"] == (
            "sample_ai_engineering_internship.txt"
        )
        assert display["recent_jobs_rows"][0]["Run ID"] == 1
        assert display["recent_jobs_rows"][0]["Matched skills"] >= 1
        assert display["recent_jobs_rows"][0]["Missing skills"] >= 1


def test_compare_skill_collections_finds_shared_and_unique_skills():
    module = _load_streamlit_app_module()

    comparison = module.compare_skill_collections(
        ["sql", "pandas", "fastapi"],
        ["sql", "docker", "pandas"],
    )

    assert comparison["shared"] == ["pandas", "sql"]
    assert comparison["unique_to_first"] == ["fastapi"]
    assert comparison["unique_to_second"] == ["docker"]


def test_compare_skill_collections_handles_no_shared_skills():
    module = _load_streamlit_app_module()

    comparison = module.compare_skill_collections(
        ["alpha"],
        ["beta"],
    )

    assert comparison["shared"] == []
    assert comparison["unique_to_first"] == ["alpha"]
    assert comparison["unique_to_second"] == ["beta"]


def test_compare_skill_collections_handles_identical_collections():
    module = _load_streamlit_app_module()

    comparison = module.compare_skill_collections(
        ["sql", "pandas"],
        ["pandas", "sql"],
    )

    assert comparison["shared"] == ["pandas", "sql"]
    assert comparison["unique_to_first"] == []
    assert comparison["unique_to_second"] == []


def test_compare_skill_collections_normalizes_duplicate_values():
    module = _load_streamlit_app_module()

    comparison = module.compare_skill_collections(
        ["sql", "sql", "pandas"],
        ["sql", "pandas", "pandas"],
    )

    assert comparison["shared"] == ["pandas", "sql"]
    assert comparison["unique_to_first"] == []
    assert comparison["unique_to_second"] == []


def test_format_skill_list_for_display_uses_none_for_empty_lists():
    module = _load_streamlit_app_module()

    assert module.format_skill_list_for_display([]) == module.EMPTY_SKILL_LIST_LABEL
    assert module.format_skill_list_for_display(["sql", "pandas"]) == "sql, pandas"


def test_build_compare_saved_analyses_options_when_database_missing():
    module = _load_streamlit_app_module()

    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "analysis_results.db"

        display = module.build_compare_saved_analyses_options(database_path)

        assert display["database_exists"] is False
        assert "sqlite saving enabled" in display["missing_message"].lower()


def test_build_compare_saved_analyses_options_when_only_one_saved_job():
    module = _load_streamlit_app_module()

    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "analysis_results.db"
        analysis_result = module.run_sample_analysis()

        module.store_analysis_result(
            analysis_result,
            save_to_database=True,
            database_path=database_path,
        )

        display = module.build_compare_saved_analyses_options(database_path)

        assert display["database_exists"] is True
        assert display["can_compare"] is False
        assert "at least two" in display["insufficient_message"].lower()


def test_build_compare_saved_analyses_result_for_two_saved_jobs():
    module = _load_streamlit_app_module()

    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "analysis_results.db"

        first_result = module.run_sample_analysis()
        module.store_analysis_result(
            first_result,
            save_to_database=True,
            database_path=database_path,
        )

        pasted_result = module.run_pasted_job_analysis(
            "Internship requiring Python, SQL, Docker, and technical writing."
        )
        module.store_analysis_result(
            pasted_result,
            save_to_database=True,
            database_path=database_path,
        )

        options = module.build_compare_saved_analyses_options(database_path)
        comparison = module.build_compare_saved_analyses_result(
            options["default_first_id"],
            options["default_second_id"],
            database_path=database_path,
        )

        assert comparison["status"] == "ready"
        assert comparison["first_job_name"]
        assert comparison["second_job_name"]
        assert comparison["first_missing_skills_count"] >= 0
        assert comparison["second_missing_skills_count"] >= 0
        assert isinstance(comparison["shared_missing_skills"], list)
        assert isinstance(comparison["missing_skills_unique_to_first"], list)
        assert isinstance(comparison["missing_skills_unique_to_second"], list)


def test_build_compare_saved_analyses_result_rejects_same_selection():
    module = _load_streamlit_app_module()

    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "analysis_results.db"
        analysis_result = module.run_sample_analysis()

        module.store_analysis_result(
            analysis_result,
            save_to_database=True,
            database_path=database_path,
        )

        pasted_result = module.run_pasted_job_analysis(
            "Internship requiring Python, SQL, Docker, and technical writing."
        )
        module.store_analysis_result(
            pasted_result,
            save_to_database=True,
            database_path=database_path,
        )

        options = module.build_compare_saved_analyses_options(database_path)
        job_result_id = options["default_first_id"]

        comparison = module.build_compare_saved_analyses_result(
            job_result_id,
            job_result_id,
            database_path=database_path,
        )

        assert comparison["status"] == "same_selection"
        assert "different" in comparison["message"].lower()


def test_format_example_job_names_uses_none_for_empty_lists():
    module = _load_streamlit_app_module()

    assert module.format_example_job_names([]) == module.EMPTY_SKILL_LIST_LABEL
    assert module.format_example_job_names(["beta_job.txt", "alpha_job.txt"]) == (
        "beta_job.txt, alpha_job.txt"
    )


def test_saved_gap_priorities_to_rows_includes_category_and_example_jobs():
    module = _load_streamlit_app_module()

    rows = module.saved_gap_priorities_to_rows(
        [
            {
                "gap_skill": "sql",
                "category": "data",
                "count": 3,
                "example_job_names": ["alpha_job.txt", "beta_job.txt"],
            }
        ]
    )

    assert rows == [
        {
            "Skill": "sql",
            "Category": "data",
            "Saved job results missing this skill": 3,
            "Example jobs": "alpha_job.txt, beta_job.txt",
        }
    ]


def test_build_saved_gap_priority_display_when_database_missing():
    module = _load_streamlit_app_module()

    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "analysis_results.db"

        display = module.build_saved_gap_priority_display(database_path)

        assert display["database_exists"] is False
        assert "sqlite saving enabled" in display["missing_message"].lower()


def test_build_saved_gap_priority_display_when_database_exists():
    module = _load_streamlit_app_module()

    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "analysis_results.db"
        analysis_result = module.run_sample_analysis()

        module.store_analysis_result(
            analysis_result,
            save_to_database=True,
            database_path=database_path,
        )

        display = module.build_saved_gap_priority_display(database_path)

        assert display["database_exists"] is True
        assert display["has_saved_gaps"] is True
        assert display["has_priorities"] is True
        assert len(display["priority_rows"]) >= 1
        assert display["priority_rows"][0]["Skill"]
        assert display["priority_rows"][0]["Category"]
        assert display["priority_rows"][0]["Saved job results missing this skill"] >= 1
        assert "study" in display["guidance"].lower()


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
    test_get_default_database_path_points_to_outputs_db()
    test_format_database_save_message_uses_repo_relative_path()
    test_store_analysis_result_skips_save_when_disabled()
    test_store_analysis_result_saves_when_enabled()
    test_build_saved_history_display_when_database_missing()
    test_build_saved_history_display_when_database_exists()
    test_build_recent_saved_runs_display_when_database_missing()
    test_build_recent_saved_runs_display_when_database_exists()
    test_compare_skill_collections_finds_shared_and_unique_skills()
    test_compare_skill_collections_handles_no_shared_skills()
    test_compare_skill_collections_handles_identical_collections()
    test_compare_skill_collections_normalizes_duplicate_values()
    test_format_skill_list_for_display_uses_none_for_empty_lists()
    test_build_compare_saved_analyses_options_when_database_missing()
    test_build_compare_saved_analyses_options_when_only_one_saved_job()
    test_build_compare_saved_analyses_result_for_two_saved_jobs()
    test_build_compare_saved_analyses_result_rejects_same_selection()
    test_format_example_job_names_uses_none_for_empty_lists()
    test_saved_gap_priorities_to_rows_includes_category_and_example_jobs()
    test_build_saved_gap_priority_display_when_database_missing()
    test_build_saved_gap_priority_display_when_database_exists()
    test_resolve_resume_path_uses_sample_by_default()
    print("All streamlit app tests passed.")
