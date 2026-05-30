# Import sys so we can tell Python where to find our src folder.
import sys

# Import Path so we can work with file/folder paths.
from pathlib import Path

# Add the src folder to Python's import path.
#
# This lets this test file import functions from files inside src/.
sys.path.append(str(Path("src")))

# Import the functions we want to test.
from extract_keywords import find_skills
from compare_resume import find_gaps
from summarize_gaps import count_recurring_gaps


# Test that find_skills can find skills in text.
def test_find_skills():

    # Create a small fake taxonomy.
    # This is simpler than using the full real taxonomy file.
    taxonomy = {
        "programming": ["python", "java", "javascript"],
        "data": ["sql"],
    }

    # Create aliases for skills that may appear in different forms.
    aliases = {
        "sql": ["sql", "sql databases"],
    }

    # Create fake text to search.
    text = "This internship uses Python and SQL databases."

    # Run the function we are testing.
    found_skills = find_skills(text, taxonomy, aliases)

    # Check that Python was found.
    assert "python" in found_skills["programming"]

    # Check that SQL was found through the alias "sql databases."
    assert "sql" in found_skills["data"]

    # Check that Java was not falsely found.
    assert "java" not in found_skills["programming"]


# Test that find_gaps finds skills in the job that are missing from the resume.
def test_find_gaps():

    # Fake skills found in a job description.
    job_skills = {
        "programming": ["python"],
        "data": ["sql", "pandas"],
    }

    # Fake skills found in a resume.
    resume_skills = {
        "programming": ["python"],
        "data": ["sql"],
    }

    # Run the function we are testing.
    gaps = find_gaps(job_skills, resume_skills)

    # Python is in both the job and resume, so it should not be a gap.
    assert gaps["programming"] == []

    # Pandas is in the job but not the resume, so it should be a gap.
    assert gaps["data"] == ["pandas"]


# Test that count_recurring_gaps counts repeated gaps across jobs.
def test_count_recurring_gaps():

    # Fake analysis results for two job descriptions.
    job_results = [
        {
            "job_name": "job_1.txt",
            "skill_gaps": {
                "data": ["sql"],
                "cloud_backend": ["aws"],
            },
        },
        {
            "job_name": "job_2.txt",
            "skill_gaps": {
                "data": ["sql"],
                "cloud_backend": ["fastapi"],
            },
        },
    ]

    # Run the function we are testing.
    recurring_gaps = count_recurring_gaps(job_results)

    # The first item should be SQL because it appears twice.
    assert recurring_gaps[0]["gap_skill"] == "sql"
    assert recurring_gaps[0]["count"] == 2

    # AWS and FastAPI each appear once.
    assert recurring_gaps[1]["count"] == 1
    assert recurring_gaps[2]["count"] == 1


# This block runs the tests when we type:
# python3 tests/test_core_logic.py
if __name__ == "__main__":

    # Run each test function.
    test_find_skills()
    test_find_gaps()
    test_count_recurring_gaps()

    # If no assert statement failed, print this success message.
    print("All core logic tests passed.")
