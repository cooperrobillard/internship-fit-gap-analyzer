# Hosted Prototype Smoke Test

Short end-to-end checklist to run **before demos** or **after deployments**. Confirms the Vercel + Render + Clerk + Supabase prototype still works.

Use **generic sample text only** — never real private resumes or job postings.

Related: [`DEV19_PRIVACY_DATA_PRODUCTION_READINESS.md`](DEV19_PRIVACY_DATA_PRODUCTION_READINESS.md), [`DEV19_RLS_AUTH_REVERIFICATION.md`](DEV19_RLS_AUTH_REVERIFICATION.md), [`DEV19_ABUSE_RATE_LIMIT_REVIEW.md`](DEV19_ABUSE_RATE_LIMIT_REVIEW.md), [`VERCEL_FRONTEND_DEPLOYMENT.md`](VERCEL_FRONTEND_DEPLOYMENT.md), [`RENDER_BACKEND_DEPLOYMENT.md`](RENDER_BACKEND_DEPLOYMENT.md), [`web/README.md`](../web/README.md).

---

## 1. Pre-flight repo checks

Run from the repository root:

```bash
git branch --show-current
git status
git pull origin main
git ls-files | grep -E '(\.env$|\.env\.local$|web/\.env\.local$|data/outputs/|\.db$)' || true
```

- [ ] On branch `main` (or your agreed deploy branch)
- [ ] Working tree clean (no uncommitted changes you did not intend to ship)
- [ ] Latest `origin/main` pulled
- [ ] No `.env`, `.env.local`, `web/.env.local`, generated outputs, or `.db` files tracked

---

## 2. Automated local checks

```bash
python3 tests/test_api_service.py
python3 run_tests.py
python3 -m py_compile api/main.py run_tests.py streamlit_app.py
cd web && npm run lint && npm run build && cd ..
```

- [ ] API service tests pass
- [ ] Full `run_tests.py` suite passes (`All tests passed.`)
- [ ] Python compile succeeds
- [ ] `npm run lint` and `npm run build` succeed

---

## 3. Hosted backend check

```bash
curl -s https://internship-fit-gap-analyzer.onrender.com/health
```

- [ ] Response includes `{"status":"ok"}`
- [ ] No prolonged hang (if cold start, wait ~30s and retry once)

---

## 4. Hosted frontend check

Open your Vercel production URL (e.g. `https://YOUR_VERCEL_APP.vercel.app`).

- [ ] Landing page loads without 404
- [ ] Privacy page loads without 404
- [ ] Hosted prototype / privacy notice is visible or easy to find (landing or dashboard)

---

## 5. Clerk auth check

- [ ] **Sign in** as User A (test account)
- [ ] `/dashboard` loads while signed in
- [ ] Sign out succeeds without leaking data from the prior session
- [ ] Sign back in as User A (test account)

---

## 6. Hosted analysis check

On `/dashboard`, use safe sample text only:

**Resume text (example):**

```text
Python SQL Git data analysis
```

**Job description text (example):**

```text
We are looking for an intern with Python, SQL, FastAPI, and cloud deployment experience.
```

- [ ] Click **Analyze pasted text**
- [ ] Matched and missing skills render (counts and lists)
- [ ] No skill appears in both matched and missing lists
- [ ] No raw stack trace, secret, or scary technical dump in the UI
- [ ] If Render was sleeping, a calm retry message may appear first — retry once after ~30s
- [ ] Transient `.txt` upload analysis works with synthetic text and does not create a saved file/profile automatically
- [ ] Saved structured-profile analysis works when an explicitly selected profile is used as the resume-side input

---

## 7. Supabase save/read check

Still signed in as User A:

- [ ] Click **Save this prototype analysis**
- [ ] Success message appears (no raw error codes)
- [ ] Saved analyses list refreshes and shows the new row (metadata/counts only)
- [ ] Saved-analysis detail view opens and shows structured fields only
- [ ] Search/filter finds the synthetic row for User A
- [ ] Comparison can use User A saved rows only
- [ ] Saved-analysis export/download works where currently supported
- [ ] Delete removes the synthetic saved analysis after confirmation
- [ ] Reload `/dashboard`
- [ ] Remaining saved analyses still belong to User A only

---

## 8. RLS / user isolation check

Use **synthetic test data only**. Do not paste real private resumes, job descriptions, user identifiers, tokens, row IDs, or secrets into the hosted app while performing this check.

### Saved analyses

- [ ] As **User A**, confirm at least one saved analysis is visible
- [ ] User A can create and read their own saved analysis
- [ ] User A search/filter results show only User A saved analyses
- [ ] User A comparison options include only User A saved analyses
- [ ] **Sign out**
- [ ] **Sign in as User B** (different Clerk account)
- [ ] User B does **not** see User A’s saved analysis in the saved list
- [ ] User B does **not** see User A’s saved analysis in search/filter results
- [ ] User B does **not** see User A’s saved analysis in comparison options
- [ ] User B runs analysis + **Save this prototype analysis** (or **Test cloud save**)
- [ ] User B sees only their own saved row(s)
- [ ] User B can edit/delete only their own saved-analysis records where those controls are available

### Resume profiles

- [ ] User B can create, edit, read, and delete their own structured resume profile
- [ ] User B does **not** see User A’s structured resume profile
- [ ] **Sign out**
- [ ] **Sign in as User A**
- [ ] User A does **not** see User B’s saved analysis
- [ ] User A does **not** see User B’s structured resume profile
- [ ] User A can create, edit, read, and delete their own structured resume profile

### Export and cleanup

- [ ] User A export contains only User A’s structured saved-analysis data and derived reports
- [ ] User B export contains only User B’s structured saved-analysis data and derived reports
- [ ] Own-row delete works for both accounts
- [ ] Synthetic verification records are cleaned up after the test
- [ ] No raw private text, secrets, tokens, SQL errors, or stack traces appear in the UI during the isolation check

---

## 9. Failure-state spot checks

If you can trigger them safely (or recall from recent deploys):

- [ ] Empty saved list shows a calm “no analyses yet” message
- [ ] Save/read errors show short, safe copy (no tokens, secrets, or Postgres internals)
- [ ] Analysis errors show calm messages (no stack traces)
- [ ] No pasted resume/job text appears in saved list rows (metadata only)

---

## 10. Abuse-controls spot checks

Use synthetic data only. Do not run repeated load or stress testing. The active Vercel WAF rate-limit rule and verification record are documented in [`DEV19_ABUSE_RATE_LIMIT_REVIEW.md`](DEV19_ABUSE_RATE_LIMIT_REVIEW.md).

- [ ] Authenticated access remains required for `/api/analyze`
- [ ] A normal analysis with generic sample text succeeds
- [ ] An oversized proxy request produces safe `413 Payload Too Large` behavior with public copy only
- [ ] After WAF activation, a controlled burst produces `429` without displaying the WAF/provider response body directly
- [ ] Resume input remains preserved after `429`
- [ ] Job description input remains preserved after `429`
- [ ] Selected structured resume profile and optional metadata remain preserved after `429`
- [ ] The local cooldown prevents immediate repeated submission and does not automatically rerun analysis
- [ ] Normal analysis resumes after the rate-limit window expires
- [ ] No tokens, secrets, raw input, IP address, stack trace, provider response body, or infrastructure details appear in the UI

---

## 11. Pass / fail criteria

### Pass (OK to demo)

All of the following:

- Local automated checks (section 2) pass
- Render `/health` returns `ok`
- Vercel landing + dashboard load for a signed-in user
- Analysis returns matched/missing skills with safe sample text
- Save + reload shows the row for the same user
- User B cannot see User A’s saved analyses
- UI errors (if any) stay user-friendly
- Structured save/read/search/compare/export/delete works with synthetic data
- Resume-profile create/edit/delete and saved-profile analysis handoff work
- Two-user RLS isolation, safe `413`, safe `429` cooldown behavior, and no raw/private/technical leakage have been checked for the current release

### Block demo — fix before showing others

Any of the following:

- `run_tests.py` or `npm run build` fails on `main`
- Render `/health` fails after one cold-start retry
- Vercel returns 404 or dashboard is unreachable when signed in
- Analysis consistently fails with config/503 errors (check `ANALYSIS_API_URL`, `ANALYSIS_API_SHARED_SECRET`)
- Save or list fails for a signed-in user with correct Supabase + Clerk setup
- **Cross-user data visible** (RLS failure)
- Secrets, tokens, stack traces, or private pasted text visible in the UI

---

## Quick reference

| Service | URL |
|---------|-----|
| Render health | `https://internship-fit-gap-analyzer.onrender.com/health` |
| Vercel app | Your project URL from the Vercel dashboard |
| Dashboard | `https://YOUR_VERCEL_APP.vercel.app/dashboard` |
