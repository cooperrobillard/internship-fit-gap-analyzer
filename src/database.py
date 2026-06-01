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


def insert_job_result(
    connection,
    run_id,
    job_filename,
    matched_skills_count,
    missing_skills_count,
):
    """
    Insert one job result into the job_results table.

    This records:
    - which analysis run the job belongs to,
    - which job file was analyzed,
    - how many skills matched and how many were missing.

    The function returns the ID of the new row.
    """
    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO job_results (
            run_id,
            job_filename,
            matched_skills_count,
            missing_skills_count
        )
        VALUES (?, ?, ?, ?);
        """,
        (
            run_id,
            str(job_filename),
            matched_skills_count,
            missing_skills_count,
        ),
    )

    connection.commit()

    return cursor.lastrowid


def insert_skill_gap(
    connection,
    run_id,
    job_filename,
    skill,
    category,
):
    """
    Insert one skill gap into the skill_gaps table.

    The function returns the ID of the new row.
    """
    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO skill_gaps (
            run_id,
            job_filename,
            skill,
            category
        )
        VALUES (?, ?, ?, ?);
        """,
        (
            run_id,
            str(job_filename),
            str(skill),
            str(category),
        ),
    )

    connection.commit()

    return cursor.lastrowid


def query_recurring_gaps(connection, run_id):
    """
    Query recurring skill gaps for one analysis run.

    The result is sorted by:
    - highest count first
    - then skill name in alphabetical order
    """
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            skill,
            category,
            COUNT(*)
        FROM skill_gaps
        WHERE run_id = ?
        GROUP BY skill, category
        ORDER BY COUNT(*) DESC, skill ASC;
        """,
        (run_id,),
    )

    rows = cursor.fetchall()

    recurring_gaps = []
    for row in rows:
        recurring_gaps.append(
            {
                "gap_skill": row[0],
                "category": row[1],
                "count": row[2],
            }
        )

    return recurring_gaps


def save_analysis_results(
    connection,
    resume_path,
    jobs_path,
    taxonomy_path,
    aliases_path,
    job_results,
):
    """
    Save one full analysis run and its related results.

    This adds:
    - one row in analysis_runs
    - one row per job in job_results
    - one row per missing skill in skill_gaps
    """
    run_id = insert_analysis_run(
        connection=connection,
        resume_path=resume_path,
        jobs_path=jobs_path,
        taxonomy_path=taxonomy_path,
        aliases_path=aliases_path,
        total_jobs=len(job_results),
    )

    for job_result in job_results:
        matched_skills_count = 0
        for skills_in_category in job_result["job_skills"].values():
            matched_skills_count += len(skills_in_category)

        missing_skills_count = 0
        for gaps_in_category in job_result["skill_gaps"].values():
            missing_skills_count += len(gaps_in_category)

        insert_job_result(
            connection=connection,
            run_id=run_id,
            job_filename=job_result["job_name"],
            matched_skills_count=matched_skills_count,
            missing_skills_count=missing_skills_count,
        )

        for category, missing_skills in job_result["skill_gaps"].items():
            for skill in missing_skills:
                insert_skill_gap(
                    connection=connection,
                    run_id=run_id,
                    job_filename=job_result["job_name"],
                    skill=skill,
                    category=category,
                )

    return run_id
