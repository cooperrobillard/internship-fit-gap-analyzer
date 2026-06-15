# Version 16 Checkpoint — Hosted Comparison, Export, and Data-Control Foundation

Record of **Version 16** for the hosted **Job Fit & Skill-Gap Analyzer** prototype. This version added user control and transparency on top of Version 15’s saved-analysis workspace.

Related: [`VERSION_15_CHECKPOINT.md`](VERSION_15_CHECKPOINT.md), [`VERSION_16_PRODUCTION_READINESS_REVIEW.md`](VERSION_16_PRODUCTION_READINESS_REVIEW.md), [`PUBLIC_PRODUCT_ROADMAP.md`](PUBLIC_PRODUCT_ROADMAP.md), [`HOSTED_PROTOTYPE_SMOKE_TEST.md`](HOSTED_PROTOTYPE_SMOKE_TEST.md).

---

## 1. Summary

Version 16 made the hosted app **more useful and user-controlled** by adding:

- **Comparison** of two saved analyses (shared and unique missing/matched skills)
- **Export/download** of structured saved data (Markdown and CSV)
- A **privacy and data-controls** page explaining what is and is not saved
- A **production-readiness review** that gates persistent resume profiles until stronger controls exist

The hosted dashboard is now a credible **structured-results job-search tool** for signed-in users—not yet a broad public launch.

---

## 2. Current product status

The hosted app is **beyond a basic prototype** (save, list, detail, gaps, compare, export, delete, privacy copy) but **not production-ready** for strangers’ sensitive data or a full public SaaS launch.

| Area | Status |
|------|--------|
| **Hosted analysis** | Works via Vercel → `POST /api/analyze` → Render FastAPI (rule-based) |
| **Clerk auth** | Sign-in/sign-up; protected dashboard |
| **Supabase + RLS** | User-owned saved analyses |
| **Saved analyses** | Create, browse, search/filter, detail, compare, export, delete |
| **Recurring gap stats** | Dashboard panel from saved missing skills |
| **Privacy / data controls** | Public `/privacy` page (honest prototype copy, not legal policy) |
| **Production-readiness review** | [`VERSION_16_PRODUCTION_READINESS_REVIEW.md`](VERSION_16_PRODUCTION_READINESS_REVIEW.md) |
| **Raw resume/job text on save** | **Not intentionally persisted** in current saved-analysis model |

**Architecture:**

```text
Browser → Vercel (Next.js) → Clerk
              → POST /api/analyze → Render (FastAPI) → rule-based analyzer
              → Supabase (job_analyses, matched_skills, skill_gaps, RLS)
```

---

## 3. Version 16 completed work

### Step 1 — Hosted saved-analysis comparison

- Dashboard section to pick **two saved analyses** and compare client-side
- **Shared / first-only / second-only** missing skills; matched skills comparison
- Preserved detail view, recurring stats, search/filter, metadata, delete, and structured data model

### Step 2 — Hosted export/download

- **Single analysis:** Markdown and CSV (metadata + skill rows)
- **All analyses:** summary CSV
- **Recurring gaps:** CSV (skill, category, count)
- **Comparison:** Markdown and CSV when a valid pair is selected
- Client-side `Blob` downloads—no new backend endpoints; **no raw resume/job text** in exports

### Step 3 — Privacy/data-control page

- Public route `/privacy` plus links from landing and dashboard
- Explains what the prototype **saves** and **does not intentionally save**
- Describes delete, export, and optional save; **does not claim** production readiness or a completed security audit

### Step 4 — Production-readiness review before resume profiles

- [`VERSION_16_PRODUCTION_READINESS_REVIEW.md`](VERSION_16_PRODUCTION_READINESS_REVIEW.md)
- Audits privacy, security, abuse, and account-data gaps
- **Recommends waiting** on persistent resume profiles and raw resume/job text storage
- Points Version 17 toward **lower-risk input polish** and profile design first

### Step 5 — Version 16 checkpoint

- This document

---

## 4. What stayed intentionally out of scope

- Persistent **resume profiles** in the cloud
- **Raw resume text** storage on save
- **Raw job-description text** storage on save
- PDF/DOCX parsing on hosted web
- Semantic / AI matching
- Major UI redesign
- Custom domain
- Billing
- Admin tools
- Full security audit
- Claiming **production readiness**

---

## 5. Privacy/security posture

- **Structured-results-first** — saved rows hold skills, counts, and job metadata labels
- **No intentional raw resume/job text** on the save or export paths in the current workflow
- **RLS and user ownership** remain central; browser code uses Clerk-scoped Supabase client, not service-role keys
- **User controls** — per-analysis delete, structured export/download, optional save, privacy page
- **Broader launch** still needs rate limiting, formal policy, account-level data rights, observability, and another RLS pass after any schema change (see production-readiness review)

---

## 6. Version 17 recommendation

Version 17 should focus on **lower-risk resume/input workflow polish** before persistent resume profiles:

| Suggested direction | Rationale |
|-------------------|-----------|
| Improve hosted **paste UX** and **demo/sample** inputs | Value without new sensitive storage |
| Consider **transient `.txt` upload** (analyze only, not saved by default) | Matches local app; keeps save path structured |
| **Profile design document** before implementation | Fields, consent, delete, RLS plan |
| **Raw resume storage off by default** | Align with production-readiness review |
| **Explicit consent** before any future profile save | Required for PII |
| **Different resume per analysis** (paste/session first) | Product goal without cloud resume library yet |

**Do not** jump straight to `resume_profiles` + raw text in Supabase until review checklist items are addressed.

---

## 7. Updated long-range roadmap

**Version 16 (complete)**

- ✅ Step 1 — Hosted saved-analysis comparison
- ✅ Step 2 — Hosted export/download
- ✅ Step 3 — Privacy/data-control page
- ✅ Step 4 — Production-readiness review before resume profiles
- ✅ Step 5 — Version 16 checkpoint

**Likely Version 17** — Resume/input workflow polish; possible persistent resume profiles; different resume per analysis; possible upload support (gated by review)

**Likely Version 18** — Production hardening; rate limiting; privacy/security cleanup; RLS re-check; error/logging improvements

**Likely Version 19** — Final UI redesign; landing/dashboard polish; responsive layout; product copy polish

**Likely Version 20** — Custom domain; final hosted smoke test; portfolio/README launch update; public sharing

---

## 8. Final Version 16 verification checklist

Run from **project root** unless noted. Use **generic sample text** in hosted smoke tests.

### Python / API

```bash
python3 tests/test_api_service.py
python3 run_tests.py
python3 -m py_compile api/main.py run_tests.py streamlit_app.py
```

### Web (Next.js)

```bash
cd web && npm run lint && npm run build && cd ..
```

### Privacy / repo hygiene

- Confirm `.env`, `.env.local`, and `web/.env.local` are **not** tracked
- Confirm no private resume/job text, secrets, or generated outputs in commits or docs

### Hosted smoke

- Render **`GET /health`** → `{"status":"ok"}`
- [`HOSTED_PROTOTYPE_SMOKE_TEST.md`](HOSTED_PROTOTYPE_SMOKE_TEST.md): sign in, analyze, save, detail, search, compare, export, delete, visit `/privacy`

---

## 9. Next step

**Recommended:** **Version 17 Step 1 — Hosted resume/job input UX polish**

Start with visible improvements to paste flows, sample/demo copy, and analyze-vs-save messaging—plus a short **resume/profile design note**—before implementing persistent cloud resume storage.

Alternative if you prefer planning first: **Version 17 Step 1 — Resume/input workflow audit and polish plan** (document-only step before code).

---

## Document maintenance

Update when Version 17 ships or when hosted data/storage scope changes. Do not mark production-ready until [`VERSION_16_PRODUCTION_READINESS_REVIEW.md`](VERSION_16_PRODUCTION_READINESS_REVIEW.md) checklist is honestly complete.
