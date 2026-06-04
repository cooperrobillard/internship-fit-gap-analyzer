# Import subprocess so this test file can run terminal commands.
import subprocess

# Import sys so we can use the same Python program that is running this test.
import sys

# Import Path so we can work with file and folder paths.
from pathlib import Path

# Import TemporaryDirectory so we can create a temporary output folder for testing.
from tempfile import TemporaryDirectory


# Test that the help command runs successfully.
def test_help_command_runs():

    # Run the main program with --help.
    result = subprocess.run(
        [sys.executable, "src/main.py", "--help"],
        capture_output=True,
        text=True,
    )

    # Check that the command worked.
    assert result.returncode == 0

    # Check that the help text includes some expected command-line options.
    assert "--resume" in result.stdout
    assert "--jobs" in result.stdout
    assert "--taxonomy" in result.stdout
    assert "--aliases" in result.stdout
    assert "--outputs" in result.stdout
    assert "--top-gaps" in result.stdout


# Test that the main program works with a custom outputs folder.
def test_main_runs_with_custom_outputs_folder():

    # Create a temporary folder just for this test.
    #
    # This avoids changing the real data/outputs folder during the test.
    with TemporaryDirectory() as temp_folder:

        # Create a path for a temporary outputs folder.
        output_folder = Path(temp_folder) / "outputs"

        # Run the main program with:
        # - a custom outputs folder
        # - only 2 top gaps shown in the terminal summary
        result = subprocess.run(
            [
                sys.executable,
                "src/main.py",
                "--outputs",
                str(output_folder),
                "--top-gaps",
                "2",
            ],
            capture_output=True,
            text=True,
        )

        # Check that the command worked.
        #
        # If it failed, result.stderr will help show the error message.
        assert result.returncode == 0, result.stderr

        # Check that the terminal summary printed expected text.
        assert "Analysis complete." in result.stdout
        assert "Jobs analyzed:" in result.stdout
        assert "Top recurring gaps:" in result.stdout
        assert "Output files:" in result.stdout

        # Create paths for the expected output files.
        gap_report_path = output_folder / "gap_report.md"
        gap_summary_path = output_folder / "gap_summary.csv"
        recurring_gaps_path = output_folder / "recurring_gaps.csv"

        # Check that all expected output files were created.
        assert gap_report_path.exists()
        assert gap_summary_path.exists()
        assert recurring_gaps_path.exists()

        # Read the markdown report text.
        report_text = gap_report_path.read_text(encoding="utf-8")

        # Check that the report contains expected sections.
        assert "# Internship Fit & Skill-Gap Report" in report_text
        assert "## Most Common Skill Gaps" in report_text
        assert "## Job Analyses" in report_text


def test_main_runs_with_database_option():

    # Create temporary folders and files for this test.
    with TemporaryDirectory() as temp_folder:
        output_folder = Path(temp_folder) / "outputs"
        database_path = Path(temp_folder) / "analysis_results.db"

        # Run the main program with a custom outputs folder and database path.
        result = subprocess.run(
            [
                sys.executable,
                "src/main.py",
                "--outputs",
                str(output_folder),
                "--database",
                str(database_path),
            ],
            capture_output=True,
            text=True,
        )

        # Check that the command worked.
        assert result.returncode == 0, result.stderr

        # Check that the database file was created.
        assert database_path.exists()

        # Check that normal output files still exist.
        gap_report_path = output_folder / "gap_report.md"
        gap_summary_path = output_folder / "gap_summary.csv"
        recurring_gaps_path = output_folder / "recurring_gaps.csv"

        assert gap_report_path.exists()
        assert gap_summary_path.exists()
        assert recurring_gaps_path.exists()


def test_main_runs_with_pandas_summary_option():

    # Create a temporary output folder for this test.
    with TemporaryDirectory() as temp_folder:
        output_folder = Path(temp_folder) / "outputs"

        # Run the main program with a custom outputs folder and --pandas-summary.
        result = subprocess.run(
            [
                sys.executable,
                "src/main.py",
                "--outputs",
                str(output_folder),
                "--pandas-summary",
            ],
            capture_output=True,
            text=True,
        )

        # Check that the command worked.
        assert result.returncode == 0, result.stderr

        # Check that normal output files still exist.
        gap_report_path = output_folder / "gap_report.md"
        gap_summary_path = output_folder / "gap_summary.csv"
        recurring_gaps_path = output_folder / "recurring_gaps.csv"

        assert gap_report_path.exists()
        assert gap_summary_path.exists()
        assert recurring_gaps_path.exists()

        # Check that pandas summary output files were created.
        gap_categories_pandas_path = output_folder / "gap_categories_pandas.csv"
        top_recurring_gaps_pandas_path = (
            output_folder / "top_recurring_gaps_pandas.csv"
        )

        assert gap_categories_pandas_path.exists()
        assert top_recurring_gaps_pandas_path.exists()

        # Check that the terminal output lists the pandas output files.
        assert "gap_categories_pandas.csv" in result.stdout
        assert "top_recurring_gaps_pandas.csv" in result.stdout


def test_main_runs_with_database_and_pandas_summary_options():

    # Create temporary folders and files for this test.
    with TemporaryDirectory() as temp_folder:
        output_folder = Path(temp_folder) / "outputs"
        database_path = Path(temp_folder) / "analysis_results.db"

        # Run the main program with database and pandas summary options together.
        result = subprocess.run(
            [
                sys.executable,
                "src/main.py",
                "--outputs",
                str(output_folder),
                "--database",
                str(database_path),
                "--pandas-summary",
            ],
            capture_output=True,
            text=True,
        )

        # Check that the command worked.
        assert result.returncode == 0, result.stderr

        # Check that normal output files still exist.
        gap_report_path = output_folder / "gap_report.md"
        gap_summary_path = output_folder / "gap_summary.csv"
        recurring_gaps_path = output_folder / "recurring_gaps.csv"

        assert gap_report_path.exists()
        assert gap_summary_path.exists()
        assert recurring_gaps_path.exists()

        # Check that pandas summary output files were created.
        gap_categories_pandas_path = output_folder / "gap_categories_pandas.csv"
        top_recurring_gaps_pandas_path = (
            output_folder / "top_recurring_gaps_pandas.csv"
        )

        assert gap_categories_pandas_path.exists()
        assert top_recurring_gaps_pandas_path.exists()

        # Check that the SQLite database file was created.
        assert database_path.exists()

        # Check that the terminal output includes expected summary text and files.
        assert "Analysis complete." in result.stdout
        assert "Output files:" in result.stdout
        assert "gap_report.md" in result.stdout
        assert "gap_summary.csv" in result.stdout
        assert "recurring_gaps.csv" in result.stdout
        assert "gap_categories_pandas.csv" in result.stdout
        assert "top_recurring_gaps_pandas.csv" in result.stdout
        assert database_path.name in result.stdout


def test_cli_reports_missing_resume_file():

    result = subprocess.run(
        [
            sys.executable,
            "src/main.py",
            "--resume",
            "data/resume/does_not_exist.txt",
        ],
        capture_output=True,
        text=True,
    )

    assert result.returncode == 1
    assert "Error: Missing required file:" in result.stderr
    assert "does_not_exist.txt" in result.stderr
    assert "Traceback" not in result.stderr


def test_cli_reports_missing_jobs_folder():

    result = subprocess.run(
        [
            sys.executable,
            "src/main.py",
            "--jobs",
            "data/does_not_exist_jobs",
        ],
        capture_output=True,
        text=True,
    )

    assert result.returncode == 1
    assert "Error: Missing jobs folder:" in result.stderr
    assert "does_not_exist_jobs" in result.stderr
    assert "Traceback" not in result.stderr


def test_cli_reports_empty_jobs_folder():

    with TemporaryDirectory() as temp_folder:
        empty_jobs_folder = Path(temp_folder) / "empty_jobs"
        empty_jobs_folder.mkdir()

        result = subprocess.run(
            [
                sys.executable,
                "src/main.py",
                "--jobs",
                str(empty_jobs_folder),
            ],
            capture_output=True,
            text=True,
        )

        assert result.returncode == 1
        assert "Error: No .txt job description files found in:" in result.stderr
        assert "Traceback" not in result.stderr


def test_cli_reports_invalid_taxonomy_json():

    with TemporaryDirectory() as temp_folder:
        bad_taxonomy_path = Path(temp_folder) / "bad_taxonomy.json"
        bad_taxonomy_path.write_text("not valid json", encoding="utf-8")

        result = subprocess.run(
            [
                sys.executable,
                "src/main.py",
                "--taxonomy",
                str(bad_taxonomy_path),
            ],
            capture_output=True,
            text=True,
        )

        assert result.returncode == 1
        assert "Error: Invalid JSON in file:" in result.stderr
        assert bad_taxonomy_path.name in result.stderr
        assert "Traceback" not in result.stderr


def test_cli_reports_invalid_aliases_json():

    with TemporaryDirectory() as temp_folder:
        bad_aliases_path = Path(temp_folder) / "bad_aliases.json"
        bad_aliases_path.write_text("{bad json", encoding="utf-8")

        result = subprocess.run(
            [
                sys.executable,
                "src/main.py",
                "--aliases",
                str(bad_aliases_path),
            ],
            capture_output=True,
            text=True,
        )

        assert result.returncode == 1
        assert "Error: Invalid JSON in file:" in result.stderr
        assert bad_aliases_path.name in result.stderr
        assert "Traceback" not in result.stderr


def test_cli_reports_invalid_database_path():

    result = subprocess.run(
        [
            sys.executable,
            "src/main.py",
            "--database",
            "data/outputs",
        ],
        capture_output=True,
        text=True,
    )

    assert result.returncode == 1
    assert "Error: Database path must be a file, not a folder:" in result.stderr
    assert "Traceback" not in result.stderr


# This block runs the tests when we type:
# python3 tests/test_cli.py
if __name__ == "__main__":

    # Run each test function.
    test_help_command_runs()
    test_main_runs_with_custom_outputs_folder()
    test_main_runs_with_database_option()
    test_main_runs_with_pandas_summary_option()
    test_main_runs_with_database_and_pandas_summary_options()
    test_cli_reports_missing_resume_file()
    test_cli_reports_missing_jobs_folder()
    test_cli_reports_empty_jobs_folder()
    test_cli_reports_invalid_taxonomy_json()
    test_cli_reports_invalid_aliases_json()
    test_cli_reports_invalid_database_path()

    # If no assert statement failed, print this success message.
    print("All CLI tests passed.")
