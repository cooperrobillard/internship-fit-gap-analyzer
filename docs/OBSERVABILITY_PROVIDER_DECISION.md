# Observability provider decision

**Status:** Documentation-and-research decision for Version 24 Step 1. No telemetry, SDK, provider account, alert, environment variable, deployment, or custom-domain change is made here.

**Official-source note:** All provider claims below are based on official provider documentation accessed June 28, 2026 America/New_York:

- Vercel Observability: https://vercel.com/docs/observability
- Vercel Logs: https://vercel.com/docs/logs
- Vercel Alerts: https://vercel.com/docs/alerts/configure-alerts
- Vercel Notifications: https://vercel.com/docs/notifications
- Render Health Checks: https://render.com/docs/health-checks
- Render Notifications: https://render.com/docs/notifications
- Supabase Logs: https://supabase.com/docs/guides/telemetry/logs
- Supabase Metrics: https://supabase.com/docs/guides/telemetry/metrics
- Clerk Dashboard: https://clerk.com/docs/guides/dashboard/overview
- Clerk Environment Variables: https://clerk.com/docs/guides/development/clerk-environment-variables
- Sentry Next.js: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Sentry FastAPI: https://docs.sentry.io/platforms/python/integrations/fastapi/
- Sentry server-side scrubbing: https://docs.sentry.io/security-legal-pii/scrubbing/server-side-scrubbing/
- Sentry pricing: https://sentry.io/pricing/
- UptimeRobot pricing: https://uptimerobot.com/pricing/
- Better Stack pricing: https://betterstack.com/pricing
- Axiom pricing: https://axiom.co/pricing
- OpenTelemetry Node.js: https://opentelemetry.io/docs/languages/js/getting-started/nodejs/

## 1. Decision summary

Recommended minimum stack:

1. Existing Vercel, Render, Supabase, and Clerk native dashboards/logs for provider-specific diagnosis.
2. Sentry Developer for manually configured **server-side error monitoring only**, contingent on redaction/sentinel tests.
3. UptimeRobot Free for independent external checks of:
   - the public Vercel frontend;
   - the public Render `/health` endpoint.
4. No external log aggregation initially.
5. No browser Sentry SDK initially.
6. No session replay.
7. No browser tracing.
8. No server tracing or profiling initially.
9. No Sentry Logs.
10. No screenshots or attachments.
11. No OpenTelemetry collector or auto-instrumentation.
12. No public status page.
13. No provider AI-debugging or autonomous-remediation feature.
14. No source-map upload token in the initial integration unless separately justified later.

Expected incremental cost: **$0/month**, assuming current platform plans and free-tier limits.

## 2. Evaluation criteria

- Privacy-safe by default for résumé/job-description processing.
- Supports server-side exception visibility without browser content capture.
- Offers independent external uptime checks.
- Keeps costs at $0/month initially.
- Avoids new account complexity unless justified.
- Avoids broad telemetry surfaces such as replay, browser tracing, logs, screenshots, attachments, and auto-instrumentation.
- Allows future kill switch, environment separation, and sentinel verification.
- Does not require application architecture changes or Supabase/RLS redesign.

## 3. Official-source comparison

| Provider/tool | Officially documented relevant capability | Decision |
| --- | --- | --- |
| Vercel | Observability, tracked request/function/external API events, logs, and notifications; configurable Alerts are a separate paid-plan product | Use native dashboards/logs/observability/notifications; do not assume Hobby-plan configurable Alerts; do not add Vercel Analytics/Speed Insights for this step |
| Render | Health checks and notifications | Use native health/deploy signals for backend diagnosis; external monitor still needed |
| Supabase | Logs Explorer/log querying and metrics | Use native diagnosis only; no third-party browser telemetry initially |
| Clerk | Dashboard and environment variable separation | Use dashboard for auth diagnosis; do not capture Clerk identifiers in telemetry |
| Sentry | Next.js and FastAPI SDKs, server-side scrubbing, Developer pricing | Defer integration; later allow only manually configured server-side errors if redaction tests pass |
| UptimeRobot | Free plan with monitors and 5-minute interval described in pricing comparison table | Use for independent external checks after human account setup |
| Better Stack | Free tier includes uptime, exceptions, logs, metrics, web events, and session replay allowances | Defer because it bundles broader surfaces than needed initially |
| Axiom | Free personal tier with ingest/storage/query allowances and 30-day retention | Defer because external log/event aggregation is not needed initially |
| OpenTelemetry | Node.js setup uses SDK and auto-instrumentations in getting-started flow | Defer because collector/auto-instrumentation/tracing is too broad for current privacy scope |

## 4. Existing native provider capabilities

- Vercel remains the first place to inspect frontend deployments, runtime logs, framework-aware observability, and notifications. Configurable Vercel Alerts are distinct from native logs, observability, and notifications; they require an eligible paid plan and must not be assumed available on Hobby.
- Render remains the first place to inspect backend deploys, service logs, and health-check behavior.
- Supabase Logs Explorer and metrics remain the first place to diagnose database/API/auth-storage provider behavior.
- Clerk dashboard remains the first place to diagnose authentication and environment/key configuration.

Native provider logs may include provider-managed metadata. The application policy therefore limits only application-generated telemetry, not claims about all provider-managed metadata.

## 5. Sentry analysis

Sentry Developer is attractive for this project because it is documented as free for one user and includes error monitoring with email alerts. It can provide server-side exception grouping for the Next.js server/proxy and FastAPI backend without requiring external log aggregation.

However, Sentry must be treated as a privacy-sensitive processor. The future integration must be manual and server-only at first. The Next.js wizard must not be run blindly because generated examples can enable default PII, tracing, logs, browser setup, or session replay.

## 6. Sentry privacy risks and required disabled features

Critical finding: Sentry's official FastAPI documentation states that request URL, HTTP method, headers, form data, and JSON payloads may be attached to issues by default. It also documents that common PII is excluded unless `send_default_pii` is enabled, but that is not enough for this app because raw résumé/job-description text can appear in request JSON.

Therefore future Sentry setup must:

- set `send_default_pii=False`;
- strip request bodies, parsed JSON, form data, headers, cookies, query strings, users, breadcrumbs, uncontrolled contexts, and stack-frame locals before transmission;
- avoid raw exception messages when they may include user content;
- disable browser SDK, session replay, browser tracing, logs, screenshots, attachments, profiling, and source-map upload tokens initially;
- use provider-side scrubbing only as defense in depth;
- pass SDK-side allowlist and sentinel tests before production enablement;
- include a telemetry kill switch.

## 7. UptimeRobot analysis

UptimeRobot Free is sufficient for the initial external monitor layer because the official pricing page describes a $0/month free option and 50 monitors, and its pricing comparison table states Free includes 5-minute intervals. This project initially needs only two simple external checks:

- public Vercel frontend URL;
- Render `/health` endpoint expecting `{"status":"ok"}` behavior.

The UptimeRobot account, monitor creation, alert contacts, MFA, retention review, and billing settings are future human-only work.

## 8. Better Stack alternative

Better Stack's official pricing page lists a free personal-project tier with uptime/heartbeats, email/Slack alerts, exceptions, session replays, logs, metrics, and web events. That breadth is useful for larger operations, but it is too broad for the initial privacy-minimal scope. It also risks encouraging external log aggregation or replay before the redaction model is implemented.

Decision: defer.

## 9. Axiom alternative

Axiom's official pricing page lists a free personal tier with event intelligence, ingest/storage/query allowances, and 30-day retention. It is a plausible future log/event store, but this app does not yet need external log aggregation and should avoid sending operational events to another data store until the allowlist, sentinel tests, retention expectations, and incident process are proven.

Decision: defer.

## 10. Native-only alternative

A native-only approach using Vercel, Render, Supabase, and Clerk dashboards/logs would minimize third-party telemetry risk, but it lacks independent external uptime checks and grouped application exception monitoring. It also does not provide a provider-neutral alerting path for sustained application failures.

Decision: use native providers as the base, then add only UptimeRobot external uptime and Sentry server-side errors after redaction verification.

## 11. OpenTelemetry decision

OpenTelemetry is powerful and vendor-neutral, but the official Node.js getting-started path involves SDK setup and auto-instrumentations. That is broader than this app needs for Version 24 and can capture traces/spans across libraries before the privacy model is proven.

Decision: no OpenTelemetry collector, SDK, exporter, or auto-instrumentation initially.

## 12. Selected stack

Selected initial production observability stack:

- Native Vercel/Render/Supabase/Clerk dashboards and logs.
- Sentry Developer, server-side error monitoring only, later and only after redaction/sentinel tests.
- UptimeRobot Free, two external checks, later and only by human configuration.

## 13. Expected cost

Expected incremental cost is **$0/month**, assuming:

- Sentry Developer remains sufficient for one-user server-side error monitoring;
- UptimeRobot Free remains sufficient for two basic monitors;
- no paid Vercel/Render/Supabase/Clerk plan changes are required;
- no Better Stack, Axiom, external log aggregation, status page, tracing, replay, or AI-debugging feature is enabled.

## 14. Retention

- Retention must be reviewed in each provider account before production enablement.
- No retention setting is changed by this PR.
- Application telemetry must not be used for product analytics or user behavior history.
- Sensitive sentinel payloads must be used only to prove absence/redaction, not retained as provider artifacts.

## 15. Access and MFA

- Human owner creates/configures any provider account.
- MFA should be enabled wherever supported.
- Access should be least-privilege.
- Secrets, DSNs, monitor tokens, webhook URLs, and billing settings must not be committed.

## 16. Required future accounts

Future human-only accounts/configuration may include:

- Sentry organization/project for server-side errors;
- UptimeRobot account with two monitors and alert contact(s).

Existing Vercel, Render, Supabase, and Clerk accounts remain the native diagnosis base.

## 17. Proposed future environment-variable names without values

Names are design placeholders only; this PR adds none:

- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT`
- `SENTRY_RELEASE`
- `SENTRY_TELEMETRY_ENABLED`
- `OBSERVABILITY_TELEMETRY_ENABLED`
- `OBSERVABILITY_REDACTION_TEST_MODE`

Any final names must be reviewed during the future integration PR.

## 18. Human-only configuration

Human-only work:

- create Sentry/UptimeRobot accounts;
- configure MFA, users, billing, retention, alert recipients, monitors, notification channels, and provider-side scrubbing;
- enter DSN/secrets in Vercel/Render environment settings;
- configure production/preview separation;
- validate provider events do not contain forbidden content;
- approve any source-map upload token, if ever separately justified.

## 19. Reasons alternatives were rejected or deferred

- Browser Sentry SDK: deferred to avoid client content, DOM, user-agent, breadcrumbs, and browser context capture.
- Session replay: rejected initially because DOM text and user interaction capture are incompatible with current privacy posture.
- Browser tracing/server tracing/profiling: deferred because timing spans can expand capture surfaces before failure classification is proven.
- Sentry Logs/external log aggregation: deferred to avoid turning telemetry into a broad event store.
- Screenshots/attachments: rejected initially because they may include sensitive pasted content.
- Source-map upload token: deferred because it introduces another secret and build integration that is not required for the first server-only error pass.
- Better Stack/Axiom: deferred because they are broader aggregation platforms than needed for the minimum initial stack.
- OpenTelemetry: deferred because collector/auto-instrumentation is too broad for the initial privacy boundary.
- Public status page: deferred because the current product does not need public incident broadcasting before minimum internal alerts are proven.
- Provider AI-debugging/autonomous remediation: rejected initially because privacy, cost, and operational-control implications need separate review.

## 20. Fallback if Sentry cannot meet the redaction tests

If Sentry cannot meet the required SDK-side allowlist and sentinel redaction tests:

- do not enable Sentry in production;
- retain native platform logs and external uptime;
- continue with provider-neutral correlation/classification;
- evaluate a different error provider only in a separately approved step.

## 21. Implementation sequencing

1. Version 24 Step 1: requirements and provider decision. **This PR.**
2. Version 24 Step 2: vendor-neutral request correlation and failure classification. **Exact next step.**
3. Version 24 Step 3A: bounded code integration PR for minimum telemetry if redaction design is ready.
4. Version 24 Step 3B: human provider configuration and verification.
5. Version 24 Step 4: production verification and incident-response runbook.
6. Version 24 Step 5: observability checkpoint.

No custom-domain work occurs until Version 25.
