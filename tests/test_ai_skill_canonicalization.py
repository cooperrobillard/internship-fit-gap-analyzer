# Tests for api/ai_skill_canonicalization.py
import sys
from pathlib import Path

repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

import api.ai_analysis_service as ai_module
from api.ai_skill_canonicalization import (
    canonicalize_ai_skill_category,
    canonicalize_ai_skill_name,
    canonicalize_skill_name_list,
)
from api.ai_analysis_service import run_profile_extraction, run_smart_analysis

SYNTHETIC_RESUME = "Alex Example with Python, C Sharp, and REST API experience."
SYNTHETIC_JOB = "Requirements: JavaScript, TypeScript, PowerShell scripting, SQL."


def test_ai_assisted_development_variants():
    assert canonicalize_ai_skill_name("AI-assisted development tools") == "AI-assisted development"
    assert (
        canonicalize_ai_skill_name("AI tools for development productivity")
        == "AI-assisted development"
    )
    assert canonicalize_ai_skill_name("LLM-assisted coding") == "AI-assisted development"
    assert canonicalize_ai_skill_name("coding with AI tools") == "AI-assisted development"


def test_ai_assisted_development_category_is_stable():
    assert (
        canonicalize_ai_skill_category(
            "AI-assisted development",
            "Development workflow / AI tools",
        )
        == "AI tools"
    )


def test_openai_api_remains_distinct():
    assert canonicalize_ai_skill_name("OpenAI API") == "OpenAI API"
    assert canonicalize_ai_skill_name("OpenAI APIs") == "OpenAI API"
    assert canonicalize_ai_skill_name("OpenAI platform API") == "OpenAI API"


def test_large_language_models_remain_distinct_from_ai_dev():
    assert canonicalize_ai_skill_name("Large language models") == "Large language models"
    assert canonicalize_ai_skill_name("LLM") == "Large language models"
    assert canonicalize_ai_skill_name("AI-assisted development") == "AI-assisted development"


def test_machine_learning_and_computer_vision_remain_distinct():
    assert canonicalize_ai_skill_name("Machine learning") == "Machine learning"
    assert canonicalize_ai_skill_name("Computer vision") == "Computer vision"
    assert canonicalize_ai_skill_name("visual perception") == "Computer vision"
    assert canonicalize_ai_skill_name("AI-assisted development tools") == "AI-assisted development"


def test_cplusplus_variants():
    assert canonicalize_ai_skill_name("C plus plus") == "C++"
    assert canonicalize_ai_skill_name("C++ programming") == "C++"
    assert canonicalize_ai_skill_name("C++") == "C++"


def test_restful_api_variants():
    assert canonicalize_ai_skill_name("RESTful API") == "REST APIs"
    assert canonicalize_ai_skill_name("RESTful APIs") == "REST APIs"


def test_cicd_variants():
    assert canonicalize_ai_skill_name("continuous integration") == "CI/CD"
    assert canonicalize_ai_skill_name("continuous deployment") == "CI/CD"


def test_embedded_systems_variants():
    assert canonicalize_ai_skill_name("embedded system") == "Embedded systems"
    assert canonicalize_ai_skill_name("embedded software systems") == "Embedded systems"


def test_firmware_testing_variants():
    assert canonicalize_ai_skill_name("firmware test") == "Firmware testing"
    assert canonicalize_ai_skill_name("firmware validation") == "Firmware testing"


def test_data_structures_and_algorithms_variants():
    assert (
        canonicalize_ai_skill_name("data structures & algorithms")
        == "Data structures and algorithms"
    )
    assert (
        canonicalize_ai_skill_name("algorithms and data structures")
        == "Data structures and algorithms"
    )


def test_csharp_variants():
    assert canonicalize_ai_skill_name("C Sharp") == "C#"
    assert canonicalize_ai_skill_name("c-sharp") == "C#"
    assert canonicalize_ai_skill_name("c#") == "C#"


def test_javascript_variants():
    assert canonicalize_ai_skill_name("JS") == "JavaScript"
    assert canonicalize_ai_skill_name("javascript") == "JavaScript"


def test_typescript_variants():
    assert canonicalize_ai_skill_name("TS") == "TypeScript"
    assert canonicalize_ai_skill_name("typescript") == "TypeScript"


def test_rest_api_variants():
    assert canonicalize_ai_skill_name("REST API") == "REST APIs"
    assert canonicalize_ai_skill_name("REST APIs") == "REST APIs"


def test_powershell_variants():
    assert canonicalize_ai_skill_name("Windows PowerShell") == "PowerShell"
    assert canonicalize_ai_skill_name("powershell scripting") == "PowerShell"


def test_sql_variants():
    assert canonicalize_ai_skill_name("structured query language") == "SQL"
    assert canonicalize_ai_skill_name("sql") == "SQL"


def test_machine_learning_variants():
    assert canonicalize_ai_skill_name("ML") == "Machine learning"
    assert canonicalize_ai_skill_name("machine-learning") == "Machine learning"


def test_llm_variants():
    assert canonicalize_ai_skill_name("LLM") == "Large language models"
    assert canonicalize_ai_skill_name("large language model") == "Large language models"


def test_cfd_variants():
    assert canonicalize_ai_skill_name("computational fluid dynamics") == "CFD"
    assert canonicalize_ai_skill_name("CFD") == "CFD"


def test_cad_variants():
    assert canonicalize_ai_skill_name("computer-aided design") == "CAD"
    assert canonicalize_ai_skill_name("CAD") == "CAD"


def test_distinct_skills_remain_distinct():
    assert canonicalize_ai_skill_name("Python") == "Python"
    assert canonicalize_ai_skill_name("MATLAB") == "MATLAB"
    assert canonicalize_ai_skill_name("React") == "React"
    assert canonicalize_ai_skill_name("Next.js") == "Next.js"
    assert canonicalize_ai_skill_name("Git") == "Git"
    assert canonicalize_ai_skill_name("GitHub") == "GitHub"
    assert canonicalize_ai_skill_name("Cybersecurity") == "Cybersecurity"
    assert canonicalize_ai_skill_name("Networking") == "Networking"
    assert canonicalize_ai_skill_name("Machine learning") == "Machine learning"
    assert canonicalize_ai_skill_name("Statistics") == "Statistics"
    assert canonicalize_ai_skill_name("PowerShell") == "PowerShell"


def test_prefix_wrappers_are_stripped():
    assert canonicalize_ai_skill_name("experience with JavaScript") == "JavaScript"
    assert canonicalize_ai_skill_name("knowledge of SQL") == "SQL"


def test_canonicalize_skill_name_list_dedupes_variants():
    assert canonicalize_skill_name_list(["js", "JavaScript", "TS", "TypeScript"]) == [
        "JavaScript",
        "TypeScript",
    ]


class MockUsage:
    input_tokens = 10
    output_tokens = 10
    total_tokens = 20


class MockOpenAiResponse:
    def __init__(self, payload: dict) -> None:
        import json

        self.output_text = json.dumps(payload)
        self.usage = MockUsage()
        self.model = "gpt-5.4-mini"
        self.output = []


class MockOpenAiClient:
    def create(self, **kwargs):
        return MockOpenAiResponse(self.payload)

    def __init__(self, payload: dict) -> None:
        self.payload = payload


def _enabled_config():
    return ai_module.AiRuntimeConfig(
        enabled=True,
        api_key="test-openai-key",
        model="gpt-5.4-mini",
        timeout_seconds=30.0,
    )


def test_smart_analysis_output_is_canonicalized():
    payload = {
        "matchedSkills": [
            {"skill": "c sharp", "category": "Programming", "evidence": "Listed"},
            {"skill": "js", "category": "Programming", "evidence": "Listed"},
            {
                "skill": "AI-assisted development tools",
                "category": "Development workflow / AI tools",
                "evidence": "Listed",
            },
        ],
        "missingSkills": [
            {"skill": "rest api", "category": "Backend", "evidence": "Required"},
        ],
        "transferableSkills": [],
        "resumeSkills": [],
        "jobSkills": [],
        "ignoredBoilerplate": [],
        "summary": "Partial fit.",
        "limitations": [],
    }
    result = run_smart_analysis(
        resume_text=SYNTHETIC_RESUME,
        job_text=SYNTHETIC_JOB,
        client=MockOpenAiClient(payload),
        config=_enabled_config(),
    )
    matched_names = {item.skill for item in result.matchedSkills}
    missing_names = {item.skill for item in result.missingSkills}
    assert matched_names == {"C#", "JavaScript", "AI-assisted development"}
    assert missing_names == {"REST APIs"}
    assert result.matchedSkills[0].evidence == "Listed"
    ai_dev = next(
        item for item in result.matchedSkills if item.skill == "AI-assisted development"
    )
    assert ai_dev.category == "AI tools"


def test_profile_extraction_output_is_canonicalized():
    payload = {
        "candidateName": "Alex Example",
        "skills": ["ts", "TypeScript", "windows powershell", "ML"],
        "summary": "Engineering student.",
    }
    result = run_profile_extraction(
        resume_text=SYNTHETIC_RESUME,
        client=MockOpenAiClient(payload),
        config=_enabled_config(),
    )
    assert result.skills == ["TypeScript", "PowerShell", "Machine learning"]


if __name__ == "__main__":
    test_csharp_variants()
    test_ai_assisted_development_variants()
    test_ai_assisted_development_category_is_stable()
    test_openai_api_remains_distinct()
    test_large_language_models_remain_distinct_from_ai_dev()
    test_machine_learning_and_computer_vision_remain_distinct()
    test_cplusplus_variants()
    test_restful_api_variants()
    test_cicd_variants()
    test_embedded_systems_variants()
    test_firmware_testing_variants()
    test_data_structures_and_algorithms_variants()
    test_javascript_variants()
    test_typescript_variants()
    test_rest_api_variants()
    test_powershell_variants()
    test_sql_variants()
    test_machine_learning_variants()
    test_llm_variants()
    test_cfd_variants()
    test_cad_variants()
    test_distinct_skills_remain_distinct()
    test_prefix_wrappers_are_stripped()
    test_canonicalize_skill_name_list_dedupes_variants()
    test_smart_analysis_output_is_canonicalized()
    test_profile_extraction_output_is_canonicalized()
    print("All AI skill canonicalization tests passed.")
