# Import Path from the pathlib module.
# Path helps us work with file and folder locations.
from pathlib import Path

# Import argparse so the user can pass options in the terminal.
import argparse

# Import Python's built-in json module.
# This lets us convert JSON text into Python dictionaries/lists.
import json

# Import our skill-finding function from src/extract_keywords.py.
from extract_keywords import find_skills

# Import our gap-finding function from src/compare_resume.py.
from compare_resume import find_gaps

# Import our markdown report-writing function from src/report_writer.py.
from report_writer import write_gap_report

# Import our CSV-writing functions from src/csv_writer.py.
from csv_writer import write_gap_csv, write_recurring_gap_csv

# Import our recurring gap counting function from src/summarize_gaps.py.
from summarize_gaps import count_recurring_gaps

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

    # Return the user's command-line choices.
    return parser.parse_args()


# Check that the project has the required input files and folders.
#
# These paths are passed in so the function works with either:
# - the default paths
# - custom paths from command-line arguments
def validate_inputs(resume_path, taxonomy_path, aliases_path, jobs_folder):

    # Create a list of files that must exist for the project to run.
    required_files = [
        resume_path,
        taxonomy_path,
        aliases_path,
    ]

    # Loop through each required file path.
    for file_path in required_files:

        # Check whether this file path actually exists.
        if not file_path.exists():

            # Stop the program with a clear error message.
            raise FileNotFoundError(f"Missing required file: {file_path}")

    # Check whether the jobs folder exists.
    if not jobs_folder.exists():

        # Stop the program if the jobs folder is missing.
        raise FileNotFoundError(f"Missing jobs folder: {jobs_folder}")

    # Check whether the jobs path is actually a folder.
    if not jobs_folder.is_dir():

        # Stop the program if the jobs path exists but is not a folder.
        raise NotADirectoryError(
            f"Expected a folder but found something else: {jobs_folder}"
        )

    # Find all .txt job files.
    job_files = list(jobs_folder.glob("*.txt"))

    # Check whether there is at least one job description file.
    if not job_files:

        # Stop the program if the jobs folder has no .txt files.
        raise FileNotFoundError(
            f"No .txt job description files found in: {jobs_folder}"
        )


# Define a helper function for reading text files.
#
# Input:
# file_path: the location of a text file
#
# Output:
# the text inside that file
def load_text_file(file_path):

    # Read the file and return its text.
    return file_path.read_text(encoding="utf-8")


# Define a helper function for reading JSON files.
#
# Input:
# file_path: the location of a JSON file
#
# Output:
# a Python dictionary or list created from the JSON text
def load_json_file(file_path):

    # Read the JSON file as plain text.
    json_text = file_path.read_text(encoding="utf-8")

    # Convert the JSON text into Python data and return it.
    return json.loads(json_text)


# Define a helper function that analyzes all job description files.
#
# Inputs:
# job_folder: the folder where job .txt files are stored
# resume_skills: the skills found in the resume
# taxonomy: the skills taxonomy dictionary
# aliases: the skill aliases dictionary
#
# Output:
# a list of job result dictionaries
def analyze_jobs(job_folder, resume_skills, taxonomy, aliases):

    # Create an empty list to store the analysis results for all jobs.
    job_results = []

    # Find every .txt file inside the jobs folder.
    job_files = job_folder.glob("*.txt")

    # Loop through each job description file.
    for job_file in job_files:

        # Read the current job description file.
        job_text = load_text_file(job_file)

        # Find taxonomy skills that appear in this job description.
        job_skills = find_skills(job_text, taxonomy, aliases)

        # Compare this job's skills against the resume skills.
        skill_gaps = find_gaps(job_skills, resume_skills)

        # Store this job's results in a dictionary.
        job_result = {
            "job_name": job_file.name,
            "job_skills": job_skills,
            "skill_gaps": skill_gaps,
        }

        # Add this job's result dictionary to the full job_results list.
        job_results.append(job_result)

    # Return all job analysis results.
    return job_results


# Define the main workflow for the program.
#
# This function controls the full project flow:
# command-line options -> load inputs -> analyze jobs -> write outputs.
def main():

    # Read command-line options.
    args = parse_args()

    # Convert command-line path strings into Path objects.
    resume_path = Path(args.resume)
    jobs_folder = Path(args.jobs)
    taxonomy_path = Path(args.taxonomy)
    aliases_path = Path(args.aliases)
    outputs_folder = Path(args.outputs)

    # Build output file paths using the selected outputs folder.
    gap_report_output_path = outputs_folder / "gap_report.md"
    gap_csv_output_path = outputs_folder / "gap_summary.csv"
    recurring_gaps_csv_output_path = outputs_folder / "recurring_gaps.csv"

    # Check that required files and folders exist before running the analysis.
    validate_inputs(resume_path, taxonomy_path, aliases_path, jobs_folder)

    # Load the resume text.
    resume_text = load_text_file(resume_path)

    # Load the skills taxonomy dictionary.
    taxonomy = load_json_file(taxonomy_path)

    # Load the skill aliases dictionary.
    aliases = load_json_file(aliases_path)

    # Find skills from the taxonomy that appear in the resume.
    resume_skills = find_skills(resume_text, taxonomy, aliases)

    # Analyze all job descriptions.
    job_results = analyze_jobs(jobs_folder, resume_skills, taxonomy, aliases)

    # Count which skill gaps appear most often across all jobs.
    recurring_gaps = count_recurring_gaps(job_results)

    # Write the markdown gap report.
    write_gap_report(gap_report_output_path, resume_skills, job_results, recurring_gaps)

    # Write the detailed gap CSV summary.
    write_gap_csv(gap_csv_output_path, job_results)

    # Write the recurring gaps CSV summary.
    write_recurring_gap_csv(recurring_gaps_csv_output_path, recurring_gaps)

    # Store the output file paths in a list.
    output_paths = [
        gap_report_output_path,
        gap_csv_output_path,
        recurring_gaps_csv_output_path,
    ]

    # Print a clean summary of the run in the terminal.
    print_run_summary(
        job_results,
        recurring_gaps,
        output_paths,
        max_gaps=args.top_gaps,
    )


# This checks whether this file is being run directly.
#
# When we type:
# python3 src/main.py
#
# Python runs main().
if __name__ == "__main__":
    main()
