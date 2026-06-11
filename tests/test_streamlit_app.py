# Smoke tests for the local Streamlit app helpers (no Streamlit server required).
import importlib.util
import sqlite3
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


def test_streamlit_app_exposes_layout_tab_helpers():
    module = _load_streamlit_app_module()

    assert hasattr(module, "_render_analyze_tab")
    assert hasattr(module, "_render_results_tab")
    assert hasattr(module, "_render_saved_analyses_tab")
    assert hasattr(module, "_render_data_management_tab")


def test_get_analysis_workflow_choices_includes_sample_paste_and_upload():
    module = _load_streamlit_app_module()

    choices = module.get_analysis_workflow_choices()
    choice_keys = [choice["key"] for choice in choices]
    choice_labels = [choice["label"] for choice in choices]

    assert module.WORKFLOW_SAMPLE in choice_keys
    assert module.WORKFLOW_PASTE in choice_keys
    assert module.WORKFLOW_UPLOAD in choice_keys
    assert module.WORKFLOW_SAMPLE_LABEL in choice_labels
    assert module.WORKFLOW_PASTE_LABEL in choice_labels
    assert module.WORKFLOW_UPLOAD_LABEL in choice_labels


def test_label_to_analysis_workflow_key_maps_user_facing_labels():
    module = _load_streamlit_app_module()

    assert (
        module.label_to_analysis_workflow_key(module.WORKFLOW_SAMPLE_LABEL)
        == module.WORKFLOW_SAMPLE
    )
    assert (
        module.label_to_analysis_workflow_key(module.WORKFLOW_PASTE_LABEL)
        == module.WORKFLOW_PASTE
    )
    assert (
        module.label_to_analysis_workflow_key(module.WORKFLOW_UPLOAD_LABEL)
        == module.WORKFLOW_UPLOAD
    )


def test_run_sample_analysis_uses_bundled_sample_resume_and_job():
    module = _load_streamlit_app_module()

    result = module.run_sample_analysis()

    assert Path(result["resume_path"]) == module.SAMPLE_RESUME_PATH
    assert result["jobs"][0]["job_name"] == module.DEFAULT_JOB_PATH.name


def test_custom_job_workflows_still_support_portable_resume_and_job_text():
    module = _load_streamlit_app_module()

    pasted_job_text = "Internship requiring Python, SQL, and technical documentation."
    resume_text = "Python SQL pandas Git technical documentation"

    pasted_job_input = module.resolve_job_description_input(
        module.JOB_INPUT_PASTED,
        pasted_job_text=pasted_job_text,
    )
    resume_input = module.resolve_pasted_job_resume_input(
        module.RESUME_SOURCE_PASTED,
        pasted_resume_text=resume_text,
    )
    job_name = module.build_pasted_job_name(
        job_title="Data Intern",
        company="Acme Corp",
    )

    result = module.run_pasted_job_analysis(
        pasted_job_input["job_text"],
        job_name=job_name,
        resume_path=resume_input["resume_path"],
        resume_text=resume_input["resume_text"],
    )

    assert pasted_job_input["error_message"] is None
    assert resume_input["error_message"] is None
    assert result["jobs"][0]["job_name"] == "Acme Corp — Data Intern"
    assert result["analysis_mode"] == "single_text"


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
        assert "sample_ai_engineering_internship.txt" in (
            display["recent_jobs_rows"][0]["Saved result"]
        )
        assert display["recent_jobs_rows"][0]["Run ID"] == 1
        assert display["recent_jobs_rows"][0]["Result ID"] == 1
        assert display["recent_jobs_rows"][0]["Matched skills"] >= 1
        assert display["recent_jobs_rows"][0]["Missing skills"] >= 1


def _sample_saved_results_for_search_tests():
    return [
        {
            "job_filename": "alpha_engineering_internship.txt",
            "run_timestamp": "2026-06-07T16:32:00",
            "run_id": 3,
            "job_result_id": 5,
            "missing_skills_count": 11,
            "matched_skills_count": 17,
        },
        {
            "job_filename": "beta_data_internship.txt",
            "run_timestamp": "2026-06-01T10:00:00",
            "run_id": 1,
            "job_result_id": 1,
            "missing_skills_count": 4,
            "matched_skills_count": 6,
        },
    ]


def test_filter_saved_results_empty_query_returns_all_results_in_order():
    module = _load_streamlit_app_module()
    saved_results = _sample_saved_results_for_search_tests()

    filtered = module.filter_saved_results(saved_results, "")
    assert filtered == saved_results
    assert saved_results is not filtered


def test_filter_saved_results_whitespace_query_returns_all_results():
    module = _load_streamlit_app_module()
    saved_results = _sample_saved_results_for_search_tests()

    filtered = module.filter_saved_results(saved_results, "   ")
    assert filtered == saved_results


def test_filter_saved_results_is_case_insensitive():
    module = _load_streamlit_app_module()
    saved_results = _sample_saved_results_for_search_tests()

    filtered = module.filter_saved_results(saved_results, "ALPHA_ENGINEERING")
    assert len(filtered) == 1
    assert filtered[0]["job_filename"] == "alpha_engineering_internship.txt"


def test_filter_saved_results_matches_job_name_substring():
    module = _load_streamlit_app_module()
    saved_results = _sample_saved_results_for_search_tests()

    filtered = module.filter_saved_results(saved_results, "beta_data")
    assert len(filtered) == 1
    assert filtered[0]["job_filename"] == "beta_data_internship.txt"


def test_filter_saved_results_matches_run_id():
    module = _load_streamlit_app_module()
    saved_results = _sample_saved_results_for_search_tests()

    filtered = module.filter_saved_results(saved_results, "run 3")
    assert len(filtered) == 1
    assert filtered[0]["run_id"] == 3


def test_filter_saved_results_matches_job_result_id():
    module = _load_streamlit_app_module()
    saved_results = _sample_saved_results_for_search_tests()

    filtered = module.filter_saved_results(saved_results, "result 1")
    assert len(filtered) == 1
    assert filtered[0]["job_result_id"] == 1


def test_filter_saved_results_matches_formatted_timestamp_text():
    module = _load_streamlit_app_module()
    saved_results = _sample_saved_results_for_search_tests()

    filtered = module.filter_saved_results(saved_results, "2026-06-07")
    assert len(filtered) == 1
    assert filtered[0]["run_id"] == 3


def test_filter_saved_results_no_match_returns_empty_list():
    module = _load_streamlit_app_module()
    saved_results = _sample_saved_results_for_search_tests()

    filtered = module.filter_saved_results(saved_results, "no-such-saved-job")
    assert filtered == []


def test_filter_saved_results_preserves_newest_first_order():
    module = _load_streamlit_app_module()
    saved_results = module.sort_saved_results(
        _sample_saved_results_for_search_tests()
    )

    filtered = module.filter_saved_results(saved_results, "internship")
    assert [job["job_filename"] for job in filtered] == [
        "alpha_engineering_internship.txt",
        "beta_data_internship.txt",
    ]


def test_filter_saved_results_does_not_mutate_input():
    module = _load_streamlit_app_module()
    saved_results = _sample_saved_results_for_search_tests()
    original_copy = [dict(job) for job in saved_results]

    module.filter_saved_results(saved_results, "alpha")
    assert saved_results == original_copy


def test_filter_saved_results_handles_missing_optional_fields():
    module = _load_streamlit_app_module()

    filtered = module.filter_saved_results(
        [
            {
                "job_filename": "minimal_job.txt",
                "run_id": 9,
                "job_result_id": 12,
            }
        ],
        "result 12",
    )

    assert len(filtered) == 1
    assert filtered[0]["job_filename"] == "minimal_job.txt"


def test_build_recent_saved_runs_display_search_no_match():
    module = _load_streamlit_app_module()

    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "analysis_results.db"
        analysis_result = module.run_sample_analysis()

        module.store_analysis_result(
            analysis_result,
            save_to_database=True,
            database_path=database_path,
        )

        display = module.build_recent_saved_runs_display(
            database_path,
            search_query="no-such-saved-job",
        )

        assert display["search_no_match"] is True
        assert "match this search" in display["no_match_message"].lower()


def test_apply_pending_delete_saved_analysis_confirmation_reset():
    module = _load_streamlit_app_module()

    session_state = {
        module.DELETE_SAVED_CONFIRM_RESET_PENDING_SESSION_KEY: True,
        module.DELETE_SAVED_CONFIRM_SESSION_KEY: True,
        module.DELETE_SAVED_SELECTED_SESSION_KEY: 7,
    }

    applied = module.apply_pending_delete_saved_analysis_confirmation_reset(
        session_state
    )

    assert applied is True
    assert session_state[module.DELETE_SAVED_CONFIRM_SESSION_KEY] is False
    assert module.DELETE_SAVED_CONFIRM_RESET_PENDING_SESSION_KEY not in session_state
    assert module.DELETE_SAVED_SELECTED_SESSION_KEY not in session_state


def test_apply_pending_delete_saved_analysis_confirmation_reset_when_not_pending():
    module = _load_streamlit_app_module()

    session_state = {
        module.DELETE_SAVED_CONFIRM_SESSION_KEY: True,
    }

    applied = module.apply_pending_delete_saved_analysis_confirmation_reset(
        session_state
    )

    assert applied is False
    assert session_state[module.DELETE_SAVED_CONFIRM_SESSION_KEY] is True


def test_request_delete_saved_analysis_confirmation_reset_sets_pending_flag():
    module = _load_streamlit_app_module()

    session_state = {
        module.DELETE_SAVED_CONFIRM_SESSION_KEY: True,
        module.DELETE_SAVED_SELECTED_SESSION_KEY: 4,
    }

    module.request_delete_saved_analysis_confirmation_reset(session_state)

    assert session_state[module.DELETE_SAVED_CONFIRM_RESET_PENDING_SESSION_KEY] is True
    assert module.DELETE_SAVED_SELECTED_SESSION_KEY not in session_state
    assert session_state[module.DELETE_SAVED_CONFIRM_SESSION_KEY] is True


def test_build_delete_saved_analysis_display_when_database_missing():
    module = _load_streamlit_app_module()

    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "analysis_results.db"

        display = module.build_delete_saved_analysis_display(database_path)

        assert display["database_exists"] is False
        assert "sqlite saving enabled" in display["missing_message"].lower()


def test_build_delete_saved_analysis_display_when_can_delete():
    module = _load_streamlit_app_module()

    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "analysis_results.db"
        analysis_result = module.run_sample_analysis()

        module.store_analysis_result(
            analysis_result,
            save_to_database=True,
            database_path=database_path,
        )

        display = module.build_delete_saved_analysis_display(database_path)

        assert display["can_delete"] is True
        assert display["selectable_count"] == 1
        assert "sample_ai_engineering_internship.txt" in display["options"][0]["label"]


def test_build_delete_saved_analysis_display_respects_search_filter():
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

        display = module.build_delete_saved_analysis_display(
            database_path,
            search_query="sample_ai_engineering",
        )

        assert display["can_delete"] is True
        assert display["selectable_count"] == 1
        assert display["is_filtered"] is True
        assert "sample_ai_engineering_internship.txt" in display["options"][0]["label"]


def test_build_compare_saved_analyses_options_search_insufficient():
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

        display = module.build_compare_saved_analyses_options(
            database_path,
            search_query="sample_ai_engineering",
        )

        assert display["can_compare"] is False
        assert "match this search" in display["insufficient_message"].lower()


def test_format_saved_result_label_includes_job_name_and_stable_ids():
    module = _load_streamlit_app_module()

    label = module.format_saved_result_label(
        {
            "job_filename": "sample_ai_engineering_internship.txt",
            "run_timestamp": "2026-06-07T16:32:00",
            "run_id": 3,
            "job_result_id": 5,
            "missing_skills_count": 11,
            "matched_skills_count": 17,
        }
    )

    assert "sample_ai_engineering_internship.txt" in label
    assert "run 3" in label
    assert "result 5" in label
    assert "11 gaps" in label
    assert "17 matched" in label
    assert "saved 2026-06-07" in label


def test_format_saved_result_label_distinguishes_duplicate_job_names():
    module = _load_streamlit_app_module()

    first_label = module.format_saved_result_label(
        {
            "job_filename": "sample_job.txt",
            "run_timestamp": "2026-06-07T10:00:00",
            "run_id": 1,
            "job_result_id": 1,
            "missing_skills_count": 4,
            "matched_skills_count": 6,
        }
    )
    second_label = module.format_saved_result_label(
        {
            "job_filename": "sample_job.txt",
            "run_timestamp": "2026-06-08T10:00:00",
            "run_id": 2,
            "job_result_id": 2,
            "missing_skills_count": 7,
            "matched_skills_count": 5,
        }
    )

    assert first_label != second_label
    assert "run 1" in first_label
    assert "run 2" in second_label
    assert "result 1" in first_label
    assert "result 2" in second_label


def test_sort_saved_results_orders_newest_first():
    module = _load_streamlit_app_module()

    sorted_jobs = module.sort_saved_results(
        [
            {
                "job_filename": "older_job.txt",
                "run_timestamp": "2026-06-01T10:00:00",
                "run_id": 1,
                "job_result_id": 1,
                "missing_skills_count": 2,
                "matched_skills_count": 3,
            },
            {
                "job_filename": "newer_job.txt",
                "run_timestamp": "2026-06-07T10:00:00",
                "run_id": 2,
                "job_result_id": 2,
                "missing_skills_count": 5,
                "matched_skills_count": 4,
            },
        ]
    )

    assert sorted_jobs[0]["job_filename"] == "newer_job.txt"
    assert sorted_jobs[1]["job_filename"] == "older_job.txt"


def test_sort_saved_results_uses_ids_when_timestamps_match():
    module = _load_streamlit_app_module()

    sorted_jobs = module.sort_saved_results(
        [
            {
                "job_filename": "alpha_job.txt",
                "run_timestamp": "2026-06-07T10:00:00",
                "run_id": 1,
                "job_result_id": 1,
                "missing_skills_count": 2,
                "matched_skills_count": 3,
            },
            {
                "job_filename": "beta_job.txt",
                "run_timestamp": "2026-06-07T10:00:00",
                "run_id": 2,
                "job_result_id": 3,
                "missing_skills_count": 5,
                "matched_skills_count": 4,
            },
        ]
    )

    assert sorted_jobs[0]["run_id"] == 2
    assert sorted_jobs[1]["run_id"] == 1


def test_format_saved_result_label_handles_missing_timestamp():
    module = _load_streamlit_app_module()

    label = module.format_saved_result_label(
        {
            "job_filename": "sample_job.txt",
            "run_id": 4,
            "job_result_id": 9,
            "missing_skills_count": 1,
        }
    )

    assert "sample_job.txt" in label
    assert "saved unknown time" in label
    assert "run 4" in label
    assert "result 9" in label


def test_recent_saved_jobs_to_rows_includes_saved_result_label():
    module = _load_streamlit_app_module()

    rows = module.recent_saved_jobs_to_rows(
        [
            {
                "job_filename": "sample_job.txt",
                "run_timestamp": "2026-06-07T16:32:00",
                "run_id": 1,
                "job_result_id": 1,
                "missing_skills_count": 3,
                "matched_skills_count": 5,
            }
        ]
    )

    assert "Saved result" in rows[0]
    assert "sample_job.txt" in rows[0]["Saved result"]
    assert rows[0]["Result ID"] == 1


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


def test_get_resume_source_choices_include_portable_options_when_requested():
    module = _load_streamlit_app_module()

    choices = module.get_resume_source_choices(include_in_memory_options=True)
    choice_keys = [choice["key"] for choice in choices]

    assert module.RESUME_SOURCE_SAMPLE in choice_keys
    assert module.RESUME_SOURCE_PASTED in choice_keys
    assert module.RESUME_SOURCE_UPLOADED in choice_keys


def test_get_resume_source_choices_omit_portable_options_by_default():
    module = _load_streamlit_app_module()

    choices = module.get_resume_source_choices()
    choice_keys = [choice["key"] for choice in choices]

    assert module.RESUME_SOURCE_PASTED not in choice_keys
    assert module.RESUME_SOURCE_UPLOADED not in choice_keys


def test_validate_pasted_resume_text_rejects_blank_input():
    module = _load_streamlit_app_module()

    is_valid, error_message = module.validate_pasted_resume_text("")
    assert is_valid is False
    assert "empty" in error_message.lower()

    is_valid, _ = module.validate_pasted_resume_text("   ")
    assert is_valid is False


def test_validate_pasted_resume_text_accepts_nonempty_input():
    module = _load_streamlit_app_module()

    is_valid, error_message = module.validate_pasted_resume_text(
        "Python, SQL, and technical documentation"
    )

    assert is_valid is True
    assert error_message is None


def test_decode_uploaded_resume_bytes_accepts_valid_utf8():
    module = _load_streamlit_app_module()

    uploaded_bytes = "Python and SQL experience".encode("utf-8")
    is_valid, resume_text, error_message = module.decode_uploaded_resume_bytes(
        uploaded_bytes
    )

    assert is_valid is True
    assert resume_text == "Python and SQL experience"
    assert error_message is None


def test_decode_uploaded_resume_bytes_rejects_empty_content():
    module = _load_streamlit_app_module()

    is_valid, resume_text, error_message = module.decode_uploaded_resume_bytes(b"")
    assert is_valid is False
    assert resume_text is None
    assert "empty" in error_message.lower()

    is_valid, resume_text, error_message = module.decode_uploaded_resume_bytes(None)
    assert is_valid is False
    assert resume_text is None
    assert "upload" in error_message.lower()


def test_decode_uploaded_resume_bytes_rejects_invalid_utf8():
    module = _load_streamlit_app_module()

    is_valid, resume_text, error_message = module.decode_uploaded_resume_bytes(
        b"\xff\xfe\xfd"
    )

    assert is_valid is False
    assert resume_text is None
    assert "utf-8" in error_message.lower()


def test_resolve_pasted_job_resume_input_accepts_pasted_resume_text():
    module = _load_streamlit_app_module()

    resume_input = module.resolve_pasted_job_resume_input(
        module.RESUME_SOURCE_PASTED,
        pasted_resume_text="Python SQL pandas",
    )

    assert resume_input["error_message"] is None
    assert resume_input["resume_text"] == "Python SQL pandas"
    assert resume_input["resume_path"] == module.RESUME_LABEL_PASTED
    assert resume_input["display_label"] == module.RESUME_LABEL_PASTED


def test_resolve_pasted_job_resume_input_accepts_uploaded_resume_bytes():
    module = _load_streamlit_app_module()

    resume_input = module.resolve_pasted_job_resume_input(
        module.RESUME_SOURCE_UPLOADED,
        uploaded_resume_bytes="MATLAB and Python".encode("utf-8"),
        uploaded_filename="../../secret/path/my_resume.txt",
    )

    assert resume_input["error_message"] is None
    assert resume_input["resume_text"] == "MATLAB and Python"
    assert resume_input["display_label"] == "Uploaded resume: my_resume.txt"
    assert resume_input["resume_path"] == "Uploaded resume: my_resume.txt"


def test_run_pasted_job_analysis_works_with_in_memory_resume_text():
    module = _load_streamlit_app_module()

    resume_text = "Python SQL pandas Git technical documentation"
    job_text = "Summer internship requiring Python, SQL, pandas, and documentation."

    result = module.run_pasted_job_analysis(
        job_text,
        resume_path=module.RESUME_LABEL_PASTED,
        resume_text=resume_text,
    )
    display = module.build_display_summary(result)

    assert result["analysis_mode"] == "single_text"
    assert display["resume_path_label"] == module.RESUME_LABEL_PASTED
    assert display["jobs"][0]["matched_skills_count"] >= 1


def test_in_memory_resume_text_is_not_written_to_disk_or_database_body():
    module = _load_streamlit_app_module()

    secret_resume = "SECRET_RESUME_PHRASE_12345 Python SQL pandas"
    job_text = "Internship requiring Python and SQL."

    with TemporaryDirectory() as temp_folder:
        temp_path = Path(temp_folder)
        database_path = temp_path / "analysis_results.db"

        result = module.run_pasted_job_analysis(
            job_text,
            resume_path=module.RESUME_LABEL_PASTED,
            resume_text=secret_resume,
        )
        module.store_analysis_result(
            result,
            save_to_database=True,
            database_path=database_path,
        )

        assert list(temp_path.iterdir()) == [database_path]
        assert secret_resume.encode() not in database_path.read_bytes()

        connection = sqlite3.connect(database_path)
        try:
            stored_resume_path = connection.execute(
                "SELECT resume_path FROM analysis_runs"
            ).fetchone()[0]
        finally:
            connection.close()

        assert stored_resume_path == module.RESUME_LABEL_PASTED
        assert secret_resume not in stored_resume_path


def test_uploaded_resume_workflow_keeps_generic_database_label_only():
    module = _load_streamlit_app_module()

    secret_resume = "SECRET_UPLOADED_RESUME_67890 Python Git"
    job_text = "Role requiring Python and Git."

    with TemporaryDirectory() as temp_folder:
        temp_path = Path(temp_folder)
        database_path = temp_path / "analysis_results.db"

        resume_input = module.resolve_pasted_job_resume_input(
            module.RESUME_SOURCE_UPLOADED,
            uploaded_resume_bytes=secret_resume.encode("utf-8"),
            uploaded_filename="my_resume.txt",
        )

        result = module.run_pasted_job_analysis(
            job_text,
            resume_path=resume_input["resume_path"],
            resume_text=resume_input["resume_text"],
        )
        module.store_analysis_result(
            result,
            save_to_database=True,
            database_path=database_path,
        )

        assert list(temp_path.iterdir()) == [database_path]
        assert secret_resume.encode() not in database_path.read_bytes()

        connection = sqlite3.connect(database_path)
        try:
            stored_resume_path = connection.execute(
                "SELECT resume_path FROM analysis_runs"
            ).fetchone()[0]
        finally:
            connection.close()

        assert stored_resume_path == "Uploaded resume: my_resume.txt"


def test_resolve_pasted_job_resume_input_preserves_sample_resume_behavior():
    module = _load_streamlit_app_module()

    with TemporaryDirectory() as temp_folder:
        temp_path = Path(temp_folder)
        sample_resume = temp_path / "sample_resume.txt"
        private_resume = temp_path / "resume.txt"
        sample_resume.write_text("Python and Git", encoding="utf-8")

        resume_input = module.resolve_pasted_job_resume_input(
            module.RESUME_SOURCE_SAMPLE,
            sample_resume_path=sample_resume,
            private_resume_path=private_resume,
        )

        assert resume_input["error_message"] is None
        assert resume_input["resume_path"] == sample_resume
        assert resume_input["resume_text"] is None


def test_resolve_pasted_job_resume_input_preserves_private_resume_behavior():
    module = _load_streamlit_app_module()

    with TemporaryDirectory() as temp_folder:
        temp_path = Path(temp_folder)
        sample_resume = temp_path / "sample_resume.txt"
        private_resume = temp_path / "resume.txt"
        sample_resume.write_text("Python and Git", encoding="utf-8")
        private_resume.write_text("MATLAB and Python", encoding="utf-8")

        resume_input = module.resolve_pasted_job_resume_input(
            module.RESUME_SOURCE_PRIVATE,
            sample_resume_path=sample_resume,
            private_resume_path=private_resume,
        )

        assert resume_input["error_message"] is None
        assert resume_input["resume_path"] == private_resume
        assert resume_input["resume_text"] is None


def test_build_pasted_job_name_uses_default_when_both_fields_blank():
    module = _load_streamlit_app_module()

    assert module.build_pasted_job_name() == module.PASTED_JOB_NAME
    assert module.build_pasted_job_name(None, None) == module.PASTED_JOB_NAME


def test_build_pasted_job_name_uses_title_only():
    module = _load_streamlit_app_module()

    assert module.build_pasted_job_name(job_title="Data Intern") == "Data Intern"


def test_build_pasted_job_name_uses_company_fallback():
    module = _load_streamlit_app_module()

    assert module.build_pasted_job_name(company="Acme Corp") == "Acme Corp — pasted job"


def test_build_pasted_job_name_combines_title_and_company():
    module = _load_streamlit_app_module()

    assert (
        module.build_pasted_job_name(
            job_title="Software Engineering Intern",
            company="Acme Corp",
        )
        == "Acme Corp — Software Engineering Intern"
    )


def test_build_pasted_job_name_trims_whitespace():
    module = _load_streamlit_app_module()

    assert (
        module.build_pasted_job_name(
            job_title="  Data Intern  ",
            company="  Acme Corp  ",
        )
        == "Acme Corp — Data Intern"
    )


def test_build_pasted_job_name_treats_whitespace_only_as_missing():
    module = _load_streamlit_app_module()

    assert module.build_pasted_job_name(job_title="   ", company="Acme Corp") == (
        "Acme Corp — pasted job"
    )
    assert module.build_pasted_job_name(job_title="Data Intern", company="   ") == (
        "Data Intern"
    )
    assert module.build_pasted_job_name(job_title="   ", company="   ") == (
        module.PASTED_JOB_NAME
    )


def test_run_pasted_job_analysis_uses_custom_job_name():
    module = _load_streamlit_app_module()

    job_text = "Internship requiring Python, SQL, and technical documentation."
    custom_job_name = "Acme Corp — Data Intern"

    result = module.run_pasted_job_analysis(job_text, job_name=custom_job_name)
    display = module.build_display_summary(result)

    assert result["jobs"][0]["job_name"] == custom_job_name
    assert display["jobs"][0]["job_name"] == custom_job_name


def test_filter_saved_results_finds_pasted_job_metadata_label():
    module = _load_streamlit_app_module()

    job_text = "Internship requiring Python, SQL, and technical documentation."
    custom_job_name = module.build_pasted_job_name(
        job_title="Data Intern",
        company="Acme Corp",
    )

    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "analysis_results.db"

        result = module.run_pasted_job_analysis(
            job_text,
            job_name=custom_job_name,
        )
        module.store_analysis_result(
            result,
            save_to_database=True,
            database_path=database_path,
        )

        saved_data = module.load_all_sorted_saved_results(database_path)
        filtered = module.filter_saved_results(saved_data["saved_jobs"], "acme corp")

        assert len(filtered) == 1
        assert filtered[0]["job_filename"] == "Acme Corp — Data Intern"
        assert "Acme Corp — Data Intern" in module.format_saved_result_label(
            filtered[0]
        )


def test_decode_uploaded_job_bytes_accepts_valid_utf8():
    module = _load_streamlit_app_module()

    uploaded_bytes = "Internship requiring Python and SQL.".encode("utf-8")
    is_valid, job_text, error_message = module.decode_uploaded_job_bytes(uploaded_bytes)

    assert is_valid is True
    assert job_text == "Internship requiring Python and SQL."
    assert error_message is None


def test_decode_uploaded_job_bytes_rejects_empty_content():
    module = _load_streamlit_app_module()

    is_valid, job_text, error_message = module.decode_uploaded_job_bytes(b"")
    assert is_valid is False
    assert job_text is None
    assert "empty" in error_message.lower()

    is_valid, job_text, error_message = module.decode_uploaded_job_bytes(None)
    assert is_valid is False
    assert job_text is None
    assert "upload" in error_message.lower()


def test_decode_uploaded_job_bytes_rejects_whitespace_only_content():
    module = _load_streamlit_app_module()

    is_valid, job_text, error_message = module.decode_uploaded_job_bytes(b"   \n\t  ")
    assert is_valid is False
    assert job_text is None
    assert "empty" in error_message.lower()


def test_decode_uploaded_job_bytes_rejects_invalid_utf8():
    module = _load_streamlit_app_module()

    is_valid, job_text, error_message = module.decode_uploaded_job_bytes(b"\xff\xfe\xfd")
    assert is_valid is False
    assert job_text is None
    assert "utf-8" in error_message.lower()


def test_resolve_job_description_input_preserves_pasted_validation():
    module = _load_streamlit_app_module()

    job_input = module.resolve_job_description_input(
        module.JOB_INPUT_PASTED,
        pasted_job_text="   ",
    )

    assert job_input["job_text"] is None
    assert job_input["error_message"] is not None
    assert "empty" in job_input["error_message"].lower()

    valid_input = module.resolve_job_description_input(
        module.JOB_INPUT_PASTED,
        pasted_job_text="Internship requiring Python.",
    )

    assert valid_input["error_message"] is None
    assert valid_input["job_text"] == "Internship requiring Python."


def test_run_pasted_job_analysis_works_with_uploaded_job_text():
    module = _load_streamlit_app_module()

    job_text = "Internship requiring Python, SQL, and technical documentation."
    job_input = module.resolve_job_description_input(
        module.JOB_INPUT_UPLOADED,
        uploaded_job_bytes=job_text.encode("utf-8"),
        uploaded_filename="internship_posting.txt",
    )

    result = module.run_pasted_job_analysis(
        job_input["job_text"],
        job_name=module.build_pasted_job_name(
            uploaded_filename=job_input["uploaded_filename"],
        ),
    )
    display = module.build_display_summary(result)

    assert result["analysis_mode"] == "single_text"
    assert display["jobs"][0]["job_name"] == "Uploaded job: internship_posting.txt"
    assert display["jobs"][0]["matched_skills_count"] >= 1


def test_build_pasted_job_name_uses_uploaded_filename_fallback():
    module = _load_streamlit_app_module()

    assert (
        module.build_pasted_job_name(uploaded_filename="../../secret/internship.txt")
        == "Uploaded job: internship.txt"
    )


def test_build_pasted_job_name_prefers_metadata_over_uploaded_filename():
    module = _load_streamlit_app_module()

    assert (
        module.build_pasted_job_name(
            job_title="Data Intern",
            company="Acme Corp",
            uploaded_filename="internship.txt",
        )
        == "Acme Corp — Data Intern"
    )


def test_uploaded_job_text_is_not_written_to_disk_or_database_body():
    module = _load_streamlit_app_module()

    secret_job = "SECRET_JOB_PHRASE_99999 Python SQL internship role"
    job_input = module.resolve_job_description_input(
        module.JOB_INPUT_UPLOADED,
        uploaded_job_bytes=secret_job.encode("utf-8"),
        uploaded_filename="internship.txt",
    )

    with TemporaryDirectory() as temp_folder:
        temp_path = Path(temp_folder)
        jobs_folder = temp_path / "data" / "jobs"
        jobs_folder.mkdir(parents=True)
        database_path = temp_path / "analysis_results.db"

        result = module.run_pasted_job_analysis(
            job_input["job_text"],
            job_name=module.build_pasted_job_name(
                uploaded_filename=job_input["uploaded_filename"],
            ),
        )
        module.store_analysis_result(
            result,
            save_to_database=True,
            database_path=database_path,
        )

        assert list(jobs_folder.iterdir()) == []
        assert secret_job.encode() not in database_path.read_bytes()

        connection = sqlite3.connect(database_path)
        try:
            stored_job_filename = connection.execute(
                "SELECT job_filename FROM job_results"
            ).fetchone()[0]
        finally:
            connection.close()

        assert stored_job_filename == "Uploaded job: internship.txt"


def test_sanitize_download_filename_removes_unsafe_characters():
    module = _load_streamlit_app_module()

    assert (
        module.sanitize_download_filename(
            "Mitre / Systems Engineering Intern",
            "analysis",
        )
        == "mitre_systems_engineering_intern_analysis"
    )
    assert (
        module.sanitize_download_filename("Acme Corp — Data Intern", "skill_gaps")
        == "acme_corp_data_intern_skill_gaps"
    )


def test_build_analysis_markdown_download_includes_job_name_and_sections():
    module = _load_streamlit_app_module()

    display = module.build_display_summary(module.run_sample_analysis())

    markdown = module.build_analysis_markdown_download(display)
    job_name = display["jobs"][0]["job_name"]

    assert "# Internship Fit & Skill-Gap Analysis" in markdown
    assert f"## Job: {job_name}" in markdown
    assert "### Summary" in markdown
    assert "### Matched skills" in markdown
    assert "### Missing skills" in markdown
    assert "## Recurring gaps" in markdown
    assert "Jobs analyzed:" in markdown


def test_build_analysis_markdown_download_excludes_raw_resume_and_job_text():
    module = _load_streamlit_app_module()

    secret_job = "SECRET_JOB_DESCRIPTION_PHRASE_XYZ12345"
    secret_resume = "SECRET_RESUME_PHRASE_ABC67890"
    result = module.run_pasted_job_analysis(
        f"{secret_job} Python SQL required.",
        resume_path=module.RESUME_LABEL_PASTED,
        resume_text=secret_resume,
    )
    display = module.build_display_summary(result)
    markdown = module.build_analysis_markdown_download(display)

    assert secret_job not in markdown
    assert secret_resume not in markdown


def test_build_skill_gaps_csv_download_includes_headers_and_rows():
    module = _load_streamlit_app_module()

    display = module.build_display_summary(module.run_sample_analysis())
    csv_text = module.build_skill_gaps_csv_download(display)

    lines = csv_text.strip().splitlines()
    assert lines[0] == "job_name,category,skill"
    assert len(lines) >= 2


def test_build_skill_gaps_csv_download_handles_no_missing_skills():
    module = _load_streamlit_app_module()

    display = {
        "jobs": [
            {
                "job_name": "Example job",
                "missing_skills_rows": [],
            }
        ]
    }

    csv_text = module.build_skill_gaps_csv_download(display)

    assert csv_text.strip() == "job_name,category,skill"


def test_sample_analysis_produces_non_empty_download_exports():
    module = _load_streamlit_app_module()

    display = module.build_display_summary(module.run_sample_analysis())
    markdown = module.build_analysis_markdown_download(display)
    csv_text = module.build_skill_gaps_csv_download(display)
    markdown_filename, csv_filename = module.build_download_filenames(display)

    assert len(markdown.strip()) > 0
    assert csv_text.startswith("job_name,category,skill")
    assert markdown_filename.endswith(".md")
    assert csv_filename.endswith(".csv")


def test_pasted_job_analysis_produces_download_exports():
    module = _load_streamlit_app_module()

    result = module.run_pasted_job_analysis(
        "Internship requiring Python, SQL, and technical documentation.",
        job_name=module.build_pasted_job_name(
            job_title="Data Intern",
            company="Acme Corp",
        ),
    )
    display = module.build_display_summary(result)
    markdown = module.build_analysis_markdown_download(display)
    csv_text = module.build_skill_gaps_csv_download(display)

    assert "Acme Corp — Data Intern" in markdown
    assert "job_name,category,skill" in csv_text
    assert "Acme Corp — Data Intern" in csv_text


def test_streamlit_app_does_not_use_deprecated_use_container_width():
    """Guard against reintroducing deprecated Streamlit width arguments."""
    repo_root = Path(__file__).resolve().parent.parent
    streamlit_app_source = (repo_root / "streamlit_app.py").read_text(encoding="utf-8")

    assert "use_container_width" not in streamlit_app_source


if __name__ == "__main__":
    test_streamlit_app_imports_safely()
    test_streamlit_app_exposes_layout_tab_helpers()
    test_get_analysis_workflow_choices_includes_sample_paste_and_upload()
    test_label_to_analysis_workflow_key_maps_user_facing_labels()
    test_run_sample_analysis_uses_bundled_sample_resume_and_job()
    test_custom_job_workflows_still_support_portable_resume_and_job_text()
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
    test_filter_saved_results_empty_query_returns_all_results_in_order()
    test_filter_saved_results_whitespace_query_returns_all_results()
    test_filter_saved_results_is_case_insensitive()
    test_filter_saved_results_matches_job_name_substring()
    test_filter_saved_results_matches_run_id()
    test_filter_saved_results_matches_job_result_id()
    test_filter_saved_results_matches_formatted_timestamp_text()
    test_filter_saved_results_no_match_returns_empty_list()
    test_filter_saved_results_preserves_newest_first_order()
    test_filter_saved_results_does_not_mutate_input()
    test_filter_saved_results_handles_missing_optional_fields()
    test_build_recent_saved_runs_display_search_no_match()
    test_apply_pending_delete_saved_analysis_confirmation_reset()
    test_apply_pending_delete_saved_analysis_confirmation_reset_when_not_pending()
    test_request_delete_saved_analysis_confirmation_reset_sets_pending_flag()
    test_build_delete_saved_analysis_display_when_database_missing()
    test_build_delete_saved_analysis_display_when_can_delete()
    test_build_delete_saved_analysis_display_respects_search_filter()
    test_build_compare_saved_analyses_options_search_insufficient()
    test_format_saved_result_label_includes_job_name_and_stable_ids()
    test_format_saved_result_label_distinguishes_duplicate_job_names()
    test_sort_saved_results_orders_newest_first()
    test_sort_saved_results_uses_ids_when_timestamps_match()
    test_format_saved_result_label_handles_missing_timestamp()
    test_recent_saved_jobs_to_rows_includes_saved_result_label()
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
    test_get_resume_source_choices_include_portable_options_when_requested()
    test_get_resume_source_choices_omit_portable_options_by_default()
    test_validate_pasted_resume_text_rejects_blank_input()
    test_validate_pasted_resume_text_accepts_nonempty_input()
    test_decode_uploaded_resume_bytes_accepts_valid_utf8()
    test_decode_uploaded_resume_bytes_rejects_empty_content()
    test_decode_uploaded_resume_bytes_rejects_invalid_utf8()
    test_resolve_pasted_job_resume_input_accepts_pasted_resume_text()
    test_resolve_pasted_job_resume_input_accepts_uploaded_resume_bytes()
    test_run_pasted_job_analysis_works_with_in_memory_resume_text()
    test_in_memory_resume_text_is_not_written_to_disk_or_database_body()
    test_uploaded_resume_workflow_keeps_generic_database_label_only()
    test_resolve_pasted_job_resume_input_preserves_sample_resume_behavior()
    test_resolve_pasted_job_resume_input_preserves_private_resume_behavior()
    test_build_pasted_job_name_uses_default_when_both_fields_blank()
    test_build_pasted_job_name_uses_title_only()
    test_build_pasted_job_name_uses_company_fallback()
    test_build_pasted_job_name_combines_title_and_company()
    test_build_pasted_job_name_trims_whitespace()
    test_build_pasted_job_name_treats_whitespace_only_as_missing()
    test_run_pasted_job_analysis_uses_custom_job_name()
    test_filter_saved_results_finds_pasted_job_metadata_label()
    test_decode_uploaded_job_bytes_accepts_valid_utf8()
    test_decode_uploaded_job_bytes_rejects_empty_content()
    test_decode_uploaded_job_bytes_rejects_whitespace_only_content()
    test_decode_uploaded_job_bytes_rejects_invalid_utf8()
    test_resolve_job_description_input_preserves_pasted_validation()
    test_run_pasted_job_analysis_works_with_uploaded_job_text()
    test_build_pasted_job_name_uses_uploaded_filename_fallback()
    test_build_pasted_job_name_prefers_metadata_over_uploaded_filename()
    test_uploaded_job_text_is_not_written_to_disk_or_database_body()
    test_sanitize_download_filename_removes_unsafe_characters()
    test_build_analysis_markdown_download_includes_job_name_and_sections()
    test_build_analysis_markdown_download_excludes_raw_resume_and_job_text()
    test_build_skill_gaps_csv_download_includes_headers_and_rows()
    test_build_skill_gaps_csv_download_handles_no_missing_skills()
    test_sample_analysis_produces_non_empty_download_exports()
    test_pasted_job_analysis_produces_download_exports()
    test_streamlit_app_does_not_use_deprecated_use_container_width()
    print("All streamlit app tests passed.")
