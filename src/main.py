# Import Path from the pathlib module.
# Path helps us work with file and folder locations.
from pathlib import Path

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

# Store important file/folder paths in variables near the top.
# This makes them easier to find and change later.
RESUME_PATH = Path("data/resume/resume.txt")
SKILLS_TAXONOMY_PATH = Path("data/skills_taxonomy.json")
SKILL_ALIASES_PATH = Path("data/skill_aliases.json")
JOBS_FOLDER = Path("data/jobs")

GAP_REPORT_OUTPUT_PATH = Path("data/outputs/gap_report.md")
GAP_CSV_OUTPUT_PATH = Path("data/outputs/gap_summary.csv")
RECURRING_GAPS_CSV_OUTPUT_PATH = Path("data/outputs/recurring_gaps.csv")


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
# load inputs -> analyze jobs -> write outputs.
def main():

    # Load the resume text.
    resume_text = load_text_file(RESUME_PATH)

    # Load the skills taxonomy dictionary.
    taxonomy = load_json_file(SKILLS_TAXONOMY_PATH)

    # Load the skill aliases dictionary.
    aliases = load_json_file(SKILL_ALIASES_PATH)

    # Find skills from the taxonomy that appear in the resume.
    resume_skills = find_skills(resume_text, taxonomy, aliases)

    # Analyze all job descriptions.
    job_results = analyze_jobs(JOBS_FOLDER, resume_skills, taxonomy, aliases)

    # Count which skill gaps appear most often across all jobs.
    recurring_gaps = count_recurring_gaps(job_results)

    # Write the markdown gap report.
    write_gap_report(GAP_REPORT_OUTPUT_PATH, resume_skills, job_results, recurring_gaps)

    # Write the detailed gap CSV summary.
    write_gap_csv(GAP_CSV_OUTPUT_PATH, job_results)

    # Write the recurring gaps CSV summary.
    write_recurring_gap_csv(RECURRING_GAPS_CSV_OUTPUT_PATH, recurring_gaps)

    # Print simple success messages in the terminal.
    print(f"Gap report written to {GAP_REPORT_OUTPUT_PATH}")
    print(f"Gap CSV written to {GAP_CSV_OUTPUT_PATH}")
    print(f"Recurring gaps CSV written to {RECURRING_GAPS_CSV_OUTPUT_PATH}")


# This checks whether this file is being run directly.
#
# When we type:
# python3 src/main.py
#
# Python runs main().
if __name__ == "__main__":
    main()
