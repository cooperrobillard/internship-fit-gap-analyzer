"""Allowlist-only request correlation and safe event helpers."""

from __future__ import annotations

import json
import logging
from datetime import UTC, datetime
from time import monotonic
from typing import Literal, TypedDict
from uuid import UUID, uuid4

REQUEST_ID_HEADER = "X-Request-ID"
SAFE_EVENT_SCHEMA_VERSION = "1"
ANALYSIS_EVENT_NAME = "analysis_request"
ANALYZE_OPERATION = "analyze"
MAX_DURATION_MS = 3_600_000

FAILURE_CLASSES = frozenset(
    {
        "request.validation_failed",
        "request.payload_too_large",
        "request.rate_limited",
        "resource.not_found",
        "operation.cancelled",
        "auth.session_not_ready",
        "auth.session_stale",
        "auth.authorization_denied_unexpected",
        "proxy.upstream_timeout",
        "proxy.upstream_unreachable",
        "proxy.upstream_invalid_response",
        "proxy.upstream_5xx",
        "backend.unhandled_exception",
        "backend.serialization_failed",
        "data.network_failed",
        "data.read_failed",
        "data.write_failed",
        "data.update_failed",
        "data.delete_failed",
        "config.backend_url_missing",
        "config.shared_secret_rejected",
        "config.supabase_unavailable",
        "availability.frontend_down",
        "availability.backend_health_down",
        "availability.analysis_path_sustained_failure",
        "deployment.frontend_failed",
        "deployment.backend_failed",
        "observability.delivery_failed",
        "privacy.redaction_test_failed",
        "privacy.sensitive_data_detected",
        "security.secret_detected",
        "security.identity_collection_detected",
    }
)

SAFE_EVENT_KEYS = (
    "schema_version",
    "event_name",
    "event_id",
    "request_id",
    "timestamp",
    "service",
    "operation",
    "outcome",
    "severity",
    "environment",
    "release",
    "route_template",
    "http_method",
    "http_status",
    "duration_ms",
    "failure_class",
    "upstream_status_class",
    "retry_count",
    "rate_limit_result",
    "payload_size_bucket",
    "runtime_name",
    "runtime_version",
)

Outcome = Literal["success", "failure"]
Severity = Literal["info", "warning", "error", "critical"]
Service = Literal["nextjs_analysis_proxy", "fastapi_analysis_service"]


class SafeAnalysisEvent(TypedDict, total=False):
    schema_version: str
    event_name: str
    event_id: str
    request_id: str
    timestamp: str
    service: Service
    operation: str
    outcome: Outcome
    severity: Severity
    environment: str
    release: str
    route_template: str
    http_method: str
    http_status: int
    duration_ms: int
    failure_class: str
    upstream_status_class: str
    retry_count: int
    rate_limit_result: str
    payload_size_bucket: str
    runtime_name: str
    runtime_version: str


def generate_request_id() -> str:
    return str(uuid4())


def is_canonical_uuid4(value: object) -> bool:
    if not isinstance(value, str) or len(value) != 36:
        return False
    try:
        parsed = UUID(value)
    except ValueError:
        return False
    return parsed.version == 4 and str(parsed) == value


def resolve_request_id(value: object) -> str:
    return value if is_canonical_uuid4(value) else generate_request_id()


def duration_ms_from_monotonic(started_at: float) -> int:
    elapsed = round((monotonic() - started_at) * 1000)
    if elapsed < 0:
        return 0
    return min(MAX_DURATION_MS, elapsed)


def _safe_http_status(value: int) -> int:
    if not isinstance(value, int) or value < 100 or value > 599:
        return 500
    return value


def create_safe_analysis_event(
    *,
    request_id: str,
    service: Service,
    outcome: Outcome,
    severity: Severity,
    route_template: str,
    http_method: str,
    http_status: int,
    duration_ms: int,
    failure_class: str | None = None,
) -> SafeAnalysisEvent:
    if not is_canonical_uuid4(request_id):
        raise ValueError("request_id must be canonical UUIDv4")
    if outcome == "success" and failure_class is not None:
        raise ValueError("success events must not include failure_class")
    if outcome == "failure" and failure_class not in FAILURE_CLASSES:
        raise ValueError("failure events require a recognized failure_class")

    safe_duration = min(MAX_DURATION_MS, max(0, round(duration_ms)))
    event: SafeAnalysisEvent = {
        "schema_version": SAFE_EVENT_SCHEMA_VERSION,
        "event_name": ANALYSIS_EVENT_NAME,
        "event_id": generate_request_id(),
        "request_id": request_id,
        "timestamp": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        "service": service,
        "operation": ANALYZE_OPERATION,
        "outcome": outcome,
        "severity": severity,
        "route_template": route_template,
        "http_method": http_method,
        "http_status": _safe_http_status(http_status),
        "duration_ms": safe_duration,
    }
    if outcome == "failure" and failure_class is not None:
        event["failure_class"] = failure_class
    return event


def serialize_safe_event(event: SafeAnalysisEvent) -> str:
    safe = {key: event[key] for key in SAFE_EVENT_KEYS if key in event}
    return json.dumps(safe, separators=(",", ":"), sort_keys=True)


def emit_safe_event(logger: logging.Logger, event: SafeAnalysisEvent) -> None:
    try:
        logger.info(serialize_safe_event(event))
    except Exception:
        pass

_SAFE_SERVICES = {"nextjs_analysis_proxy", "fastapi_analysis_service"}
_SAFE_OUTCOMES = {"success", "failure"}
_SAFE_SEVERITIES = {"info", "warning", "error", "critical"}
_SAFE_ROUTES = {"/api/analyze", "/analyze"}
_SAFE_METHODS = {"POST"}
_UPSTREAM_STATUS_CLASSES = {"4xx", "5xx", "unknown"}
_RATE_LIMIT_RESULTS = {"allowed", "limited", "unknown"}
_PAYLOAD_SIZE_BUCKETS = {"under_10kb", "10kb_to_100kb", "100kb_to_500kb", "500kb_to_1mb", "over_1mb", "unknown"}


def optional_safe_token(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    trimmed = value.strip()
    import re
    if re.fullmatch(r"[A-Za-z0-9._:-]{1,80}", trimmed) is None:
        return None
    return trimmed


def _contains_sentinel(value: object) -> bool:
    return isinstance(value, str) and "SENSITIVE_" in value and "_SENTINEL_DO_NOT_CAPTURE" in value


def _safe_int(value: object, minimum: int, maximum: int) -> int | None:
    if isinstance(value, bool) or not isinstance(value, int) or value < minimum or value > maximum:
        return None
    return value


def validate_safe_analysis_event(value: object) -> SafeAnalysisEvent | None:
    if not isinstance(value, dict):
        return None
    if not set(value).issubset(set(SAFE_EVENT_KEYS)):
        return None
    if any(_contains_sentinel(v) for v in value.values()):
        return None
    if value.get("schema_version") != SAFE_EVENT_SCHEMA_VERSION or value.get("event_name") != ANALYSIS_EVENT_NAME:
        return None
    if not is_canonical_uuid4(value.get("event_id")) or not is_canonical_uuid4(value.get("request_id")):
        return None
    if value.get("operation") != ANALYZE_OPERATION:
        return None
    service = value.get("service")
    outcome = value.get("outcome")
    severity = value.get("severity")
    route = value.get("route_template")
    method = value.get("http_method")
    status = _safe_int(value.get("http_status"), 100, 599)
    duration = _safe_int(value.get("duration_ms"), 0, MAX_DURATION_MS)
    timestamp = value.get("timestamp")
    if service not in _SAFE_SERVICES or outcome not in _SAFE_OUTCOMES or severity not in _SAFE_SEVERITIES or route not in _SAFE_ROUTES or method not in _SAFE_METHODS or status is None or duration is None or not isinstance(timestamp, str) or _contains_sentinel(timestamp):
        return None
    failure_class = value.get("failure_class")
    if outcome == "success" and failure_class is not None:
        return None
    if outcome == "failure" and failure_class not in FAILURE_CLASSES:
        return None
    rebuilt: SafeAnalysisEvent = {
        "schema_version": "1",
        "event_name": "analysis_request",
        "event_id": value["event_id"],
        "request_id": value["request_id"],
        "timestamp": timestamp,
        "service": service,  # type: ignore[typeddict-item]
        "operation": "analyze",
        "outcome": outcome,  # type: ignore[typeddict-item]
        "severity": severity,  # type: ignore[typeddict-item]
        "route_template": route,
        "http_method": method,
        "http_status": status,
        "duration_ms": duration,
    }
    if outcome == "failure":
        rebuilt["failure_class"] = str(failure_class)
    if "upstream_status_class" in value:
        if value["upstream_status_class"] not in _UPSTREAM_STATUS_CLASSES: return None
        rebuilt["upstream_status_class"] = value["upstream_status_class"]
    if "retry_count" in value:
        retry = _safe_int(value["retry_count"], 0, 10)
        if retry is None: return None
        rebuilt["retry_count"] = retry
    if "rate_limit_result" in value:
        if value["rate_limit_result"] not in _RATE_LIMIT_RESULTS: return None
        rebuilt["rate_limit_result"] = value["rate_limit_result"]
    if "payload_size_bucket" in value:
        if value["payload_size_bucket"] not in _PAYLOAD_SIZE_BUCKETS: return None
        rebuilt["payload_size_bucket"] = value["payload_size_bucket"]
    for key in ("environment", "release", "runtime_name", "runtime_version"):
        if key in value:
            token = optional_safe_token(value[key])
            if token is None: return None
            rebuilt[key] = token
    return rebuilt
