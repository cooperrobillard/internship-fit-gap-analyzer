"""
Local FastAPI prototype for the rule-based Python analyzer.

- Optional shared-secret request validation on /analyze (not full production auth)
- Does not save analyses or raw pasted text
- Does not replace the Streamlit app
"""

import logging
import os
import secrets
from time import monotonic

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.analysis_service import analyze_request
from api.models import AnalyzeRequest, AnalyzeResponse
from api.observability import (
    REQUEST_ID_HEADER,
    create_safe_analysis_event,
    duration_ms_from_monotonic,
    emit_safe_event,
    resolve_request_id,
)

logger = logging.getLogger(__name__)

_SAFE_VALIDATION_MESSAGES = {
    "json_invalid": "Malformed JSON.",
    "missing": "This field is required.",
    "string_type": "Must be text.",
    "string_too_long": "Must be 100,000 characters or fewer.",
    "value_error": "Must not be blank.",
}


def _safe_validation_field(location: tuple[object, ...]) -> str | None:
    for part in location:
        if part in {"resumeText", "jobText"}:
            return str(part)
    return None


def _safe_validation_message(error_type: str) -> str:
    return _SAFE_VALIDATION_MESSAGES.get(error_type, "Invalid value.")


def _sanitize_validation_errors(exc: RequestValidationError) -> list[dict[str, str]]:
    safe_errors: list[dict[str, str]] = []

    for error in exc.errors():
        error_type = str(error.get("type", ""))
        location = tuple(error.get("loc", ()))
        field = _safe_validation_field(location)

        if error_type == "missing" and location == ("body",):
            safe_errors.append({"field": "body", "message": "Request body is required."})
            continue

        if error_type == "json_invalid":
            safe_errors.append({"field": "body", "message": "Malformed JSON."})
            continue

        safe_error = {"message": _safe_validation_message(error_type)}
        if field is not None:
            safe_error["field"] = field
        safe_errors.append(safe_error)

    return safe_errors or [{"message": "Invalid request data."}]

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
    allow_headers=["Content-Type", "X-Analysis-Api-Key", REQUEST_ID_HEADER],
)


@app.middleware("http")
async def request_correlation_middleware(request: Request, call_next):
    request_id = resolve_request_id(request.headers.get(REQUEST_ID_HEADER))
    request.state.request_id = request_id
    started_at = monotonic()

    try:
        response = await call_next(request)
    except Exception:
        if request.method == "POST" and request.url.path == "/analyze":
            emit_safe_event(
                logger,
                create_safe_analysis_event(
                    request_id=request_id,
                    service="fastapi_analysis_service",
                    outcome="failure",
                    severity="error",
                    route_template="/analyze",
                    http_method="POST",
                    http_status=500,
                    duration_ms=duration_ms_from_monotonic(started_at),
                    failure_class="backend.unhandled_exception",
                ),
            )
        response = JSONResponse(
            status_code=500,
            content={
                "detail": "The analysis could not be completed. Please try again."
            },
        )

    response.headers[REQUEST_ID_HEADER] = request_id

    if (
        request.method == "POST"
        and request.url.path == "/analyze"
        and 200 <= response.status_code < 300
    ):
        emit_safe_event(
            logger,
            create_safe_analysis_event(
                request_id=request_id,
                service="fastapi_analysis_service",
                outcome="success",
                severity="info",
                route_template="/analyze",
                http_method="POST",
                http_status=response.status_code,
                duration_ms=duration_ms_from_monotonic(started_at),
            ),
        )

    return response



@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Invalid request data.",
            "errors": _sanitize_validation_errors(exc),
        },
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
