import sys
from pathlib import Path

repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

from uuid import uuid4

import sentry_sdk
from sentry_sdk.transport import Transport

from api.observability import create_safe_analysis_event
from api.sentry_telemetry import (
    _reset_for_tests,
    capture_safe_failure_to_sentry,
    reconstruct_sentry_event,
)

SENTINELS = [
    "SENSITIVE_RESUME_SENTINEL_DO_NOT_CAPTURE",
    "SENSITIVE_JOB_SENTINEL_DO_NOT_CAPTURE",
    "SENSITIVE_NOTE_SENTINEL_DO_NOT_CAPTURE",
    "SENSITIVE_TOKEN_SENTINEL_DO_NOT_CAPTURE",
    "SENSITIVE_HEADER_SENTINEL_DO_NOT_CAPTURE",
    "SENSITIVE_COOKIE_SENTINEL_DO_NOT_CAPTURE",
    "SENSITIVE_EXCEPTION_SENTINEL_DO_NOT_CAPTURE",
    "SENSITIVE_IDENTITY_SENTINEL_DO_NOT_CAPTURE",
    "SENSITIVE_URL_SENTINEL_DO_NOT_CAPTURE",
]
FAKE_EVENT_ID = "a" * 32
TEST_DSN = "https://public@o0.ingest.sentry.io/0"


class FakeSdk:
    def __init__(self, fail_init=False, fail_capture=False, capture_event_id=FAKE_EVENT_ID):
        self.calls = []
        self.fail_init = fail_init
        self.fail_capture = fail_capture
        self.capture_event_id = capture_event_id

    def init(self, **kwargs):
        if self.fail_init:
            raise RuntimeError("boom")
        self.calls.append(("init", kwargs))

    def capture_event(self, event, hint=None):
        if self.fail_capture:
            raise RuntimeError("boom")
        self.calls.append(("capture_event", event, hint))
        return self.capture_event_id


def failure():
    return create_safe_analysis_event(
        request_id=str(uuid4()),
        service="fastapi_analysis_service",
        outcome="failure",
        severity="error",
        route_template="/analyze",
        http_method="POST",
        http_status=500,
        duration_ms=1,
        failure_class="backend.unhandled_exception",
    )


def success():
    return create_safe_analysis_event(
        request_id=str(uuid4()),
        service="fastapi_analysis_service",
        outcome="success",
        severity="info",
        route_template="/analyze",
        http_method="POST",
        http_status=200,
        duration_ms=1,
    )


def setup_function():
    _reset_for_tests()


def teardown_real_sdk_client():
    client = sentry_sdk.get_client()
    if client is not None:
        client.close()


def test_disabled_by_default_and_requires_dsn():
    for cfg in ({}, {"OBSERVABILITY_TELEMETRY_ENABLED": "true"}, {"SENTRY_DSN": "https://fake"}):
        _reset_for_tests()
        sdk = FakeSdk()
        assert capture_safe_failure_to_sentry(failure(), sdk=sdk, config=cfg) == "disabled"
        assert sdk.calls == []


def test_exact_opt_in_privacy_config_and_once():
    sdk = FakeSdk()
    cfg = {
        "OBSERVABILITY_TELEMETRY_ENABLED": "true",
        "SENTRY_DSN": "https://fake",
        "SENTRY_ENVIRONMENT": "bad value",
        "SENTRY_RELEASE": "rel-1",
    }
    assert capture_safe_failure_to_sentry(failure(), sdk=sdk, config=cfg) == "queued"
    assert capture_safe_failure_to_sentry(failure(), sdk=sdk, config=cfg) == "queued"
    inits = [c for c in sdk.calls if c[0] == "init"]
    assert len(inits) == 1
    opts = inits[0][1]
    assert opts["send_default_pii"] is False and opts["default_integrations"] is False and opts["auto_enabling_integrations"] is False
    assert opts["max_request_body_size"] == "never" and opts["include_local_variables"] is False and opts["include_source_context"] is False
    assert opts["traces_sample_rate"] is None and opts["enable_logs"] is False and opts["auto_session_tracking"] is False and opts["send_client_reports"] is False
    assert opts["max_breadcrumbs"] == 0 and opts["attach_stacktrace"] is False and opts["environment"] is None and opts["release"] == "rel-1"
    assert opts["before_breadcrumb"]({}) is None


def test_success_malformed_and_sdk_failures_drop_or_isolate():
    sdk = FakeSdk()
    cfg = {"OBSERVABILITY_TELEMETRY_ENABLED": "true", "SENTRY_DSN": "https://fake"}
    assert capture_safe_failure_to_sentry(success(), sdk=sdk, config=cfg) == "dropped"
    assert sdk.calls == []
    assert capture_safe_failure_to_sentry({"bad": "event"}, sdk=sdk, config=cfg) == "dropped"
    assert capture_safe_failure_to_sentry(failure(), sdk=FakeSdk(fail_init=True), config=cfg) == "disabled"
    _reset_for_tests()
    assert capture_safe_failure_to_sentry(failure(), sdk=FakeSdk(fail_capture=True), config=cfg) == "failed"


def test_reconstruct_from_hint_rebuilds_valid_failure():
    safe = failure()
    out = reconstruct_sentry_event({}, {"safe_event": safe})
    assert out is not None
    assert out["message"] == "fastapi_analysis_service:backend.unhandled_exception"
    assert out["extra"] == {"safe_event": safe}


def test_before_send_reconstructs_and_redacts():
    safe = failure()
    incoming = {
        "event_id": "a" * 32,
        "timestamp": 1,
        "request": {"url": SENTINELS[-1]},
        "user": {"id": SENTINELS[-2]},
        "tags": {"evil": SENTINELS[3]},
        "extra": {"safe_event": safe, "evil": SENTINELS[0]},
        "exception": {"values": [{"value": SENTINELS[-3]}]},
        "contexts": {"evil": SENTINELS[1]},
        "breadcrumbs": [{"message": SENTINELS[2]}],
    }
    out = reconstruct_sentry_event(incoming, {"safe_event": safe})
    assert out is not None
    text = str(out)
    for sentinel in SENTINELS:
        assert sentinel not in text
    assert out["message"] == "fastapi_analysis_service:backend.unhandled_exception"
    assert out["extra"] == {"safe_event": safe}
    assert "request_id" not in out["tags"]
    assert reconstruct_sentry_event({"extra": {}}, {"safe_event": None}) is None
    bad = dict(safe)
    bad["release"] = SENTINELS[3]
    assert reconstruct_sentry_event({}, {"safe_event": bad}) is None


def test_extra_fallback_path_still_works():
    safe = failure()
    out = reconstruct_sentry_event({"extra": {"safe_event": safe}})
    assert out is not None
    assert out["extra"] == {"safe_event": safe}


def test_capture_passes_safe_event_through_hint_not_extra():
    sdk = FakeSdk()
    cfg = {"OBSERVABILITY_TELEMETRY_ENABLED": "true", "SENTRY_DSN": "https://fake"}
    safe = failure()
    assert capture_safe_failure_to_sentry(safe, sdk=sdk, config=cfg) == "queued"
    captures = [c for c in sdk.calls if c[0] == "capture_event"]
    assert len(captures) == 1
    event, hint = captures[0][1], captures[0][2]
    assert event == {}
    assert hint == {"safe_event": safe}
    assert "safe_event" not in event.get("extra", {})


def test_none_event_id_returns_dropped():
    sdk = FakeSdk(capture_event_id=None)
    cfg = {"OBSERVABILITY_TELEMETRY_ENABLED": "true", "SENTRY_DSN": "https://fake"}
    assert capture_safe_failure_to_sentry(failure(), sdk=sdk, config=cfg) == "dropped"


def test_valid_event_id_returns_queued():
    sdk = FakeSdk(capture_event_id=FAKE_EVENT_ID)
    cfg = {"OBSERVABILITY_TELEMETRY_ENABLED": "true", "SENTRY_DSN": "https://fake"}
    assert capture_safe_failure_to_sentry(failure(), sdk=sdk, config=cfg) == "queued"


def test_real_sdk_pipeline_delivers_rebuilt_event_without_network():
    _reset_for_tests()
    delivered = []

    class MemoryTransport(Transport):
        def capture_envelope(self, envelope):
            event = envelope.get_event()
            if event is not None:
                delivered.append(dict(event))

        def flush(self, timeout=None, callback=None):
            return True

    class RealSdk:
        def init(self, **kwargs):
            kwargs["transport"] = MemoryTransport
            return sentry_sdk.init(**kwargs)

        def capture_event(self, event, hint=None):
            return sentry_sdk.capture_event(event, hint=hint)

        def flush(self, timeout=None):
            return sentry_sdk.flush(timeout=timeout)

    try:
        safe = create_safe_analysis_event(
            request_id=str(uuid4()),
            service="fastapi_analysis_service",
            outcome="failure",
            severity="error",
            route_template="/analyze",
            http_method="POST",
            http_status=500,
            duration_ms=42,
            failure_class="backend.unhandled_exception",
        )
        cfg = {"OBSERVABILITY_TELEMETRY_ENABLED": "true", "SENTRY_DSN": TEST_DSN}
        sdk = RealSdk()
        assert capture_safe_failure_to_sentry(safe, sdk=sdk, config=cfg) == "queued"
        sdk.flush()
        assert len(delivered) == 1
        event = delivered[0]
        assert event.get("message") == "fastapi_analysis_service:backend.unhandled_exception"
        rebuilt_safe = event.get("extra", {}).get("safe_event", {})
        assert rebuilt_safe.get("http_method") == "POST"
        assert rebuilt_safe.get("http_status") == 500
        assert rebuilt_safe.get("duration_ms") == 42
        assert rebuilt_safe.get("failure_class") == "backend.unhandled_exception"
        assert "request_id" not in event.get("tags", {})
        serialized = str(event)
        for sentinel in SENTINELS:
            assert sentinel not in serialized
        assert "resumeText" not in serialized
        assert "jobText" not in serialized
    finally:
        _reset_for_tests()
        teardown_real_sdk_client()


if __name__ == "__main__":
    tests = [
        test_disabled_by_default_and_requires_dsn,
        test_exact_opt_in_privacy_config_and_once,
        test_success_malformed_and_sdk_failures_drop_or_isolate,
        test_reconstruct_from_hint_rebuilds_valid_failure,
        test_before_send_reconstructs_and_redacts,
        test_extra_fallback_path_still_works,
        test_capture_passes_safe_event_through_hint_not_extra,
        test_none_event_id_returns_dropped,
        test_valid_event_id_returns_queued,
        test_real_sdk_pipeline_delivers_rebuilt_event_without_network,
    ]
    for test_fn in tests:
        setup_function()
        test_fn()
    print("All Sentry telemetry tests passed.")
