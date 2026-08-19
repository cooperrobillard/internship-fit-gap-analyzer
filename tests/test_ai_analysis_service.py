# Tests for api/ai_analysis_service.py — no live OpenAI calls.
import json
import os
import sys
from pathlib import Path
from unittest.mock import patch

repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

import httpx
from fastapi.testclient import TestClient
from openai import (
    APIConnectionError,
    APITimeoutError,
    AuthenticationError,
    BadRequestError,
    InternalServerError,
    RateLimitError,
)

import api.ai_analysis_service as ai_module
from api.ai_analysis_service import (
    AiDisabledError,
    MalformedResponseError,
    MissingApiKeyError,
    OpenAiAuthOrConfigurationError,
    OpenAiBillingOrQuotaError,
    OpenAiConnectionError,
    OpenAiRateLimitError,
    OpenAiTimeoutError,
    OpenAiUnknownError,
    OpenAiUnavailableError,
    ResponseValidationError,
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


class RaisingMockClient:
    def __init__(self, error: BaseException) -> None:
        self.error = error
        self.call_count = 0

    def create(self, **kwargs):
        self.call_count += 1
        raise self.error


class RaisingOpenAiSdkClient:
    def __init__(self, error: BaseException) -> None:
        self.responses = RaisingMockClient(error)


def _status_error(error_type, status_code: int, *, code: str, error_kind: str):
    request = httpx.Request("POST", "https://api.openai.com/v1/responses")
    response = httpx.Response(status_code, request=request)
    return error_type(
        "SENSITIVE_PROVIDER_DETAIL_DO_NOT_EXPOSE",
        response=response,
        body={"code": code, "type": error_kind},
    )


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


def test_openai_sdk_client_disables_automatic_retries():
    mock_client = MockOpenAiSdkClient(MATHWORKS_AI_ANALYSIS_PAYLOAD)
    with patch("openai.OpenAI", return_value=mock_client) as openai_constructor:
        result = run_smart_analysis(
            resume_text=SYNTHETIC_RESUME,
            job_text=SYNTHETIC_SECURITY_JOB,
            config=_enabled_config(),
        )

    assert result.analysisMode == "ai_smart"
    assert mock_client.responses.last_kwargs is not None
    assert openai_constructor.call_count == 1
    constructor_kwargs = openai_constructor.call_args.kwargs
    assert constructor_kwargs["max_retries"] == 0
    assert constructor_kwargs["timeout"] == 30.0


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


def test_profile_invalid_payload_raises_safe_error():
    try:
        run_profile_extraction(
            resume_text=SYNTHETIC_RESUME,
            client=MockOpenAiClient({"candidateName": "", "skills": [], "summary": ""}),
            config=_enabled_config(),
        )
        assert False, "expected ResponseValidationError"
    except ResponseValidationError as exc:
        assert exc.error_class == "provider_invalid_response"


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
    except MalformedResponseError as exc:
        assert exc.error_class == "provider_invalid_response"


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


def test_openai_billing_or_quota_failure_is_classified_safely():
    error = _status_error(
        RateLimitError,
        429,
        code="credit_balance_exhausted",
        error_kind="insufficient_quota",
    )
    mock_client = RaisingMockClient(error)

    try:
        run_smart_analysis(
            resume_text=SYNTHETIC_RESUME,
            job_text=SYNTHETIC_SECURITY_JOB,
            client=mock_client,
            config=_enabled_config(),
        )
        assert False, "expected OpenAiBillingOrQuotaError"
    except OpenAiBillingOrQuotaError as exc:
        assert exc.error_class == "provider_billing_or_quota"
    assert mock_client.call_count == 1


def test_openai_temporary_rate_limit_is_classified_safely():
    error = _status_error(
        RateLimitError,
        429,
        code="rate_limit_exceeded",
        error_kind="rate_limit_error",
    )
    try:
        run_smart_analysis(
            resume_text=SYNTHETIC_RESUME,
            job_text=SYNTHETIC_SECURITY_JOB,
            client=RaisingMockClient(error),
            config=_enabled_config(),
        )
        assert False, "expected OpenAiRateLimitError"
    except OpenAiRateLimitError as exc:
        assert exc.error_class == "provider_rate_limited"


def test_openai_sdk_timeout_is_classified_safely():
    request = httpx.Request("POST", "https://api.openai.com/v1/responses")
    try:
        run_smart_analysis(
            resume_text=SYNTHETIC_RESUME,
            job_text=SYNTHETIC_SECURITY_JOB,
            client=RaisingMockClient(APITimeoutError(request)),
            config=_enabled_config(),
        )
        assert False, "expected OpenAiTimeoutError"
    except OpenAiTimeoutError as exc:
        assert exc.error_class == "provider_timeout"


def test_openai_connection_failure_is_classified_safely():
    request = httpx.Request("POST", "https://api.openai.com/v1/responses")
    try:
        run_smart_analysis(
            resume_text=SYNTHETIC_RESUME,
            job_text=SYNTHETIC_SECURITY_JOB,
            client=RaisingMockClient(APIConnectionError(request=request)),
            config=_enabled_config(),
        )
        assert False, "expected OpenAiConnectionError"
    except OpenAiConnectionError as exc:
        assert exc.error_class == "provider_connection"


def test_openai_auth_failure_is_classified_safely():
    error = _status_error(
        AuthenticationError,
        401,
        code="invalid_api_key",
        error_kind="invalid_request_error",
    )
    try:
        run_smart_analysis(
            resume_text=SYNTHETIC_RESUME,
            job_text=SYNTHETIC_SECURITY_JOB,
            client=RaisingMockClient(error),
            config=_enabled_config(),
        )
        assert False, "expected OpenAiAuthOrConfigurationError"
    except OpenAiAuthOrConfigurationError as exc:
        assert exc.error_class == "provider_auth_or_configuration"


def test_openai_request_configuration_failure_is_classified_safely():
    error = _status_error(
        BadRequestError,
        400,
        code="invalid_model",
        error_kind="invalid_request_error",
    )
    try:
        run_smart_analysis(
            resume_text=SYNTHETIC_RESUME,
            job_text=SYNTHETIC_SECURITY_JOB,
            client=RaisingMockClient(error),
            config=_enabled_config(),
        )
        assert False, "expected OpenAiAuthOrConfigurationError"
    except OpenAiAuthOrConfigurationError as exc:
        assert exc.error_class == "provider_auth_or_configuration"


def test_openai_server_failure_is_classified_safely():
    error = _status_error(
        InternalServerError,
        503,
        code="server_error",
        error_kind="server_error",
    )
    try:
        run_smart_analysis(
            resume_text=SYNTHETIC_RESUME,
            job_text=SYNTHETIC_SECURITY_JOB,
            client=RaisingMockClient(error),
            config=_enabled_config(),
        )
        assert False, "expected OpenAiUnavailableError"
    except OpenAiUnavailableError as exc:
        assert exc.error_class == "provider_unavailable"


def test_unknown_provider_failure_is_classified_safely():
    try:
        run_smart_analysis(
            resume_text=SYNTHETIC_RESUME,
            job_text=SYNTHETIC_SECURITY_JOB,
            client=RaisingMockClient(RuntimeError("opaque provider failure")),
            config=_enabled_config(),
        )
        assert False, "expected OpenAiUnknownError"
    except OpenAiUnknownError as exc:
        assert exc.error_class == "provider_unknown"


def test_provider_failure_logs_only_safe_category():
    error = _status_error(
        RateLimitError,
        429,
        code="credit_balance_exhausted",
        error_kind="insufficient_quota",
    )
    with patch.object(ai_module.logger, "warning") as warning:
        try:
            run_smart_analysis(
                resume_text=SYNTHETIC_RESUME,
                job_text=SYNTHETIC_SECURITY_JOB,
                client=RaisingMockClient(error),
                config=_enabled_config(),
            )
            assert False, "expected OpenAiBillingOrQuotaError"
        except OpenAiBillingOrQuotaError:
            pass

    logged = str(warning.call_args_list)
    assert "provider_billing_or_quota" in logged
    assert "SENSITIVE_PROVIDER_DETAIL_DO_NOT_EXPOSE" not in logged
    assert SYNTHETIC_RESUME.strip() not in logged
    assert SYNTHETIC_SECURITY_JOB.strip() not in logged


def test_provider_failure_api_response_is_safe_and_returns_for_fallback():
    error = _status_error(
        RateLimitError,
        429,
        code="credit_balance_exhausted",
        error_kind="insufficient_quota",
    )
    payload = {
        "resumeText": SYNTHETIC_RESUME,
        "jobText": SYNTHETIC_SECURITY_JOB,
    }
    with patch.dict(
        os.environ,
        {"AI_FEATURES_ENABLED": "true", "OPENAI_API_KEY": "test-openai-key"},
    ):
        with patch("openai.OpenAI", return_value=RaisingOpenAiSdkClient(error)):
            response = client.post("/ai/analyze", json=payload)

    assert response.status_code == 429
    assert response.json() == {"detail": "Smart AI is temporarily unavailable."}
    assert "SENSITIVE_PROVIDER_DETAIL_DO_NOT_EXPOSE" not in response.text
    assert SYNTHETIC_RESUME.strip() not in response.text
    assert SYNTHETIC_SECURITY_JOB.strip() not in response.text


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
    test_openai_sdk_client_disables_automatic_retries()
    test_resume_skill_extraction_includes_explicit_skills()
    test_profile_extraction_returns_skills_without_contact_info()
    test_profile_invalid_payload_raises_safe_error()
    test_missing_api_key_raises_safe_error()
    test_disabled_features_raise_safe_error()
    test_malformed_ai_response_raises_safe_error()
    test_openai_timeout_raises_safe_error()
    test_openai_billing_or_quota_failure_is_classified_safely()
    test_openai_temporary_rate_limit_is_classified_safely()
    test_openai_sdk_timeout_is_classified_safely()
    test_openai_connection_failure_is_classified_safely()
    test_openai_auth_failure_is_classified_safely()
    test_openai_request_configuration_failure_is_classified_safely()
    test_openai_server_failure_is_classified_safely()
    test_unknown_provider_failure_is_classified_safely()
    test_provider_failure_logs_only_safe_category()
    test_provider_failure_api_response_is_safe_and_returns_for_fallback()
    test_ai_analyze_endpoint_requires_shared_secret_when_configured()
    test_ai_analyze_endpoint_maps_disabled_to_safe_http_error()
    print("All AI analysis service tests passed.")
