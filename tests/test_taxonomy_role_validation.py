"""Evidence-based cross-domain validation for the skill taxonomy."""
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from src.compare_resume import find_gaps
from src.extract_keywords import find_skills, phrase_appears_in_text

TAXONOMY_PATH = REPO_ROOT / "data" / "skills_taxonomy.json"
ALIASES_PATH = REPO_ROOT / "data" / "skill_aliases.json"
CASES_PATH = REPO_ROOT / "data" / "taxonomy_validation_cases.json"


def load_taxonomy_and_aliases():
    return json.loads(TAXONOMY_PATH.read_text()), json.loads(ALIASES_PATH.read_text())


def load_cases():
    return json.loads(CASES_PATH.read_text())


def flatten_expected(items):
    by_category = {}
    for item in items:
        by_category.setdefault(item["category"], []).append(item["skill"])
    return {category: sorted(skills) for category, skills in by_category.items()}


def compact_found(found):
    return {category: sorted(skills) for category, skills in found.items() if skills}


def skill_to_category(taxonomy):
    return {skill: category for category, skills in taxonomy.items() for skill in skills}


def expected_matched(case):
    resume = flatten_expected(case["expected_resume_skills"])
    job = flatten_expected(case["expected_job_skills"])
    return {
        category: sorted(set(skills).intersection(resume.get(category, [])))
        for category, skills in job.items()
        if set(skills).intersection(resume.get(category, []))
    }


def expected_missing(case):
    resume = flatten_expected(case["expected_resume_skills"])
    job = flatten_expected(case["expected_job_skills"])
    return {
        category: sorted(skill for skill in skills if skill not in set(resume.get(category, [])))
        for category, skills in job.items()
        if any(skill not in set(resume.get(category, [])) for skill in skills)
    }


def test_fixture_structure():
    cases = load_cases()
    assert sorted(cases) == ["negative_controls", "role_cases"]
    for case in cases["role_cases"]:
        assert set(case) == {"id", "domain", "resume_text", "job_text", "expected_resume_skills", "expected_job_skills"}
        assert re.fullmatch(r"[a-z0-9]+(?:_[a-z0-9]+)*", case["id"])
        assert case["domain"] and case["resume_text"] and case["job_text"]
    for control in cases["negative_controls"]:
        assert set(control) == {"id", "text", "forbidden_skills"}
        assert re.fullmatch(r"[a-z0-9]+(?:_[a-z0-9]+)*", control["id"])
        assert control["text"] and control["forbidden_skills"]


def test_unique_ids_and_minimum_case_counts():
    cases = load_cases()
    role_ids = [case["id"] for case in cases["role_cases"]]
    negative_ids = [case["id"] for case in cases["negative_controls"]]
    assert len(role_ids) == len(set(role_ids))
    assert len(negative_ids) == len(set(negative_ids))
    assert len(cases["role_cases"]) >= 21
    assert len(cases["negative_controls"]) >= 15


def test_expected_skills_exist_and_categories_are_correct():
    taxonomy, _ = load_taxonomy_and_aliases()
    categories = skill_to_category(taxonomy)
    for case in load_cases()["role_cases"]:
        for item in case["expected_resume_skills"] + case["expected_job_skills"]:
            assert item["skill"] in categories, (case["id"], item)
            assert categories[item["skill"]] == item["category"], (case["id"], item, categories[item["skill"]])
    for control in load_cases()["negative_controls"]:
        for item in control["forbidden_skills"]:
            assert item["skill"] in categories, (control["id"], item)
            assert categories[item["skill"]] == item["category"], (control["id"], item)


def test_role_expected_coverage_and_all_categories_exercised():
    taxonomy, _ = load_taxonomy_and_aliases()
    exercised = set()
    for case in load_cases()["role_cases"]:
        resume = {item["skill"] for item in case["expected_resume_skills"]}
        job = {item["skill"] for item in case["expected_job_skills"]}
        assert len(case["expected_job_skills"]) >= 3, case["id"]
        assert resume.intersection(job), case["id"]
        assert job - resume, case["id"]
        exercised.update(item["category"] for item in case["expected_resume_skills"] + case["expected_job_skills"])
    assert exercised == set(taxonomy)


def test_at_least_30_expectations_are_alias_driven():
    _, aliases = load_taxonomy_and_aliases()
    alias_driven = []
    for case in load_cases()["role_cases"]:
        for field, text_field in (("expected_resume_skills", "resume_text"), ("expected_job_skills", "job_text")):
            text = case[text_field].lower()
            for item in case[field]:
                skill = item["skill"]
                if skill in aliases and not phrase_appears_in_text(skill, text):
                    if any(phrase_appears_in_text(alias, text) for alias in aliases[skill]):
                        alias_driven.append((case["id"], skill))
    assert len(alias_driven) >= 30


def test_exact_resume_extraction():
    taxonomy, aliases = load_taxonomy_and_aliases()
    for case in load_cases()["role_cases"]:
        assert compact_found(find_skills(case["resume_text"], taxonomy, aliases)) == flatten_expected(case["expected_resume_skills"]), case["id"]


def test_exact_job_extraction():
    taxonomy, aliases = load_taxonomy_and_aliases()
    for case in load_cases()["role_cases"]:
        assert compact_found(find_skills(case["job_text"], taxonomy, aliases)) == flatten_expected(case["expected_job_skills"]), case["id"]


def test_exact_end_to_end_matched_and_missing_results_are_disjoint():
    taxonomy, aliases = load_taxonomy_and_aliases()
    for case in load_cases()["role_cases"]:
        resume = find_skills(case["resume_text"], taxonomy, aliases)
        job = find_skills(case["job_text"], taxonomy, aliases)
        missing = find_gaps(job, resume)
        matched = {
            category: sorted(skill for skill in skills if skill not in set(missing.get(category, [])))
            for category, skills in job.items()
            if any(skill not in set(missing.get(category, [])) for skill in skills)
        }
        compact_missing = compact_found(missing)
        assert matched == expected_matched(case), case["id"]
        assert compact_missing == expected_missing(case), case["id"]
        for category, skills in matched.items():
            assert set(skills).isdisjoint(compact_missing.get(category, [])), case["id"]


def test_negative_control_forbidden_skill_absence():
    taxonomy, aliases = load_taxonomy_and_aliases()
    for control in load_cases()["negative_controls"]:
        found = find_skills(control["text"], taxonomy, aliases)
        for item in control["forbidden_skills"]:
            assert item["skill"] not in found[item["category"]], (control["id"], item, found[item["category"]])


if __name__ == "__main__":
    test_fixture_structure()
    test_unique_ids_and_minimum_case_counts()
    test_expected_skills_exist_and_categories_are_correct()
    test_role_expected_coverage_and_all_categories_exercised()
    test_at_least_30_expectations_are_alias_driven()
    test_exact_resume_extraction()
    test_exact_job_extraction()
    test_exact_end_to_end_matched_and_missing_results_are_disjoint()
    test_negative_control_forbidden_skill_absence()
    print("All taxonomy role-validation tests passed.")
