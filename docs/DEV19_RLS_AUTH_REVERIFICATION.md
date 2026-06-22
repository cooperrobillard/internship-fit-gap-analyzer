# Dev 19 Step 3 — Clerk/Supabase RLS and Two-User Ownership Re-Verification

**Verification date:** `[DATE AND TIME]`  
**Verification type:** Manual production re-verification  
**Scope:** Clerk-authenticated Supabase RLS ownership for saved analyses, saved-analysis child rows, structured resume profiles, user-owned exports, and hosted two-user browser isolation.

Related: [`HOSTED_PROTOTYPE_SMOKE_TEST.md`](HOSTED_PROTOTYPE_SMOKE_TEST.md), [`PUBLIC_PRODUCT_ROADMAP.md`](PUBLIC_PRODUCT_ROADMAP.md), [`SAVED_ANALYSIS_RLS_PATTERN_REVIEW.md`](SAVED_ANALYSIS_RLS_PATTERN_REVIEW.md), [`RESUME_PROFILE_MIGRATION_VERIFICATION.md`](RESUME_PROFILE_MIGRATION_VERIFICATION.md), [`RESUME_PROFILE_CHECKPOINT.md`](RESUME_PROFILE_CHECKPOINT.md).

---

## 1. Purpose and scope

This checkpoint records the completed human production verification for **Dev 19 Step 3 — Clerk/Supabase RLS and two-user ownership re-verification**.

The verification focused on whether authenticated users can access their own production rows while remaining isolated from another authenticated user's saved analyses, resume profiles, comparison options, and exported structured data.

This was a documentation-only checkpoint. No application code, backend code, frontend code, tests, workflow files, dependency files, database schema, migrations, RLS policies, Clerk configuration, Supabase dashboard configuration, Vercel settings, Render settings, or deployment settings were changed as part of this record.

---

## 2. Important limitations

This checkpoint is:

- a manual production re-verification;
- not a formal penetration test;
- not a comprehensive security audit;
- not an automated RLS regression suite;
- not permission to bypass future RLS verification.

Future schema, RLS, auth, helper, export, comparison, or data-control changes still require their own focused verification.

This document intentionally does not include real Clerk user IDs, email addresses, JWTs, access tokens, API keys, Supabase project secrets, private resume text, private job text, or raw production row IDs.

---

## 3. Production policy inspection

### Tables inspected

The human verification inspected the production RLS posture for these tables:

- `resume_profiles`
- `analysis_runs`
- `job_analyses`
- `matched_skills`
- `skill_gaps`

### RLS-enabled results

| Table | RLS enabled result |
|---|---:|
| `resume_profiles` | `[PASS/FAIL]` |
| `analysis_runs` | `[PASS/FAIL]` |
| `job_analyses` | `[PASS/FAIL]` |
| `matched_skills` | `[PASS/FAIL]` |
| `skill_gaps` | `[PASS/FAIL]` |

### Policy coverage and ownership predicate

| Check | Result |
|---|---:|
| Expected policies present | `[PASS/FAIL]` |
| Policies restricted to `authenticated` | `[PASS/FAIL]` |
| Ownership predicate uses Clerk JWT `sub` | `[PASS/FAIL]` |
| Parent/child ownership mismatches | `[NUMBER]` |

The expected ownership pattern remains Clerk-user ownership through the JWT subject claim, using the project-standard predicate shape:

```sql
clerk_user_id = (select auth.jwt() ->> 'sub'::text)
```

### Structured-profile privacy and raw-job-text inspection

| Check | Result |
|---|---:|
| `resume_profiles.resume_text` absent | `[PASS/FAIL]` |
| Populated raw `job_text` rows | `[NUMBER]` |

The structured resume-profile check is limited to confirming the supplied production inspection result above. It does not authorize adding raw resume storage.

---

## 4. Two-user hosted browser scenarios performed

The human verification used two distinct authenticated test accounts and synthetic test data only.

| Scenario | Result |
|---|---:|
| User A created and read own saved analysis | `[PASS/FAIL]` |
| User A created, edited, and read own resume profile | `[PASS/FAIL]` |
| User B could not see User A saved analysis | `[PASS/FAIL]` |
| User B could not see User A resume profile | `[PASS/FAIL]` |
| User B created and read own saved analysis | `[PASS/FAIL]` |
| User B created and edited own resume profile | `[PASS/FAIL]` |
| User A could not see User B saved analysis | `[PASS/FAIL]` |
| User A could not see User B resume profile | `[PASS/FAIL]` |
| Each user's export contained only their own data | `[PASS/FAIL]` |
| Own-row delete worked for both accounts | `[PASS/FAIL]` |
| Synthetic verification records cleaned up | `[PASS/FAIL]` |
| No raw private text, secrets, tokens, SQL errors, or stack traces appeared in the UI | `[PASS/FAIL]` |

### Saved-analysis isolation

The human test covered own-row saved-analysis create/read behavior for both users and cross-user saved-analysis visibility checks in both directions.

### Resume-profile isolation

The human test covered own-row structured resume-profile create/edit/read behavior for both users and cross-user resume-profile visibility checks in both directions.

### Search and comparison-option isolation

The two-user isolation review included checking that each authenticated user's saved-analysis surfaces remained scoped to that user's own records. This includes user-owned saved-analysis selection surfaces such as search/filter results and comparison options.

### Export isolation

The export check verified the supplied result that each user's export contained only that user's own data.

### Own-row CRUD and cleanup

The hosted test verified own-row create/read/update/delete behavior where applicable and confirmed the supplied cleanup result for synthetic verification records.

---

## 5. Additional factual notes

`[ADD ONLY REAL OBSERVATIONS]`

---

## 6. Conclusion

**Pass/fail conclusion:** This checkpoint records the supplied human production verification results exactly as provided above. It does not add independent claims beyond those supplied results.

The documented verification supports continuing to **Dev 19 Step 4 — abuse/rate-limit review and bounded implementation**, while preserving the requirement that future RLS, schema, auth, export, comparison, or data-control changes receive their own review.
