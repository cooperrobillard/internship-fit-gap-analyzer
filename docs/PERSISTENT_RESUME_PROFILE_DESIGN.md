# Persistent Resume Profile Design — Pre-Implementation Plan

**Status:** Design document only — June 2026  
**Product:** Job Fit & Skill-Gap Analyzer (hosted prototype)  
**Repository:** internship-fit-gap-analyzer

Related: [`VERSION_17_INPUT_WORKFLOW_GUARDRAIL.md`](VERSION_17_INPUT_WORKFLOW_GUARDRAIL.md), [`VERSION_16_PRODUCTION_READINESS_REVIEW.md`](VERSION_16_PRODUCTION_READINESS_REVIEW.md), [`PUBLIC_PRODUCT_ROADMAP.md`](PUBLIC_PRODUCT_ROADMAP.md), [`HOSTED_PROTOTYPE_SMOKE_TEST.md`](HOSTED_PROTOTYPE_SMOKE_TEST.md), hosted privacy page (`web/src/app/privacy/page.tsx`, route `/privacy`).

**This document does not implement resume profiles.** It defines product intent, data-model choices, and safety requirements so a future implementation step can proceed honestly.

---

## Summary

Persistent **resume profiles** would let signed-in users save one or more named resume representations and reuse them across job analyses—instead of pasting or uploading resume text every time.

That capability is useful, but it raises the bar for **privacy, consent, row-level security (RLS), delete/export, retention, and data minimization**. The hosted app today intentionally avoids storing raw resume or job-description text in the cloud save path. Resume profiles must not weaken that posture by default.

This plan recommends a **conservative first implementation**: named profiles that store **structured skills and metadata**, not raw resume text, while keeping one-time paste and transient `.txt` upload available for every analysis.

---

## Product goal

### Intended future user experience

| Capability | Behavior |
|------------|----------|
| **One-time paste** | User can still paste resume text for a single analysis without creating a profile. |
| **Transient `.txt` upload** | User can load a plain `.txt` file into the form in the browser without saving the file or text to the cloud. |
| **Optional named profile** | User may explicitly create a resume profile (e.g. “CS internship resume”, “Data analyst version”). |
| **Profile per analysis** | User can choose which saved profile to use when comparing to a job description—or use one-off input instead. |
| **Different resume per job** | No forced single master resume; each analysis can use a different profile or one-off text. |
| **Profile management** | User can view a profile summary, edit name/skills, export profile data they own, and delete a profile. |

### What profiles are *not* required for

- Running an analysis (paste/upload/demo remains sufficient).
- Saving structured analysis results (matched/missing skills + job metadata)—that stays a separate, optional action after analysis.

### Honest product framing

Resume profiles are a **convenience and reuse** feature, not a prerequisite for the core skill-gap workflow. Any UI must make that distinction clear.

---

## Current state before implementation

| Area | Today |
|------|--------|
| **Resume/job input** | Paste, browser-only `.txt` upload, fictional **Try sample inputs** on the hosted dashboard. |
| **Analysis** | Browser → Next.js `POST /api/analyze` → Render FastAPI → rule-based analyzer (in-memory). |
| **Cloud save** | Structured matched/missing skills + job metadata (title, company, URL, notes); **not** raw resume or job body text on the intended write path. |
| **Version 16** | Saved-analysis comparison, export/download, privacy/data-control page, production-readiness review before resume profiles. |
| **Version 17 (Steps 1–4)** | Input UX polish, transient upload, demo inputs, input workflow guardrail document. |
| **Resume profiles** | **Not implemented** in the hosted app. A first-pass Postgres sketch may exist in repository database docs, but it is **not wired** to the dashboard and must be reviewed before use. |

Users already get value from structured saved analyses and recurring gap stats without resume profiles.

---

## Data sensitivity

Resume content is often **personally identifiable and sensitive**. Even when users only intend to store “skills,” source material may include:

- **Direct identifiers** — name, email, phone, address, links
- **Education and employment history** — schools, employers, dates, titles
- **Indirect signals** — work authorization, language, veteran status, disability or health clues, demographic clues, references, project details tied to identity

**Raw resume storage increases data responsibility** — breach impact, user expectations, retention obligations, and the need for clear legal/product copy all grow.

**Users need clear consent and controls** — especially if raw text is stored. “Save analysis results” and “save resume profile” must not feel like the same action.

**Data minimization should guide the design** — store the smallest representation that still supports the product goal (repeated comparisons and skill tracking). When structured skills are enough, avoid raw text.

This is careful product design, not alarmism. The current prototype is not claimed to be insecure; resume profiles simply add a **new, more sensitive data class** that deserves explicit planning.

---

## Recommended data model options

### Option A — Structured skills profile only

| | |
|---|---|
| **Stores** | Profile name, optional label/description, extracted resume skills (name + category), optional user-added/edited skills, source type metadata, timestamps |
| **Does not store** | Raw resume text |
| **Pros** | Safest and most aligned with current structured-results-first model; lower custody risk; simpler exports and privacy copy |
| **Cons** | Loses exact resume wording; re-analysis may differ if taxonomy or aliases change unless skills are re-edited or re-extracted |

### Option B — Raw resume text profile

| | |
|---|---|
| **Stores** | Profile name + full raw resume text (and optional metadata) |
| **Pros** | Easy to re-run analysis with identical input; familiar “my resume on file” mental model |
| **Cons** | Highest privacy responsibility; requires strong consent, delete/export, retention policy, and possibly encryption-at-rest strategy; larger payloads and abuse surface |

### Option C — Hybrid profile

| | |
|---|---|
| **Stores** | Structured skills by default; raw resume text **only** if user explicitly opts in per profile |
| **Pros** | Flexible for users who want both skill library and full text reuse |
| **Cons** | Most complex UX and engineering; two code paths; easy to accidentally broaden scope |

### Preferred option for first implementation

**Recommend Option A (structured skills only)** for the first shipped resume-profile version.

If product feedback later demands full-text reuse, treat **Option C** as a gated follow-on: raw text **off by default**, separate opt-in, and only after production controls from Version 16/18 are in better shape.

**Do not start with Option B** as the default product path.

---

## Proposed first implementation recommendation

When implementation is approved (after schema/RLS plan and production gates):

1. **Add named resume profiles** that store **structured skills and profile metadata** first.
2. **Avoid raw resume text storage by default** — no silent persistence of pasted or uploaded body text when creating a profile.
3. **Keep one-time paste/upload analysis** available for every run without saving a profile.
4. **Require explicit opt-in** before any future raw resume text column is written; treat that as a separate product decision and schema review.
5. **Do not add PDF/DOCX parsing** in the first resume-profile release — plain text paste/upload only, consistent with Version 17.
6. **Update privacy/data-control copy** before enabling profile save in production.
7. **Re-verify RLS** with multiple test users after any new table or policy ships.

Profile creation flow (conceptual): user provides resume text **once** (paste or transient `.txt`) → app runs skill extraction (same rule-based path as today) → user reviews/edits extracted skills → user explicitly **saves profile** with a name. Raw text is discarded after extraction unless a future opt-in hybrid is approved.

---

## Possible database fields

**Conceptual only — do not create migrations from this document.**

Example future table: `resume_profiles`

| Column | Type (conceptual) | Notes |
|--------|-------------------|--------|
| `id` | uuid, PK | |
| `clerk_user_id` | text, not null | Owner; matches existing RLS pattern on `job_analyses` |
| `profile_name` | text, not null | User-visible name, e.g. “Fall 2026 internship” |
| `profile_label` | text, nullable | Optional short description |
| `extracted_skills` | json/jsonb | Array of `{ skill, category }` from analyzer at save time |
| `user_added_skills` | json/jsonb, nullable | User edits/supplements |
| `source_type` | text | e.g. `pasted`, `txt_upload`, `manual`, `demo` — not a file path |
| `raw_resume_text` | text, nullable | **Null in v1**; only if explicit opt-in hybrid is approved later |
| `raw_text_saved` | boolean, default false | Explicit flag; false in v1 |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Optional future link on `job_analyses` (separate design decision):

- `resume_profile_id` uuid, nullable, FK → `resume_profiles`, `ON DELETE SET NULL`
- `resume_profile_name_snapshot` text, nullable — denormalized label for history if profile is deleted

**Important:** Any existing draft schema in the repository must be **reviewed and revised** to match this conservative model before implementation. Policies, indexes, triggers, and column names must be designed and tested—not assumed from an unwired first pass.

---

## RLS and access-control expectations

| Requirement | Expectation |
|-------------|-------------|
| **Ownership** | Every profile row is owned by one `clerk_user_id`. |
| **Isolation** | Users can SELECT, INSERT, UPDATE, and DELETE **only their own** profiles. |
| **No cross-user access** | User A must never read or modify User B’s profiles via the Supabase client or API. |
| **Browser client** | Clerk session + Supabase anon/authenticated client with RLS; **no service-role key in browser code**. |
| **Server actions** | If server routes are added later, they must preserve the same ownership rules. |
| **Testing** | Manual or automated checks with **at least two test users** before calling the feature done. |
| **Schema changes** | Full RLS policy review after any new table, column, or policy change (per Version 16 review). |

Child rows (if any are added later) must cascade or nullify consistently on profile delete, with behavior documented for the user.

---

## Consent and UX requirements

### Required user-facing behavior

- **Explicit profile creation** — saving a profile is a deliberate action, not a side effect of running analysis or saving analysis results.
- **Clear disclosure** — before save, user sees what will be stored (e.g. profile name + skill list; **not** full resume text in v1).
- **Separate opt-in for raw text** — if ever offered, a distinct checkbox/control with plain language; never pre-checked.
- **Default remains one-time** — opening the dashboard does not imply a profile is created or updated.
- **Unambiguous controls** — buttons such as “Save resume profile” vs “Run analysis (does not save)” vs “Save structured results” must not be conflated.
- **Privacy copy updated** — `/privacy`, dashboard, and profile flows updated **before** launch of profile save.
- **Demo/sample inputs** — saving a fictional demo as a profile should be possible for testing but clearly labeled as demo content.

### Copy principles

- State what **is** stored (skills, profile name).
- State what **is not** stored by default (raw resume text, uploaded files).
- Link to data controls (view, delete, export).

---

## User controls

Future hosted dashboard should support:

| Control | Description |
|---------|-------------|
| **View profile summary** | Name, skill counts, last updated, source type — not full raw text in v1 |
| **Edit profile** | Rename; add/remove/edit skills in the structured list |
| **Delete profile** | Confirmed delete; explain impact on past saved analyses (see below) |
| **Export profile** | User-owned structured profile export (CSV/JSON/Markdown — format TBD); no raw text in default export |
| **Choose profile per analysis** | Selector: “One-time paste/upload” or a saved profile |
| **One-off override** | Any analysis can use pasted/uploaded text without updating a profile |
| **Default profile (later)** | Optional convenience: mark one profile as default for signed-in users |

Controls should mirror the tone of existing saved-analysis delete/export patterns (confirmation, calm errors, no secrets in UI).

---

## Delete/export behavior

### Delete profile

- Removes the profile row (and any profile-only child data defined in schema).
- **Does not automatically delete past saved analyses** unless explicitly designed otherwise.
- Recommended default: saved analyses **remain**; optional `resume_profile_id` on a saved row becomes `NULL` or retains a **name snapshot** for history.
- User-facing copy must explain: “Deleting this profile does not delete your saved job analyses.”

### Export profile

- Includes only data the user owns for that profile.
- Default export: profile name, label, skills, timestamps, source type — **no raw resume text** in v1.
- If raw text is ever stored (hybrid opt-in), export must **clearly label** whether raw text is included; default export should still exclude raw text unless user explicitly requests a full export.

### Consistency with existing exports

- Align with current structured-only exports (no surprise resume bodies in CSV/Markdown bundles).

---

## Relationship to saved analyses

| Topic | Design intent |
|-------|----------------|
| **Separation** | Resume profiles and saved analyses are **different resources**. Profile = reusable resume representation; saved analysis = outcome of one job comparison. |
| **Current save model** | Unchanged: structured matched/missing skills + job metadata. |
| **Future linkage** | When saving an analysis, optionally record `resume_profile_id` and/or a **snapshot label** (“Used profile: Fall 2026 internship”) for user context. |
| **No raw text in saved analysis** | Saving an analysis should still not persist raw resume or job body text on the default path. |
| **Isolation** | Profile APIs and UI must not expose another user’s profile or text. |
| **Optional profiles** | Analysis must work with zero saved profiles. |

Recurring gap stats continue to derive from **saved missing skills on job analyses**, not from profile tables directly—unless product explicitly adds profile-scoped analytics later.

---

## Implementation phases

Use these phases to keep scope controlled. **Phases 2+ are future work** — not started by this document.

| Phase | Scope |
|-------|--------|
| **Phase 1 — Design + schema/RLS plan** | Finalize this document; draft SQL policies and migration plan; privacy copy outline; no app code |
| **Phase 2 — Profile creation (structured only)** | Create profile from extracted skills; explicit save; no raw text column writes |
| **Phase 3 — Profile selector in analysis form** | Choose profile or one-time input; populate analysis input from profile skills (see open question: text reconstruction vs analyzer API accepting skill sets) |
| **Phase 4 — Profile management UI** | List, edit, delete profiles in dashboard section |
| **Phase 5 — Export/delete controls** | Profile export; confirmed delete; update `/privacy` |
| **Phase 6 — Optional raw text review** | Only if product and production gates justify hybrid opt-in; encryption/retention review |

**Open engineering question for Phase 3:** Today `/api/analyze` expects resume **text**. Profiles without raw text may need either (a) a canonical text serialization from skills for the existing analyzer, or (b) a future analyzer entry point that compares skill sets directly. Prefer (a) for minimal backend change; document limitations honestly.

---

## Testing and verification plan

Before merging any resume-profile implementation:

| Check | Action |
|-------|--------|
| Python tests | `pytest api/tests` |
| Full Python suite | `python3 run_tests.py` |
| Python compile | `python3 -m py_compile api/main.py` (and touched modules) |
| Web lint | `cd web && npm run lint` |
| Web build | `cd web && npm run build` |
| RLS two-user test | User A creates profile; User B cannot read/update/delete it |
| Profile CRUD | Create, read, update name/skills, delete |
| One-time analysis | Paste/upload analysis works **without** saving a profile |
| Structured analysis save | Save analysis results still works; still no raw resume/job text on save path |
| Delete profile | Past saved analyses still accessible; linkage behavior matches design |
| Privacy/repo hygiene | No `.env` commits; no private resume files in repo; no generated outputs tracked |
| Hosted smoke test | [`HOSTED_PROTOTYPE_SMOKE_TEST.md`](HOSTED_PROTOTYPE_SMOKE_TEST.md) plus new profile scenarios |

---

## What remains out of scope

For the first resume-profile implementation and this design phase:

- PDF/DOCX parsing
- AI / semantic matching
- Full public production launch or formal security audit claim
- Billing, teams, or admin tools
- Broad UI redesign
- Storing **raw job descriptions** in profiles or saved analyses by default
- Storing **raw resume text by default**
- Automatic profile creation from every analysis
- Account-wide “upload my resume file to the cloud” persistence

---

## Recommendation for next step

**Recommended:** **Version 17 Step 6 — resume-profile schema and RLS plan (documentation only)**

Produce a short, reviewable artifact that:

- Maps this design to concrete Supabase table definitions and RLS policies (draft SQL in docs or a dedicated plan file — **not** applied migrations yet).
- Notes differences from any existing unwired `resume_profiles` sketch in the repo.
- Lists privacy copy deltas for `/privacy` and the dashboard.
- Confirms Phase 1 exit criteria before any Next.js or API implementation.

**Not recommended yet:** jumping straight to dashboard UI or live migrations without that schema/RLS plan and Version 18 production-hardening progress (rate limits, multi-user RLS discipline, smoke tests).

**After Step 6:** Either begin **Phase 2 implementation** (structured profiles only) or parallel **Version 18** hardening if production gates are the higher priority.

---

## Document maintenance

Update when:

- implementation phases start or scope changes,
- raw text opt-in is approved or rejected,
- schema or RLS policies are finalized.

Do not treat this document as production readiness or a completed security audit.
