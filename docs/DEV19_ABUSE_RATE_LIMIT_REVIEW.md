# Dev 19 Step 4 — Abuse and Rate-Limit Review

**Status:** Prepared for human activation. The Vercel Firewall/WAF rule described here is **not configured by this PR** and production verification is pending.

Related: [`HOSTED_PROTOTYPE_SMOKE_TEST.md`](HOSTED_PROTOTYPE_SMOKE_TEST.md), [`PUBLIC_PRODUCT_ROADMAP.md`](PUBLIC_PRODUCT_ROADMAP.md), [`DEV19_RLS_AUTH_REVERIFICATION.md`](DEV19_RLS_AUTH_REVERIFICATION.md).

## Scope

This review records the current abuse posture for the hosted analysis flow and the bounded application behavior added for safe client/proxy handling. It does not configure provider settings, change infrastructure, add dependencies, add secrets, or implement a distributed quota system.

## Existing controls

- **Clerk authentication on the Next.js analysis route.** Browser analysis calls go to the protected Next.js `/api/analyze` route before the Render backend is contacted.
- **Server-side Render shared secret.** The Next.js route forwards the configured shared secret to Render server-side only; browser code does not receive it.
- **Backend field limits.** The FastAPI/Pydantic request model limits `resumeText` and `jobText` to 100,000 characters each.
- **Safe validation and error handling.** Backend validation is sanitized before returning to the browser, and proxy/backend failures use stable public messages rather than raw stack traces or provider internals.
- **Backend timeout.** The Next.js proxy keeps the existing 25-second backend timeout so slow backend calls do not hang indefinitely.
- **Render platform DDoS protection.** Render provides platform-level network protection for the hosted FastAPI service, separate from application-specific abuse controls.
- **No raw-input persistence.** Running analysis does not save raw resume text or raw job-description text; saved analyses store structured skills and metadata only.

## Main exposure

- Repeated authenticated calls to `/api/analyze` can repeatedly invoke the comparatively expensive analysis path.
- Oversized requests can consume proxy/application resources before backend field validation runs, especially when request bodies are larger than the accepted backend fields.
- Automated account creation or distributed sources can still generate abuse patterns that per-IP fixed-window rules may not fully stop.
- Direct Supabase save/profile abuse is a separate concern from the analysis route and should be reviewed independently with RLS, quotas, and product requirements in mind.
- IP-based limiting can cause shared-IP false positives for campuses, offices, households, VPNs, or mobile networks.

## Chosen bounded protection

### Planned human-configured Vercel rule

```text
Vercel path: /api/analyze
Method: POST
Strategy: Fixed Window
Window: 60 seconds
Limit: 20 requests
Counting key: IP
Action: 429
```

This PR does **not** configure that rule. Vercel Firewall settings are human-controlled, and provider activation plus production verification remain pending after merge/deploy.

### Application behavior prepared by this PR

- The Next.js proxy has a named request-body ceiling of 1,000,000 UTF-8 bytes for `/api/analyze`.
- The route still authenticates with Clerk before reading or parsing the request body.
- A valid numeric `Content-Length` header that clearly exceeds the ceiling is rejected with safe `413 Payload Too Large` JSON.
- The route also measures the received UTF-8 body before JSON parsing or forwarding and rejects oversized bodies with the same safe `413` response.
- Oversized requests are not forwarded to Render.
- Malformed JSON continues to return a safe `400` response.
- Backend `422` validation passthrough, timeout behavior, shared-secret forwarding, and successful response shape are preserved.
- The browser client treats `429` before trusting or rendering any response body, uses stable public copy, and preserves inputs.
- The dashboard adds a local cooldown after `429` using the `Retry-After` header only when it is a valid integer clamped to 1–600 seconds; otherwise it defaults to about 60 seconds.

The request-body ceiling is a proxy-level application safeguard, not a network-edge body-size guarantee. Very large requests may still be rejected or handled by platform infrastructure before application code executes.

## Non-goals and limitations

- No new provider, dependency, secret, environment variable, Redis, Upstash, database-backed limiter, in-memory limiter, module-global counter, or external SDK was added.
- No in-memory limiter was added because serverless process memory is not a reliable global counter across instances, regions, or cold starts.
- The planned Vercel rule is not bot prevention, account-level quotas, a formal security audit, or comprehensive abuse prevention.
- The implementation does not use `x-forwarded-for` for application limiting and does not log IP addresses, Clerk user IDs, request bodies, resume text, or job-description text.
- This review does not change Supabase schema, RLS policies, Clerk configuration, Render configuration, workflows, dependencies, or deployment settings.

## Human activation checklist

All production results are pending until a human configures the provider rule and verifies the deployed app.

### Configure Vercel Firewall/WAF rule

1. Open the Vercel dashboard for the production project.
2. Go to the project Firewall or WAF settings.
3. Add a rate-limit rule with:
   - Path: `/api/analyze`
   - Method: `POST`
   - Strategy: `Fixed Window`
   - Window: `60 seconds`
   - Limit: `20 requests`
   - Counting key: `IP`
   - Action: `429`
4. Save/apply the rule according to the Vercel dashboard flow.
5. Confirm the rule is active for the production deployment target.

### Production verification checklist

Use synthetic resume and job text only. Do not run repeated load or stress testing.

| Check | Result |
|---|---:|
| Vercel rule is configured with the exact planned settings above | Pending human verification |
| `/api/analyze` still requires authenticated access | Pending human verification |
| A normal authenticated analysis succeeds | Pending human verification |
| An oversized proxy request returns safe `413` behavior | Pending human verification |
| A controlled burst receives `429` after WAF activation | Pending human verification |
| The UI does not display the provider/WAF response body directly | Pending human verification |
| Resume input remains preserved after `429` | Pending human verification |
| Job input remains preserved after `429` | Pending human verification |
| Selected structured resume profile remains preserved after `429` | Pending human verification |
| Optional metadata remains preserved after `429` | Pending human verification |
| Local cooldown prevents immediate repeated submission | Pending human verification |
| Normal analysis resumes after the window expires | Pending human verification |
| No tokens, secrets, raw input, IP address, stack trace, or infrastructure details appear in the UI | Pending human verification |

## Follow-up considerations

Future public-launch hardening may need account-level quotas, bot controls, abuse monitoring, signup protections, and direct Supabase write-volume review. Those are intentionally outside this bounded Step 4 implementation.
