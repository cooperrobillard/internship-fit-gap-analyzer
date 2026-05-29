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

# Import our CSV-writing function from src/csv_writer.py.
from csv_writer import write_gap_csv

# Create a Path object that points to the resume text file.
resume_path = Path("data/resume/resume.txt")

# Read the resume file and store the full text in resume_text.
resume_text = resume_path.read_text(encoding="utf-8")


# Create a Path object that points to the skills taxonomy JSON file.
skills_taxonomy_path = Path("data/skills_taxonomy.json")

# Read the taxonomy file as plain text.
taxonomy_text = skills_taxonomy_path.read_text(encoding="utf-8")

# Convert the JSON text into a Python dictionary.
taxonomy = json.loads(taxonomy_text)


# Find skills from the taxonomy that appear in the resume.
resume_skills = find_skills(resume_text, taxonomy)


# Create a Path object that points to the folder with job descriptions.
job_folder = Path("data/jobs")

# Find every .txt file inside the jobs folder.
job_files = job_folder.glob("*.txt")


# Create an empty list to store the analysis results for all job files.
job_results = []


# Loop through each job description file.
for job_file in job_files:

    # Read the current job description file.
    job_text = job_file.read_text(encoding="utf-8")

    # Find taxonomy skills that appear in this job description.
    job_skills = find_skills(job_text, taxonomy)

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


# Create a Path object for where the markdown report should be saved.
report_output_path = Path("data/outputs/gap_report.md")

# Write the markdown gap report.
write_gap_report(report_output_path, resume_skills, job_results)


# Create a Path object for where the CSV summary should be saved.
csv_output_path = Path("data/outputs/gap_summary.csv")

# Write the CSV gap summary.
write_gap_csv(csv_output_path, job_results)


# Print simple success messages in the terminal.
print(f"Gap report written to {report_output_path}")
print(f"Gap CSV written to {csv_output_path}")
