# Version 24 release direction — observability before custom domain

**Decision:** Version 24 prioritizes privacy-safe production observability before custom-domain launch work.

## Rationale

A custom domain improves branding and discoverability, but it does not detect outages, request failures, elevated errors, broken provider integrations, or deployment regressions. The repository does not yet have a complete product-defined observability, log-retention, alerting, and PII-redaction policy. Broader public launch should not proceed blind.

Observability must be designed before a vendor or instrumentation is selected. The next release should define the minimum operational foundation and privacy boundaries first; custom-domain launch work belongs after that foundation exists.

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
2. Vendor-neutral request correlation and failure classification. **This remains the exact next step.**
3. Minimum production telemetry and alerting, split into:
   - Step 3A: bounded code integration PR;
   - Step 3B: human provider configuration and verification.
4. Production verification and incident-response runbook.
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

Version 24 Step 1 now selects a minimum direction of native Vercel/Render/Supabase/Clerk dashboards and logs, manually configured server-only Sentry Developer if redaction tests pass, and UptimeRobot Free external checks. Actual telemetry implementation, provider accounts, alerts, uptime monitors, environment variables, deployments, and production configuration remain future work; none are active yet.

## Proposed Version 25 sequence

1. Custom-domain configuration.
2. Vercel DNS/domain verification.
3. Clerk production-domain callback and redirect review.
4. Canonical metadata and URL updates.
5. Allowed-origin and provider configuration review.
6. Production smoke test.
7. Portfolio/public-launch update.
