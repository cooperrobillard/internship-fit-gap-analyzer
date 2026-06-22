# Dev 19 Step 3 — Clerk/Supabase RLS and Two-User Ownership Re-Verification

**Status:** Complete — production verification passed.

**Verification date:** June 22, 2026 at 12:41 PM ET

Related: [`HOSTED_PROTOTYPE_SMOKE_TEST.md`](HOSTED_PROTOTYPE_SMOKE_TEST.md), [`PUBLIC_PRODUCT_ROADMAP.md`](PUBLIC_PRODUCT_ROADMAP.md), [`DEV19_ABUSE_RATE_LIMIT_REVIEW.md`](DEV19_ABUSE_RATE_LIMIT_REVIEW.md), [`DEV19_PRIVACY_DATA_PRODUCTION_READINESS.md`](DEV19_PRIVACY_DATA_PRODUCTION_READINESS.md).

## Scope

This record documents the human-performed production verification for Clerk-authenticated Supabase row-level security, user ownership, saved analyses, saved-analysis child rows, structured resume profiles, exports, and two-user browser isolation.

No user IDs, emails, JWTs, access tokens, secrets, row IDs, private resume text, or private job text are included here. The verification used synthetic data and the synthetic verification records were cleaned up.

## Policy inspection results

| Check | Result |
|---|---:|
| RLS enabled on `resume_profiles` | PASS |
| RLS enabled on `analysis_runs` | PASS |
| RLS enabled on `job_analyses` | PASS |
| RLS enabled on `matched_skills` | PASS |
| RLS enabled on `skill_gaps` | PASS |
| Expected ownership policies present | PASS |
| Policies restricted to `authenticated` | PASS |
| Clerk JWT `sub` ownership predicate confirmed | PASS |

The confirmed project ownership pattern is:

```sql
clerk_user_id = (select auth.jwt() ->> 'sub'::text)
```

## Data-shape and raw-text inspection

| Check | Result |
|---|---:|
| Parent/child ownership mismatches | 0 |
| `resume_profiles.resume_text` absent | PASS |
| Populated raw `job_text` rows | 0 |

This confirms the current structured-profile table does not contain a raw `resume_text` column and that the inspected saved-analysis rows did not contain populated raw `job_text` values. It does not authorize adding raw resume or job-description storage in a future change.

## Two-user browser verification

| Check | Result |
|---|---:|
| User A own saved-analysis CRUD | PASS |
| User A own structured-profile CRUD | PASS |
| User B could not see User A analysis/profile | PASS |
| User B own saved-analysis CRUD | PASS |
| User B own structured-profile CRUD | PASS |
| User A could not see User B analysis/profile | PASS |
| Search/comparison isolation | PASS |
| Export isolation | PASS |
| Synthetic verification records cleaned up | PASS |
| No private or technical error leakage | PASS |

## Limitations

- This was a bounded production verification of the current schema, policies, helpers, and hosted UI behavior; future schema, RLS, auth, helper, export, comparison, or data-control changes require re-verification.
- The check does not constitute a formal security audit, penetration test, or legal/privacy compliance sign-off.
- The current product still lacks account-wide export, one-click delete-all, automated retention, restore/undo, and account-deletion-to-database-cleanup automation.
- No production SQL, dashboard settings, RLS policies, provider settings, environment variables, dependencies, or workflows were changed by this documentation checkpoint.

## Conclusion

Dev 19 Step 3 passed for its bounded scope. The current hosted implementation was verified to enforce user-owned Supabase rows for saved analyses, saved-analysis child data, structured resume profiles, comparison/search surfaces, and exports using the Clerk JWT `sub` ownership predicate.
