from pathlib import Path
from tempfile import TemporaryDirectory
import sys

# Allow this test file to import modules from the src folder.
project_root = Path(__file__).resolve().parents[1]
src_folder = project_root / "src"
sys.path.append(str(src_folder))

from database import initialize_database


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


if __name__ == "__main__":
    test_initialize_database_creates_database_file()
    test_initialize_database_creates_expected_tables()

    print("All database tests passed.")
