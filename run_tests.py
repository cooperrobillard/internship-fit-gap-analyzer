# Import subprocess so this file can run other Python files.
import subprocess

# Import sys so we can use the same Python program that is running this file.
import sys

# Import Path so we can work with file paths.
from pathlib import Path

# Find the repository root from the location of this script file.
repo_root = Path(__file__).resolve().parent

# Find the tests folder inside the repository root.
tests_folder = repo_root / "tests"

# Discover every top-level test file matching tests/test_*.py.
#
# sorted() keeps the run order deterministic (alphabetical by filename).
test_files = sorted(tests_folder.glob("test_*.py"))

# Fail clearly if no test files were found.
if not test_files:
    print("No test files found matching tests/test_*.py")
    sys.exit(1)


# Loop through each test file in alphabetical order.
for test_file in test_files:

    # Print which test file is about to run.
    print(f"\nRunning {test_file.relative_to(repo_root)}...")

    # Run the test file using the current Python interpreter.
    #
    # Use the absolute path to the test file and set cwd to the repo root
    # so relative paths inside tests still work no matter where this script
    # was launched from.
    result = subprocess.run(
        [sys.executable, str(test_file)],
        cwd=repo_root,
    )

    # Check whether the test file failed.
    if result.returncode != 0:

        # Print a clear failure message.
        print(f"\nTest failed: {test_file.relative_to(repo_root)}")

        # Stop this script with the same failure code.
        sys.exit(result.returncode)


# If the loop finishes, all test files passed.
print("\nAll tests passed.")
