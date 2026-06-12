# Hosted Prototype Smoke Test

Short end-to-end checklist to run **before demos** or **after deployments**. Confirms the Vercel + Render + Clerk + Supabase prototype still works.

Use **generic sample text only** — never real private resumes or job postings.

Related: [`VERSION_13_HOSTED_DEPLOYMENT_CHECKPOINT.md`](VERSION_13_HOSTED_DEPLOYMENT_CHECKPOINT.md), [`VERCEL_FRONTEND_DEPLOYMENT.md`](VERCEL_FRONTEND_DEPLOYMENT.md), [`RENDER_BACKEND_DEPLOYMENT.md`](RENDER_BACKEND_DEPLOYMENT.md), [`web/README.md`](../web/README.md).

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
- [ ] Hosted prototype / privacy notice is visible or easy to find (landing or dashboard)

---

## 5. Clerk auth check

- [ ] **Sign in** as User A (test account)
- [ ] `/dashboard` loads while signed in
- [ ] Optional: sign out and sign in again if auth state seems stale

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

---

## 7. Supabase save/read check

Still signed in as User A:

- [ ] Click **Save this prototype analysis**
- [ ] Success message appears (no raw error codes)
- [ ] Saved analyses list refreshes and shows the new row (metadata/counts only)
- [ ] Reload `/dashboard`
- [ ] Saved analysis still appears for User A

---

## 8. RLS / user isolation check

- [ ] As **User A**, confirm at least one saved analysis is visible
- [ ] **Sign out**
- [ ] **Sign in as User B** (different Clerk account)
- [ ] User B does **not** see User A’s saved analysis
- [ ] User B runs analysis + **Save this prototype analysis** (or **Test cloud save**)
- [ ] User B sees only their own saved row(s)

---

## 9. Failure-state spot checks

If you can trigger them safely (or recall from recent deploys):

- [ ] Empty saved list shows a calm “no analyses yet” message
- [ ] Save/read errors show short, safe copy (no tokens, secrets, or Postgres internals)
- [ ] Analysis errors show calm messages (no stack traces)
- [ ] No pasted resume/job text appears in saved list rows (metadata only)

---

## 10. Pass / fail criteria

### Pass (OK to demo)

All of the following:

- Local automated checks (section 2) pass
- Render `/health` returns `ok`
- Vercel landing + dashboard load for a signed-in user
- Analysis returns matched/missing skills with safe sample text
- Save + reload shows the row for the same user
- User B cannot see User A’s saved analyses
- UI errors (if any) stay user-friendly

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
