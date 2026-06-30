# Version 24 release direction — observability before custom domain

**Decision:** Version 24 prioritizes privacy-safe production observability before custom-domain launch work.

## Rationale

A custom domain improves branding and discoverability, but it does not detect outages, request failures, elevated errors, broken provider integrations, or deployment regressions. An observability, log-retention, alerting, and PII-redaction policy is now documented through Version 24 Step 1, request correlation and server-only Sentry integration exist from Steps 2 and 3A, and human-controlled Sentry/UptimeRobot provider configuration passed Step 3B verification. Broader public launch should still wait for the Step 4 production observability verification and incident-response runbook.

Version 24 Step 1 defined the minimum operational foundation, privacy boundaries, and a provisional provider direction. Custom-domain launch work still belongs after that foundation is implemented and verified.

## Decision matrix

| Criterion                                | Observability first |           Custom domain first |
| ---------------------------------------- | ------------------: | ----------------------------: |
| Detects production failures              |              Strong |                          None |
| Reduces launch risk                      |              Strong |                           Low |
| Supports incident response               |              Strong |                          None |
| Clarifies privacy/logging boundaries     |              Strong |                          None |
| Improves branding                        |                 Low |                        Strong |
| Improves discoverability                 |                 Low |                        Strong |
| Appropriate before broader public launch |                 Yes | Only after minimum monitoring |

## Proposed Version 24 sequence

1. Observability requirements and provider decision. **Designed/documented in [`VERSION_24_STEP_1_OBSERVABILITY_REQUIREMENTS.md`](VERSION_24_STEP_1_OBSERVABILITY_REQUIREMENTS.md) and [`OBSERVABILITY_PROVIDER_DECISION.md`](OBSERVABILITY_PROVIDER_DECISION.md); no telemetry provider is integrated yet.**
2. Vendor-neutral request correlation and failure classification. **Implemented in [`VERSION_24_STEP_2_REQUEST_CORRELATION.md`](VERSION_24_STEP_2_REQUEST_CORRELATION.md) with native server-log emission only; no external provider delivery is active.**
3. Minimum production telemetry and alerting, split into:
   - Step 3A: bounded code integration PR. **Implemented as a disabled-by-default server-only Sentry adapter with strict safe-event reconstruction; no provider account, DSN, delivery, alert, uptime monitor, or production configuration is active.**
   - Step 3B: human provider configuration and verification. **Completed and documented in [`VERSION_24_STEP_3B_PROVIDER_CONFIGURATION.md`](VERSION_24_STEP_3B_PROVIDER_CONFIGURATION.md): Sentry proxy/API projects, provider-side scrubbing, IP storage disablement, branch-specific Preview proxy canary before production enablement, local FastAPI synthetic verification, Vercel/Render production enablement, alert rules, UptimeRobot frontend/backend monitors, and notification tests passed against deployed commit `a272b760d97258ceb6eb3edef8852b5dcf005bd9`.**
4. Production verification and incident-response runbook. **Next: Version 24 Step 4.**
5. Production observability checkpoint.

## Observability privacy boundaries

Do not capture by default:

- raw résumé text;
- raw job-description text;
- uploaded file contents;
- full analysis request bodies;
- saved notes;
- source URLs;
- access tokens;
- session tokens;
- shared API secrets;
- Supabase keys;
- Clerk secrets;
- unrestricted session replay;
- arbitrary DOM text; or
- full database payloads.

Prefer narrowly scoped fields such as:

- generated request or correlation ID;
- route;
- HTTP status;
- request duration;
- coarse sanitized error class;
- service/provider name;
- environment;
- deployment commit;
- timestamp;
- rate-limit result; and
- payload-size category rather than body contents.

Version 24 Step 2 adds transient request IDs, safe `X-Request-ID` propagation, stable failure classes, and sanitized server-native JSON events for the analysis path. Version 24 Step 3A adds a server-only Sentry SDK adapter behind an explicit kill switch. Version 24 Step 3B documents completed human-controlled provider configuration: Sentry delivery for the approved server-side proxy/API failure messages, Sentry alert rules, provider-side redaction checks, UptimeRobot frontend/backend monitors, and notification tests passed against deployed commit `a272b760d97258ceb6eb3edef8852b5dcf005bd9`. The next step is still production observability verification and an incident-response runbook; Step 3B does not claim full observability completion, formal security audit, database/RLS changes, Clerk/Supabase changes, workflow changes, dependency changes, or custom-domain work.

## Proposed Version 25 sequence

1. Custom-domain configuration.
2. Vercel DNS/domain verification.
3. Clerk production-domain callback and redirect review.
4. Canonical metadata and URL updates.
5. Allowed-origin and provider configuration review.
6. Production smoke test.
7. Portfolio/public-launch update.
