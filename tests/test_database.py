from pathlib import Path
from tempfile import TemporaryDirectory
import sys

# Allow this test file to import modules from the src folder.
project_root = Path(__file__).resolve().parents[1]
src_folder = project_root / "src"
sys.path.append(str(src_folder))

from database import initialize_database, insert_analysis_run, insert_job_result
from database import insert_skill_gap
from database import query_recurring_gaps
from database import query_jobs_with_most_gaps
from database import query_recent_saved_jobs
from database import get_all_saved_job_results
from database import get_database_summary, get_recent_saved_jobs, save_analysis_results
from database import get_saved_job_result_for_comparison
from database import query_all_saved_job_results
from database import query_missing_skills_for_job_result


def table_exists(connection, table_name):
    """
    Check whether a table exists in the SQLite database.
    """
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT name
        FROM sqlite_master
        WHERE type = 'table' AND name = ?;
        """,
        (table_name,),
    )

    result = cursor.fetchone()
    return result is not None


def test_initialize_database_creates_database_file():
    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "test_analysis_results.db"

        connection = initialize_database(database_path)
        connection.close()

        assert database_path.exists()


def test_initialize_database_creates_expected_tables():
    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "test_analysis_results.db"

        connection = initialize_database(database_path)

        assert table_exists(connection, "analysis_runs")
        assert table_exists(connection, "job_results")
        assert table_exists(connection, "skill_gaps")

        connection.close()


def test_insert_analysis_run_adds_row_and_returns_id():
    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "test_analysis_results.db"

        connection = initialize_database(database_path)

        run_id = insert_analysis_run(
            connection=connection,
            resume_path="data/resume/sample_resume.txt",
            jobs_path="data/sample_jobs",
            taxonomy_path="data/skills_taxonomy.json",
            aliases_path="data/skill_aliases.json",
            total_jobs=2,
        )

        assert run_id == 1

        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                id,
                run_timestamp,
                resume_path,
                jobs_path,
                taxonomy_path,
                aliases_path,
                total_jobs
            FROM analysis_runs
            WHERE id = ?;
            """,
            (run_id,),
        )

        row = cursor.fetchone()

        assert row is not None
        assert row[0] == 1
        assert row[1] != ""
        assert row[2] == "data/resume/sample_resume.txt"
        assert row[3] == "data/sample_jobs"
        assert row[4] == "data/skills_taxonomy.json"
        assert row[5] == "data/skill_aliases.json"
        assert row[6] == 2

        connection.close()


def test_insert_job_result_adds_row_and_returns_id():
    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "test_analysis_results.db"

        connection = initialize_database(database_path)

        run_id = insert_analysis_run(
            connection=connection,
            resume_path="data/resume/sample_resume.txt",
            jobs_path="data/sample_jobs",
            taxonomy_path="data/skills_taxonomy.json",
            aliases_path="data/skill_aliases.json",
            total_jobs=1,
        )

        job_result_id = insert_job_result(
            connection=connection,
            run_id=run_id,
            job_filename="sample_job.txt",
            matched_skills_count=3,
            missing_skills_count=5,
        )

        assert job_result_id == 1

        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                id,
                run_id,
                job_filename,
                matched_skills_count,
                missing_skills_count
            FROM job_results
            WHERE id = ?;
            """,
            (job_result_id,),
        )

        row = cursor.fetchone()

        assert row is not None
        assert row[0] == 1
        assert row[1] == run_id
        assert row[2] == "sample_job.txt"
        assert row[3] == 3
        assert row[4] == 5

        connection.close()


def test_insert_skill_gap_adds_row_and_returns_id():
    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "test_analysis_results.db"

        connection = initialize_database(database_path)

        run_id = insert_analysis_run(
            connection=connection,
            resume_path="data/resume/sample_resume.txt",
            jobs_path="data/sample_jobs",
            taxonomy_path="data/skills_taxonomy.json",
            aliases_path="data/skill_aliases.json",
            total_jobs=1,
        )

        # This mirrors the real workflow: we typically store a job result
        # before we store skill gaps for that job.
        insert_job_result(
            connection=connection,
            run_id=run_id,
            job_filename="sample_job.txt",
            matched_skills_count=0,
            missing_skills_count=1,
        )

        skill_gap_id = insert_skill_gap(
            connection=connection,
            run_id=run_id,
            job_filename="sample_job.txt",
            skill="Communication",
            category="Soft Skills",
        )

        assert skill_gap_id == 1

        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                id,
                run_id,
                job_filename,
                skill,
                category
            FROM skill_gaps
            WHERE id = ?;
            """,
            (skill_gap_id,),
        )

        row = cursor.fetchone()

        assert row is not None
        assert row[0] == 1
        assert row[1] == run_id
        assert row[2] == "sample_job.txt"
        assert row[3] == "Communication"
        assert row[4] == "Soft Skills"

        connection.close()


def test_query_recurring_gaps_returns_sorted_counts():
    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "test_analysis_results.db"

        connection = initialize_database(database_path)

        run_id = insert_analysis_run(
            connection=connection,
            resume_path="data/resume/sample_resume.txt",
            jobs_path="data/sample_jobs",
            taxonomy_path="data/skills_taxonomy.json",
            aliases_path="data/skill_aliases.json",
            total_jobs=2,
        )

        insert_job_result(
            connection=connection,
            run_id=run_id,
            job_filename="job_one.txt",
            matched_skills_count=2,
            missing_skills_count=1,
        )

        insert_job_result(
            connection=connection,
            run_id=run_id,
            job_filename="job_two.txt",
            matched_skills_count=1,
            missing_skills_count=2,
        )

        insert_skill_gap(
            connection=connection,
            run_id=run_id,
            job_filename="job_one.txt",
            skill="sql",
            category="data",
        )
        insert_skill_gap(
            connection=connection,
            run_id=run_id,
            job_filename="job_two.txt",
            skill="sql",
            category="data",
        )
        insert_skill_gap(
            connection=connection,
            run_id=run_id,
            job_filename="job_two.txt",
            skill="fastapi",
            category="backend",
        )

        recurring_gaps = query_recurring_gaps(connection, run_id)

        assert recurring_gaps[0]["gap_skill"] == "sql"
        assert recurring_gaps[0]["count"] == 2
        assert recurring_gaps[0]["category"] == "data"

        assert recurring_gaps[1]["gap_skill"] == "fastapi"
        assert recurring_gaps[1]["count"] == 1
        assert recurring_gaps[1]["category"] == "backend"

        connection.close()


def test_save_analysis_results_inserts_related_rows():
    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "test_analysis_results.db"

        connection = initialize_database(database_path)

        fake_job_results = [
            {
                "job_name": "job_one.txt",
                "job_skills": {
                    "programming": ["python"],
                    "data": ["sql", "pandas"],
                },
                "skill_gaps": {
                    "programming": [],
                    "data": ["sql"],
                },
            },
            {
                "job_name": "job_two.txt",
                "job_skills": {
                    "programming": ["python", "fastapi"],
                    "data": ["sql"],
                },
                "skill_gaps": {
                    "programming": ["fastapi"],
                    "data": ["sql"],
                },
            },
        ]

        run_id = save_analysis_results(
            connection=connection,
            resume_path="data/resume/sample_resume.txt",
            jobs_path="data/sample_jobs",
            taxonomy_path="data/skills_taxonomy.json",
            aliases_path="data/skill_aliases.json",
            job_results=fake_job_results,
        )

        assert run_id == 1

        cursor = connection.cursor()

        cursor.execute("SELECT COUNT(*) FROM analysis_runs;")
        analysis_runs_count = cursor.fetchone()[0]
        assert analysis_runs_count == 1

        cursor.execute("SELECT COUNT(*) FROM job_results;")
        job_results_count = cursor.fetchone()[0]
        assert job_results_count == 2

        cursor.execute("SELECT COUNT(*) FROM skill_gaps;")
        skill_gaps_count = cursor.fetchone()[0]
        assert skill_gaps_count == 3

        recurring_gaps = query_recurring_gaps(connection, run_id)

        assert recurring_gaps[0]["gap_skill"] == "sql"
        assert recurring_gaps[0]["count"] == 2
        assert recurring_gaps[0]["category"] == "data"

        assert recurring_gaps[1]["gap_skill"] == "fastapi"
        assert recurring_gaps[1]["count"] == 1
        assert recurring_gaps[1]["category"] == "programming"

        connection.close()


def test_query_jobs_with_most_gaps_returns_sorted_jobs():
    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "test_analysis_results.db"

        connection = initialize_database(database_path)

        run_id = insert_analysis_run(
            connection=connection,
            resume_path="data/resume/sample_resume.txt",
            jobs_path="data/sample_jobs",
            taxonomy_path="data/skills_taxonomy.json",
            aliases_path="data/skill_aliases.json",
            total_jobs=3,
        )

        insert_job_result(
            connection=connection,
            run_id=run_id,
            job_filename="job_alpha.txt",
            matched_skills_count=2,
            missing_skills_count=2,
        )
        insert_job_result(
            connection=connection,
            run_id=run_id,
            job_filename="job_bravo.txt",
            matched_skills_count=4,
            missing_skills_count=5,
        )
        insert_job_result(
            connection=connection,
            run_id=run_id,
            job_filename="job_charlie.txt",
            matched_skills_count=6,
            missing_skills_count=0,
        )

        jobs_with_gaps = query_jobs_with_most_gaps(connection, run_id)

        assert jobs_with_gaps[0]["missing_skills_count"] == 5
        assert jobs_with_gaps[0]["job_filename"] == "job_bravo.txt"
        assert jobs_with_gaps[0]["matched_skills_count"] == 4

        assert set(jobs_with_gaps[0].keys()) == {
            "job_filename",
            "matched_skills_count",
            "missing_skills_count",
        }

        missing_counts = [
            job["missing_skills_count"] for job in jobs_with_gaps
        ]
        assert missing_counts == sorted(missing_counts, reverse=True)

        assert jobs_with_gaps[1]["missing_skills_count"] == 2
        assert jobs_with_gaps[2]["missing_skills_count"] == 0

        connection.close()


def test_get_database_summary_when_file_missing():
    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "missing_analysis_results.db"

        summary = get_database_summary(database_path)

        assert summary["exists"] is False
        assert summary["database_path"] == database_path


def test_get_database_summary_returns_counts_and_gaps():
    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "test_analysis_results.db"
        connection = initialize_database(database_path)

        fake_job_results = [
            {
                "job_name": "job_one.txt",
                "job_skills": {
                    "programming": ["python"],
                    "data": ["sql", "pandas"],
                },
                "skill_gaps": {
                    "programming": [],
                    "data": ["sql"],
                },
            },
            {
                "job_name": "job_two.txt",
                "job_skills": {
                    "programming": ["python", "fastapi"],
                    "data": ["sql"],
                },
                "skill_gaps": {
                    "programming": ["fastapi"],
                    "data": ["sql"],
                },
            },
        ]

        save_analysis_results(
            connection=connection,
            resume_path="data/resume/sample_resume.txt",
            jobs_path="data/sample_jobs",
            taxonomy_path="data/skills_taxonomy.json",
            aliases_path="data/skill_aliases.json",
            job_results=fake_job_results,
        )

        connection.close()

        summary = get_database_summary(database_path)

        assert summary["exists"] is True
        assert summary["analysis_runs_count"] == 1
        assert summary["job_results_count"] == 2
        assert summary["skill_gaps_count"] == 3
        assert summary["latest_run_id"] == 1
        assert summary["top_recurring_gaps"][0]["gap_skill"] == "sql"
        assert summary["top_recurring_gaps"][0]["count"] == 2


def test_get_recent_saved_jobs_when_file_missing():
    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "missing_analysis_results.db"

        recent_data = get_recent_saved_jobs(database_path)

        assert recent_data["exists"] is False
        assert recent_data["recent_jobs"] == []


def test_query_recent_saved_jobs_returns_newest_first_and_respects_limit():
    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "test_analysis_results.db"
        connection = initialize_database(database_path)

        first_job_results = [
            {
                "job_name": "older_job.txt",
                "job_skills": {"programming": ["python"]},
                "skill_gaps": {"programming": []},
            }
        ]
        second_job_results = [
            {
                "job_name": "newer_job.txt",
                "job_skills": {"programming": ["python", "fastapi"]},
                "skill_gaps": {"programming": ["fastapi"]},
            }
        ]

        save_analysis_results(
            connection=connection,
            resume_path="data/resume/sample_resume.txt",
            jobs_path="data/sample_jobs",
            taxonomy_path="data/skills_taxonomy.json",
            aliases_path="data/skill_aliases.json",
            job_results=first_job_results,
        )
        save_analysis_results(
            connection=connection,
            resume_path="data/resume/sample_resume.txt",
            jobs_path="data/sample_jobs",
            taxonomy_path="data/skills_taxonomy.json",
            aliases_path="data/skill_aliases.json",
            job_results=second_job_results,
        )

        recent_jobs = query_recent_saved_jobs(connection, limit=1)

        assert len(recent_jobs) == 1
        assert recent_jobs[0]["job_filename"] == "newer_job.txt"
        assert recent_jobs[0]["run_id"] == 2
        assert recent_jobs[0]["matched_skills_count"] == 2
        assert recent_jobs[0]["missing_skills_count"] == 1

        connection.close()

        recent_data = get_recent_saved_jobs(database_path, limit=10)

        assert recent_data["exists"] is True
        assert len(recent_data["recent_jobs"]) == 2
        assert recent_data["recent_jobs"][0]["job_filename"] == "newer_job.txt"


def test_get_all_saved_job_results_when_file_missing():
    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "missing_analysis_results.db"

        saved_data = get_all_saved_job_results(database_path)

        assert saved_data["exists"] is False
        assert saved_data["saved_jobs"] == []


def test_query_missing_skills_for_job_result_returns_sorted_unique_skills():
    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "test_analysis_results.db"
        connection = initialize_database(database_path)

        run_id = insert_analysis_run(
            connection=connection,
            resume_path="data/resume/sample_resume.txt",
            jobs_path="data/sample_jobs",
            taxonomy_path="data/skills_taxonomy.json",
            aliases_path="data/skill_aliases.json",
            total_jobs=1,
        )

        job_result_id = insert_job_result(
            connection=connection,
            run_id=run_id,
            job_filename="sample_job.txt",
            matched_skills_count=1,
            missing_skills_count=3,
        )

        insert_skill_gap(
            connection=connection,
            run_id=run_id,
            job_filename="sample_job.txt",
            skill="sql",
            category="data",
        )
        insert_skill_gap(
            connection=connection,
            run_id=run_id,
            job_filename="sample_job.txt",
            skill="fastapi",
            category="backend",
        )
        insert_skill_gap(
            connection=connection,
            run_id=run_id,
            job_filename="sample_job.txt",
            skill="sql",
            category="analytics",
        )

        missing_skills = query_missing_skills_for_job_result(
            connection,
            job_result_id,
        )

        assert missing_skills == ["fastapi", "sql"]
        assert query_missing_skills_for_job_result(connection, 999) is None

        connection.close()


def test_get_saved_job_result_for_comparison_returns_one_identifiable_result():
    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "test_analysis_results.db"
        connection = initialize_database(database_path)

        first_job_results = [
            {
                "job_name": "older_job.txt",
                "job_skills": {"programming": ["python"]},
                "skill_gaps": {"programming": ["docker"]},
            }
        ]
        second_job_results = [
            {
                "job_name": "newer_job.txt",
                "job_skills": {"programming": ["python", "fastapi"]},
                "skill_gaps": {"programming": ["fastapi", "sql"]},
            }
        ]

        save_analysis_results(
            connection=connection,
            resume_path="data/resume/sample_resume.txt",
            jobs_path="data/sample_jobs",
            taxonomy_path="data/skills_taxonomy.json",
            aliases_path="data/skill_aliases.json",
            job_results=first_job_results,
        )
        save_analysis_results(
            connection=connection,
            resume_path="data/resume/sample_resume.txt",
            jobs_path="data/sample_jobs",
            taxonomy_path="data/skills_taxonomy.json",
            aliases_path="data/skill_aliases.json",
            job_results=second_job_results,
        )

        saved_jobs = query_all_saved_job_results(connection)
        connection.close()

        assert len(saved_jobs) == 2
        assert saved_jobs[0]["job_filename"] == "newer_job.txt"
        assert saved_jobs[1]["job_filename"] == "older_job.txt"

        newer_result = get_saved_job_result_for_comparison(
            database_path,
            saved_jobs[0]["job_result_id"],
        )
        older_result = get_saved_job_result_for_comparison(
            database_path,
            saved_jobs[1]["job_result_id"],
        )

        assert newer_result["job_filename"] == "newer_job.txt"
        assert newer_result["missing_skills"] == ["fastapi", "sql"]
        assert older_result["job_filename"] == "older_job.txt"
        assert older_result["missing_skills"] == ["docker"]

        all_saved = get_all_saved_job_results(database_path)
        assert all_saved["exists"] is True
        assert len(all_saved["saved_jobs"]) == 2


if __name__ == "__main__":
    test_initialize_database_creates_database_file()
    test_initialize_database_creates_expected_tables()
    test_insert_analysis_run_adds_row_and_returns_id()
    test_insert_job_result_adds_row_and_returns_id()
    test_insert_skill_gap_adds_row_and_returns_id()
    test_query_recurring_gaps_returns_sorted_counts()
    test_save_analysis_results_inserts_related_rows()
    test_query_jobs_with_most_gaps_returns_sorted_jobs()
    test_get_database_summary_when_file_missing()
    test_get_database_summary_returns_counts_and_gaps()
    test_get_recent_saved_jobs_when_file_missing()
    test_query_recent_saved_jobs_returns_newest_first_and_respects_limit()
    test_get_all_saved_job_results_when_file_missing()
    test_query_missing_skills_for_job_result_returns_sorted_unique_skills()
    test_get_saved_job_result_for_comparison_returns_one_identifiable_result()

    print("All database tests passed.")
