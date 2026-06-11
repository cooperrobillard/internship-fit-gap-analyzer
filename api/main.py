"""
Local FastAPI prototype for the rule-based Python analyzer.

- Not authenticated yet
- Not deployed
- Does not save analyses or raw pasted text
- Does not replace the Streamlit app
"""

from fastapi import FastAPI

from api.analysis_service import analyze_request
from api.models import AnalyzeRequest, AnalyzeResponse

app = FastAPI(
    title="Internship Fit Gap Analyzer API",
    description=(
        "Local prototype HTTP wrapper around the existing rule-based Python analyzer. "
        "For development only — not authenticated, not deployed, and does not persist analyses."
    ),
    version="0.1.0",
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
