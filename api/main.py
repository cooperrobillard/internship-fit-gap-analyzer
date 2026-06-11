"""
Local FastAPI prototype for the rule-based Python analyzer.

- Not authenticated yet
- Not deployed
- Does not save analyses or raw pasted text
- Does not replace the Streamlit app
"""

import os

from fastapi import FastAPI
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
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    """
    Analyze pasted resume and job description text in memory.

    Returns matched/missing skills and optional metadata echo only.
    Raw resumeText and jobText are not included in the response.
    """
    return analyze_request(request)
