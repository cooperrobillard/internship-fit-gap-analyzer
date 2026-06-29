# Version 24 Step 1 — production observability requirements

**Status:** Step 1 policy/design document. No telemetry provider, SDK, alert, uptime monitor, environment variable, deployment, database, RLS, or custom-domain configuration is active from this document.

**Scope:** Define the production observability requirements, redaction policy, failure taxonomy, severity model, and minimum alerting scope before any Version 24 code or provider configuration.

**Official provider research note:** Provider claims in this document are based on official documentation accessed June 28, 2026 America/New_York. Relevant sources include Vercel Observability, Logs, Alerts, and Notifications; Render Health Checks and Notifications; Supabase Logs and Metrics; Clerk Dashboard and Environment Variables; Sentry Next.js, FastAPI, Server-Side Scrubbing, and Pricing; UptimeRobot Pricing; Better Stack Pricing; Axiom Pricing; and OpenTelemetry Node.js getting-started documentation.

## 1. Objectives

- Preserve the existing product privacy boundary while adding enough future operational visibility to diagnose production failures.
- Define what may and may not be emitted before SDK selection or implementation.
- Establish stable provider-neutral failure classes for later request correlation and telemetry.
- Define the minimum alerts needed before custom-domain launch work.
- Keep observability implementation incremental, reversible, and human-configured.

## 2. Non-goals

This step does **not**:

- integrate Sentry, UptimeRobot, OpenTelemetry, or any other provider;
- run a Sentry wizard;
- add browser monitoring, session replay, tracing, profiling, external log aggregation, screenshots, attachments, or source-map upload tokens;
- create accounts, secrets, DSNs, monitors, alerts, dashboards, notification rules, or billing settings;
- change Vercel, Render, Clerk, Supabase, DNS, deployments, RLS, database schema, or application architecture;
- add semantic AI, generated fit scores, rankings, candidate scoring, PDF/DOCX parsing, or raw document persistence.

## 3. Current architecture and monitored surfaces

Current hosted flow:

```text
Browser / Next.js dashboard
→ authenticated Next.js POST /api/analyze
→ Render FastAPI POST /analyze
→ deterministic rule-based analyzer
→ structured result
→ optional direct browser-to-Supabase structured save under Clerk-scoped RLS
```

Future monitoring must cover these surfaces without changing them:

| Surface | Minimum signal | Initial source |
| --- | --- | --- |
| Public Vercel frontend | External availability and provider-native deployment/runtime logs | UptimeRobot Free plus Vercel dashboards/logs |
| Next.js `/api/analyze` proxy | Request outcome class, duration, status, upstream class, sanitized failure class | Future vendor-neutral classification and server-only error monitoring |
| Render `/health` | External availability | UptimeRobot Free and Render native health checks |
| Render `/analyze` | Sanitized server error events and native service logs | Future server-only Sentry if redaction tests pass; Render logs for diagnosis |
| Supabase structured save/read/update/delete | Safe client-side failure classification and Supabase native diagnosis | Existing browser client behavior plus Supabase Logs Explorer; no third-party browser telemetry initially |
| Clerk authentication boundary | Auth/session symptoms and dashboard diagnosis | Clerk dashboard/native provider controls |
| Deployment pipeline | Failed frontend/backend deployment awareness | Vercel/Render native notifications and dashboards |

## 4. Trust boundaries

- Raw résumé text and raw job-description text are transient request inputs, not saved application records.
- Browser-to-Supabase writes remain direct and RLS-scoped; observability must not redesign this path merely to create telemetry.
- Browser code must not use service-role credentials.
- Supabase RLS must not be weakened or bypassed.
- Provider dashboards/logs may contain provider-managed metadata; application telemetry cannot guarantee those native providers are absent of all metadata.
- Third-party telemetry providers must be treated as additional processors of operational data and therefore receive only allowlisted, redacted, non-user-identifying fields.

## 5. Data classification

| Class | Examples | Telemetry posture |
| --- | --- | --- |
| Forbidden sensitive content | Raw résumé text, raw job-description text, uploads, parsed JSON input, notes, source URLs, profile descriptions, skill lists | Never intentionally emit |
| Direct identifiers | Names, email addresses, Clerk user IDs, Supabase row IDs, analysis IDs, IP addresses | Never intentionally emit |
| Secrets and session material | Cookies, authorization headers, `X-Analysis-Api-Key`, tokens, secret keys, env var values | Never emit; treat detection as security incident |
| Browser/user-agent context | User agents, DOM text, browser storage, console logs, breadcrumbs, screenshots, replay | Disabled initially; never intentionally capture |
| Operational metadata | Route template, method, status, duration, service, release, environment, failure class | Allowed only if explicitly allowlisted |
| Provider-managed metadata | Native platform log metadata, platform request IDs, infrastructure metadata | Use only in provider dashboards; cannot be represented as guaranteed absent |

## 6. Explicit telemetry allowlist

Application-generated telemetry may contain only this shape unless a later privacy review expands it:

- `schema_version`
- `event_name`
- `event_id`
- `request_id`
- `timestamp`
- `service`
- `operation`
- `outcome`
- `failure_class`
- `severity`
- `environment`
- `release`
- `route_template`
- `http_method`
- `http_status`
- `duration_ms`
- `upstream_status_class`
- `retry_count`
- `rate_limit_result`
- `payload_size_bucket`
- `runtime_name`
- `runtime_version`

## 7. Explicit telemetry denylist

Never intentionally capture:

- raw résumé text;
- raw job-description text;
- uploads;
- request or response bodies;
- parsed JSON input;
- notes;
- source URLs;
- profile descriptions;
- skill lists;
- names;
- email addresses;
- Clerk user IDs;
- Supabase row IDs;
- analysis IDs;
- IP addresses;
- user agents;
- cookies;
- authorization headers;
- `X-Analysis-Api-Key`;
- tokens;
- secret keys;
- environment-variable values;
- query strings;
- full URLs;
- browser storage;
- DOM text;
- console logs;
- breadcrumbs;
- stack-frame locals;
- screenshots;
- attachments;
- session replay.

## 8. Provider-managed logging limitation

Vercel, Render, Supabase, and Clerk native dashboards/logs are still required for provider-specific diagnosis. Their official products expose provider-managed observability, logs, metrics, dashboard, alert, or notification capabilities, but the application cannot promise those native systems never contain provider metadata such as infrastructure request identifiers, timing, request metadata, deployment metadata, or dashboard-visible operational context.

Application-owned telemetry therefore has a stricter allowlist than provider-native logs. Provider-side scrubbing is defense in depth, not the primary privacy boundary.

## 9. Request-correlation principles

- Generate or propagate a random, non-user-derived request/correlation ID for each analysis request path in a future Step 2.
- Do not derive request IDs from Clerk IDs, Supabase IDs, analysis IDs, IP addresses, emails, names, or document content.
- Prefer route templates such as `/api/analyze` and `/analyze` instead of full URLs.
- Do not include query strings.
- Use provider-neutral failure classes consistently across frontend proxy and backend.
- Correlation must help connect Vercel proxy behavior to Render backend behavior without identifying a user or saved record.

## 10. Stable failure taxonomy

These names are **design requirements**, not implemented behavior yet:

| Failure class | Meaning |
| --- | --- |
| `request.validation_failed` | Expected invalid input shape or field validation failure |
| `request.payload_too_large` | Request exceeds configured size limit |
| `request.rate_limited` | Request blocked by rate limiting |
| `resource.not_found` | Requested user-owned resource is unavailable or not found |
| `operation.cancelled` | User/browser cancelled a request or action |
| `auth.session_not_ready` | Auth state has not resolved yet |
| `auth.session_stale` | Session expired or is stale |
| `auth.authorization_denied_unexpected` | Unexpected authorization denial outside normal not-found/RLS behavior |
| `proxy.upstream_timeout` | Next.js proxy timed out waiting for backend |
| `proxy.upstream_unreachable` | Backend network connection failed |
| `proxy.upstream_invalid_response` | Backend response could not be parsed or violated contract |
| `proxy.upstream_5xx` | Backend returned 5xx to proxy |
| `backend.unhandled_exception` | Backend raised unhandled server exception |
| `backend.serialization_failed` | Backend failed to serialize/deserialize allowed response shape |
| `data.network_failed` | Browser Supabase/network request failed |
| `data.read_failed` | User-owned data read failed unexpectedly |
| `data.write_failed` | User-owned structured save failed unexpectedly |
| `data.update_failed` | User-owned structured update failed unexpectedly |
| `data.delete_failed` | User-owned delete failed unexpectedly |
| `config.backend_url_missing` | Required backend URL configuration missing |
| `config.shared_secret_rejected` | Backend rejected shared secret or proxy auth |
| `config.supabase_unavailable` | Supabase unavailable or client cannot reach expected project |
| `availability.frontend_down` | External monitor cannot reach public frontend |
| `availability.backend_health_down` | External monitor cannot reach Render `/health` |
| `availability.analysis_path_sustained_failure` | Sustained failures across analysis path exceed threshold |
| `deployment.frontend_failed` | Vercel frontend deployment failed |
| `deployment.backend_failed` | Render backend deployment failed |
| `observability.delivery_failed` | Telemetry/alert delivery failed without affecting user path |
| `privacy.redaction_test_failed` | Sentinel/redaction test found unsafe telemetry behavior |
| `privacy.sensitive_data_detected` | Sensitive content detected in emitted telemetry/provider event |
| `security.secret_detected` | Secret/token/key detected in telemetry, logs, repo, or provider event |
| `security.identity_collection_detected` | User identifiers detected in telemetry outside approved design |

## 11. Severity definitions

| Severity | Definition | Expected user-facing outcome | Alerting posture |
| --- | --- | --- | --- |
| Expected user-facing outcome | Normal, expected user-correctable state such as validation, size, rate-limit, cancellation, or unavailable record | Calm UI message; no raw details | No alert |
| Operational warning | Degraded or unusual behavior that may need review but is not currently breaking core availability | User may see retry/cooldown or a recoverable message | Optional digest/dashboard review; no immediate page initially |
| Recoverable operational error | Server, proxy, data, or provider failure that affects a request but not sustained availability | Friendly retry/error copy | Alert only if threshold/sustained pattern is met |
| Critical availability/configuration incident | Frontend down, backend health down, deployment failed, shared secret rejected, backend URL missing, sustained analysis failure | Core app path unavailable or misconfigured | Immediate email/notification once providers are configured |
| Security/privacy incident | Secret detected, sensitive data emitted, identity collection detected, redaction test failed | Do not expose details to users; preserve evidence and disable unsafe telemetry | Immediate incident response; kill switch if telemetry is implicated |

## 12. Alert matrix

Minimum future alerting scope:

| Signal | Failure class | Source | Minimum trigger | Initial recipient/action |
| --- | --- | --- | --- | --- |
| Public frontend unavailable | `availability.frontend_down` | UptimeRobot Free | External HTTP monitor reports down according to configured free-tier interval | Human email notification; check Vercel dashboard/logs |
| Render health unavailable | `availability.backend_health_down` | UptimeRobot Free + Render health status | `/health` does not return expected healthy response | Human email notification; check Render logs/events |
| Frontend deployment failed | `deployment.frontend_failed` | Vercel native notifications | Vercel deployment failure | Human reviews Vercel build/deployment output |
| Backend deployment failed | `deployment.backend_failed` | Render native notifications | Render deploy failure | Human reviews Render deploy logs |
| Shared secret rejected | `config.shared_secret_rejected` | Future server-side classification/Sentry if approved | Any production occurrence, because it can indicate misconfiguration or secret drift | Human checks environment variables without exposing values |
| Backend URL missing | `config.backend_url_missing` | Future server-side classification/Sentry if approved | Any production occurrence | Human checks Vercel env configuration |
| Sustained analysis failures | `availability.analysis_path_sustained_failure` | Future correlation/classification plus server-only Sentry/native logs | Threshold to be defined in Step 3 after instrumentation design | Human checks Vercel, Render, and backend contract |
| Sensitive telemetry detected | `privacy.sensitive_data_detected` | Sentinel tests/provider review | Any occurrence | Disable telemetry via kill switch and investigate |
| Secret detected | `security.secret_detected` | Sentinel tests/credential scans/provider review | Any occurrence | Rotate affected secret and disable unsafe emission |

## 13. Expected outcomes that must not alert

These expected outcomes should produce calm UI behavior and may be counted in aggregate later, but must not generate immediate production alerts:

- 400/422 validation;
- 413 oversized payload;
- 429 rate limiting;
- user cancellation;
- record not found/already unavailable.

## 14. Retention policy

- Keep application-generated telemetry minimal and short-lived by default.
- Use free-tier/provider-default retention only after human review of provider settings.
- Do not export native logs to an external aggregator initially.
- Do not use telemetry as a product analytics store.
- Do not preserve sensitive sentinel-test payloads in provider systems; sentinel tests must assert absence/redaction rather than store examples.
- Retention settings for Sentry, UptimeRobot, Vercel, Render, Supabase, and Clerk are future human-only account/configuration review items.

## 15. Access/MFA policy

- Provider accounts must be created/configured only by the human owner.
- MFA should be enabled wherever supported.
- Access should be least-privilege and limited to people responsible for operating the app.
- Do not share provider credentials, DSNs, API tokens, or webhook secrets in the repository.
- Billing settings and plan changes are human-only.

## 16. Environment and release tagging

Future telemetry must tag:

- `environment`: `production`, `preview`, or `local`;
- `release`: commit SHA or deployment release identifier;
- `service`: frontend proxy or backend service;
- `runtime_name` and `runtime_version` only if they are non-sensitive platform/runtime values.

Preview and local telemetry must not route into production alert channels unless explicitly configured later.

## 17. Kill-switch requirement

Any future third-party telemetry integration must include a human-controlled kill switch so production telemetry can be disabled without redeploying risky code paths where practical. The kill switch must default safe when configuration is absent and must not expose secret values in logs or UI.

## 18. Provider-failure isolation requirement

Observability provider failures must not break analysis, save, read, export, comparison, deletion, or profile flows. Telemetry delivery failures should be represented only as `observability.delivery_failed` in safe internal logs or native dashboards and must be non-blocking.

## 19. Redaction and sentinel verification strategy

Sentry's official FastAPI documentation says request URL, HTTP method, headers, form data, and JSON payloads may be attached to issues by default, while `send_default_pii=False` excludes common PII only unless default PII is enabled. Therefore:

- `send_default_pii=False` is necessary but not sufficient;
- SDK setup must be manual, not wizard-driven;
- `request.data`/JSON, headers, cookies, query strings, users, breadcrumbs, uncontrolled context, and stack-frame locals must be stripped before transmission;
- raw exception messages must not be assumed safe;
- provider-side scrubbing is defense in depth, not the primary privacy boundary;
- SDK-side allowlist enforcement and sentinel tests are mandatory before production enablement.

Sentinel tests must attempt to pass representative forbidden strings through failure paths and verify they do not appear in outbound telemetry events, provider events, local snapshots, or captured exception context.

## 20. Production/preview/local separation

- Production telemetry must use production project/account separation.
- Preview telemetry, if ever enabled, must be segregated from production alerts and retention review.
- Local development should default to disabled telemetry or stdout-only safe diagnostics.
- No local secrets or DSNs should be committed.
- No provider monitor should target preview URLs unless a later task explicitly approves it.

## 21. Incident-response implications

- Incidents require correlation IDs, timestamps, service, environment, release, route template, status, and failure class—not raw user content.
- Privacy/security events take priority over diagnostic convenience.
- If sensitive data is detected in telemetry, disable telemetry, preserve minimal evidence, rotate affected secrets if any, and review provider deletion/retention controls.
- Native provider dashboards remain the diagnosis path for infrastructure details.
- Hosted behavior must not be described as security-audited merely because monitoring exists.

## 22. Version 24 implementation sequence

1. Requirements and provider decision. **This PR.**
2. Vendor-neutral request correlation and failure classification. **Exact next step.**
3. Minimum production telemetry and alerting, split into:
   - Step 3A: bounded code integration PR;
   - Step 3B: human provider configuration and verification.
4. Production verification and incident-response runbook.
5. Observability checkpoint.

Custom-domain work remains Version 25.

## 23. Remaining limitations

- No telemetry provider is integrated yet.
- No alerts or uptime monitors are active yet.
- No provider account has been created by this PR.
- No production configuration has changed.
- Isolated browser-side Supabase failures will not initially generate immediate email alerts.
- Basic monitoring remains incomplete until later Version 24 steps.
- Native provider logging may contain provider-managed metadata that the app cannot classify as guaranteed absent.
