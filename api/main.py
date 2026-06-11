"""
Local FastAPI prototype for the rule-based Python analyzer.

- Optional shared-secret request validation on /analyze (not full production auth)
- Does not save analyses or raw pasted text
- Does not replace the Streamlit app
"""

import os
import secrets

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from api.analysis_service import analyze_request
from api.models import AnalyzeRequest, AnalyzeResponse

_DEFAULT_LOCAL_DEV_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


def parse_allowed_origins(raw_value: str | None = None) -> list[str]:
    """
    Parse ALLOWED_ORIGINS (comma-separated) for CORS.

    When unset, blank, or only empty entries, returns local Next.js dev origins only.
    Never defaults to "*".
    """
    if raw_value is None:
        raw_value = os.environ.get("ALLOWED_ORIGINS")

    if raw_value is None or not raw_value.strip():
        return list(_DEFAULT_LOCAL_DEV_ORIGINS)

    origins: list[str] = []
    for part in raw_value.split(","):
        trimmed = part.strip()
        if trimmed:
            origins.append(trimmed)

    if not origins:
        return list(_DEFAULT_LOCAL_DEV_ORIGINS)

    return origins


def get_allowed_origins() -> list[str]:
    """CORS allow_origins list from ALLOWED_ORIGINS (or local dev defaults)."""
    return parse_allowed_origins()


def get_analysis_api_shared_secret() -> str | None:
    """Shared secret for /analyze when ANALYSIS_API_SHARED_SECRET is set."""
    raw = os.environ.get("ANALYSIS_API_SHARED_SECRET")
    if raw is None or not raw.strip():
        return None
    return raw.strip()


def verify_analysis_api_key(
    x_analysis_api_key: str | None = Header(None, alias="X-Analysis-Api-Key"),
) -> None:
    """
    Require X-Analysis-Api-Key when ANALYSIS_API_SHARED_SECRET is configured.

    /health is not protected. When the secret env var is unset, local dev works
    as before.
    """
    secret = get_analysis_api_shared_secret()
    if secret is None:
        return

    if x_analysis_api_key is None or not secrets.compare_digest(
        x_analysis_api_key, secret
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing analysis API key",
        )


app = FastAPI(
    title="Internship Fit Gap Analyzer API",
    description=(
        "Local prototype HTTP wrapper around the rule-based Python analyzer in src/. "
        "Used by the Next.js dashboard during local development only — not authenticated, "
        "not deployed, and does not persist analyses or raw pasted text."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-Analysis-Api-Key"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(
    request: AnalyzeRequest,
    _: None = Depends(verify_analysis_api_key),
) -> AnalyzeResponse:
    """
    Analyze pasted resume and job description text in memory.

    Returns matched/missing skills and optional metadata echo only.
    Raw resumeText and jobText are not included in the response.
    """
    return analyze_request(request)
