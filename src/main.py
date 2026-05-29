# Import Path from the pathlib module.
# Path helps us work with file and folder locations in a cleaner way.
from pathlib import Path

# Import Python's built-in json module.
# This lets us convert JSON text into Python dictionaries/lists.
import json

# Import the find_skills function from our own file: src/extract_keywords.py
# This lets main.py use the skill-matching logic we wrote in another file.
from extract_keywords import find_skills

# Create a Path object that points to the resume text file.
# This does not read the file yet. It only stores the file location.
resume_path = Path("data/resume/resume.txt")

# Read the resume file and save all of its text into the variable resume_text.
# encoding="utf-8" tells Python how to decode the text file into readable characters.
resume_text = resume_path.read_text(encoding="utf-8")


# Create a Path object that points to the skills taxonomy JSON file.
# The taxonomy file contains skill categories and lists of skills.
skills_taxonomy_path = Path("data/skills_taxonomy.json")

# Read the JSON file as plain text.
# At this point, taxonomy_text is still just a string.
taxonomy_text = skills_taxonomy_path.read_text(encoding="utf-8")

# Convert the JSON string into a real Python dictionary.
# After this line, taxonomy can be used like a normal dictionary.
taxonomy = json.loads(taxonomy_text)


# Print a label so the terminal output is easier to understand.
print("Resume preview:")

# Print only the first 500 characters of the resume.
# The [:500] is string slicing: it means "from the start up to character 500."
print(resume_text[:500])


# Print a blank line, then a label for the taxonomy output.
# \n means "new line."
print("\nSkills taxonomy:")

# Print the full taxonomy dictionary.
# This helps us confirm that the JSON file loaded correctly.
print(taxonomy)


# Call the find_skills function using the resume text and taxonomy.
# The function searches the resume for skills listed in the taxonomy.
# The returned dictionary gets stored in resume_skills.
resume_skills = find_skills(resume_text, taxonomy)


# Print a blank line and label before showing resume skill matches.
print("\nSkills found in resume:")

# Print the dictionary of skills found in the resume.
print(resume_skills)


# Create a Path object that points to the folder containing job descriptions.
job_folder = Path("data/jobs")

# Find every .txt file inside the jobs folder.
# "*.txt" means "any file name ending in .txt."
# job_files is something we can loop through.
job_files = job_folder.glob("*.txt")


# Loop through each job description file found in the jobs folder.
# Each time the loop runs, job_file represents one specific .txt file.
for job_file in job_files:

    # Read the current job description file and save its text.
    job_text = job_file.read_text(encoding="utf-8")

    # Use find_skills to search this job description for taxonomy skills.
    # The returned dictionary gets stored in job_skills.
    job_skills = find_skills(job_text, taxonomy)

    # Print a blank line and a label showing which job file is being previewed.
    # job_file.name gives only the file name, not the full path.
    print(f"\nJob description preview for {job_file.name}:")

    # Print only the first 300 characters of the job description.
    # This keeps the terminal from getting too messy.
    print(job_text[:300])

    # Print a blank line and a label showing which job file's skills were found.
    print(f"\nSkills found in {job_file.name}:")

    # Print the dictionary of skills found in this job description.
    print(job_skills)
