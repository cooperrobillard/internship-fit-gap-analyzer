# Tests for the local FastAPI analysis service prototype in api/.
import sys
from pathlib import Path

repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

from fastapi.testclient import TestClient

from api.main import app

client = TestClient(app)

SAMPLE_RESUME = "Python, Git, SQL, and technical documentation experience."
SAMPLE_JOB = "Intern role requiring Python, SQL, pandas, and machine learning."


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
    test_analyze_returns_matched_and_missing_skills()
    test_analyze_response_excludes_raw_resume_and_job_text()
    test_cors_allows_local_nextjs_origin()
    test_analyze_does_not_create_tracked_generated_files()
    print("All API service tests passed.")
