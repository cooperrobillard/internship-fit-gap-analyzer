# Version 17 Input Workflow Checkpoint and Resume-Profile Design Guardrail

**Status:** Checkpoint complete — June 2026  
**Product:** Job Fit & Skill-Gap Analyzer (hosted prototype)  
**Repository:** internship-fit-gap-analyzer

Related: [`PUBLIC_PRODUCT_ROADMAP.md`](PUBLIC_PRODUCT_ROADMAP.md), [`VERSION_16_CHECKPOINT.md`](VERSION_16_CHECKPOINT.md), [`VERSION_16_PRODUCTION_READINESS_REVIEW.md`](VERSION_16_PRODUCTION_READINESS_REVIEW.md), [`HOSTED_PROTOTYPE_SMOKE_TEST.md`](HOSTED_PROTOTYPE_SMOKE_TEST.md), hosted privacy page (`web/src/app/privacy/page.tsx`, route `/privacy`).

---

## Summary

Version 17 improved the **hosted input workflow** so users can compare a resume to a job description more comfortably—without adding persistent resume profiles or storing raw resume or job-description text in the cloud save model.

Steps 1–3 focused on clarity, convenience, and safe demos:

- clearer paste/save copy,
- transient plain `.txt` file loading in the browser,
- fictional sample/demo inputs for trying the app without personal data.

This document records that progress, describes the **current input model**, and sets a **guardrail** for any future resume-profile work. It is a practical engineering checkpoint—not a formal security audit and not a claim of production readiness.

---

## Current Version 17 progress

### Step 1 — Hosted resume/job input UX polish

- Polished dashboard analysis form copy (paste fields, optional metadata labels).
- Clear **analyze vs save** distinction: running analysis does not save; save stores structured skills and metadata only.
- Links to the privacy/data-control page from the dashboard.
- Honest prototype messaging about rule-based matching and what is not stored on save.

### Step 2 — Hosted transient `.txt` resume/job upload support

- Optional plain `.txt` upload for resume and job-description fields.
- Files are read **client-side in the browser** and populate existing text areas.
- Validation for unsupported types, empty files, and a practical size limit (~500 KB).
- No file persistence, no uploaded-file storage, no schema or dependency changes.

### Step 3 — Hosted sample/demo input improvements

- **Try sample inputs** loads fictional resume text, job description, and demo metadata.
- **Clear inputs** resets form fields and upload status.
- Demo content is clearly fictional (not real people or employers).
- User still clicks **Run analysis** manually; sample load does not auto-run or auto-save.

### Step 4 — Input workflow checkpoint and guardrail (this document)

- Summarizes Version 17 input progress.
- Documents the current transient input model.
- Lists resume-profile design questions that must be answered before implementation.

---

## Current input model

On the hosted dashboard today, users can:

| Input method | Behavior |
|--------------|----------|
| **Paste resume text** | Typed or pasted into the resume textarea; used for one analysis run in memory. |
| **Paste job-description text** | Typed or pasted into the job textarea; used for one analysis run in memory. |
| **Transient `.txt` upload** | Plain text files read in the browser; contents fill the textareas; files are not stored. |
| **Fictional demo inputs** | **Try sample inputs** fills resume, job, and optional metadata with safe demo content. |
| **Optional metadata** | Job title, company, source URL, notes—used when saving structured results after analysis. |

**Analysis flow:** Browser → Next.js `POST /api/analyze` → Render FastAPI → rule-based analyzer (`src/`) → matched/missing skills returned to the dashboard.

**Save flow (optional, after analysis):** Structured matched/missing skills plus metadata are written to Supabase under the signed-in user’s RLS scope. The intended save path does **not** store raw resume or job-description body text.

**One-off vs persistent:** Every comparison is driven by whatever text is in the form at run time. There is no account-level resume library yet.

---

## What this model intentionally avoids

Version 17 input work did **not** add:

- persistent **resume profiles**
- raw **resume text** storage in Supabase
- raw **job-description text** storage in Supabase
- **uploaded file** persistence (resume or job)
- **PDF/DOCX** parsing
- **semantic / AI** matching
- **database schema** changes for resumes or profiles
- an account-level **resume library**
- changes to Clerk auth, Supabase RLS behavior, or FastAPI analyzer logic (except incidental bug fixes avoided in this track)

The hosted app remains **structured-results-first**: skills, counts, labels, and derived recurring-gap stats—not full document storage.

---

## Why this matters

**Resumes can contain sensitive personal information** — names, contact details, employers, education, dates, and other details users may not expect to live in the cloud indefinitely.

**File uploads can create privacy expectations** — even when files are only read in the browser, users may assume the app “has their resume on file.” Copy and product behavior must stay honest about what is and is not stored.

**A demo workflow helps people try the app safely** — fictional sample inputs let users explore analysis, save, compare, and export without pasting a real private resume or job posting.

**Transient `.txt` support improves convenience without long-term storage responsibility** — users can load text from a file for one comparison without the product taking custody of that file.

**Persistent resume profiles need explicit design** — before storing any resume content in the cloud, the project needs clear answers on data model, consent, view/edit/delete/export, RLS, retention, and updated privacy copy. Skipping that design step risks silent scope creep and user trust issues.

This is careful product engineering, not alarmism. The current prototype can be useful for demos and learning while the team decides whether and how to add resume profiles later.

---

## Resume-profile design questions before implementation

Answer these in a **separate design document** (and update privacy copy) before writing resume-profile code or schema migrations:

### Data model

- [ ] Should resume profiles store **raw text**, **structured extracted skills only**, or **both**?
- [ ] What **exact fields** would be stored (title, label, created/updated timestamps, source type, skill snapshot, etc.)?
- [ ] Should raw resume text be **encrypted at rest**, or **avoided entirely** in favor of minimized fields?
- [ ] Should the app support **multiple named resume profiles** per user?
- [ ] How does the user **choose a resume profile per analysis** (dropdown, default profile, one-off override)?

### Consent and UX

- [ ] How does the user **explicitly consent** to saving a resume profile (separate action from “save analysis results”)?
- [ ] Can users still **paste or upload a one-time resume** without saving it as a profile?
- [ ] How can the user **view, edit, export, and delete** a resume profile?
- [ ] What **empty/error states** and confirmations are required for delete?

### Security and isolation

- [ ] How do **RLS policies** isolate resume profiles by `clerk_user_id` (and any related child rows)?
- [ ] What **re-verification** is needed after new tables or columns (see [`VERSION_16_PRODUCTION_READINESS_REVIEW.md`](VERSION_16_PRODUCTION_READINESS_REVIEW.md))?
- [ ] Are **service-role keys** kept server-side only (never in browser code)?

### Retention, export, and copy

- [ ] What **data retention policy** applies to resume profiles (indefinite until delete, TTL, account closure)?
- [ ] What should **exports include or exclude** (never raw resume text in structured exports unless explicitly chosen and documented)?
- [ ] How should **privacy/data-control copy** change on `/privacy`, the dashboard, and save flows?
- [ ] What **additional smoke tests** are required (create profile, select profile, analyze, save, delete profile, cross-user isolation)?

### Production bar (from Version 16 review)

- [ ] Are **rate limiting**, **abuse protection**, and **observability** adequate for holding more sensitive data?
- [ ] Is there a path to **account-level export/delete** if profiles become part of “my data”?

---

## Recommended guardrail

**Do not implement persistent resume profiles** until a separate design step answers the resume-profile **data model**, **consent**, **delete/export**, **RLS**, **retention**, and **privacy-copy** questions above.

Until then:

- Keep resume and job input **transient** for analysis (paste, browser-only `.txt`, or demo inputs).
- Keep cloud save **structured-results-first** (skills + metadata).
- Treat any schema columns reserved for future resume/job body text as **out of scope** for the current write path.

If the team later decides resume profiles are not worth the custody cost, the current input model already supports the core product value without them.

---

## Recommended next Version 17 steps

**Recommended:** Close Version 17 input-workflow track here and move to **Version 18 — public readiness / production hardening**.

**Why:** Steps 1–4 delivered the planned input polish (UX, transient upload, demo inputs, and this guardrail). Version 16 already identified production gaps (abuse protection, formal policy copy, RLS re-verification after schema changes, retention, observability). Addressing those gaps delivers more safety for real users than starting profile storage without implementation-ready answers.

**Version 18 focus (practical):**

- Rate limiting / abuse review for `/api/analyze`
- RLS and auth re-check with multiple test users
- Privacy copy and data-control completeness
- Input size limits and hosted smoke-test discipline
- Honest “prototype → public v1” checklist progress

**Optional later (only if resume profiles stay on the roadmap):**

- **Version 17 Step 5 (optional)** — focused **resume-profile design document only** (answers the checklist above; no code, no schema). Schedule this **before** any profile implementation sprint, not instead of production hardening.

**Not recommended next:** jumping straight from this guardrail into persistent resume-profile **implementation**.

---

## Verification checklist

Use after Version 17 input-workflow changes and before treating the hosted dashboard as ready for broader use:

| Check | Command or action |
|-------|-------------------|
| FastAPI tests | `pytest api/tests` (from repo root, with API deps installed) |
| Full Python tests | `python3 run_tests.py` |
| Python compile | `python3 -m py_compile api/main.py` (and other touched `src/` / `api/` modules as needed) |
| Web lint | `cd web && npm run lint` |
| Web build | `cd web && npm run build` |
| Privacy copy | Review `/privacy` and dashboard form copy for honest save/upload/demo language |
| Hosted dashboard smoke test | Follow [`HOSTED_PROTOTYPE_SMOKE_TEST.md`](HOSTED_PROTOTYPE_SMOKE_TEST.md) on local or deployed stack |
| No raw resume/job storage added | Confirm save path still maps structured skills + metadata only; no new resume/profile tables wired |

**Version 17 Step 4 confirmation:** This step added **documentation only**. No application code, schema, or storage behavior changed.

---

## Document maintenance

Update this file when:

- hosted input workflow changes materially (new input types, save model changes),
- resume-profile design is completed or explicitly deferred,
- Version 18 production-hardening work shifts the guardrail.

Do not mark the app production-ready or security-audited based on this document alone.
