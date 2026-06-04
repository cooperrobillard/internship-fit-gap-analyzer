# Import Path from the pathlib module.
# Path helps us work with file and folder locations.
from pathlib import Path

# Import argparse so the user can pass options in the terminal.
import argparse

# Import sys so we can exit with a clear error code when CLI input is invalid.
import sys

# Import the reusable analysis workflow for CLI and future UI code.
from analysis_runner import run_analysis, validate_inputs

# Import our terminal summary function from src/console_summary.py.
from console_summary import print_run_summary

# Default file and folder paths.
#
# These are used when the user does not provide custom paths in the terminal.
DEFAULT_RESUME_PATH = Path("data/resume/sample_resume.txt")
DEFAULT_SKILLS_TAXONOMY_PATH = Path("data/skills_taxonomy.json")
DEFAULT_SKILL_ALIASES_PATH = Path("data/skill_aliases.json")
DEFAULT_JOBS_FOLDER = Path("data/sample_jobs")
DEFAULT_OUTPUTS_FOLDER = Path("data/outputs")


# Define a function that reads command-line options.
#
# This lets the user customize paths or settings without editing the code.
def parse_args():

    # Create the argument parser.
    #
    # The description shows up when the user runs:
    # python3 src/main.py --help
    parser = argparse.ArgumentParser(
        description="Analyze internship job descriptions against a resume."
    )

    # Optional resume path.
    parser.add_argument(
        "--resume",
        default=str(DEFAULT_RESUME_PATH),
        help="Path to the resume text file.",
    )

    # Optional jobs folder path.
    parser.add_argument(
        "--jobs",
        default=str(DEFAULT_JOBS_FOLDER),
        help="Path to the folder containing job description .txt files.",
    )

    # Optional skills taxonomy path.
    parser.add_argument(
        "--taxonomy",
        default=str(DEFAULT_SKILLS_TAXONOMY_PATH),
        help="Path to the skills taxonomy JSON file.",
    )

    # Optional skill aliases path.
    parser.add_argument(
        "--aliases",
        default=str(DEFAULT_SKILL_ALIASES_PATH),
        help="Path to the skill aliases JSON file.",
    )

    # Optional outputs folder path.
    parser.add_argument(
        "--outputs",
        default=str(DEFAULT_OUTPUTS_FOLDER),
        help="Path to the folder where output files should be saved.",
    )

    # Optional number of top recurring gaps to print in the terminal.
    parser.add_argument(
        "--top-gaps",
        type=int,
        default=5,
        help="Number of top recurring gaps to show in the terminal summary.",
    )

    # Optional database file path.
    parser.add_argument(
        "--database",
        default=None,
        help="Optional path to a SQLite database file where analysis results should be saved.",
    )

    # Optional pandas summary output files.
    parser.add_argument(
        "--pandas-summary",
        action="store_true",
        help="Create extra pandas-generated summary CSV files.",
    )

    # Return the user's command-line choices.
    return parser.parse_args()


# Define the main workflow for the program.
#
# This function reads CLI options, runs the shared analysis workflow,
# and prints the terminal summary.
def main():

    # Read command-line options.
    args = parse_args()

    # Run the shared analysis workflow.
    results = run_analysis(
        resume_path=args.resume,
        jobs_folder=args.jobs,
        taxonomy_path=args.taxonomy,
        aliases_path=args.aliases,
        outputs_folder=args.outputs,
        database_path=args.database,
        pandas_summary=args.pandas_summary,
    )

    # Print a clean summary of the run in the terminal.
    print_run_summary(
        results["job_results"],
        results["recurring_gaps"],
        results["output_paths"],
        max_gaps=args.top_gaps,
    )


# This checks whether this file is being run directly.
#
# When we type:
# python3 src/main.py
#
# Python runs main().
if __name__ == "__main__":

    # Run the main workflow and show clear messages for common input mistakes.
    try:
        main()

    # Missing files, folders, or job description files.
    except FileNotFoundError as error:
        print(f"Error: {error}", file=sys.stderr)
        sys.exit(1)

    # A path that should be a folder but is not.
    except NotADirectoryError as error:
        print(f"Error: {error}", file=sys.stderr)
        sys.exit(1)

    # Invalid JSON files or database paths.
    except ValueError as error:
        print(f"Error: {error}", file=sys.stderr)
        sys.exit(1)
