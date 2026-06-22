# Public Product Roadmap — Job Fit & Skill-Gap Analyzer

Practical audit for evolving the **hosted prototype** into a **finished public web app** that strangers can safely use. Repository and folder name stay **internship-fit-gap-analyzer** for now; the public-facing product name can be **Job Fit & Skill-Gap Analyzer**.

Related: [`HOSTED_PROTOTYPE_SMOKE_TEST.md`](HOSTED_PROTOTYPE_SMOKE_TEST.md), [`PRODUCT_ROADMAP.md`](PRODUCT_ROADMAP.md), [`DEPLOYMENT_READINESS.md`](DEPLOYMENT_READINESS.md), [`VERSION_15_CHECKPOINT.md`](VERSION_15_CHECKPOINT.md), [`VERSION_16_CHECKPOINT.md`](VERSION_16_CHECKPOINT.md), [`VERSION_16_PRODUCTION_READINESS_REVIEW.md`](VERSION_16_PRODUCTION_READINESS_REVIEW.md), [`VERSION_17_INPUT_WORKFLOW_GUARDRAIL.md`](VERSION_17_INPUT_WORKFLOW_GUARDRAIL.md), [`PERSISTENT_RESUME_PROFILE_DESIGN.md`](PERSISTENT_RESUME_PROFILE_DESIGN.md), [`RESUME_PROFILE_SCHEMA_RLS_PLAN.md`](RESUME_PROFILE_SCHEMA_RLS_PLAN.md), [`RESUME_PROFILE_SCHEMA_RLS_DRAFT.md`](RESUME_PROFILE_SCHEMA_RLS_DRAFT.md), [`SAVED_ANALYSIS_RLS_PATTERN_REVIEW.md`](SAVED_ANALYSIS_RLS_PATTERN_REVIEW.md), [`RESUME_PROFILE_PRE_MIGRATION_REVIEW.md`](RESUME_PROFILE_PRE_MIGRATION_REVIEW.md), [`RESUME_PROFILE_CHECKPOINT.md`](RESUME_PROFILE_CHECKPOINT.md), root [`README.md`](../README.md).

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
| **Analyzer** | Rule-based taxonomy + aliases in `src/` |

### Hosted web app (prototype)

| Piece | Status |
|-------|--------|
| **Frontend** | Next.js on Vercel (`web/`) |
| **Auth** | Clerk sign-in/sign-up, protected `/dashboard` |
| **Analysis** | Browser → `/api/analyze` → Render FastAPI (`api/`) with optional shared-secret validation |
| **Cloud DB** | Supabase/Postgres, RLS per Clerk user |
| **Save** | Structured matched/missing skills + metadata (title, company, URL, notes)—**no raw resume/job text** |
| **Read** | Recent saved list (metadata + counts); no detail drill-down, search, compare, delete, or export in UI yet |
| **Ops** | Hosted smoke-test checklist, improved analysis/save/read error handling |

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
| Saved analysis history | Yes | Partial | Yes | P0 | Hosted: list of recent rows only |
| Saved analysis detail view | Yes | No | Yes | P0 | Hosted list does not open skill rows |
| Saved analysis search / filter | Yes | No | Should have | P1 | Streamlit search tab |
| Recurring gap stats | Yes | No | Yes | P0 | CLI pandas + Streamlit; **key product gap on hosted** |
| Saved analysis comparison | Yes | No | Should have | P1 | Two-way compare in Streamlit |
| Deletion | Yes | No | Yes | P0 | RLS allows; no hosted UI yet |
| Export / download | Yes | No | Should have | P1 | CSV/MD locally; hosted TBD |
| SQLite local persistence | Yes | N/A | N/A | — | Stays local tool |
| Supabase hosted persistence | N/A | Yes | Yes | P0 | Prototype save path live |
| Clerk auth | N/A | Yes | Yes | P0 | |
| RLS / user ownership | N/A | Yes | Yes | P0 | Manually verified; needs ongoing checks |
| Persistent resume profiles | Partial (UI) | Schema + helpers | Later | P2 | Dev 18 Step 4: dashboard CRUD — not wired to analysis yet |
| Different resume per analysis | Yes (implicit paste) | Yes (paste) | Yes | P1 | Profiles would formalize this |
| Public privacy / data controls | Partial | Partial | Yes | P0 | Notices only; need policy + delete/export |
| UI polish / final design | Local OK | Prototype | Yes | P1 | Copy polish done; full redesign later |
| Custom domain | No | No | Later | P2 | Vercel default URL today |
| Semantic / AI matching | No | No | Later | P3 | Explicitly out of v1 scope |
| Rate limiting / abuse protection | No | Partial | Yes | P0 | Shared secret on API only; need more |
| Error monitoring / logging | Minimal | Minimal | Yes | P1 | Calm UI errors; no full observability |

**Legend:** P0 = blocks public launch · P1 = strong post-launch or fast follow · P2+ = later

---

## 4. Public v1 requirements

### Must have before public launch

- [ ] Hosted **recurring gap stats** across saved analyses (core value prop)
- [ ] Hosted **saved analysis detail** (view matched/missing skills for a saved row)
- [ ] Hosted **delete** own analyses (and cascade skill rows)
- [ ] **Privacy policy** + in-app data explanation (what is stored, what is not)
- [x] **Auth + RLS** re-verified with multiple test users — Dev 19 Step 3 complete; see [`DEV19_RLS_AUTH_REVERIFICATION.md`](DEV19_RLS_AUTH_REVERIFICATION.md)
- [ ] **Safe data model** unchanged: structured skills + metadata; no raw resume/job text by default
- [ ] **Abuse basics**: API rate limiting or equivalent; review shared-secret model
- [ ] **Hosted smoke test** passes on production after each deploy
- [ ] **Error handling** remains user-safe (no secrets, tokens, or stack traces in UI)
- [ ] **Internship-only copy** removed or broadened to “any job” in public surfaces

### Should have soon after launch

- [ ] Search / filter saved analyses
- [ ] Compare two saved analyses
- [ ] Export (CSV or similar) of user-owned summary data
- [ ] Resume/job **file upload** on web (with explicit privacy copy)
- [ ] Basic monitoring (Vercel/Render/Supabase dashboards + alerts)
- [ ] Custom domain decision

### Can wait until later

- [ ] Persistent **resume profiles** (with per-analysis resume choice)
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

**Current honest status:** Demoable hosted prototype—not production-ready for strangers’ sensitive data.

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

### Future: resume profiles

- **Desired:** Named resume profiles users reuse, with ability to pick a **different resume per analysis**
- **Design:** [`PERSISTENT_RESUME_PROFILE_DESIGN.md`](PERSISTENT_RESUME_PROFILE_DESIGN.md) — product/consent/UX plan (Step 5)
- **Schema/RLS plan:** [`RESUME_PROFILE_SCHEMA_RLS_PLAN.md`](RESUME_PROFILE_SCHEMA_RLS_PLAN.md) — structured table + policies (Step 6)
- **SQL draft (not applied):** [`RESUME_PROFILE_SCHEMA_RLS_DRAFT.md`](RESUME_PROFILE_SCHEMA_RLS_DRAFT.md) + [`sql/resume_profiles_schema_rls_draft.sql`](sql/resume_profiles_schema_rls_draft.sql) (Step 7)
- **RLS pattern review:** [`SAVED_ANALYSIS_RLS_PATTERN_REVIEW.md`](SAVED_ANALYSIS_RLS_PATTERN_REVIEW.md) — saved analyses use `clerk_user_id` + `auth.jwt()->>'sub'` (Step 8); profile schema should mirror this
- **First implementation should:** structured skills only; **omit `raw_resume_text`**; match saved-analysis ownership/RLS

### User rights (target)

- **Delete** saved analyses (and children) from the dashboard
- **Export** structured history they own
- **Clear copy** before any future “store full resume in cloud” feature

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
- **Dev 18 — migration apply + verification** ([`RESUME_PROFILE_MIGRATION_VERIFICATION.md`](RESUME_PROFILE_MIGRATION_VERIFICATION.md)) — hosted structured schema and RLS confirmed; table empty; helpers/UI not implemented

**Not implemented:** helpers or UI.

### Dev 19 — Production hardening

- Dev 19 Step 3 — Clerk/Supabase RLS and two-user ownership re-verification — **Complete**; see [`DEV19_RLS_AUTH_REVERIFICATION.md`](DEV19_RLS_AUTH_REVERIFICATION.md).
- Next step: **Dev 19 Step 4 — abuse/rate-limit review and bounded implementation**.
- Continue to avoid production-ready or security-audited claims until a separate, explicit review supports them.

### Version 18 — Public readiness / security / privacy

- Privacy page and data controls copy
- Delete/export completeness
- Rate limiting / abuse protection review
- RLS and auth security pass
- Input validation and size limits

### Version 19 — Final UI redesign

- Design system: vibrant, summery, non-generic
- Landing + dashboard layout pass
- Accessible components, mobile sanity

### Version 20 — Domain and public launch

- Custom domain on Vercel
- Launch checklist + portfolio writeup
- Post-launch smoke test in CI or runbook

---

## 9. Recommended next implementation step

**Version 17 Step 10 — Resume-profile pre-migration review** — **Complete**

- [`RESUME_PROFILE_PRE_MIGRATION_REVIEW.md`](RESUME_PROFILE_PRE_MIGRATION_REVIEW.md) — design/SQL draft ready to **author** migration; **not ready to apply** until live Supabase `job_analyses` RLS predicate is confirmed

**Version 17 Step 11 — Structured resume-profile migration file** — **Complete**

- [`web/database/migrations/20260617_structured_resume_profiles.sql`](../web/database/migrations/20260617_structured_resume_profiles.sql) — ALTER migration for legacy empty `resume_profiles`

**Dev 18 — Apply migration + verify RLS** — **Complete**

- [`RESUME_PROFILE_MIGRATION_VERIFICATION.md`](RESUME_PROFILE_MIGRATION_VERIFICATION.md) — hosted structured schema, indexes, RLS, and smoke test verified; `resume_profiles` row count 0; helpers/UI not implemented

**Dev 18 Step 7 — Resume-profile checkpoint** — **Complete**

- [`RESUME_PROFILE_CHECKPOINT.md`](RESUME_PROFILE_CHECKPOINT.md) — structured database/RLS foundation, helpers, management UI, selector guardrail, controlled analysis handoff, privacy model, and limitations documented before Dev 19

**Recommended next:** Dev 19 production hardening: RLS/auth re-checks, user-safe errors/logging, input limits, abuse/rate-limit review, and privacy/data-control review.

**Dev 18 Step 2 — Typed resume-profile helpers** — **Complete**

- [`web/src/lib/supabase/resume-profiles.ts`](../web/src/lib/supabase/resume-profiles.ts) — list/create/update/delete; structured skills only; no UI yet

**Dev 18 Step 3 — Helper test coverage** — **Complete (manual checklist)**

- [`RESUME_PROFILE_MIGRATION_VERIFICATION.md`](RESUME_PROFILE_MIGRATION_VERIFICATION.md) § Helper test coverage — no web test runner; pure exports + manual checklist

**Dev 18 Step 4 — Resume-profile management UI foundation** — **Complete**

- [`web/src/app/dashboard/resume-profiles-panel.tsx`](../web/src/app/dashboard/resume-profiles-panel.tsx) — list/create/edit/delete structured profiles on dashboard

**Out of scope until gated:** raw resume text, PDF/DOCX parsing, AI extraction, semantic matching, application tracking, and production-readiness claims without Dev 19 hardening.

See [`VERSION_16_CHECKPOINT.md`](VERSION_16_CHECKPOINT.md) and [`VERSION_16_PRODUCTION_READINESS_REVIEW.md`](VERSION_16_PRODUCTION_READINESS_REVIEW.md).

---

## Document maintenance

Update this file when hosted parity changes or public v1 scope shifts. Do not mark production-ready until section 5 checklist is honestly complete.
