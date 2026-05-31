# Import sys so we can tell Python where to find the src folder.
import sys

# Import Path so we can work with file and folder paths.
from pathlib import Path

# Import TemporaryDirectory so each test can create fake input files safely.
from tempfile import TemporaryDirectory

# Add the src folder to Python's import path.
#
# This lets this test file import functions from src/main.py.
sys.path.append(str(Path("src")))


# Import the validation function we want to test.
#
# This works because main.py only runs the full program inside:
# if __name__ == "__main__":
from main import validate_inputs


# Test that validate_inputs works when all required files and folders exist.
def test_validate_inputs_accepts_valid_inputs():

    # Create a temporary folder for this test.
    with TemporaryDirectory() as temp_folder:

        # Convert the temporary folder path into a Path object.
        temp_path = Path(temp_folder)

        # Create fake input file paths.
        resume_path = temp_path / "resume.txt"
        taxonomy_path = temp_path / "skills_taxonomy.json"
        aliases_path = temp_path / "skill_aliases.json"

        # Create a fake jobs folder path.
        jobs_folder = temp_path / "jobs"

        # Actually create the jobs folder.
        jobs_folder.mkdir()

        # Write small fake contents into the required files.
        resume_path.write_text("Python resume text", encoding="utf-8")
        taxonomy_path.write_text('{"programming": ["python"]}', encoding="utf-8")
        aliases_path.write_text("{}", encoding="utf-8")

        # Add one fake job description file.
        (jobs_folder / "job_1.txt").write_text("Python job text", encoding="utf-8")

        # Run the validation function.
        #
        # If this raises no error, the test passes.
        validate_inputs(resume_path, taxonomy_path, aliases_path, jobs_folder)


# Test that validate_inputs catches a missing required file.
def test_validate_inputs_catches_missing_resume_file():

    # Create a temporary folder for this test.
    with TemporaryDirectory() as temp_folder:

        # Convert the temporary folder path into a Path object.
        temp_path = Path(temp_folder)

        # Create fake paths.
        #
        # Notice: we will NOT create resume_path.
        resume_path = temp_path / "missing_resume.txt"
        taxonomy_path = temp_path / "skills_taxonomy.json"
        aliases_path = temp_path / "skill_aliases.json"
        jobs_folder = temp_path / "jobs"

        # Create the jobs folder.
        jobs_folder.mkdir()

        # Create the other required files.
        taxonomy_path.write_text('{"programming": ["python"]}', encoding="utf-8")
        aliases_path.write_text("{}", encoding="utf-8")
        (jobs_folder / "job_1.txt").write_text("Python job text", encoding="utf-8")

        # Try to validate the inputs.
        try:
            validate_inputs(resume_path, taxonomy_path, aliases_path, jobs_folder)

        # If FileNotFoundError happens, check the message.
        except FileNotFoundError as error:
            assert "Missing required file" in str(error)

        # If no error happens, the test should fail.
        else:
            assert False, "Expected FileNotFoundError for missing resume file"


# Test that validate_inputs catches a jobs folder with no .txt files.
def test_validate_inputs_catches_empty_jobs_folder():

    # Create a temporary folder for this test.
    with TemporaryDirectory() as temp_folder:

        # Convert the temporary folder path into a Path object.
        temp_path = Path(temp_folder)

        # Create fake input file paths.
        resume_path = temp_path / "resume.txt"
        taxonomy_path = temp_path / "skills_taxonomy.json"
        aliases_path = temp_path / "skill_aliases.json"
        jobs_folder = temp_path / "jobs"

        # Create the jobs folder, but do not put any .txt files inside it.
        jobs_folder.mkdir()

        # Create the required files.
        resume_path.write_text("Python resume text", encoding="utf-8")
        taxonomy_path.write_text('{"programming": ["python"]}', encoding="utf-8")
        aliases_path.write_text("{}", encoding="utf-8")

        # Try to validate the inputs.
        try:
            validate_inputs(resume_path, taxonomy_path, aliases_path, jobs_folder)

        # If FileNotFoundError happens, check the message.
        except FileNotFoundError as error:
            assert "No .txt job description files found" in str(error)

        # If no error happens, the test should fail.
        else:
            assert False, "Expected FileNotFoundError for empty jobs folder"


# This block runs the tests when we type:
# python3 tests/test_validation.py
if __name__ == "__main__":

    # Run each test function.
    test_validate_inputs_accepts_valid_inputs()
    test_validate_inputs_catches_missing_resume_file()
    test_validate_inputs_catches_empty_jobs_folder()

    # If no assert statement failed, print this success message.
    print("All validation tests passed.")
