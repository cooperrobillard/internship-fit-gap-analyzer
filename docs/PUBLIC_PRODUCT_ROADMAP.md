# Public Product Roadmap — Job Fit & Skill-Gap Analyzer

Practical audit for evolving the **hosted prototype** into a **finished public web app** that strangers can safely use. Repository and folder name stay **internship-fit-gap-analyzer** for now; the public-facing product name can be **Job Fit & Skill-Gap Analyzer**.

Related: [`VERSION_22_CHECKPOINT.md`](VERSION_22_CHECKPOINT.md), [`TAXONOMY_MAINTENANCE.md`](TAXONOMY_MAINTENANCE.md), [`DEV19_PRIVACY_DATA_PRODUCTION_READINESS.md`](DEV19_PRIVACY_DATA_PRODUCTION_READINESS.md), [`DEV19_RLS_AUTH_REVERIFICATION.md`](DEV19_RLS_AUTH_REVERIFICATION.md), [`DEV19_ABUSE_RATE_LIMIT_REVIEW.md`](DEV19_ABUSE_RATE_LIMIT_REVIEW.md), [`HOSTED_PROTOTYPE_SMOKE_TEST.md`](HOSTED_PROTOTYPE_SMOKE_TEST.md), [`PRODUCT_ROADMAP.md`](PRODUCT_ROADMAP.md), [`DEPLOYMENT_READINESS.md`](DEPLOYMENT_READINESS.md), [`RESUME_PROFILE_CHECKPOINT.md`](RESUME_PROFILE_CHECKPOINT.md), root [`README.md`](../README.md).

---

## 1. Product north star

| | |
|---|---|
| **Public name** | Job Fit & Skill-Gap Analyzer |
| **What it is** | A rule-based web app that compares resume text to a job description and shows matched skills, missing skills, and patterns across many postings |
| **Who it is for** | Job seekers comparing their skills to roles (internships, co-ops, entry-level, and other jobs—not internship-only) |
| **Problem solved** | “What does this posting expect that I don’t show yet?” and “What skills keep showing up as gaps across roles I care about?” |

**Not the goal (yet):** AI/semantic matching, auto-scoring “fit,” or storing full resume/job documents by default.

**Serious public bar:** Account-based, user-owned data, clear privacy, calm errors, and a UI people would recommend—not a portfolio-only demo.

---

## 2. Current state summary

### Local app (stable)

| Piece | Status |
|-------|--------|
| **CLI** (`src/main.py`) | Multi-job analysis, markdown/CSV outputs, optional SQLite, pandas recurring-gap CSVs |
| **Streamlit** (`streamlit_app.py`) | Sample, paste, and **file upload**; save/search/**compare**/delete; exports and DB backup |
| **SQLite** | Full saved-analysis history, skill rows, metadata (no raw resume/job body text in DB) |
| **Analyzer** | Rule-based curated cross-domain taxonomy + reviewed aliases in `src/` |

### Hosted web app (limited public-beta / portfolio prototype)

| Piece | Status |
|-------|--------|
| **Frontend** | Next.js on Vercel (`web/`) |
| **Auth** | Clerk sign-in/sign-up, protected `/dashboard` |
| **Analysis** | Browser → `/api/analyze` → Render FastAPI (`api/`) with server-only shared-secret forwarding |
| **Cloud DB** | Supabase/Postgres, RLS per Clerk user |
| **Save** | Structured matched/missing skills + metadata (title, company, URL, notes)—**no raw resume/job text** |
| **Resume profiles** | Structured profile create/edit/delete and explicit saved-profile analysis handoff |
| **Read/manage** | Saved-analysis detail, search/filter, compare, export/download, delete, recurring gap stats |
| **Ops/hardening** | Safe API validation/errors, frontend retry/cooldown, proxy request-size handling, Dev 19 two-user RLS verification, active Vercel rate limiting |

### Architecture (hosted)

```text
Browser → Vercel (Next.js) → Clerk
              → POST /api/analyze → Render (FastAPI) → src/ analyzer (in-memory)
              → Supabase (job_analyses, matched_skills, skill_gaps, RLS)
```

---

## 3. Feature parity audit

| Capability | Local? | Hosted? | Public v1? | Priority | Notes |
|------------|--------|---------|------------|----------|-------|
| Single job analysis | Yes | Yes | Yes | P0 | Hosted via paste + `/api/analyze` |
| Resume input (paste) | Yes | Yes | Yes | P0 | |
| Resume input (upload) | Yes (Streamlit) | Partial | Should have | P1 | Hosted: transient `.txt` in browser only (Version 17); not persistent |
| Job description input (paste) | Yes | Yes | Yes | P0 | |
| Job description input (upload) | Yes (Streamlit) | Partial | Should have | P1 | Hosted: transient `.txt` in browser only (Version 17); not persistent |
| Job title / company metadata | Yes | Yes | Yes | P0 | On save form today |
| Source URL / notes | Yes | Yes | Yes | P0 | On save form today |
| Matched / missing skills display | Yes | Yes | Yes | P0 | Per-run only on hosted |
| Saved analysis history | Yes | Yes | Yes | P0 | Hosted list/detail/search/delete are implemented |
| Saved analysis detail view | Yes | Yes | Yes | P0 | Shows structured metadata and skill rows |
| Saved analysis search / filter | Yes | Yes | Should have | P1 | Hosted search/filter implemented |
| Recurring gap stats | Yes | Yes | Yes | P0 | Hosted derived recurring-gap stats implemented |
| Saved analysis comparison | Yes | Yes | Should have | P1 | Hosted comparison implemented |
| Deletion | Yes | Yes | Yes | P0 | Hosted individual saved-analysis delete implemented |
| Export / download | Yes | Yes | Should have | P1 | Hosted structured exports/downloads implemented where supported |
| SQLite local persistence | Yes | N/A | N/A | — | Stays local tool |
| Supabase hosted persistence | N/A | Yes | Yes | P0 | Prototype save path live |
| Clerk auth | N/A | Yes | Yes | P0 | |
| RLS / user ownership | N/A | Yes | Yes | P0 | Manually verified; needs ongoing checks |
| Persistent resume profiles | Partial (UI) | Yes | Later | P2 | Structured profile CRUD and explicit analysis handoff implemented; not raw resume storage |
| Different resume per analysis | Yes (implicit paste) | Yes (paste) | Yes | P1 | Profiles would formalize this |
| Public privacy / data controls | Partial | Yes | Yes | P0 | Privacy/data-control copy reconciled; account-wide controls remain open |
| UI polish / final design | Local OK | Prototype | Yes | P1 | Copy polish done; full redesign later |
| Custom domain | No | No | Later | P2 | Vercel default URL today |
| Semantic / AI matching | No | No | Later | P3 | Explicitly out of v1 scope |
| Rate limiting / abuse protection | No | Basic | Yes | P0 | Active Vercel IP-based limit plus safe 413/429 handling; not comprehensive abuse prevention |
| Error monitoring / logging | Minimal | Minimal | Yes | P1 | Calm UI errors; no full observability |

**Legend:** P0 = blocks public launch · P1 = strong post-launch or fast follow · P2+ = later

---

## 4. Public v1 requirements

### Must have before public launch

- [x] Hosted **recurring gap stats** across saved analyses (core value prop)
- [x] Hosted **saved analysis detail** (view matched/missing skills for a saved row)
- [x] Hosted **delete** own analyses (and cascade skill rows where implemented)
- [x] In-app privacy/data explanation for current behavior; **not** a formal legal privacy policy
- [x] **Auth + RLS** re-verified with multiple test users — Dev 19 Step 3 passed; see [`DEV19_RLS_AUTH_REVERIFICATION.md`](DEV19_RLS_AUTH_REVERIFICATION.md)
- [x] **Safe data model** unchanged: structured skills + metadata; no raw resume/job text by default
- [x] **Abuse basics**: active Vercel IP-based rate limiting, safe `413`, safe `429`, and shared-secret forwarding verified; see [`DEV19_ABUSE_RATE_LIMIT_REVIEW.md`](DEV19_ABUSE_RATE_LIMIT_REVIEW.md)
- [x] **Hosted smoke test** passed for the Dev 19 checkpoint using supplied human verification facts
- [x] **Error handling** remains user-safe (no secrets, tokens, or stack traces in UI)
- [x] Final UI, landing-page, dashboard hierarchy, accessibility, and mobile launch pass

### Should have soon after launch

- [x] Search / filter saved analyses
- [x] Compare two saved analyses
- [x] Export/download of supported user-owned structured saved-analysis and derived report data
- [x] Transient resume/job `.txt` upload on web with explicit privacy copy
- [ ] Basic monitoring (Vercel/Render/Supabase dashboards + alerts)
- [ ] Custom domain decision

### Can wait until later

- [x] Persistent structured resume profiles with explicit saved-profile analysis handoff
- [ ] Semantic / AI matching
- [ ] Application-status / job tracker product features
- [ ] Full visual redesign (Version 19 track)
- [ ] Raw resume/job text storage (only with explicit product + legal decision)
- [ ] Billing, teams, orgs

---

## 5. Production readiness checklist

Use before calling the app “public”:

| Area | Check |
|------|--------|
| **Auth** | Clerk production instance; sign-in/out; session edge cases |
| **RLS** | User A cannot read/write User B rows; policies match `clerk_user_id` |
| **Data model** | Saves skills + metadata only; `job_text` / raw body not written by app |
| **Repo hygiene** | No `.env`, `.env.local`, private resumes, or generated outputs tracked |
| **Privacy copy** | Landing + dashboard + dedicated privacy page |
| **User controls** | Delete own analyses; export summary data |
| **API security** | Shared secret + plan for rate limits; no public unauthenticated `/analyze` abuse |
| **Validation** | Input limits on paste size; safe API errors |
| **Monitoring** | Know where to read Vercel/Render/Supabase logs; basic alert path |
| **Smoke test** | [`HOSTED_PROTOTYPE_SMOKE_TEST.md`](HOSTED_PROTOTYPE_SMOKE_TEST.md) green |
| **Backup** | Supabase backup/PITR awareness; no single-point “hope” |
| **Launch** | Domain, support contact, honest “rule-based prototype → public v1” messaging |

**Current honest status:** Demoable hosted prototype with Dev 19 hardening complete for a limited public-beta/portfolio scope; still not mature production SaaS for highly sensitive data.

---

## 6. Data / privacy model

### Store now (intentional)

- Per-analysis **matched skills** and **missing skills** (name + category)
- **Metadata:** job title, company, source URL, notes, counts, timestamps
- **User identity** via Clerk → `clerk_user_id` on all owned rows

### Do not store by default (current behavior)

- Raw **resume text** and **job description body text** on the hosted write path
- Resume files or job posting files in Supabase (not implemented)

Schema may include sensitive columns (e.g. `job_text`) for future use—they are **not** populated by the current app.

### Structured resume profiles

- **Current:** Structured resume-profile management is implemented for profile name, optional description/notes, extracted skills, user-added skills, source type, and timestamps.
- **Analysis handoff:** Users can explicitly select a saved profile; the app constructs temporary structured analysis input from profile fields and skill lists.
- **Privacy boundary:** Profiles do not store raw resume body text, transient `.txt` uploads are not automatically saved as profiles, and this is not full resume parsing.
- **Checkpoint:** [`RESUME_PROFILE_CHECKPOINT.md`](RESUME_PROFILE_CHECKPOINT.md) records the structured-profile foundation, and [`DEV19_PRIVACY_DATA_PRODUCTION_READINESS.md`](DEV19_PRIVACY_DATA_PRODUCTION_READINESS.md) records the current data-control posture.

---

## 7. Design direction

Target feel for the public app (Version 19+ visual system, informed earlier):

| Aim for | Avoid |
|---------|--------|
| Bubbly, vibrant, happy, **summery** | Gray generic AI SaaS |
| Sleek, modern, **professional** | Heavy card-grid “template” UI |
| Technical / official enough to trust | Playful at the expense of clarity |
| Approachable for students and job seekers | Internship-only or childish branding |

**Layout:** Purposeful hierarchy, readable analysis results, clear save/history flows—not a wall of identical cards.

**Copy:** Honest about rule-based matching; welcoming for any job type under **Job Fit & Skill-Gap Analyzer**.

---

## 8. Recommended implementation roadmap (Version 15+)

### Version 15 — Hosted saved-analysis feature parity foundation ✅

**Complete** — see [`VERSION_15_CHECKPOINT.md`](VERSION_15_CHECKPOINT.md).

- Recurring **gap stats** on dashboard
- **Saved analysis detail** view (skills for one row)
- Job **metadata** display polish in list + detail
- **Search / filter** saved analyses
- **Delete** saved analyses (UI + RLS-scoped Supabase client)

### Version 16 — Hosted comparison, export, and data-control foundation ✅

**Complete** — see [`VERSION_16_CHECKPOINT.md`](VERSION_16_CHECKPOINT.md) and [`VERSION_16_PRODUCTION_READINESS_REVIEW.md`](VERSION_16_PRODUCTION_READINESS_REVIEW.md).

- **Compare** two saved analyses
- **Export** user-owned structured data (Markdown/CSV)
- **Privacy / data-control** page (`web/src/app/privacy/page.tsx`, route `/privacy`)
- Production-readiness review before resume profiles

### Version 17 — Resume/input workflow polish (then profiles)

**Gate:** [`VERSION_16_PRODUCTION_READINESS_REVIEW.md`](VERSION_16_PRODUCTION_READINESS_REVIEW.md) and [`VERSION_17_INPUT_WORKFLOW_GUARDRAIL.md`](VERSION_17_INPUT_WORKFLOW_GUARDRAIL.md) — no persistent resume profiles until a separate design step answers data model, consent, delete/export, RLS, and privacy-copy questions.

**Complete (input workflow):**

- Step 1 — hosted paste/save UX polish and honest prototype copy
- Step 2 — transient plain `.txt` upload (browser-only; no file persistence)
- Step 3 — fictional **Try sample inputs** / **Clear inputs** demo workflow
- Step 4 — input workflow checkpoint and resume-profile guardrail
- Step 5 — persistent resume-profile **design document** ([`PERSISTENT_RESUME_PROFILE_DESIGN.md`](PERSISTENT_RESUME_PROFILE_DESIGN.md))
- Step 6 — structured resume-profile **schema/RLS plan** ([`RESUME_PROFILE_SCHEMA_RLS_PLAN.md`](RESUME_PROFILE_SCHEMA_RLS_PLAN.md))
- Step 7 — docs-only **schema/RLS SQL draft** ([`RESUME_PROFILE_SCHEMA_RLS_DRAFT.md`](RESUME_PROFILE_SCHEMA_RLS_DRAFT.md)) — **not applied**
- Step 8 — **saved-analysis RLS pattern review** ([`SAVED_ANALYSIS_RLS_PATTERN_REVIEW.md`](SAVED_ANALYSIS_RLS_PATTERN_REVIEW.md))
- Step 9 — **resume-profile SQL draft aligned** with saved-analysis `clerk_user_id` + RLS ([`RESUME_PROFILE_SCHEMA_RLS_DRAFT.md`](RESUME_PROFILE_SCHEMA_RLS_DRAFT.md)) — **not applied**
- Step 10 — **pre-migration review** ([`RESUME_PROFILE_PRE_MIGRATION_REVIEW.md`](RESUME_PROFILE_PRE_MIGRATION_REVIEW.md)) — design ready; **confirm live Supabase RLS predicate before apply**
- Step 11 — **migration file** ([`web/database/migrations/20260617_structured_resume_profiles.sql`](../web/database/migrations/20260617_structured_resume_profiles.sql))
- **Dev 18 — migration apply + verification** ([`RESUME_PROFILE_MIGRATION_VERIFICATION.md`](RESUME_PROFILE_MIGRATION_VERIFICATION.md)) — hosted structured schema and RLS confirmed at that checkpoint; later Dev 18 work added helpers/UI

**Not implemented:** helpers or UI.

### Dev 19 — Production hardening

- Step 1 — API validation, safe errors, safe logging — **Complete**
- Step 2 — frontend error/loading/retry hardening — **Complete**
- Step 3 — RLS/two-user ownership verification — **Complete**; supplied human production verification passed on June 22, 2026
- Step 4 — abuse/rate-limit implementation and production activation — **Complete**; supplied human production verification passed on June 22, 2026
- Step 5 — privacy/data-control/readiness checkpoint — **Complete**; see [`DEV19_PRIVACY_DATA_PRODUCTION_READINESS.md`](DEV19_PRIVACY_DATA_PRODUCTION_READINESS.md)

Dev 19 supports a limited public-beta/portfolio readiness verdict after one final UI and launch pass. It does **not** certify the entire product as mature production SaaS, formally security audited, penetration tested, or legally/privacy compliant.

### Dev 20 — Final UI and launch pass ✅

**Complete** — landing-page polish, dashboard hierarchy, accessibility pass, mobile launch pass, and launch-readiness documentation are recorded. Final deployed production verification remains a human release step.

### Dev 21 — Route redesign and visual QA ✅

**Complete** — route organization, visual QA, and polished hosted product surfaces were reconciled without changing auth, persistence, or analyzer behavior.

### Version 22 — Curated cross-domain taxonomy rollout ✅

**Complete** — see [`VERSION_22_CHECKPOINT.md`](VERSION_22_CHECKPOINT.md). The analyzer now uses a validated curated cross-domain taxonomy with reviewed aliases while remaining deterministic, non-semantic, and non-AI.

### Future — Domain and broader public launch

- Custom domain on Vercel
- Launch checklist + portfolio writeup
- Post-launch smoke test in CI or runbook

---

## 9. Recommended next implementation step

**Version 23 — Bulk saved-analysis management** is the current implementation track.

- [x] Step 1 — Accessible saved-analysis multi-selection foundation with native row checkboxes, **Select all visible**, indeterminate state, selected/hidden counts, Clear selection, and session/refresh/delete cleanup. See [`VERSION_23_STEP_1_MULTI_SELECTION.md`](VERSION_23_STEP_1_MULTI_SELECTION.md).
- [x] Step 2 — Selected CSV export for checked loaded saved analyses, including checked rows hidden by search/filter, using the existing structured CSV schema. See [`VERSION_23_STEP_2_SELECTED_EXPORT.md`](VERSION_23_STEP_2_SELECTED_EXPORT.md).
- [ ] Step 3 — Carefully scoped selected deletion design and implementation.
- [ ] Later — Account-wide management controls. Account-wide export/delete claims remain unimplemented until an explicit future step builds and verifies them.

Version 23 must preserve RLS, avoid raw resume/job text storage, avoid analyzer/taxonomy changes unless separately approved, and keep account-wide controls honest until implemented. Step 1 multi-selection and Step 2 selected CSV export are complete; selected deletion remains pending for Step 3.

**Still later:** custom domain, observability, mature SaaS hardening, semantic matching, AI extraction, billing, teams, organization features, and formal security/legal certification.

**Out of scope until separately approved:** raw resume text, PDF/DOCX parsing, AI extraction, semantic matching, application tracking, automated retention, and mature SaaS/security-certification claims.

See [`VERSION_22_CHECKPOINT.md`](VERSION_22_CHECKPOINT.md), [`TAXONOMY_MAINTENANCE.md`](TAXONOMY_MAINTENANCE.md), [`VERSION_16_CHECKPOINT.md`](VERSION_16_CHECKPOINT.md), and [`VERSION_16_PRODUCTION_READINESS_REVIEW.md`](VERSION_16_PRODUCTION_READINESS_REVIEW.md).

---

## Document maintenance

Update this file when hosted parity changes or public v1 scope shifts. Do not mark the product mature production SaaS or security-certified without a separate explicit review.
