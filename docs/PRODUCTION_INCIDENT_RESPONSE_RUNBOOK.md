# Production incident-response runbook

**Product:** Job Fit & Skill-Gap Analyzer
**Scope:** Hosted production app only. This runbook is operational guidance; it does not authorize changing provider settings, secrets, database schema, RLS, Clerk, Supabase, DNS, or runtime code without a separate approved task.

## 1. Purpose and scope

Use this runbook to triage, contain, recover, and close production incidents while preserving the project's privacy boundary. It covers the public Vercel frontend, authenticated Next.js analysis proxy, Render FastAPI backend, Sentry server-side telemetry, UptimeRobot monitors, Clerk authentication symptoms, and Supabase/RLS concerns.

## 2. Current production architecture

```text
Browser / Next.js dashboard on Vercel
→ authenticated Next.js POST /api/analyze
→ Render FastAPI POST /analyze
→ deterministic rule-based analysis
→ structured result
→ optional direct browser-to-Supabase structured save under Clerk-scoped RLS
```

Render also exposes public `GET /health`, expected to return `{"status":"ok"}`. Browser-to-Supabase activity is outside the analysis request-ID correlation path.

## 3. Monitoring sources

- Vercel dashboard and native logs for frontend, deployments, and `/api/analyze` proxy behavior.
- Render dashboard, deploy/service-health indicators, logs, and public `/health` checks.
- Sentry server-side projects for allowlisted application failure events only.
- UptimeRobot permanent frontend and backend-health monitors for external availability.
- Clerk dashboard for authentication-provider symptoms.
- Supabase dashboard/logs for structured-data and RLS concerns.

Application-level events delivered to Sentry are not the same as provider/platform failures. Provider failures may produce no Sentry event. Successful-request correlation relies on Vercel and Render native logs, not Sentry.

## 4. Privacy boundaries

Never paste raw Sentry events into GitHub, documentation, pull requests, chat, or learning logs. Never record DSNs, tokens, environment-variable values, email addresses, provider IDs, Clerk IDs, Supabase identifiers, résumé text, job-description text, headers, cookies, request bodies, or response bodies. Do not record request IDs in long-term evidence unless strictly necessary.

Never disable RLS as an incident workaround. Never expose a Supabase service-role key. Never add a production debug endpoint. Never change application behavior solely to make an incorrectly configured monitor green. Observability must never become a dependency of analysis behavior.

## 5. Severity definitions

- **SEV-1:** Privacy/security exposure, exposed secret, destructive data-control failure, or RLS isolation concern.
- **SEV-2:** Core public workflow unavailable, sustained backend outage, broad authentication failure, or analysis unavailable.
- **SEV-3:** Partial degradation, isolated sanitized server error, intermittent timeout, or short-lived provider degradation.
- **SEV-4:** Monitoring noise, documentation issue, false-positive alert, or no-user-impact operational anomaly.

## 6. Standard response lifecycle

```text
Detect → Confirm → Classify → Contain → Diagnose → Recover → Verify → Close → Follow up
```

## 7. Detection and confirmation

1. Identify the signal source: user report, UptimeRobot, Sentry alert, Vercel, Render, Clerk, or Supabase.
2. Confirm with at least one independent source when safe.
3. Use sanitized observations only: status, route template, failure class, service, timestamp, duration, and deployment commit.
4. Do not copy raw logs or payloads into the incident record.

## 8. Request-ID correlation procedure

1. For an analysis request, obtain the `X-Request-ID` from the browser response or safe browser tooling.
2. Confirm it is a canonical lowercase UUIDv4 and not user-derived.
3. Search Vercel native logs for the same ID on `/api/analyze`.
4. Search Render native logs for the same ID on `/analyze`.
5. Confirm status, duration, service, operation, and sanitized outcome match expectations.
6. Remember: direct browser-to-Supabase activity, Clerk redirects, platform/WAF responses, and UptimeRobot checks are outside this correlation path.

## 9. Vercel investigation procedure

1. Check current production deployment status and commit.
2. Inspect `/api/analyze` route logs around the incident window using safe filters.
3. Look for sanitized failure classes such as `proxy.upstream_timeout`, `proxy.upstream_unreachable`, `proxy.upstream_5xx`, `config.backend_url_missing`, or `config.shared_secret_rejected`.
4. Do not reveal environment-variable values while checking configuration presence.
5. Compare with Render logs before concluding the proxy or backend is at fault.

## 10. Render investigation procedure

1. Check service health, deploy state, and current deployed commit.
2. Verify public `/health` from an external shell if needed.
3. Inspect `/analyze` logs for matching request IDs or sanitized backend events.
4. Confirm whether failures are sustained or transient.
5. Do not add shell-only debug endpoints or change runtime behavior to investigate.

## 11. Sentry investigation procedure

1. Open only the relevant server-side project.
2. Review issue title, sanitized tags, failure class, service, route template, release, and timestamps.
3. Confirm no forbidden context is present.
4. Do not paste raw Sentry JSON or event bodies into records.
5. Remember that successful production behavior should normally be absent from Sentry.

## 12. UptimeRobot investigation procedure

1. Check the permanent frontend monitor and backend-health monitor.
2. Confirm whether either monitor reports an active incident.
3. Compare monitor history with direct Vercel/Render checks.
4. Remove any temporary monitor used for testing after verification.
5. Treat one-off external-check anomalies with healthy provider evidence as possible SEV-4 unless user impact or sustained failure is confirmed.

## 13. Frontend-down procedure

Classify as SEV-2 unless privacy/security evidence makes it SEV-1. Confirm with UptimeRobot, browser smoke test, and Vercel deployment status. If Vercel shows deployment regression, use the rollback procedure. Verify landing page, sign-in entry, and dashboard load after recovery.

## 14. Backend-health-down procedure

Classify as SEV-2 when sustained. Confirm UptimeRobot backend monitor, direct `/health`, Render service health, and recent deploys. If `/health` recovers quickly and monitors show no sustained outage, consider SEV-4 or SEV-3 based on impact evidence.

## 15. Proxy-timeout procedure

Investigate `proxy.upstream_timeout`. Confirm Vercel duration, Render response timing, and UptimeRobot backend state. Recover by waiting out a provider degradation, rolling back a known deployment regression, or opening a narrow runtime fix only after cause is confirmed.

## 16. Upstream-unreachable procedure

Investigate `proxy.upstream_unreachable`. Confirm Render service availability and Vercel backend URL configuration presence without exposing values. Do not rotate or reveal secrets unless evidence indicates secret exposure or drift.

## 17. Proxy/backend 5xx procedure

For `proxy.upstream_5xx` or generic 5xx, correlate Vercel and Render by request ID. If Render logged `backend.unhandled_exception`, follow the backend procedure. If the provider returned a platform 5xx with no application event, treat it as provider/platform evidence, not a Sentry application event.

## 18. Backend unhandled-exception procedure

Review the sanitized Sentry issue and Render logs for `backend.unhandled_exception`. Confirm redaction. If isolated and no user impact is known, classify SEV-3; if sustained analysis is unavailable, classify SEV-2. Open a narrowly scoped code fix only after preserving sanitized evidence.

## 19. Proxy configuration-failure procedure

For `config.backend_url_missing` or another critical proxy configuration failure, classify SEV-2 unless a secret/privacy exposure makes it SEV-1. Verify configuration presence in Vercel without revealing values. Human approval is required for provider setting changes.

## 20. Shared-secret rejection procedure

For `config.shared_secret_rejected`, classify at least SEV-2 because analysis may be unavailable and configuration drift is possible. Check Vercel and Render environment-variable presence without exposing values. If a secret is suspected exposed, escalate to SEV-1 and rotate with human approval.

## 21. Deployment-regression procedure

Compare the current deployed commit with the last known healthy commit. Check Vercel and Render deployment logs. If regression is confirmed, roll back the affected provider only; do not change database/RLS/Clerk/Supabase as a shortcut.

## 22. Clerk/authentication incident procedure

Classify broad sign-in/session failure as SEV-2. Check Clerk dashboard status and application sign-in behavior. Do not record Clerk IDs, user emails, session tokens, or cookies. Do not change redirect/domain settings without a separate approved task.

## 23. Supabase/data/RLS concern procedure

Classify any RLS isolation concern, cross-user data visibility, service-role exposure, or destructive data-control failure as SEV-1. Stop normal debugging. Preserve sanitized evidence without IDs or payloads. Never disable RLS. Do not run production SQL without explicit human approval.

## 24. Sensitive-data-in-Sentry procedure

If sensitive data is found in Sentry:

```text
SEV-1
→ disable the affected telemetry kill switch
→ redeploy the affected service
→ confirm the application still works
→ inspect scope without copying sensitive payloads
→ delete the affected Sentry issue
→ consider recreating the Sentry project if exposure is widespread
→ rotate any exposed secret
→ open a narrowly scoped privacy fix
→ do not re-enable telemetry until sentinel tests pass
```

## 25. Telemetry kill-switch procedure

Disable `OBSERVABILITY_TELEMETRY_ENABLED` for the affected Vercel and/or Render production environment through provider dashboards, then redeploy the affected service. Keep native sanitized logs and core analysis behavior working. Do not delete code or alter analysis behavior merely to stop telemetry.

## 26. Noisy-alert or false-positive-monitor procedure

Classify no-user-impact monitor noise as SEV-4 after confirmation. Check UptimeRobot, Vercel, Render, and Sentry. Adjust monitor or alert configuration only through a human-approved provider-configuration task. Never change app behavior solely to satisfy an incorrectly configured monitor.

## 27. Vercel rollback procedure

Use Vercel's dashboard rollback or promote the last known healthy deployment after human approval. Record only the target commit SHA, timestamp, and sanitized reason. Re-verify landing page, sign-in entry, dashboard, analysis proxy, request ID, and Sentry absence for successful behavior.

## 28. Render rollback procedure

Use Render's rollback/manual deploy controls after human approval. Record only the target commit SHA, timestamp, and sanitized reason. Re-verify `/health`, `/analyze` through the frontend, request-ID propagation, and absence of new Sentry application errors.

## 29. Recovery verification

Minimum recovery checks:

- frontend loads;
- sign-in path works;
- dashboard loads;
- fictional analysis succeeds;
- `/health` returns HTTP 200 and `{"status":"ok"}`;
- `X-Request-ID` is returned on analysis;
- request ID correlates across browser, Vercel, and Render when applicable;
- successful behavior remains absent from Sentry;
- UptimeRobot permanent monitors are up;
- no secrets, stack traces, private text, headers, cookies, bodies, or identifiers are visible.

## 30. Incident closure

Close only after recovery is verified and severity is confirmed. Document sanitized timeline, classification, affected surface, recovery action, checks run, limitations, and follow-up. Do not include raw logs, raw events, private identifiers, provider IDs, payloads, or secrets.

## 31. Sanitized incident-record template

```text
Incident title:
Date/time window UTC:
Severity:
Status:
Detected by:
Affected surface:
User impact:
Root cause:
Recovery action:
Repository commit:
Vercel deployed commit:
Render deployed commit:
Sanitized chronology:
Request-correlation result:
Sentry result:
UptimeRobot result:
Privacy review result:
Recovery verification:
Known limitations:
Follow-up:
```

Use `not confirmed` for root cause when evidence does not prove a cause.

## 32. Known limitations

- No browser monitoring, session replay, tracing, profiling, source-map upload, external log aggregation, or OpenTelemetry is approved.
- Native provider logs may contain provider-managed metadata outside application allowlists.
- Direct browser-to-Supabase activity is not correlated by `X-Request-ID`.
- Platform/Clerk/WAF-generated responses may not include the application request ID.
- The hosted Render backend failure path should not be deliberately triggered with unsafe debug endpoints.
- This runbook is not a formal security audit, penetration test, legal review, or compliance certification.

## 33. Scheduled operational review

At each production checkpoint or before broader public launch, review: monitor state, alert rules, notification path, kill-switch readiness, rollback targets, Sentry redaction, provider commit identity, documented limitations, and whether any new feature changed the privacy boundary.
