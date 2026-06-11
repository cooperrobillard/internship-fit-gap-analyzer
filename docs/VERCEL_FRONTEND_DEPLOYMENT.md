# Vercel Frontend Deployment

Deploy the **Next.js prototype** from `web/` to [Vercel](https://vercel.com/) and point it at the hosted **Render FastAPI** analysis API. Manual dashboard setup—no `vercel.json` required for the first deploy.

Related: [`VERSION_13_DEPLOYMENT_PATH.md`](VERSION_13_DEPLOYMENT_PATH.md), [`RENDER_BACKEND_DEPLOYMENT.md`](RENDER_BACKEND_DEPLOYMENT.md), [`web/README.md`](../web/README.md).

---

## Purpose

Host the Clerk + Supabase dashboard shell and wire the analysis form to the Render backend (`POST /analyze`). The local Streamlit app and CLI are **not** deployed by this step.

---

## Vercel project settings

Create or import a project connected to the `internship-fit-gap-analyzer` repository:

| Setting | Value |
|---------|--------|
| **Framework preset** | Next.js |
| **Root directory** | `web` |
| **Install command** | `npm install` (or Vercel default) |
| **Build command** | `npm run build` |
| **Output directory** | Leave as Vercel default for Next.js |
| **Production branch** | `main` (or your release branch) |

Deploy only the `web/` app—not the repository root.

---

## Required environment variables

Set in Vercel → Project → **Settings** → **Environment Variables** (Production, and Preview if you use branch deploys). Use values from Clerk and Supabase dashboards—**do not paste real secrets into this repo**.

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (browser) |
| `CLERK_SECRET_KEY` | Clerk secret (server/middleware only) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (browser client) |
| `NEXT_PUBLIC_ANALYSIS_API_URL` | Hosted FastAPI base URL, e.g. `https://internship-fit-gap-analyzer.onrender.com` (no trailing slash) |

The repo also accepts legacy `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` locally; prefer `NEXT_PUBLIC_SUPABASE_ANON_KEY` on Vercel.

---

## Optional Clerk route variables

If you rely on explicit routes (defaults in `web/.env.example` work for many setups):

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/dashboard` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/dashboard` |

Some Clerk docs use `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` / `AFTER_SIGN_UP_URL` naming—match whatever your Clerk + Next.js integration expects; this repo’s example file uses the `*_FALLBACK_REDIRECT_URL` names above.

---

## Safety notes

- **Do not commit** `web/.env.local` or any file with real secrets.
- **Do not paste** production keys into docs, commits, or issues.
- **`NEXT_PUBLIC_*`** variables are **browser-visible**—only public URLs and publishable/anon keys belong there.
- **`CLERK_SECRET_KEY`** goes in Vercel env vars only—never in client code or `NEXT_PUBLIC_*` names.
- **Never** use the Supabase **service role** key in the browser.
- This frontend is a **prototype**—do not describe it as production-secure yet.

---

## Render CORS follow-up

After Vercel assigns your app URL, update the **Render** backend env var so browser calls from Vercel are allowed:

```text
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://YOUR_VERCEL_APP_URL
```

Replace `YOUR_VERCEL_APP_URL` with your real host (e.g. `your-project.vercel.app` or custom domain). Redeploy or restart the Render service after changing `ALLOWED_ORIGINS`.

---

## Hosted verification checklist

Use **generic sample text** only for analysis smoke tests—not real private resumes.

- [ ] Landing page loads on Vercel
- [ ] `/sign-in` loads
- [ ] `/sign-up` loads
- [ ] `/dashboard` is protected (redirects or blocks when signed out)
- [ ] Signed-in dashboard loads
- [ ] Analysis form calls the Render backend (`NEXT_PUBLIC_ANALYSIS_API_URL`)
- [ ] Sample analysis returns matched/missing skills with **no skill in both lists**
- [ ] **Save this prototype analysis** works when Clerk + Supabase + RLS are configured
- [ ] Saved analyses panel shows the saved row (metadata/counts only)

**Sample analyze body (safe text only):**

```json
{
  "resumeText": "Python SQL Git data analysis",
  "jobText": "We are looking for an intern with Python, SQL, FastAPI, and cloud deployment experience."
}
```

---

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Build runs from wrong folder | Root Directory must be **`web`** |
| Analysis fails in browser | `NEXT_PUBLIC_ANALYSIS_API_URL` = Render URL; Render `ALLOWED_ORIGINS` includes exact Vercel origin (`https://…`, no path) |
| CORS error in DevTools | Update Render `ALLOWED_ORIGINS` and restart API service |
| Auth / sign-in fails | Clerk production keys; allowed domains and redirect URLs include your Vercel host |
| Dashboard 401 / middleware errors | `CLERK_SECRET_KEY` set on Vercel (not only publishable key) |
| Supabase status / save fails | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`; Clerk configured as Supabase third-party auth; RLS policies applied |
| Build fails locally on Vercel | Run `cd web && npm run build` with valid env vars; fix TypeScript/Clerk errors before redeploying |

---

## Next steps

Confirm end-to-end flow against [`VERSION_13_DEPLOYMENT_PATH.md`](VERSION_13_DEPLOYMENT_PATH.md) step 9. Keep raw resume/job text out of cloud storage—the prototype save path stores structured skills and metadata only.
