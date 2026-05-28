from pathlib import Path
import json

resume_path = Path("data/resume/resume.txt")
resume_text = resume_path.read_text(encoding="utf-8")

print("Resume preview:")
print(resume_text[:500])

skills_taxonomy_path = Path("data/skills_taxonomy.json")
taxonomy_text = skills_taxonomy_path.read_text(encoding="utf-8")
taxonomy = json.loads(taxonomy_text)

print("Skills taxonomy:")
print(taxonomy)

job_folder = Path("data/jobs")
job_files = job_folder.glob("*.txt")

for job_file in job_files:
    job_text = job_file.read_text(encoding="utf-8")

    print(f"Job description preview for {job_file.name}:")
    print(job_text[:300])
