# Import sys so we can read command-line arguments and find the src folder.
import sys

# Import Path so we can work with file and folder paths.
from pathlib import Path

# Import sqlite3 so we can connect to the SQLite database file.
import sqlite3

# Add the src folder to Python's import path.
project_root = Path(__file__).resolve().parents[1]
src_folder = project_root / "src"
sys.path.append(str(src_folder))

# Import database query helpers from the project.
from database import query_recurring_gaps, query_jobs_with_most_gaps


def count_rows(connection, table_name):
    """
    Count how many rows exist in one database table.
    """
    cursor = connection.cursor()

    cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
    row_count = cursor.fetchone()[0]

    return row_count


def get_latest_run_id(connection):
    """
    Return the highest analysis run ID in the database.
    """
    cursor = connection.cursor()

    cursor.execute("SELECT MAX(id) FROM analysis_runs;")
    latest_run_id = cursor.fetchone()[0]

    return latest_run_id


def print_database_summary(database_path):
    """
    Print a simple summary of one SQLite analysis database file.
    """
    database_path = Path(database_path)

    # Stop early with a clear message if the database file does not exist.
    if not database_path.exists():
        print(f"Database file not found: {database_path}")
        sys.exit(1)

    connection = sqlite3.connect(database_path)

    try:
        analysis_runs_count = count_rows(connection, "analysis_runs")
        job_results_count = count_rows(connection, "job_results")
        skill_gaps_count = count_rows(connection, "skill_gaps")
        latest_run_id = get_latest_run_id(connection)

        print("\nDatabase summary\n")
        print(f"Analysis runs: {analysis_runs_count}")
        print(f"Job results: {job_results_count}")
        print(f"Skill gaps: {skill_gaps_count}")
        print(f"\nLatest run ID: {latest_run_id}")

        if latest_run_id is None:
            print("\nTop recurring gaps:")
            print("- No analysis runs found")
            print("\nJobs with most gaps:")
            print("- No analysis runs found")
            return

        recurring_gaps = query_recurring_gaps(connection, latest_run_id)
        jobs_with_most_gaps = query_jobs_with_most_gaps(connection, latest_run_id)

        print("\nTop recurring gaps:")

        if not recurring_gaps:
            print("- No skill gaps found")
        else:
            for index, gap in enumerate(recurring_gaps, start=1):
                gap_skill = gap["gap_skill"]
                category = gap["category"]
                count = gap["count"]
                print(f"{index}. {gap_skill} ({category}): {count}")

        print("\nJobs with most gaps:")

        if not jobs_with_most_gaps:
            print("- No job results found")
        else:
            for index, job in enumerate(jobs_with_most_gaps, start=1):
                job_filename = job["job_filename"]
                matched_skills_count = job["matched_skills_count"]
                missing_skills_count = job["missing_skills_count"]
                print(
                    f"{index}. {job_filename}: "
                    f"{missing_skills_count} missing skill(s) "
                    f"({matched_skills_count} matched)"
                )

    finally:
        connection.close()


def main():
    """
    Read the database path from the command line and print a summary.
    """
    if len(sys.argv) != 2:
        print("Usage: python3 scripts/inspect_database.py <database_path>")
        sys.exit(1)

    database_path = sys.argv[1]
    print_database_summary(database_path)


if __name__ == "__main__":
    main()
