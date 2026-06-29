"""Disabled-by-default, failure-only Sentry telemetry adapter."""

from __future__ import annotations

import os
from typing import Any, Mapping

from api.observability import SafeAnalysisEvent, optional_safe_token, validate_safe_analysis_event

_initialized = False
_init_failed = False
_active_sdk: Any | None = None


def _enabled(config: Mapping[str, str | None]) -> bool:
    return (config.get("OBSERVABILITY_TELEMETRY_ENABLED") or "").strip().lower() == "true" and bool((config.get("SENTRY_DSN") or "").strip())


def _level(severity: str) -> str | None:
    return {"warning": "warning", "error": "error", "critical": "fatal"}.get(severity)


def reconstruct_sentry_event(incoming: Mapping[str, Any]) -> dict[str, Any] | None:
    extra = incoming.get("extra") if isinstance(incoming.get("extra"), Mapping) else {}
    safe = validate_safe_analysis_event(extra.get("safe_event"))
    if not safe or safe.get("outcome") != "failure" or not safe.get("failure_class"):
        return None
    level = _level(str(safe.get("severity")))
    if level is None:
        return None
    tags = {
        "schema_version": safe["schema_version"], "event_name": safe["event_name"], "service": safe["service"],
        "operation": safe["operation"], "outcome": safe["outcome"], "severity": safe["severity"],
        "failure_class": safe["failure_class"], "route_template": safe["route_template"],
        "http_method": safe["http_method"], "http_status": str(safe["http_status"]),
    }
    for key in ("upstream_status_class", "payload_size_bucket", "environment", "release"):
        if safe.get(key): tags[key] = str(safe[key])
    event = {"message": f"{safe['service']}:{safe['failure_class']}", "level": level, "fingerprint": [safe["service"], safe["failure_class"]], "tags": tags, "extra": {"safe_event": safe}, "breadcrumbs": []}
    if isinstance(incoming.get("event_id"), str) and len(incoming["event_id"]) == 32:
        event["event_id"] = incoming["event_id"]
    if isinstance(incoming.get("timestamp"), (int, float)):
        event["timestamp"] = incoming["timestamp"]
    return event


def _init_if_needed(config: Mapping[str, str | None], sdk: Any) -> bool:
    global _initialized, _init_failed, _active_sdk
    if not _enabled(config):
        return False
    if _initialized:
        return not _init_failed
    try:
        sdk.init(
            dsn=(config.get("SENTRY_DSN") or "").strip(),
            environment=optional_safe_token(config.get("SENTRY_ENVIRONMENT")),
            release=optional_safe_token(config.get("SENTRY_RELEASE")),
            send_default_pii=False,
            default_integrations=False,
            auto_enabling_integrations=False,
            max_request_body_size="never",
            include_local_variables=False,
            include_source_context=False,
            max_breadcrumbs=0,
            attach_stacktrace=False,
            enable_logs=False,
            traces_sample_rate=None,
            auto_session_tracking=False,
            send_client_reports=False,
            before_breadcrumb=lambda breadcrumb, hint=None: None,
            before_send=lambda event, hint=None: reconstruct_sentry_event(event),
        )
        _initialized = True; _active_sdk = sdk; return True
    except Exception:
        _initialized = True; _init_failed = True; return False


def capture_safe_failure_to_sentry(event: SafeAnalysisEvent, *, sdk: Any | None = None, config: Mapping[str, str | None] | None = None) -> str:
    try:
        safe = validate_safe_analysis_event(event)
        if not safe or safe.get("outcome") != "failure" or not safe.get("failure_class"):
            return "dropped"
        if sdk is None:
            import sentry_sdk as sdk  # type: ignore[no-redef]
        if config is None:
            config = os.environ
        if not _init_if_needed(config, sdk):
            return "disabled"
        (_active_sdk or sdk).capture_event({"extra": {"safe_event": safe}})
        return "queued"
    except Exception:
        return "failed"


def _reset_for_tests() -> None:
    global _initialized, _init_failed, _active_sdk
    _initialized = False; _init_failed = False; _active_sdk = None
