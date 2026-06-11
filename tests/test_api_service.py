# Tests for the local FastAPI analysis service prototype in api/.
import importlib
import os
import sys
from pathlib import Path

repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

from fastapi.testclient import TestClient

import api.main as api_main_module
from api.main import app, get_allowed_origins, parse_allowed_origins

client = TestClient(app)

SAMPLE_RESUME = "Python, Git, SQL, and technical documentation experience."
SAMPLE_JOB = "Intern role requiring Python, SQL, pandas, and machine learning."
TEST_SHARED_SECRET = "test-analysis-api-shared-secret"


def _analyze_payload() -> dict[str, str]:
    return {
        "resumeText": SAMPLE_RESUME,
        "jobText": SAMPLE_JOB,
    }


def test_health_returns_ok():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_analyze_rejects_blank_resume_text():
    response = client.post(
        "/analyze",
        json={
            "resumeText": "   ",
            "jobText": SAMPLE_JOB,
        },
    )

    assert response.status_code == 422


def test_analyze_rejects_blank_job_text():
    response = client.post(
        "/analyze",
        json={
            "resumeText": SAMPLE_RESUME,
            "jobText": "",
        },
    )

    assert response.status_code == 422


def test_analyze_matched_and_missing_skills_are_disjoint():
    resume_text = "Python SQL Git data analysis"
    job_text = (
        "We are looking for an intern with Python, SQL, FastAPI, "
        "and cloud deployment experience."
    )

    response = client.post(
        "/analyze",
        json={
            "resumeText": resume_text,
            "jobText": job_text,
        },
    )

    assert response.status_code == 200
    payload = response.json()

    matched_names = {item["skill"] for item in payload["matchedSkills"]}
    missing_names = {item["skill"] for item in payload["missingSkills"]}

    assert "python" in matched_names
    assert "sql" in matched_names
    assert "fastapi" in missing_names
    assert "fastapi" not in matched_names
    assert matched_names.isdisjoint(missing_names)


def test_analyze_returns_matched_and_missing_skills():
    response = client.post(
        "/analyze",
        json={
            "resumeText": SAMPLE_RESUME,
            "jobText": SAMPLE_JOB,
            "jobTitle": "AI Intern",
            "company": "Example Co",
        },
    )

    assert response.status_code == 200
    payload = response.json()

    assert isinstance(payload["matchedSkills"], list)
    assert isinstance(payload["missingSkills"], list)
    assert payload["matchedSkillsCount"] == len(payload["matchedSkills"])
    assert payload["missingSkillsCount"] == len(payload["missingSkills"])
    assert payload["matchedSkillsCount"] >= 1
    assert payload["missingSkillsCount"] >= 1
    assert isinstance(payload["summary"], str)
    assert payload["summary"]

    first_matched = payload["matchedSkills"][0]
    assert "skill" in first_matched
    assert "category" in first_matched

    assert payload["metadata"]["jobTitle"] == "AI Intern"
    assert payload["metadata"]["company"] == "Example Co"


def test_analyze_response_excludes_raw_resume_and_job_text():
    secret_resume = "SECRET_RESUME_PHRASE_FOR_API_TEST"
    secret_job = "SECRET_JOB_PHRASE_FOR_API_TEST with Python SQL"

    response = client.post(
        "/analyze",
        json={
            "resumeText": secret_resume,
            "jobText": secret_job,
        },
    )

    assert response.status_code == 200
    response_text = response.text

    assert "resumeText" not in response_text
    assert "jobText" not in response_text
    assert secret_resume not in response_text
    assert secret_job not in response_text


def test_parse_allowed_origins_defaults_when_unset():
    original = os.environ.pop("ALLOWED_ORIGINS", None)

    try:
        assert parse_allowed_origins() == [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
        assert parse_allowed_origins(None) == [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
        assert parse_allowed_origins("") == [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
        assert parse_allowed_origins("   ") == [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    finally:
        if original is not None:
            os.environ["ALLOWED_ORIGINS"] = original


def test_parse_allowed_origins_trims_comma_separated_values():
    assert parse_allowed_origins(
        " https://app.example.com , https://preview.example.com "
    ) == [
        "https://app.example.com",
        "https://preview.example.com",
    ]


def test_parse_allowed_origins_ignores_empty_entries():
    assert parse_allowed_origins(
        "https://app.example.com,, ,https://preview.example.com,"
    ) == [
        "https://app.example.com",
        "https://preview.example.com",
    ]


def test_parse_allowed_origins_default_never_includes_wildcard():
    original = os.environ.pop("ALLOWED_ORIGINS", None)

    try:
        for raw in (None, "", "   ", ","):
            origins = parse_allowed_origins(raw)
            assert "*" not in origins
            assert origins == [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
            ]
        assert "*" not in get_allowed_origins()
    finally:
        if original is not None:
            os.environ["ALLOWED_ORIGINS"] = original


def test_cors_allows_local_nextjs_origin():
    response = client.options(
        "/analyze",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_cors_allows_production_origin_from_env():
    """Reload app so middleware picks up ALLOWED_ORIGINS (read at import)."""
    original = os.environ.get("ALLOWED_ORIGINS")
    placeholder_origin = "https://your-vercel-app.vercel.app"
    os.environ["ALLOWED_ORIGINS"] = placeholder_origin

    importlib.reload(api_main_module)

    try:
        prod_client = TestClient(api_main_module.app)
        response = prod_client.options(
            "/analyze",
            headers={
                "Origin": placeholder_origin,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )

        assert response.status_code == 200
        assert (
            response.headers.get("access-control-allow-origin") == placeholder_origin
        )
    finally:
        if original is None:
            os.environ.pop("ALLOWED_ORIGINS", None)
        else:
            os.environ["ALLOWED_ORIGINS"] = original
        importlib.reload(api_main_module)


def test_analyze_works_when_shared_secret_unset():
    original = os.environ.pop("ANALYSIS_API_SHARED_SECRET", None)

    try:
        response = client.post("/analyze", json=_analyze_payload())

        assert response.status_code == 200
        payload = response.json()
        assert payload["matchedSkillsCount"] >= 1
    finally:
        if original is not None:
            os.environ["ANALYSIS_API_SHARED_SECRET"] = original


def test_analyze_fails_when_shared_secret_set_but_header_missing():
    original = os.environ.get("ANALYSIS_API_SHARED_SECRET")
    os.environ["ANALYSIS_API_SHARED_SECRET"] = TEST_SHARED_SECRET

    try:
        response = client.post("/analyze", json=_analyze_payload())

        assert response.status_code == 401
        assert "analysis api key" in response.json()["detail"].lower()
    finally:
        if original is None:
            os.environ.pop("ANALYSIS_API_SHARED_SECRET", None)
        else:
            os.environ["ANALYSIS_API_SHARED_SECRET"] = original


def test_analyze_fails_when_shared_secret_set_but_header_wrong():
    original = os.environ.get("ANALYSIS_API_SHARED_SECRET")
    os.environ["ANALYSIS_API_SHARED_SECRET"] = TEST_SHARED_SECRET

    try:
        response = client.post(
            "/analyze",
            json=_analyze_payload(),
            headers={"X-Analysis-Api-Key": "wrong-secret"},
        )

        assert response.status_code == 401
        assert "analysis api key" in response.json()["detail"].lower()
    finally:
        if original is None:
            os.environ.pop("ANALYSIS_API_SHARED_SECRET", None)
        else:
            os.environ["ANALYSIS_API_SHARED_SECRET"] = original


def test_analyze_succeeds_when_shared_secret_set_and_header_matches():
    original = os.environ.get("ANALYSIS_API_SHARED_SECRET")
    os.environ["ANALYSIS_API_SHARED_SECRET"] = TEST_SHARED_SECRET

    try:
        response = client.post(
            "/analyze",
            json=_analyze_payload(),
            headers={"X-Analysis-Api-Key": TEST_SHARED_SECRET},
        )

        assert response.status_code == 200
        payload = response.json()
        assert payload["matchedSkillsCount"] >= 1
    finally:
        if original is None:
            os.environ.pop("ANALYSIS_API_SHARED_SECRET", None)
        else:
            os.environ["ANALYSIS_API_SHARED_SECRET"] = original


def test_health_works_when_shared_secret_set():
    original = os.environ.get("ANALYSIS_API_SHARED_SECRET")
    os.environ["ANALYSIS_API_SHARED_SECRET"] = TEST_SHARED_SECRET

    try:
        response = client.get("/health")

        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
    finally:
        if original is None:
            os.environ.pop("ANALYSIS_API_SHARED_SECRET", None)
        else:
            os.environ["ANALYSIS_API_SHARED_SECRET"] = original


def test_analyze_does_not_create_tracked_generated_files():
    repo_root = Path(__file__).resolve().parent.parent
    outputs_folder = repo_root / "data" / "outputs"

    before_outputs = set(outputs_folder.glob("*")) if outputs_folder.exists() else set()
    data_folder = repo_root / "data"
    before_db_files = set(data_folder.glob("**/*.db")) if data_folder.exists() else set()

    response = client.post(
        "/analyze",
        json={
            "resumeText": SAMPLE_RESUME,
            "jobText": SAMPLE_JOB,
        },
    )

    assert response.status_code == 200

    after_outputs = set(outputs_folder.glob("*")) if outputs_folder.exists() else set()
    after_db_files = set(data_folder.glob("**/*.db")) if data_folder.exists() else set()

    assert before_outputs == after_outputs
    assert before_db_files == after_db_files


if __name__ == "__main__":
    test_health_returns_ok()
    test_analyze_rejects_blank_resume_text()
    test_analyze_rejects_blank_job_text()
    test_analyze_matched_and_missing_skills_are_disjoint()
    test_analyze_returns_matched_and_missing_skills()
    test_analyze_response_excludes_raw_resume_and_job_text()
    test_parse_allowed_origins_defaults_when_unset()
    test_parse_allowed_origins_trims_comma_separated_values()
    test_parse_allowed_origins_ignores_empty_entries()
    test_parse_allowed_origins_default_never_includes_wildcard()
    test_cors_allows_local_nextjs_origin()
    test_cors_allows_production_origin_from_env()
    test_analyze_works_when_shared_secret_unset()
    test_analyze_fails_when_shared_secret_set_but_header_missing()
    test_analyze_fails_when_shared_secret_set_but_header_wrong()
    test_analyze_succeeds_when_shared_secret_set_and_header_matches()
    test_health_works_when_shared_secret_set()
    test_analyze_does_not_create_tracked_generated_files()
    print("All API service tests passed.")
