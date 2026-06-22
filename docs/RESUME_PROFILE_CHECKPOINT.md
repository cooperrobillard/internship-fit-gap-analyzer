# Resume Profile Checkpoint

**Dev 18 Step 7** · **Structured resume-profile foundation** · **Checkpoint date: 2026-06-19**

Related: [`RESUME_PROFILE_MIGRATION_VERIFICATION.md`](RESUME_PROFILE_MIGRATION_VERIFICATION.md), [`PERSISTENT_RESUME_PROFILE_DESIGN.md`](PERSISTENT_RESUME_PROFILE_DESIGN.md), [`RESUME_PROFILE_SCHEMA_RLS_PLAN.md`](RESUME_PROFILE_SCHEMA_RLS_PLAN.md), [`RESUME_PROFILE_PRE_MIGRATION_REVIEW.md`](RESUME_PROFILE_PRE_MIGRATION_REVIEW.md), [`PUBLIC_PRODUCT_ROADMAP.md`](PUBLIC_PRODUCT_ROADMAP.md).

---

## 1. Checkpoint summary

Dev 18 completed the first structured resume-profile foundation for **Job Fit & Skill-Gap Analyzer**. The project now has:

- a structured-skills-first `public.resume_profiles` database shape with RLS verification;
- typed frontend helpers for profile CRUD operations;
- an authenticated dashboard management UI for structured profiles;
- a saved-profile selector and read-only preview near the dashboard analysis input;
- a controlled, explicit profile-to-analysis handoff that preserves the existing pasted/uploaded resume flow.

This checkpoint is documentation only. It records the current state before **Dev 19 production hardening**. It is **not** a full security audit and is **not** a production-readiness certification.

---

## 2. Product purpose

Job Fit & Skill-Gap Analyzer helps users compare resume-side skills against job descriptions and review matched skills, missing skills, recurring gaps, saved analyses, saved-analysis detail views, comparisons, export/download options, job metadata, and structured resume-profile support.

The product direction remains privacy-conscious and rule-based:

- analysis is keyword/rule-based, not AI or semantic matching;
- saved analyses store structured results and metadata, not raw resume or job-description bodies by default;
- resume profiles are structured-skills-first, not cloud copies of full resumes.

---

## 3. Completed database and RLS foundation

The hosted `public.resume_profiles` table has been verified in the structured-skills-first shape:

- profile metadata is present, including profile name, optional description, source type, and timestamps;
- structured extracted/user-added skill arrays are present;
- the legacy/raw `resume_text` field is not present;
- RLS is enabled;
- authenticated users can select, insert, update, and delete only rows they own through `clerk_user_id`;
- the ownership predicate follows the Clerk JWT subject pattern:

```sql
clerk_user_id = (select auth.jwt() ->> 'sub'::text)
```

A rollback-only two-user RLS verification was performed with synthetic users. Cross-user access was blocked, the transaction was rolled back, and the table remained empty after verification.

---

## 4. Completed typed helper foundation

Typed frontend helpers exist for structured resume profiles:

- list user-owned profiles;
- create structured profiles;
- update structured profiles;
- delete structured profiles;
- map Supabase `snake_case` fields to app-facing `camelCase` fields;
- normalize and validate structured skill arrays;
- keep helper inputs structured-skills-first.

The helper layer keeps update and delete operations scoped by both profile ID and Clerk user ID. Helper validation and safety coverage were added or reviewed, including checks that the select list and helper types do not introduce a raw resume-text field.

---

## 5. Completed profile-management UI

Authenticated users can manage structured resume profiles from the dashboard:

- list profiles;
- create profiles;
- edit profiles;
- delete profiles with confirmation;
- see structured extracted skills and user-added skills;
- enter optional notes/description and source type metadata.

The UI includes friendly loading, empty, validation, success, and error states. Profile copy explains that profiles store structured skills and notes, not raw resume text. Profile deletion removes the structured profile from the user account and does not delete saved job analyses.

---

## 6. Completed selector and analysis-input integration

The analysis form now supports an explicit resume input mode:

1. **Use pasted/uploaded resume input** — the default.
2. **Use saved structured resume profile** — an explicit user-selected mode.

The saved-profile selector and read-only preview remain visible near the analysis input. The preview displays structured profile information such as profile name, optional description, source type, extracted skills, and user-added skills.

In saved-profile mode, the selected profile is converted into a temporary resume-side analysis string only at analysis time. The generated text uses structured fields only, such as:

- profile name;
- optional description/notes;
- extracted skills;
- user-added skills.

The generated profile input is not written into the resume textarea and is not persisted. The existing `resumeText` / `jobText` API contract was preserved, and FastAPI did not need to change. No database schema, migration, RLS, provider, environment, package, or dependency changes were required for the selector/handoff.

A nullable `profileDescription` TypeScript issue in the profile-to-analysis helper was corrected by treating a missing description as an empty string before trimming.

---

## 7. Privacy and data-model status

The current privacy posture is preserved:

- raw pasted resume text is not stored by default;
- raw pasted job-description text is not stored by default;
- uploaded `.txt` files remain transient and browser-side;
- resume profiles are structured-skills-first;
- generated profile analysis text is temporary and not persisted;
- generated profile analysis text is not written into the pasted/uploaded resume textarea;
- saved analyses continue to store structured skill results and metadata, not raw resume/job bodies by default;
- no service-role key is used in browser/client code;
- RLS is not bypassed.

This checkpoint does not approve storing raw resumes, raw job descriptions, uploaded files, or unminimized profile content.

---

## 8. Verification summary

Verification completed or reviewed for the resume-profile foundation:

- hosted database shape verified against the structured resume-profile target;
- legacy/raw `resume_text` column verified absent from `public.resume_profiles`;
- RLS policies verified for own-row select, insert, update, and delete;
- rollback-only two-user RLS verification performed;
- table remained empty after verification;
- typed helper behavior reviewed for field mapping, validation, structured skills, and user-owned query scoping;
- profile-management UI manually verified for create/edit/delete behavior, with test profiles removed afterward;
- selector guardrail initially verified to preview profiles without changing the analysis payload;
- controlled profile-to-analysis handoff verified to preserve the pasted/uploaded default flow and use structured profile fields only when explicitly selected;
- GitHub/Vercel checks and human manual verification passed for the completed handoff state.

Manual review should continue during Dev 19, especially around auth/session edge cases, RLS regression checks, user-facing privacy copy, and production-safe error handling.

---

## 9. Current limitations and intentional non-goals

Saved-profile analysis uses structured skills and notes, not a complete raw resume. It is not equivalent to full resume parsing.

Intentional non-goals at this checkpoint:

- no PDF/DOCX parsing;
- no AI extraction;
- no semantic matching;
- no application tracking;
- no raw resume storage by default;
- no raw job-description storage by default;
- no production SQL changes as part of this checkpoint;
- no provider/dashboard/environment changes as part of this checkpoint.

This checkpoint is not a full security audit. This checkpoint is not a production-readiness certification.

---

## 10. Next phase: Dev 19 production hardening

Dev 19 should focus on production hardening before broader public launch claims. Recommended areas include:

- auth and RLS re-checks after the completed resume-profile work;
- user-safe error handling and log review;
- input validation and payload-size review;
- abuse/rate-limit design;
- privacy/data-control copy review for saved analyses and resume profiles;
- hosted smoke-test discipline after deploys;
- documentation updates for any production-hardening decisions.

Human approval is still required for production SQL, provider settings, environment variables, deployment settings, and any future change that would store raw resume or job-description text.
