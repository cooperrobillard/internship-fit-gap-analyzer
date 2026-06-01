from pathlib import Path
from datetime import datetime
import sqlite3


def connect_to_database(database_path):
    """
    Connect to a SQLite database file.

    If the parent folder does not exist yet, create it.
    """
    database_path = Path(database_path)
    database_path.parent.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(database_path)
    return connection


def create_tables(connection):
    """
    Create the database tables needed for Version 2.

    This does not insert any data yet.
    It only creates the structure where data will eventually be stored.
    """
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analysis_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_timestamp TEXT NOT NULL,
            resume_path TEXT NOT NULL,
            jobs_path TEXT NOT NULL,
            taxonomy_path TEXT NOT NULL,
            aliases_path TEXT NOT NULL,
            total_jobs INTEGER NOT NULL
        );
        """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS job_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER NOT NULL,
            job_filename TEXT NOT NULL,
            matched_skills_count INTEGER NOT NULL,
            missing_skills_count INTEGER NOT NULL,
            FOREIGN KEY (run_id) REFERENCES analysis_runs (id)
        );
        """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS skill_gaps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER NOT NULL,
            job_filename TEXT NOT NULL,
            skill TEXT NOT NULL,
            category TEXT NOT NULL,
            FOREIGN KEY (run_id) REFERENCES analysis_runs (id)
        );
        """)

    connection.commit()


def initialize_database(database_path):
    """
    Connect to the database and create the required tables.

    The function returns the connection so other parts of the program
    can use it later.
    """
    connection = connect_to_database(database_path)
    create_tables(connection)
    return connection


def insert_analysis_run(
    connection,
    resume_path,
    jobs_path,
    taxonomy_path,
    aliases_path,
    total_jobs,
):
    """
    Insert one analyzer run into the analysis_runs table.

    This records:
    - when the analyzer ran,
    - which input paths were used,
    - how many jobs were analyzed.

    The function returns the ID of the new row.
    """
    cursor = connection.cursor()

    run_timestamp = datetime.now().isoformat(timespec="seconds")

    cursor.execute(
        """
        INSERT INTO analysis_runs (
            run_timestamp,
            resume_path,
            jobs_path,
            taxonomy_path,
            aliases_path,
            total_jobs
        )
        VALUES (?, ?, ?, ?, ?, ?);
        """,
        (
            run_timestamp,
            str(resume_path),
            str(jobs_path),
            str(taxonomy_path),
            str(aliases_path),
            total_jobs,
        ),
    )

    connection.commit()

    return cursor.lastrowid
