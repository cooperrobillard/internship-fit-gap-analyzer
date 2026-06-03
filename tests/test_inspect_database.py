# Import subprocess so this test file can run terminal commands.
import subprocess

# Import sys so we can use the same Python program that is running this test.
import sys

# Import Path so we can work with file and folder paths.
from pathlib import Path

# Import TemporaryDirectory so we can create a temporary database file for testing.
from tempfile import TemporaryDirectory

# Allow this test file to import modules from the src folder.
project_root = Path(__file__).resolve().parents[1]
src_folder = project_root / "src"
sys.path.append(str(src_folder))

from database import initialize_database, save_analysis_results


def test_inspect_database_script_prints_summary():
    with TemporaryDirectory() as temp_folder:
        database_path = Path(temp_folder) / "analysis_results.db"

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

        result = subprocess.run(
            [
                sys.executable,
                "scripts/inspect_database.py",
                str(database_path),
            ],
            capture_output=True,
            text=True,
        )

        assert result.returncode == 0, result.stderr

        assert "Database summary" in result.stdout
        assert "Analysis runs:" in result.stdout
        assert "Job results:" in result.stdout
        assert "Skill gaps:" in result.stdout
        assert "Latest run ID:" in result.stdout
        assert "Top recurring gaps:" in result.stdout
        assert "Jobs with most gaps:" in result.stdout


if __name__ == "__main__":
    test_inspect_database_script_prints_summary()

    print("All database inspection tests passed.")
