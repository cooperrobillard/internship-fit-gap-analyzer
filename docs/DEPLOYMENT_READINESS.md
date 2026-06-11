# Deployment Readiness

Practical checklist for evaluating whether this project is ready to move from a **local demo** toward a **hosted account-based web app**. This document does **not** implement deployment, auth, or cloud infrastructure.

For current capabilities, see the [README](../README.md). For version history, see [`PRODUCT_ROADMAP.md`](PRODUCT_ROADMAP.md).

---

## 1. Current local architecture summary

```text
User (single machine)
  ├── CLI (src/main.py)
  │     └── analysis_runner.py → extract/compare/summarize → markdown/CSV/SQLite
  ├── Streamlit UI (streamlit_app.py, localhost)
  │     └── same analysis_runner + database.py helpers
  └── Local SQLite (optional, data/outputs/analysis_results.db)
        └── analysis_runs, job_results, skill_gaps (+ optional source_url, notes)
```

- **Analysis logic** lives in `src/` and is shared by CLI and Streamlit.
- **Persistence** is optional, file-based SQLite on the local filesystem.
- **No network service layer** — no API, no auth middleware, no cloud DB.
- **No multi-tenant boundary** — one user, one machine, one DB path.

---

## 2. What is already demo-ready

| Item | Status |
|------|--------|
| Rule-based gap analysis (CLI + UI) | Works on sample and private inputs |
| Public sample data workflow | Safe for portfolio demos and screenshots |
| Test gate (`python3 run_tests.py`) | 10 script-style test files, fail-fast runner |
| Local Streamlit prototype | Sample, paste, upload workflows |
| Optional SQLite save + history | Search, compare, delete, exports |
| Saved metadata | Optional source URL and notes |
| Downloads & exports | Current-run MD/CSV; saved summary CSVs; DB backup |
| Privacy-safe repo layout | Samples in Git; private inputs and outputs Git-ignored |
| Documentation | README quickstart, LIMITATIONS, TESTING, checkpoints |

**Bottom line:** The project is **demo-ready locally** and **portfolio-ready** with honest limitations stated.

---

## 3. What is not deployment-ready yet

| Gap | Why it blocks hosting as-is |
|-----|----------------------------|
| Streamlit on localhost | Not a production app server or branded product UI |
| Local SQLite file | No cloud persistence, backups, or per-user isolation |
| No authentication | Anyone with URL access would share one implicit “user” |
| No HTTPS / secrets management | No deployment config or environment separation |
| No rate limiting or abuse controls | Paste/upload endpoints would be unprotected |
| No observability policy | No defined logging, retention, or PII scrubbing for hosted mode |
| No restore/import | Backup download exists; import is not implemented |
| Rule-based matching only | Product expectations for “AI job fit” would be misleading |

---

## 4. Privacy/security blockers before hosting

Decide and document **before** any public or multi-user launch:

| Question | Current local answer | Hosted requirement |
|----------|---------------------|-------------------|
| Is raw resume text stored? | No in SQLite; in-memory in UI session | Must stay false or be explicit opt-in with encryption |
| Is raw job text stored? | No in SQLite; in-memory in UI session | Same |
| What metadata is stored? | Job label, gap lists, counts, optional URL/notes | Review each field for PII leakage |
| Who can read another user’s data? | N/A (single user) | Must be impossible across accounts |
| Are uploads logged server-side? | N/A locally | Define no-full-text logging policy |
| Retention and deletion | User deletes local DB rows | Need account-level delete and data export |
| Backup files | User downloads SQLite file | Treat backups as sensitive; no public hosting of dumps |
| Sample vs. real data in repos | Samples only in Git | CI and docs must never use real resumes |

**Blocker:** Hosting without answering these risks exposing internship-search PII.

---

## 5. Data model questions before accounts/cloud database

| Topic | Open question |
|-------|----------------|
| **User ownership** | How does `analysis_runs` map to `user_id`? |
| **Tenant isolation** | Row-level security vs. separate schema per user vs. separate DB |
| **Job identity** | Is `job_filename` still the label, or a normalized posting ID? |
| **Matched skills** | Today only counts are stored; is per-skill storage needed for hosted comparison? |
| **Metadata editing** | Post-save edit of source URL/notes not in UI today—needed hosted? |
| **Migration** | Can users import local SQLite backup into cloud account (restore/import unbuilt)? |
| **Soft delete vs. hard delete** | Local UI hard-deletes; hosted may need audit trail |
| **File uploads** | Store files vs. process-and-discard vs. encrypted blob storage |

---

## 6. Auth/account questions before Clerk-style integration

| Topic | Open question |
|-------|----------------|
| **Identity provider** | Clerk, Auth0, Supabase Auth, or custom? |
| **Session model** | Cookie sessions, JWT, server-side session store |
| **Guest vs. registered** | Allow anonymous try vs. account required |
| **Authorization** | Every analysis row scoped to `sub` / user ID |
| **Admin/support access** | Can admin impersonate or read user data? (Default: no) |
| **Account deletion** | GDPR-style delete all analyses on account close |
| **Portfolio “unlisted” access** | Magic link, allowlist, or full public signup? |
| **Streamlit replacement** | Auth does not belong inside current `streamlit_app.py` as a bolt-on |

**Blocker:** Clerk-style auth needs a **hosted app layer** with middleware—not Streamlit session state alone.

---

## 7. Cloud database questions

| Topic | Open question |
|-------|----------------|
| **Platform** | Postgres (Supabase/Neon/RDS) vs. managed SQLite (limited multi-user) |
| **Connection security** | TLS, pooled connections, secrets in env not repo |
| **Schema migration** | Versioned migrations vs. ad-hoc ALTER (local uses idempotent upgrade) |
| **Backups** | Automated backups, point-in-time recovery, export for user |
| **Cost model** | Free tier limits vs. expected storage per user |
| **Edge vs. region** | Where resume/job text is processed relative to DB |
| **Encryption** | At rest and in transit; optional field-level encryption for notes |

---

## 8. UI/product cleanup needed before public beta

| Area | Local state | Beta expectation |
|------|-------------|------------------|
| Branding | Generic Streamlit chrome | Standalone UI tied to portfolio site |
| Onboarding | Implicit | Clear “what this tool does / does not do” |
| Error messages | Developer-oriented | User-safe, no stack traces |
| Mobile layout | Streamlit default | Responsive if jobfit is linked from portfolio |
| Accessibility | Not audited | Basic a11y pass |
| Empty states | Partial | No saved data, first run, failed upload |
| Feature scope | Comparison, delete, exports | Resist feature creep before auth ships |
| Honest labeling | Rule-based, not AI | Must remain prominent in hosted UI |

---

## 9. Recommended next architecture path

**Do not** bolt Clerk (or any auth) onto the current local Streamlit + SQLite app blindly. The local stack optimized for solo learning; hosting needs a deliberate split.

Recommended direction:

```text
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Frontend / App │────▶│  Auth layer      │────▶│  Cloud database │
│  (new UI)       │     │  (e.g. Clerk)    │     │  (per-user rows)│
└────────┬────────┘     └──────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│ Analysis service│  ← reuse src/analysis_runner logic (library or API)
│ / helper layer  │     process text in memory; return structured results
└─────────────────┘
```

Principles:

1. **Define hosted product architecture first** — users, data boundaries, privacy rules.
2. **Keep analysis logic reusable** — `src/analysis_runner.py` remains the core; wrap, don’t rewrite.
3. **Separate layers** — frontend/app, auth, database, analysis service.
4. **Process sensitive text in memory** by default; persist only derived results unless explicitly designed otherwise.
5. **Local Streamlit stays** as a dev/demo tool until the hosted UI replaces it.

---

## 10. Near-term next step after this branch

**Version 12 Step 0:** Produce a **hosted architecture decision document / prototype plan** for the account-based version.

That step should nail down (without implementing yet):

- target hosted shape (e.g. portfolio subpath vs. separate app domain),
- auth approach (Clerk-style vs. alternatives),
- database choice and per-user schema sketch,
- what gets stored vs. discarded,
- minimal MVP for a private/unlisted beta,
- explicit non-goals (no semantic AI, no full application tracker, etc.).

Only after Step 0 should implementation branches add auth, cloud DB, or a new frontend.

---

## Quick self-check before any deploy experiment

- [ ] `python3 run_tests.py` passes
- [ ] README quickstart works on a clean clone with sample data only
- [ ] Privacy rules written for hosted mode (this doc + LIMITATIONS)
- [ ] Architecture decision doc (Version 12 Step 0) reviewed
- [ ] No real resume/job data in repo or CI artifacts
- [ ] Auth and DB are designed together, not added one at a time to Streamlit

---

*Deployment readiness checklist — Version 11 documentation only; no deployment implemented.*
