# Tests for api/ai_analysis_service.py — no live OpenAI calls.
import json
import os
import sys
from pathlib import Path
from unittest.mock import patch

repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

from fastapi.testclient import TestClient

import api.ai_analysis_service as ai_module
from api.ai_analysis_service import (
    AiDisabledError,
    MissingApiKeyError,
    MalformedResponseError,
    OpenAiTimeoutError,
    get_ai_runtime_config,
    run_profile_extraction,
    run_smart_analysis,
)
from api.main import app

client = TestClient(app)
TEST_SHARED_SECRET = "test-analysis-api-shared-secret"

SYNTHETIC_RESUME = """
Alex Example
Software engineering student with Python, PowerShell, Git, REST APIs, and PyTorch experience.
Built a Next.js dashboard and integrated the OpenAI API for structured outputs.
"""

SYNTHETIC_SECURITY_JOB = """
MathWorks — Security Engineering Intern

We are an equal opportunity employer. Hybrid work available. Visa sponsorship not provided.
Apply at careers.example.com/interview-process.

Requirements:
- Threat modeling and incident response
- PowerShell scripting and Sysinternals
- Python for automation
- Experience with CALDERA or similar adversary emulation
"""

MATHWORKS_AI_ANALYSIS_PAYLOAD = {
    "matchedSkills": [
        {
            "skill": "Python",
            "category": "Programming languages",
            "evidence": "Python for automation",
        },
        {
            "skill": "PowerShell",
            "category": "Technical tools",
            "evidence": "PowerShell scripting",
        },
    ],
    "missingSkills": [
        {
            "skill": "Threat modeling",
            "category": "Security methods",
            "evidence": "Listed in requirements",
        },
        {
            "skill": "CALDERA",
            "category": "Security tools",
            "evidence": "CALDERA or similar",
        },
    ],
    "transferableSkills": [],
    "resumeSkills": [
        {"skill": "Python", "category": "Programming languages", "evidence": "Listed in experience"},
        {"skill": "PowerShell", "category": "Technical tools", "evidence": "Listed in experience"},
        {"skill": "PyTorch", "category": "ML frameworks", "evidence": "Listed in experience"},
    ],
    "jobSkills": [
        {"skill": "Threat modeling", "category": "Security methods", "evidence": "Requirements"},
        {"skill": "PowerShell", "category": "Technical tools", "evidence": "Requirements"},
    ],
    "ignoredBoilerplate": [
        "Equal opportunity employer language",
        "Hybrid work availability",
        "Visa sponsorship statement",
        "Application link",
    ],
    "summary": "Partial fit for security engineering internship with strong scripting overlap.",
    "limitations": ["Smart AI may miss niche security tools."],
    "jobMetadata": {
        "jobTitle": "Security Engineering Intern",
        "company": "MathWorks",
        "sourceUrl": "",
        "notes": "Hybrid work available; visa sponsorship not provided.",
    },
}

PROFILE_EXTRACTION_PAYLOAD = {
    "candidateName": "Alex Example",
    "skills": ["Python", "PowerShell", "Git", "REST APIs", "Next.js", "PyTorch", "OpenAI API"],
    "summary": "Software engineering student with scripting and ML project experience.",
}


class MockUsage:
    input_tokens = 120
    output_tokens = 80
    total_tokens = 200


class MockOpenAiResponse:
    def __init__(self, payload: dict, model: str = "gpt-5.4-mini") -> None:
        self.output_text = json.dumps(payload)
        self.usage = MockUsage()
        self.model = model
        self.output = []


class MockOpenAiClient:
    def __init__(self, payload: dict) -> None:
        self.payload = payload
        self.last_kwargs = None

    def create(self, **kwargs):
        self.last_kwargs = kwargs
        return MockOpenAiResponse(self.payload)


class MockOpenAiSdkClient:
    """Mimics openai.OpenAI client shape: client.responses.create(...)."""

    def __init__(self, payload: dict) -> None:
        self.responses = MockOpenAiClient(payload)


class TimeoutMockClient:
    def create(self, **kwargs):
        raise TimeoutError("timed out")


class MalformedMockClient:
    def create(self, **kwargs):
        response = MockOpenAiResponse({})
        response.output_text = "not-json"
        return response


def _enabled_config():
    return ai_module.AiRuntimeConfig(
        enabled=True,
        api_key="test-openai-key",
        model="gpt-5.4-mini",
        timeout_seconds=30.0,
    )


def test_get_ai_runtime_config_defaults():
    with patch.dict(os.environ, {}, clear=True):
        config = get_ai_runtime_config()
        assert config.enabled is False
        assert config.api_key is None
        assert config.model == "gpt-5.4-mini"


def test_run_smart_analysis_parses_schema_success():
    mock_client = MockOpenAiClient(MATHWORKS_AI_ANALYSIS_PAYLOAD)
    result = run_smart_analysis(
        resume_text=SYNTHETIC_RESUME,
        job_text=SYNTHETIC_SECURITY_JOB,
        job_title="Security Engineering Intern",
        company="MathWorks",
        client=mock_client,
        config=_enabled_config(),
    )

    assert result.analysisMode == "ai_smart"
    assert result.matchedSkillsCount == 2
    assert result.missingSkillsCount == 2
    assert any(item.skill == "Python" for item in result.matchedSkills)
    assert any(item.skill == "CALDERA" for item in result.missingSkills)
    assert result.ignoredBoilerplate
    assert "equal opportunity" in result.ignoredBoilerplate[0].lower()
    assert result.usage.totalTokens == 200
    assert result.model == "gpt-5.4-mini"
    assert result.jobMetadata is not None
    assert result.jobMetadata.jobTitle == "Security Engineering Intern"
    assert result.jobMetadata.company == "MathWorks"
    assert "hybrid" in (result.jobMetadata.notes or "").lower()
    assert mock_client.last_kwargs is not None
    assert mock_client.last_kwargs.get("store") is False
    prompt = str(mock_client.last_kwargs.get("input", ""))
    assert "matchedSkills" in prompt
    assert "transferableSkills" in prompt
    assert "Do not list every résumé skill" in prompt


def test_openai_sdk_client_uses_responses_resource():
    mock_client = MockOpenAiSdkClient(MATHWORKS_AI_ANALYSIS_PAYLOAD)
    result = run_smart_analysis(
        resume_text=SYNTHETIC_RESUME,
        job_text=SYNTHETIC_SECURITY_JOB,
        client=mock_client,
        config=_enabled_config(),
    )
    assert result.analysisMode == "ai_smart"
    assert mock_client.responses.last_kwargs is not None
    assert mock_client.responses.last_kwargs.get("store") is False


def test_resume_skill_extraction_includes_explicit_skills():
    mock_client = MockOpenAiClient(MATHWORKS_AI_ANALYSIS_PAYLOAD)
    result = run_smart_analysis(
        resume_text=SYNTHETIC_RESUME,
        job_text=SYNTHETIC_SECURITY_JOB,
        client=mock_client,
        config=_enabled_config(),
    )
    resume_skill_names = {item.skill for item in result.resumeSkills}
    assert "Python" in resume_skill_names
    assert "PowerShell" in resume_skill_names
    assert "PyTorch" in resume_skill_names


def test_profile_extraction_returns_skills_without_contact_info():
    mock_client = MockOpenAiClient(PROFILE_EXTRACTION_PAYLOAD)
    result = run_profile_extraction(
        resume_text=SYNTHETIC_RESUME,
        client=mock_client,
        config=_enabled_config(),
    )
    assert result.candidateName == "Alex Example"
    assert "Python" in result.skills
    assert "@" not in result.candidateName
    assert all("@" not in skill for skill in result.skills)


def test_missing_api_key_raises_safe_error():
    config = ai_module.AiRuntimeConfig(
        enabled=True,
        api_key=None,
        model="gpt-5.4-mini",
        timeout_seconds=30.0,
    )
    try:
        run_smart_analysis(
            resume_text=SYNTHETIC_RESUME,
            job_text=SYNTHETIC_SECURITY_JOB,
            client=MockOpenAiClient(MATHWORKS_AI_ANALYSIS_PAYLOAD),
            config=config,
        )
        assert False, "expected MissingApiKeyError"
    except MissingApiKeyError:
        pass


def test_disabled_features_raise_safe_error():
    config = ai_module.AiRuntimeConfig(
        enabled=False,
        api_key="test-openai-key",
        model="gpt-5.4-mini",
        timeout_seconds=30.0,
    )
    try:
        run_smart_analysis(
            resume_text=SYNTHETIC_RESUME,
            job_text=SYNTHETIC_SECURITY_JOB,
            client=MockOpenAiClient(MATHWORKS_AI_ANALYSIS_PAYLOAD),
            config=config,
        )
        assert False, "expected AiDisabledError"
    except AiDisabledError:
        pass


def test_malformed_ai_response_raises_safe_error():
    try:
        run_smart_analysis(
            resume_text=SYNTHETIC_RESUME,
            job_text=SYNTHETIC_SECURITY_JOB,
            client=MalformedMockClient(),
            config=_enabled_config(),
        )
        assert False, "expected MalformedResponseError"
    except MalformedResponseError:
        pass


def test_openai_timeout_raises_safe_error():
    try:
        run_smart_analysis(
            resume_text=SYNTHETIC_RESUME,
            job_text=SYNTHETIC_SECURITY_JOB,
            client=TimeoutMockClient(),
            config=_enabled_config(),
        )
        assert False, "expected OpenAiTimeoutError"
    except OpenAiTimeoutError:
        pass


def test_ai_analyze_endpoint_requires_shared_secret_when_configured():
    payload = {
        "resumeText": SYNTHETIC_RESUME,
        "jobText": SYNTHETIC_SECURITY_JOB,
    }
    mock_result = run_smart_analysis(
        resume_text=SYNTHETIC_RESUME,
        job_text=SYNTHETIC_SECURITY_JOB,
        client=MockOpenAiClient(MATHWORKS_AI_ANALYSIS_PAYLOAD),
        config=_enabled_config(),
    )

    original = os.environ.get("ANALYSIS_API_SHARED_SECRET")
    os.environ["ANALYSIS_API_SHARED_SECRET"] = TEST_SHARED_SECRET
    try:
        denied = client.post("/ai/analyze", json=payload)
        assert denied.status_code == 401

        with patch("api.main.run_smart_analysis", return_value=mock_result):
            allowed = client.post(
                "/ai/analyze",
                json=payload,
                headers={"X-Analysis-Api-Key": TEST_SHARED_SECRET},
            )
            assert allowed.status_code == 200
            body = allowed.json()
            assert body["analysisMode"] == "ai_smart"
            assert "resumeText" not in body
            assert "jobText" not in body
            assert body["usage"]["totalTokens"] == 200
    finally:
        if original is None:
            os.environ.pop("ANALYSIS_API_SHARED_SECRET", None)
        else:
            os.environ["ANALYSIS_API_SHARED_SECRET"] = original


def test_ai_analyze_endpoint_maps_disabled_to_safe_http_error():
    payload = {
        "resumeText": SYNTHETIC_RESUME,
        "jobText": SYNTHETIC_SECURITY_JOB,
    }
    with patch(
        "api.main.run_smart_analysis",
        side_effect=AiDisabledError("disabled"),
    ):
        response = client.post("/ai/analyze", json=payload)
        assert response.status_code == 503
        assert "disabled" in response.json()["detail"].lower()
        assert TEST_SHARED_SECRET not in response.text


if __name__ == "__main__":
    test_get_ai_runtime_config_defaults()
    test_run_smart_analysis_parses_schema_success()
    test_openai_sdk_client_uses_responses_resource()
    test_resume_skill_extraction_includes_explicit_skills()
    test_profile_extraction_returns_skills_without_contact_info()
    test_missing_api_key_raises_safe_error()
    test_disabled_features_raise_safe_error()
    test_malformed_ai_response_raises_safe_error()
    test_openai_timeout_raises_safe_error()
    test_ai_analyze_endpoint_requires_shared_secret_when_configured()
    test_ai_analyze_endpoint_maps_disabled_to_safe_http_error()
    print("All AI analysis service tests passed.")
