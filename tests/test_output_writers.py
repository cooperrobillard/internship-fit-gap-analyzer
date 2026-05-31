# Import csv so we can read the CSV files created by our writer functions.
import csv

# Import sys so we can tell Python where to find the src folder.
import sys

# Import Path so we can work with file and folder paths.
from pathlib import Path

# Import TemporaryDirectory so we can create a temporary test folder.
# This lets us test file writing without changing the real data/outputs folder.
from tempfile import TemporaryDirectory

# Add the src folder to Python's import path.
#
# This lets this test file import functions from files inside src/.
sys.path.append(str(Path("src")))


# Import the output writer functions we want to test.
from report_writer import write_gap_report
from csv_writer import write_gap_csv, write_recurring_gap_csv


# Test that write_gap_report creates a markdown file with expected text.
def test_write_gap_report_creates_markdown_file():

    # Create fake resume skills for testing.
    resume_skills = {
        "programming": ["python"],
        "data": [],
    }

    # Create fake job analysis results for testing.
    job_results = [
        {
            "job_name": "job_1.txt",
            "job_skills": {
                "programming": ["python"],
                "data": ["sql"],
            },
            "skill_gaps": {
                "programming": [],
                "data": ["sql"],
            },
        }
    ]

    # Create fake recurring gaps for testing.
    recurring_gaps = [
        {
            "gap_skill": "sql",
            "category": "data",
            "count": 1,
        }
    ]

    # Create a temporary folder just for this test.
    #
    # When the test finishes, Python automatically deletes this folder.
    with TemporaryDirectory() as temp_folder:

        # Create a path for the temporary markdown report.
        output_path = Path(temp_folder) / "gap_report.md"

        # Run the function we are testing.
        write_gap_report(output_path, resume_skills, job_results, recurring_gaps)

        # Check that the markdown file was actually created.
        assert output_path.exists()

        # Read the report text back into Python.
        report_text = output_path.read_text(encoding="utf-8")

        # Check that important expected text appears in the report.
        assert "# Internship Fit & Skill-Gap Report" in report_text
        assert "job_1.txt" in report_text
        assert "sql" in report_text


# Test that write_gap_csv creates a CSV file with the expected row.
def test_write_gap_csv_creates_expected_rows():

    # Create fake job analysis results.
    job_results = [
        {
            "job_name": "job_1.txt",
            "job_skills": {
                "programming": ["python"],
                "data": ["sql"],
            },
            "skill_gaps": {
                "programming": [],
                "data": ["sql"],
            },
        }
    ]

    # Create a temporary folder just for this test.
    with TemporaryDirectory() as temp_folder:

        # Create a path for the temporary CSV file.
        output_path = Path(temp_folder) / "gap_summary.csv"

        # Run the function we are testing.
        write_gap_csv(output_path, job_results)

        # Check that the CSV file was actually created.
        assert output_path.exists()

        # Open the CSV file and read its rows as dictionaries.
        with open(output_path, newline="", encoding="utf-8") as csv_file:
            rows = list(csv.DictReader(csv_file))

        # There should be one row because there is one gap: sql.
        assert len(rows) == 1

        # Check that the row contains the expected values.
        assert rows[0]["job_name"] == "job_1.txt"
        assert rows[0]["category"] == "data"
        assert rows[0]["gap_skill"] == "sql"


# Test that write_recurring_gap_csv creates a CSV file with expected rows.
def test_write_recurring_gap_csv_creates_expected_rows():

    # Create fake recurring gap results.
    recurring_gaps = [
        {
            "gap_skill": "sql",
            "category": "data",
            "count": 2,
        },
        {
            "gap_skill": "aws",
            "category": "cloud_backend",
            "count": 1,
        },
    ]

    # Create a temporary folder just for this test.
    with TemporaryDirectory() as temp_folder:

        # Create a path for the temporary recurring gaps CSV.
        output_path = Path(temp_folder) / "recurring_gaps.csv"

        # Run the function we are testing.
        write_recurring_gap_csv(output_path, recurring_gaps)

        # Check that the CSV file was actually created.
        assert output_path.exists()

        # Open the CSV file and read its rows as dictionaries.
        with open(output_path, newline="", encoding="utf-8") as csv_file:
            rows = list(csv.DictReader(csv_file))

        # There should be two rows because we created two recurring gaps.
        assert len(rows) == 2

        # Check the first row.
        assert rows[0]["gap_skill"] == "sql"
        assert rows[0]["category"] == "data"
        assert rows[0]["count"] == "2"

        # Check the second row.
        assert rows[1]["gap_skill"] == "aws"
        assert rows[1]["category"] == "cloud_backend"
        assert rows[1]["count"] == "1"


# This block runs the tests when we type:
# python3 tests/test_output_writers.py
if __name__ == "__main__":

    # Run each test function.
    test_write_gap_report_creates_markdown_file()
    test_write_gap_csv_creates_expected_rows()
    test_write_recurring_gap_csv_creates_expected_rows()

    # If no assert statement failed, print this success message.
    print("All output writer tests passed.")
