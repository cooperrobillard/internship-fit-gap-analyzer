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

1. Observability requirements and privacy/redaction policy.
2. Safe request correlation and error classification.
3. Uptime checks and alerting for Vercel, Render, and critical flows.
4. Deployment-verification and incident-response runbook.
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

Vendor selection and actual telemetry implementation remain future Version 24 work. This document does not choose or integrate Sentry, Datadog, Better Stack, Logtail, Axiom, PostHog, or another vendor.

## Proposed Version 25 sequence

1. Custom-domain configuration.
2. Vercel DNS/domain verification.
3. Clerk production-domain callback and redirect review.
4. Canonical metadata and URL updates.
5. Allowed-origin and provider configuration review.
6. Production smoke test.
7. Portfolio/public-launch update.
