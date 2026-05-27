from pathlib import Path

source_resume_path = Path(
    "/Users/cooperrobillard/Downloads/Cooper_Robillard_Resume_plain.txt"
)
project_resume_path = Path("data/resume/resume.txt")

with open(source_resume_path, "r", encoding="utf-8") as file:
    resume_text = file.read()

with open(project_resume_path, "w", encoding="utf-8") as file:
    file.write(resume_text)

print("Updated data/resume/resume.txt")
