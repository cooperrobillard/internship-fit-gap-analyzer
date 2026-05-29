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


# Print the skills found in the resume.
print("Skills found in resume:")
print(resume_skills)


# Create a Path object that points to the folder with job descriptions.
job_folder = Path("data/jobs")

# Find every .txt file inside the jobs folder.
job_files = job_folder.glob("*.txt")


# Loop through each job description file.
for job_file in job_files:

    # Read the current job description file.
    job_text = job_file.read_text(encoding="utf-8")

    # Find taxonomy skills that appear in this job description.
    job_skills = find_skills(job_text, taxonomy)

    # Compare this job's skills against the resume skills.
    # This finds skills in the job that are missing from the resume.
    skill_gaps = find_gaps(job_skills, resume_skills)

    # Print which job file we are analyzing.
    print(f"\nAnalyzing job file: {job_file.name}")

    # Print the skills found in this job description.
    print("\nSkills found in job:")
    print(job_skills)

    # Print the missing skills for this job.
    print("\nSkill gaps:")
    print(skill_gaps)
