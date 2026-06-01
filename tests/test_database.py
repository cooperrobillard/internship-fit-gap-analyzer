from pathlib import Path
from tempfile import TemporaryDirectory
import sys

# Allow this test file to import modules from the src folder.
project_root = Path(__file__).resolve().parents[1]
src_folder = project_root / "src"
sys.path.append(str(src_folder))

from database import initialize_database, insert_analysis_run


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


if __name__ == "__main__":
    test_initialize_database_creates_database_file()
    test_initialize_database_creates_expected_tables()
    test_insert_analysis_run_adds_row_and_returns_id()

    print("All database tests passed.")
