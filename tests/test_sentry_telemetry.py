import sys
from pathlib import Path
repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))
from uuid import uuid4
from api.observability import create_safe_analysis_event
from api.sentry_telemetry import _reset_for_tests, capture_safe_failure_to_sentry, reconstruct_sentry_event

SENTINELS=["SENSITIVE_RESUME_SENTINEL_DO_NOT_CAPTURE","SENSITIVE_JOB_SENTINEL_DO_NOT_CAPTURE","SENSITIVE_NOTE_SENTINEL_DO_NOT_CAPTURE","SENSITIVE_TOKEN_SENTINEL_DO_NOT_CAPTURE","SENSITIVE_HEADER_SENTINEL_DO_NOT_CAPTURE","SENSITIVE_COOKIE_SENTINEL_DO_NOT_CAPTURE","SENSITIVE_EXCEPTION_SENTINEL_DO_NOT_CAPTURE","SENSITIVE_IDENTITY_SENTINEL_DO_NOT_CAPTURE","SENSITIVE_URL_SENTINEL_DO_NOT_CAPTURE"]
class FakeSdk:
    def __init__(self, fail_init=False, fail_capture=False): self.calls=[]; self.fail_init=fail_init; self.fail_capture=fail_capture
    def init(self, **kwargs):
        if self.fail_init: raise RuntimeError("boom")
        self.calls.append(("init", kwargs))
    def capture_event(self, event):
        if self.fail_capture: raise RuntimeError("boom")
        self.calls.append(("capture_event", event))

def failure(): return create_safe_analysis_event(request_id=str(uuid4()), service="fastapi_analysis_service", outcome="failure", severity="error", route_template="/analyze", http_method="POST", http_status=500, duration_ms=1, failure_class="backend.unhandled_exception")
def success(): return create_safe_analysis_event(request_id=str(uuid4()), service="fastapi_analysis_service", outcome="success", severity="info", route_template="/analyze", http_method="POST", http_status=200, duration_ms=1)

def setup_function(): _reset_for_tests()

def test_disabled_by_default_and_requires_dsn():
    for cfg in ({}, {"OBSERVABILITY_TELEMETRY_ENABLED":"true"}, {"SENTRY_DSN":"https://fake"}):
        _reset_for_tests(); sdk=FakeSdk(); assert capture_safe_failure_to_sentry(failure(), sdk=sdk, config=cfg)=="disabled"; assert sdk.calls==[]

def test_exact_opt_in_privacy_config_and_once():
    sdk=FakeSdk(); cfg={"OBSERVABILITY_TELEMETRY_ENABLED":"true","SENTRY_DSN":"https://fake","SENTRY_ENVIRONMENT":"bad value","SENTRY_RELEASE":"rel-1"}
    assert capture_safe_failure_to_sentry(failure(), sdk=sdk, config=cfg)=="queued"
    assert capture_safe_failure_to_sentry(failure(), sdk=sdk, config=cfg)=="queued"
    inits=[c for c in sdk.calls if c[0]=="init"]; assert len(inits)==1
    opts=inits[0][1]
    assert opts["send_default_pii"] is False and opts["default_integrations"] is False and opts["auto_enabling_integrations"] is False
    assert opts["max_request_body_size"]=="never" and opts["include_local_variables"] is False and opts["include_source_context"] is False
    assert opts["traces_sample_rate"] is None and opts["enable_logs"] is False and opts["auto_session_tracking"] is False and opts["send_client_reports"] is False
    assert opts["max_breadcrumbs"]==0 and opts["attach_stacktrace"] is False and opts["environment"] is None and opts["release"]=="rel-1"
    assert opts["before_breadcrumb"]({}) is None

def test_success_malformed_and_sdk_failures_drop_or_isolate():
    sdk=FakeSdk(); cfg={"OBSERVABILITY_TELEMETRY_ENABLED":"true","SENTRY_DSN":"https://fake"}
    assert capture_safe_failure_to_sentry(success(), sdk=sdk, config=cfg)=="dropped"; assert sdk.calls==[]
    assert capture_safe_failure_to_sentry({"bad":"event"}, sdk=sdk, config=cfg)=="dropped"
    assert capture_safe_failure_to_sentry(failure(), sdk=FakeSdk(fail_init=True), config=cfg)=="disabled"
    _reset_for_tests(); assert capture_safe_failure_to_sentry(failure(), sdk=FakeSdk(fail_capture=True), config=cfg)=="failed"

def test_before_send_reconstructs_and_redacts():
    safe=failure(); incoming={"event_id":"a"*32,"timestamp":1,"request":{"url":SENTINELS[-1]},"user":{"id":SENTINELS[-2]},"tags":{"evil":SENTINELS[3]},"extra":{"safe_event":safe,"evil":SENTINELS[0]},"exception":{"values":[{"value":SENTINELS[-3]}]},"contexts":{"evil":SENTINELS[1]},"breadcrumbs":[{"message":SENTINELS[2]}]}
    out=reconstruct_sentry_event(incoming); assert out is not None
    text=str(out)
    for s in SENTINELS: assert s not in text
    assert out["message"]=="fastapi_analysis_service:backend.unhandled_exception"
    assert out["extra"]=={"safe_event": safe}
    assert "request_id" not in out["tags"]
    assert reconstruct_sentry_event({"extra":{}}) is None
    bad=dict(safe); bad["release"]=SENTINELS[3]
    assert reconstruct_sentry_event({"extra":{"safe_event":bad}}) is None

if __name__ == "__main__":
    setup_function(); test_disabled_by_default_and_requires_dsn()
    setup_function(); test_exact_opt_in_privacy_config_and_once()
    setup_function(); test_success_malformed_and_sdk_failures_drop_or_isolate()
    setup_function(); test_before_send_reconstructs_and_redacts()
    print("All Sentry telemetry tests passed.")
