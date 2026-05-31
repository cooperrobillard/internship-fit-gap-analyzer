# Import subprocess so this file can run other Python files.
# We will use it to run each test file from this one script.
import subprocess

# Import sys so we can use the same Python program that is running this file.
import sys

# Import Path so we can work with file paths.
from pathlib import Path

# Create a list of test files we want to run.
#
# Each item is a Path object pointing to one test file.
test_files = [
    Path("tests/test_core_logic.py"),
    Path("tests/test_output_writers.py"),
]


# Loop through each test file in the list.
for test_file in test_files:

    # Print which test file is about to run.
    print(f"\nRunning {test_file}...")

    # Run the test file using the current Python interpreter.
    #
    # sys.executable means:
    # "Use the same Python that is running this script."
    #
    # str(test_file) turns the Path object into a string path.
    result = subprocess.run([sys.executable, str(test_file)])

    # Check whether the test file failed.
    #
    # returncode is 0 when the command worked.
    # returncode is not 0 when something went wrong.
    if result.returncode != 0:

        # Print a clear failure message.
        print(f"\nTest failed: {test_file}")

        # Stop this script with the same failure code.
        sys.exit(result.returncode)


# If the loop finishes, all test files passed.
print("\nAll tests passed.")
