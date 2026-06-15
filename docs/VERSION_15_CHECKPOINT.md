# Version 15 Checkpoint — Hosted Saved-Analysis Feature Parity Foundation

Record of **Version 15** for the hosted **Job Fit & Skill-Gap Analyzer** prototype. This closes the first major gap between the local/Streamlit saved-analysis workflow and the signed-in Next.js dashboard.

Related: [`PUBLIC_PRODUCT_ROADMAP.md`](PUBLIC_PRODUCT_ROADMAP.md), [`VERSION_13_HOSTED_DEPLOYMENT_CHECKPOINT.md`](VERSION_13_HOSTED_DEPLOYMENT_CHECKPOINT.md), [`HOSTED_PROTOTYPE_SMOKE_TEST.md`](HOSTED_PROTOTYPE_SMOKE_TEST.md).

---

## 1. Version 15 summary

Version 15 moved the hosted app **closer to feature parity** with the original local and Streamlit saved-analysis workflow. Before Version 15, the dashboard could analyze and save structured results, but users could only skim a short recent list.

After Version 15, signed-in users can **review, label, find, and delete** their own saved analyses in the cloud—with recurring gap stats that answer “what skills keep showing up as missing across my saved postings?”

The hosted app is now **more useful as a real job-search workspace**, while still a **prototype** (not production-ready SaaS).

---

## 2. Completed steps

| Step | Summary |
|------|---------|
| **Step 1 — Hosted recurring gap stats** | Dashboard panel aggregates missing skills across the user’s saved analyses (RLS-scoped). Shows frequency counts and calm empty states. |
| **Step 2 — Richer saved-analysis detail view** | Selecting a saved row opens metadata plus full matched/missing skill lists. No raw resume or job body text loaded. |
| **Step 3 — Job metadata polish** | Clear optional labels on save (job title, company, source URL, notes). Consistent display with fallbacks in list and detail. |
| **Step 4 — Search/filter foundation** | Client-side search over metadata and skill names; simple filters (all, has/no missing skills, has notes). Preserves default newest-first order. |
| **Step 5 — Hosted delete flow** | Inline confirmation, RLS-scoped delete of `job_analyses` (child skill rows cascade). List, detail, and recurring stats refresh after delete. |

---

## 3. Current hosted capabilities (after Version 15)

- **User sign-in / sign-up** (Clerk)
- **Hosted analysis** via browser → `POST /api/analyze` → Render FastAPI (rule-based, in-memory)
- **Supabase saved analyses** with RLS and per-user ownership
- **Recurring missing-skill stats** across saved analyses
- **Saved-analysis detail review** (metadata + skill rows)
- **Metadata labels:** job title, company, source URL, notes (structured only on save—no raw resume/job body text)
- **Saved-analysis search and filter** (client-side on loaded list)
- **Saved-analysis deletion** with confirmation
- **Safer save / read / delete error handling** (calm UI copy; no raw Supabase errors, tokens, or stack traces)

**Architecture (unchanged):**

```text
Browser → Vercel (Next.js) → Clerk
              → POST /api/analyze → Render (FastAPI) → rule-based analyzer
              → Supabase (job_analyses, matched_skills, skill_gaps, RLS)
```

---

## 4. What is still not finished

Be honest about limits:

- **Not production-ready SaaS** — demoable prototype for learning and portfolio use
- **No full security audit** — RLS and shared-secret API validation exist; formal review still needed
- **No semantic / AI matching** — rule-based taxonomy and aliases only
- **No PDF/DOCX parsing** on the hosted web app (Streamlit local upload remains separate)
- **No persistent resume profiles** — schema draft exists; not wired in hosted UI
- **No custom domain or final branding** — Vercel default URL today
- **No final UI redesign** — functional dashboard, not launch polish
- **Public privacy / data-control docs** need more work (policy page, export story)
- **Rate limiting / abuse protection** still needs consideration beyond shared-secret validation

---

## 5. Public-product progress update

The project is moving toward a **public-facing product** named **Job Fit & Skill-Gap Analyzer**:

- A **serious public tool** for comparing resume text to job descriptions and tracking skill gaps across postings
- **Structured analysis results and metadata first** — matched/missing skills, counts, job labels
- **Raw resume and job text storage deferred** until privacy and security decisions are stronger
- **First public version can stay rule-based** — honest about keyword/alias matching
- **AI / semantic matching can come later** — explicit future track, not claimed today

The **local CLI and Streamlit app** remain the fuller offline workflow (uploads, SQLite, compare, exports). The **hosted dashboard** now covers the core saved-analysis loop for signed-in users.

---

## 6. Recommended Version 16

**Version 16 — Hosted comparison, export, and data-control foundation**

| Step | Focus |
|------|--------|
| **Step 1** | Add **hosted saved-analysis comparison** (two saved rows side by side) |
| **Step 2** | Add **hosted saved-analysis export / download** (user-owned summary data) |
| **Step 3** | Add **basic privacy / data-control page** or account data-controls planning |
| **Step 4** | **Review production-readiness gaps** before resume profiles |
| **Step 5** | **Version 16 checkpoint** |

Version 16 builds on Version 15’s save/review/find/delete foundation toward public launch requirements (compare, export, privacy copy) without jumping to resume profiles or AI matching yet.

---

## 7. Verification checklist

Run from the **project root** unless noted. Use **generic sample text only** in hosted smoke tests—no real private resumes or job postings.

### Local Python

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
- Follow [`HOSTED_PROTOTYPE_SMOKE_TEST.md`](HOSTED_PROTOTYPE_SMOKE_TEST.md): sign in, analyze with safe sample text, save, open detail, search/filter, delete, confirm recurring stats update

---

## Document maintenance

Update this checkpoint when Version 16 ships or when hosted parity scope changes. Do **not** mark the app production-ready until the public readiness checklist in [`PUBLIC_PRODUCT_ROADMAP.md`](PUBLIC_PRODUCT_ROADMAP.md) is honestly complete.
