"""
In-memory analysis for the FastAPI prototype.

Uses the existing rule-based analyzer in src/analysis_runner.py.
Does not write resume/job text to disk, SQLite, or report files.
"""

from __future__ import annotations

import sys
from pathlib import Path

_SRC_DIR = Path(__file__).resolve().parent.parent / "src"
if str(_SRC_DIR) not in sys.path:
    sys.path.insert(0, str(_SRC_DIR))

from analysis_runner import run_single_job_analysis

from api.models import AnalyzeMetadata, AnalyzeRequest, AnalyzeResponse, SkillItem

_DEFAULT_TAXONOMY = Path("data/skills_taxonomy.json")
_DEFAULT_ALIASES = Path("data/skill_aliases.json")


def _flatten_skills_by_category(skills_by_category: dict[str, list[str]]) -> list[SkillItem]:
    items: list[SkillItem] = []

    for category, skill_list in skills_by_category.items():
        for skill in skill_list:
            items.append(SkillItem(skill=skill, category=category))

    items.sort(key=lambda item: (item.category.lower(), item.skill.lower()))
    return items


def _build_summary(matched_count: int, missing_count: int) -> str:
    if matched_count == 0 and missing_count == 0:
        return (
            "No taxonomy skills were found in the job description. "
            "Try mentioning skills from the project taxonomy in the pasted texts."
        )

    matched_label = "skill" if matched_count == 1 else "skills"
    missing_label = "skill" if missing_count == 1 else "skills"
    return (
        f"Rule-based analysis found {matched_count} matched {matched_label} "
        f"and {missing_count} missing {missing_label}."
    )


def analyze_request(request: AnalyzeRequest) -> AnalyzeResponse:
    """
    Run the existing Python analyzer on pasted text.

    Raw resume and job text stay in memory only for this call.
    """
    job_name = request.jobTitle or "Job description"

    analysis_result = run_single_job_analysis(
        resume_text=request.resumeText,
        job_text=request.jobText,
        job_name=job_name,
        taxonomy_path=_DEFAULT_TAXONOMY,
        aliases_path=_DEFAULT_ALIASES,
    )

    job_summary = analysis_result["jobs"][0]
    matched_skills = _flatten_skills_by_category(job_summary["matched_skills"])
    missing_skills = _flatten_skills_by_category(job_summary["missing_skills"])
    matched_count = job_summary["matched_skills_count"]
    missing_count = job_summary["missing_skills_count"]

    return AnalyzeResponse(
        matchedSkills=matched_skills,
        missingSkills=missing_skills,
        matchedSkillsCount=matched_count,
        missingSkillsCount=missing_count,
        summary=_build_summary(matched_count, missing_count),
        metadata=AnalyzeMetadata(
            jobTitle=request.jobTitle,
            company=request.company,
            sourceUrl=request.sourceUrl,
            notes=request.notes,
        ),
    )
