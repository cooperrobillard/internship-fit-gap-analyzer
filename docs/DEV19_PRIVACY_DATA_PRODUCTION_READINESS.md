# Dev 19 Step 5 — Privacy, Data-Control, and Production-Readiness Checkpoint

**Status:** Complete for Dev 19 bounded hardening scope

**Checkpoint date:** June 22, 2026

Related: [`DEV19_RLS_AUTH_REVERIFICATION.md`](DEV19_RLS_AUTH_REVERIFICATION.md), [`DEV19_ABUSE_RATE_LIMIT_REVIEW.md`](DEV19_ABUSE_RATE_LIMIT_REVIEW.md), [`HOSTED_PROTOTYPE_SMOKE_TEST.md`](HOSTED_PROTOTYPE_SMOKE_TEST.md), [`PUBLIC_PRODUCT_ROADMAP.md`](PUBLIC_PRODUCT_ROADMAP.md), [`LIMITATIONS.md`](LIMITATIONS.md).

## Architecture and data flow

### Analysis request path

```text
Browser / dashboard
  → Vercel Next.js /api/analyze
  → Render FastAPI /analyze
  → structured rule-based analysis result
  → browser result display
  → optional Supabase save of structured records
```

Dashboard analysis requires Clerk authentication at the application route. Vercel forwards accepted analysis requests to Render using a server-only shared secret. Render runs the rule-based analyzer and returns matched skills, missing skills, and summary data.

### Saved data path

```text
Browser / dashboard
  → Clerk-authenticated Supabase browser client
  → Supabase Postgres user-owned tables with RLS
```

The browser uses the Supabase publishable/browser-safe client with Clerk session tokens. User-owned tables are protected by Supabase RLS keyed to `clerk_user_id` and the Clerk JWT `sub` predicate verified in Dev 19 Step 3.

## Data inventory

| Data category | Where processed | Intentionally persisted by application? | Current user controls | Known limitations |
|---|---|---:|---|---|
| Transient resume text | Browser, Vercel `/api/analyze`, Render `/analyze` | No, not by the product save path | Analyze without saving; clear input in browser | Platform/service logging cannot be guaranteed absent; users should avoid unusually sensitive content |
| Transient job text | Browser, Vercel `/api/analyze`, Render `/analyze` | No, not by the product save path | Analyze without saving; clear input in browser | Platform/service logging cannot be guaranteed absent; users should avoid unusually sensitive content |
| Structured saved analyses | Supabase user-owned tables | Yes — structured metadata, counts, matched skills, missing skills, derived recurring-gap data | Review details; search/filter; compare; export where supported; delete individual saved analyses | No account-wide export; no one-click delete-all; no restore/undo; no automated retention |
| Structured resume profiles | Supabase `resume_profiles` | Yes — profile name, optional description/notes, extracted skills, user-added skills, source type, timestamps | Create, edit, delete; explicitly select profile for analysis handoff | No raw resume body storage; no profile export control; saved profile analysis is structured handoff, not full resume parsing |
| Authentication/session data | Clerk and Clerk-integrated app/session surfaces | Managed by Clerk, not custom app tables | Sign in/sign out through Clerk UI | This checkpoint does not claim Clerk account deletion automatically deletes Supabase records |
| Exports | Generated in browser/dashboard from structured saved records | Not stored as a separate server-side export object by the app | Download supported saved-analysis, recurring-gap, comparison exports | Exported files become the user's responsibility; no account-wide export |
| Local-only SQLite data | Local CLI/Streamlit workflows under ignored/generated paths | Yes, only when local user chooses SQLite save | Local search/compare/delete/export in local app | Separate from hosted Supabase; local database files can contain private derived results and must not be committed |

## Data-control inventory

| Control | Current availability | Notes |
|---|---:|---|
| Analyze without save | Available | Analysis can be run without writing structured cloud records. |
| Individual analysis delete | Available | Deletes individual saved analyses through the dashboard. |
| Structured profile edit/delete | Available | Profiles can be created, edited, and deleted. |
| Saved-analysis exports | Available where supported | Structured saved-analysis export/download exists in the dashboard. |
| Recurring-gap/comparison exports | Available where supported | Derived reports can be exported where the dashboard exposes export/download. |
| Account-wide export | Not available | Documented limitation. |
| Delete-all | Not available | Documented limitation. |
| Automated retention | Not available | No scheduled retention/deletion policy is implemented. |
| Restore/undo | Not available | Deleted rows should be treated as permanent. |
| Account deletion/data cleanup integration | Not available | Deleting a Clerk account is not claimed to automatically delete Supabase records. |

## Security and abuse posture

Current bounded safeguards:

- Clerk route protection for dashboard analysis.
- Server-only Render shared secret forwarded by Vercel; secret values are not exposed to browser code.
- Supabase RLS on user-owned saved-analysis and structured-profile tables.
- Dev 19 Step 3 two-user verification passed on June 22, 2026 at 12:41 PM ET.
- Safe API validation and frontend-safe errors/retries.
- Backend input character limits for resume and job text.
- Next.js proxy body-size handling with safe `413` responses.
- Active Vercel WAF rate limit on `POST /api/analyze`: fixed window, 20 requests per 60 seconds, counted by IP, returning `429`.
- Dev 19 Step 4 abuse/rate-limit verification passed on June 22, 2026 at 12:41 PM ET.
- CI-oriented privacy/backend/lint/build checks are documented and run for code changes; this checkpoint does not claim remote GitHub/Vercel checks passed until the PR reports them.
- Browser/client code uses publishable Supabase access patterns; no service-role key belongs in browser code.
- The application save path does not intentionally persist raw resume or raw job-description text.

## Readiness verdict

**READY FOR FINAL UI AND LAUNCH PASS — limited public beta/portfolio release**

This verdict is limited. It means Dev 19's bounded privacy, RLS, safe-error, input-size, and basic abuse-control hardening has been reconciled with public copy and recorded from supplied human verification.

It does **not** mean mature production SaaS. It is not a formal security audit, not penetration tested, and not a formal legal/privacy compliance sign-off. Account-wide export/delete, automated retention, restore/undo, and account-deletion-to-database-cleanup integration remain open. Raw resume/job text should remain transient. Future storage, schema, auth, provider, or data-control changes require re-verification before broader launch claims.

## Launch blockers and follow-ups

### Launch-blocking findings for limited public beta/portfolio release

- None recorded from the supplied Dev 19 Step 3, Step 4, and final hosted smoke-test facts.

### Accepted limited-beta constraints

- Rule-based matching only; no AI or semantic fit judgment.
- No PDF/DOCX parsing.
- No mature production SaaS, formal security audit, penetration test, or legal/privacy compliance sign-off.
- IP-based rate limiting is basic abuse protection, not account quotas, bot prevention, or comprehensive DDoS protection.
- No account-wide export, one-click delete-all, automated retention, restore/undo, or account deletion data cleanup integration.
- Platform/service logging cannot be guaranteed absent; users should avoid unusually sensitive content.

### Post-launch improvements

- Final UI, dashboard hierarchy, accessibility, and mobile launch pass.
- Account-wide export and delete-all design.
- Account deletion/data cleanup integration design.
- Retention policy design if the product grows beyond portfolio/public-beta scope.
- Continued RLS/auth regression checks after any schema/helper/provider change.
- More explicit observability/logging policy before broader public use.

## Final Dev 19 conclusion

Dev 19 hardening is complete for its bounded scope:

1. API validation, safe errors, and safe logging were completed.
2. Frontend loading/error/retry hardening was completed.
3. RLS and two-user ownership verification passed.
4. Abuse/rate-limit implementation and production activation passed.
5. Privacy/data-control/readiness copy and documentation were reconciled in this checkpoint.

Next step: **Dev 20 Step 1 — final UI, landing-page, dashboard-hierarchy, accessibility, and mobile launch pass**.
