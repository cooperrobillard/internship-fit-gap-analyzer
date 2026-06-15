# Version 16 Production-Readiness Review Before Resume Profiles

**Status:** Review complete — June 2026  
**Product:** Job Fit & Skill-Gap Analyzer (hosted prototype)  
**Repository:** internship-fit-gap-analyzer

Related: [`PUBLIC_PRODUCT_ROADMAP.md`](PUBLIC_PRODUCT_ROADMAP.md), [`VERSION_15_CHECKPOINT.md`](VERSION_15_CHECKPOINT.md), [`HOSTED_PROTOTYPE_SMOKE_TEST.md`](HOSTED_PROTOTYPE_SMOKE_TEST.md), hosted privacy page (`web/src/app/privacy/page.tsx`, route `/privacy`).

---

## Summary judgment

The hosted app has made **solid progress** as a structured-results job-search workspace: sign-in, save, review, compare, export, delete, and honest privacy copy are in place. The **intended saved-data model** does not persist raw resume or job-description text.

**Recommendation:** The project is **not ready** to add **persistent resume profiles** or to **store raw resume or job-description text** in the cloud until additional privacy, security, abuse, and account-data controls are completed. Version 17 should start with **lower-risk input workflow polish** and a **profile design document**, not immediate raw-text profile storage.

This is a practical engineering checkpoint—not a formal security audit and not a claim that the current app is “insecure.”

---

## 2. Current hosted architecture

```text
Browser
  └── Vercel (Next.js, web/)
        ├── Clerk (sign-in / sign-up)
        ├── GET /privacy (data-control explanation)
        ├── POST /api/analyze (Next.js route handler)
        │     └── HTTPS → Render (FastAPI, api/)
        │           └── Rule-based analyzer (in-memory; src/)
        └── Supabase (Postgres + RLS)
              └── job_analyses, matched_skills, skill_gaps (per user)
```

| Layer | Role |
|-------|------|
| **Vercel** | Landing, dashboard, privacy page, analysis proxy |
| **Clerk** | User authentication; identity for Supabase client |
| **Render** | FastAPI `/health`, `/analyze` (shared-secret validation when configured) |
| **Supabase** | Structured saved analyses; row-level security per signed-in user |

Analysis requests go through the **hosted Next.js app**, not directly from the browser to Render. Saved data in Supabase is **structured analysis output and metadata**, not full resume or job posting bodies on the current write path.

---

## 3. Current saved-data model

When a user saves an analysis, the app stores **structured results and labels**:

| Stored today (intended) | Not stored on save (intended) |
|-------------------------|-------------------------------|
| Job title, company, source URL, notes | Raw pasted resume text |
| Saved date (timestamp) | Raw uploaded resume text |
| Matched skills (name + category) | Raw pasted job-description text |
| Missing skills (name + category) | Raw uploaded job-description text |
| Matched / missing counts | |
| Recurring gap stats (derived from saved missing skills) | |

The database schema may include columns reserved for future use (e.g. job body text). The **current application path does not intentionally write** raw resume or job-description content to saved rows. Analysis still requires pasted text in the browser for a one-time comparison; that processing is separate from the structured save model.

---

## 4. What currently works well

- **Sign-in boundary** — Clerk separates anonymous and signed-in use; dashboard save features expect an account.
- **User-owned saved analyses** — Supabase RLS scopes reads/writes to the signed-in user’s rows.
- **Hosted analysis** — Browser → `/api/analyze` → FastAPI returns matched/missing skills (rule-based).
- **Structured save / read / delete** — Save skills + metadata; detail view; delete with confirmation; child skill rows cascade.
- **Recurring gap stats** — Aggregated missing skills across the user’s saves.
- **Detail, search/filter, comparison** — Review one row; find analyses; compare two saved rows client-side.
- **Export / download** — Markdown/CSV for single analysis, all analyses summary, recurring gaps, and comparisons (structured fields only).
- **Privacy / data-control page** — Honest prototype copy at `/privacy` (not formal legal policy).
- **Safer error handling** — Calm UI messages; no raw Supabase errors, tokens, or stack traces in the dashboard.
- **Structured-results-first design** — Core product value (gaps, labels, history) without persisting full resume/job bodies on save.

---

## 5. Main production-readiness gaps

| Area | Gap | Why it matters before resume profiles |
|------|-----|--------------------------------------|
| **Security audit** | No full third-party or formal security review | Resume storage raises the bar for controls and review |
| **Privacy / legal** | No formal privacy policy or terms of service | Persistent PII needs clear legal and product copy |
| **Abuse / cost** | No rate limiting or strong abuse protection on analysis | Public traffic + larger payloads increase risk and cost |
| **Observability** | Limited logging/monitoring runbook | Harder to detect incidents affecting user data |
| **Error monitoring** | No complete alerting strategy (Vercel/Render/Supabase) | Production issues may go unnoticed |
| **Account data rights** | Per-analysis delete/export exist; no full **account-level** export/delete story | Users need clear “all my data” expectations |
| **Data retention** | No published retention or deletion schedule | Resume data needs defined lifecycle |
| **Transient request handling** | No documented review of what hosting platforms may log during analysis | Pasted text transits the stack even when not saved |
| **RLS after schema change** | RLS verified for current tables; **re-verification required** after new tables/columns | Resume profiles would add sensitive rows |
| **Incident procedure** | No written incident/debugging playbook | Needed before holding more sensitive data |
| **Cost / usage controls** | No caps or alerts for analysis volume | Uploads and public launch increase spend risk |

None of these alone means “do not use the prototype for demos.” Together they mean **do not expand into persistent resume storage yet**.

---

## 6. Resume-profile-specific risks

Persistent resume profiles are **more sensitive** than structured skill-gap rows:

- Resumes often contain **names, addresses, phone numbers, email, education, employers, dates, and project details**.
- They may imply **work authorization, demographics, health, or other protected characteristics** even when not explicitly labeled.
- Storing raw resume text increases **custody responsibility**: breach impact, user trust, and regulatory expectations grow.
- Users need **explicit consent** (“what will be stored, for how long, who can access it”) and **strong delete/export** paths.
- **Minimization** should be the default: ask whether full raw text is required, or whether labeled skill summaries / user-edited snippets are enough for the product goal.

**Conservative position:** Treat resume profiles as a **new data class**, not a small extension of job metadata.

---

## 7. Raw job-description storage risks

Job descriptions are **usually less personal than resumes**, but storage still has downsides:

- Postings can reveal **application targets, compensation hints, referral context, or strategy** when combined with notes and URLs.
- Raw job text is **not required** for the current structured-results workflow (skills + metadata already suffice).
- If job body storage is added later, it should be **optional, explicit, and documented**—same bar as resume text.

**Recommendation:** Keep job descriptions **transient for analysis** on the hosted path until the same production controls as resume storage are in place.

---

## 8. Recommended rule before resume profiles

**Do not add persistent resume profiles** (and do not store raw resume or job-description text in Supabase) until the project has:

1. **Defined exact fields** to store—and justified each field (minimization review).
2. **Added explicit consent language** in UI and policy copy before first save of resume content.
3. **Clarified account-level delete/export** expectations (not only per-analysis delete).
4. **Re-checked Supabase RLS** with multi-user tests for any new tables/columns.
5. **Decided whether raw resume text is necessary** vs. structured or user-edited excerpts.
6. **Considered encryption at rest and access patterns** if raw text is stored.
7. **Added rate limiting or abuse controls** for analysis and upload endpoints.
8. **Updated privacy / data-control copy** to match actual storage behavior.
9. **Completed another hosted smoke test** after any storage change ([`HOSTED_PROTOTYPE_SMOKE_TEST.md`](HOSTED_PROTOTYPE_SMOKE_TEST.md)).

Until then, remain on the **structured-results-first** model.

---

## 9. Safe Version 17 path

Start Version 17 with **lower-risk input workflow polish** before full persistent profiles:

| Safer near-term work | Defer until controls above |
|---------------------|----------------------------|
| Clearer paste UX and demo/sample inputs | Persistent `resume_profiles` rows with raw text |
| Optional **`.txt` upload** analyzed **transiently** (not saved by default) | Silent save of upload contents |
| Explicit “save vs. analyze only” messaging | Profile picker wired to cloud resume storage |
| Profile **design document** (fields, consent, delete, RLS plan) | PDF/DOCX parsing in production path |
| Different resume **per session** via paste only | Cross-device resume library without audit |

Upload and profile features should be **opt-in**, **documented**, and **tested** with the same RLS and privacy bar as saved analyses.

---

## 10. Launch-readiness checklist

Use before storing resume/job body text or calling the app “public production.”

### Privacy / data

- [ ] Formal privacy policy and terms (if public service)
- [ ] Data-control page matches actual storage (`web/src/app/privacy/page.tsx`, route `/privacy`)
- [ ] Documented data retention and deletion
- [ ] Account-level export and delete story defined
- [ ] Transient analysis path reviewed (what is not saved vs. what may be logged by platforms)

### Security / auth / RLS

- [ ] Clerk production configuration reviewed
- [ ] RLS policies tested with multiple users (read/write isolation)
- [ ] No service-role keys in browser code
- [ ] API abuse model reviewed (shared secret + future rate limits)
- [ ] Security review or audit appropriate to scope

### Reliability / observability

- [ ] Hosted smoke test passes after deploy
- [ ] Log locations documented (Vercel, Render, Supabase)
- [ ] Basic alerting or monitoring plan
- [ ] Incident response / debugging runbook

### Abuse / cost controls

- [ ] Rate limiting or equivalent on analysis
- [ ] Input size limits enforced
- [ ] Cost/usage awareness for Vercel, Render, Supabase

### UX / product clarity

- [ ] Honest rule-based (not AI) messaging
- [ ] Clear save vs. analyze-only flows
- [ ] Consent before storing sensitive content
- [ ] Delete and export discoverable in UI

### Documentation / public claims

- [ ] README and roadmap match behavior
- [ ] No “production-ready” or “fully secure” claims without evidence
- [ ] Portfolio/demo vs. public launch positioning clear

---

## 11. Recommendation for next step

1. **Version 16 Step 5** — Publish [`VERSION_16_CHECKPOINT.md`](VERSION_16_CHECKPOINT.md) (when implemented) summarizing comparison, export, privacy page, and this review.
2. **Version 17** — Begin with **resume/input workflow planning** and transient upload UX—not immediate persistent raw resume storage.
3. **Revisit this checklist** before any schema or save-path change that stores resume or job body text.

**Bottom line:** The hosted app is a **credible structured-results prototype**. Persistent resume profiles are a **product and privacy escalation** that should wait until the gaps in section 5 are addressed and section 8’s rule is satisfied.
