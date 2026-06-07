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


def get_latest_run_id(connection):
    """Return the highest analysis run ID in the database, or None when empty."""
    cursor = connection.cursor()

    cursor.execute("SELECT MAX(id) FROM analysis_runs;")
    latest_run_id = cursor.fetchone()[0]

    return latest_run_id


def _count_table_rows(connection, table_name):
    """Count rows in one of the analysis database tables."""
    allowed_tables = {
        "analysis_runs": "SELECT COUNT(*) FROM analysis_runs;",
        "job_results": "SELECT COUNT(*) FROM job_results;",
        "skill_gaps": "SELECT COUNT(*) FROM skill_gaps;",
    }

    if table_name not in allowed_tables:
        raise ValueError(f"Unsupported table name: {table_name}")

    cursor = connection.cursor()
    cursor.execute(allowed_tables[table_name])

    return cursor.fetchone()[0]


def query_saved_gap_priorities(connection, limit=None):
    """
    Query recurring missing skills across all saved job analyses.

    Each count is the number of distinct saved job results (run + job name)
    where the skill appears. Results are sorted by highest count first, then
    skill name alphabetically.
    """
    cursor = connection.cursor()

    query = """
        SELECT
            skill,
            category,
            COUNT(DISTINCT run_id || '|' || job_filename) AS job_result_count,
            GROUP_CONCAT(DISTINCT job_filename) AS example_job_names
        FROM skill_gaps
        GROUP BY skill, category
        ORDER BY job_result_count DESC, skill ASC
    """

    if limit is None:
        cursor.execute(query)
    else:
        cursor.execute(query + " LIMIT ?;", (limit,))

    rows = cursor.fetchall()

    priorities = []
    for row in rows:
        example_job_names = []

        if row[3]:
            example_job_names = sorted(
                job_name.strip()
                for job_name in row[3].split(",")
                if job_name.strip()
            )

        priorities.append(
            {
                "gap_skill": row[0],
                "category": row[1],
                "count": row[2],
                "example_job_names": example_job_names,
            }
        )

    return priorities


def get_saved_gap_priority_summary(database_path, limit=10):
    """
    Read recurring missing-skill priorities from a SQLite analysis database.

    If the file does not exist, returns exists=False.
    If no skill gaps are saved yet, returns has_saved_gaps=False.
    """
    database_path = Path(database_path)

    if not database_path.exists():
        return {
            "exists": False,
            "database_path": database_path,
        }

    connection = sqlite3.connect(database_path)

    try:
        skill_gaps_count = _count_table_rows(connection, "skill_gaps")

        if skill_gaps_count == 0:
            return {
                "exists": True,
                "database_path": database_path,
                "has_saved_gaps": False,
                "priorities": [],
            }

        priorities = query_saved_gap_priorities(connection, limit=limit)

        return {
            "exists": True,
            "database_path": database_path,
            "has_saved_gaps": True,
            "priorities": priorities,
            "limit": limit,
        }
    finally:
        connection.close()


def get_database_summary(database_path):
    """
    Read a simple summary from a SQLite analysis database file.

    If the file does not exist, returns {"exists": False, "database_path": ...}.
    Otherwise returns table counts and top recurring gaps from the latest run.
    """
    database_path = Path(database_path)

    if not database_path.exists():
        return {
            "exists": False,
            "database_path": database_path,
        }

    connection = sqlite3.connect(database_path)

    try:
        analysis_runs_count = _count_table_rows(connection, "analysis_runs")
        job_results_count = _count_table_rows(connection, "job_results")
        skill_gaps_count = _count_table_rows(connection, "skill_gaps")
        latest_run_id = get_latest_run_id(connection)

        top_recurring_gaps = []

        if latest_run_id is not None:
            top_recurring_gaps = query_recurring_gaps(connection, latest_run_id)

        return {
            "exists": True,
            "database_path": database_path,
            "analysis_runs_count": analysis_runs_count,
            "job_results_count": job_results_count,
            "skill_gaps_count": skill_gaps_count,
            "latest_run_id": latest_run_id,
            "top_recurring_gaps": top_recurring_gaps,
        }
    finally:
        connection.close()


def query_recent_saved_jobs(connection, limit=10):
    """
    Return the most recent saved job results across all analysis runs.

    Each item includes run ID, timestamp, job name, and skill counts.
    """
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            job_results.id,
            job_results.run_id,
            analysis_runs.run_timestamp,
            job_results.job_filename,
            job_results.matched_skills_count,
            job_results.missing_skills_count
        FROM job_results
        JOIN analysis_runs ON job_results.run_id = analysis_runs.id
        ORDER BY analysis_runs.run_timestamp DESC,
                 job_results.run_id DESC,
                 job_results.id DESC
        LIMIT ?;
        """,
        (limit,),
    )

    rows = cursor.fetchall()

    recent_jobs = []
    for row in rows:
        recent_jobs.append(
            {
                "job_result_id": row[0],
                "run_id": row[1],
                "run_timestamp": row[2],
                "job_filename": row[3],
                "matched_skills_count": row[4],
                "missing_skills_count": row[5],
            }
        )

    return recent_jobs


def query_all_saved_job_results(connection):
    """
    Return every saved job result with stable IDs for comparison pickers.

    Ordered newest run first, then newest job result within each run.
    """
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            job_results.id,
            job_results.run_id,
            analysis_runs.run_timestamp,
            job_results.job_filename,
            job_results.matched_skills_count,
            job_results.missing_skills_count
        FROM job_results
        JOIN analysis_runs ON job_results.run_id = analysis_runs.id
        ORDER BY analysis_runs.run_timestamp DESC,
                 job_results.run_id DESC,
                 job_results.id DESC;
        """
    )

    rows = cursor.fetchall()

    saved_jobs = []
    for row in rows:
        saved_jobs.append(
            {
                "job_result_id": row[0],
                "run_id": row[1],
                "run_timestamp": row[2],
                "job_filename": row[3],
                "matched_skills_count": row[4],
                "missing_skills_count": row[5],
            }
        )

    return saved_jobs


def query_missing_skills_for_job_result(connection, job_result_id):
    """
    Return the missing skill names saved for one job result row.

    Skills are deduplicated and sorted alphabetically.
    Returns None when the job result ID does not exist.
    """
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT run_id, job_filename
        FROM job_results
        WHERE id = ?;
        """,
        (job_result_id,),
    )

    job_row = cursor.fetchone()

    if job_row is None:
        return None

    run_id = job_row[0]
    job_filename = job_row[1]

    cursor.execute(
        """
        SELECT DISTINCT skill
        FROM skill_gaps
        WHERE run_id = ? AND job_filename = ?
        ORDER BY skill ASC;
        """,
        (run_id, job_filename),
    )

    return [row[0] for row in cursor.fetchall()]


def get_all_saved_job_results(database_path):
    """
    Read every saved job result from a SQLite analysis database file.

    If the file does not exist, returns exists=False and an empty list.
    """
    database_path = Path(database_path)

    if not database_path.exists():
        return {
            "exists": False,
            "database_path": database_path,
            "saved_jobs": [],
        }

    connection = sqlite3.connect(database_path)

    try:
        saved_jobs = query_all_saved_job_results(connection)
    finally:
        connection.close()

    return {
        "exists": True,
        "database_path": database_path,
        "saved_jobs": saved_jobs,
    }


def get_saved_job_result_for_comparison(database_path, job_result_id):
    """
    Load one saved job result and its missing skills for comparison.

    Returns None when the job result ID does not exist.
    """
    database_path = Path(database_path)

    if not database_path.exists():
        return None

    connection = sqlite3.connect(database_path)

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                job_results.id,
                job_results.run_id,
                analysis_runs.run_timestamp,
                job_results.job_filename,
                job_results.matched_skills_count,
                job_results.missing_skills_count
            FROM job_results
            JOIN analysis_runs ON job_results.run_id = analysis_runs.id
            WHERE job_results.id = ?;
            """,
            (job_result_id,),
        )

        row = cursor.fetchone()

        if row is None:
            return None

        missing_skills = query_missing_skills_for_job_result(
            connection,
            job_result_id,
        )

        return {
            "job_result_id": row[0],
            "run_id": row[1],
            "run_timestamp": row[2],
            "job_filename": row[3],
            "matched_skills_count": row[4],
            "missing_skills_count": row[5],
            "missing_skills": missing_skills,
        }
    finally:
        connection.close()


def get_recent_saved_jobs(database_path, limit=10):
    """
    Read recent saved job results from a SQLite analysis database file.

    If the file does not exist, returns exists=False and an empty list.
    """
    database_path = Path(database_path)

    if not database_path.exists():
        return {
            "exists": False,
            "database_path": database_path,
            "recent_jobs": [],
        }

    connection = sqlite3.connect(database_path)

    try:
        recent_jobs = query_recent_saved_jobs(connection, limit=limit)
    finally:
        connection.close()

    return {
        "exists": True,
        "database_path": database_path,
        "recent_jobs": recent_jobs,
    }


def query_jobs_with_most_gaps(connection, run_id):
    """
    Query job results for one analysis run, sorted by missing skills.

    The result is sorted by:
    - highest missing_skills_count first
    - then job filename in alphabetical order
    """
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            job_filename,
            matched_skills_count,
            missing_skills_count
        FROM job_results
        WHERE run_id = ?
        ORDER BY missing_skills_count DESC, job_filename ASC;
        """,
        (run_id,),
    )

    rows = cursor.fetchall()

    jobs_with_gaps = []
    for row in rows:
        jobs_with_gaps.append(
            {
                "job_filename": row[0],
                "matched_skills_count": row[1],
                "missing_skills_count": row[2],
            }
        )

    return jobs_with_gaps


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
