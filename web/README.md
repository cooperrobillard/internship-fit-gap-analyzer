# Internship Fit & Skill-Gap Analyzer — Web Frontend

This folder is the **future hosted web-app frontend** for the Internship Fit & Skill-Gap Analyzer. It is a Next.js scaffold that will eventually replace the localhost-only experience with a portfolio-ready hosted product.

## What exists today

- A simple landing page describing the planned hosted product
- Placeholder UI only (e.g. “Auth coming soon”, “Dashboard coming soon”)

## What is not implemented yet

- Clerk-style authentication
- Postgres / Supabase-style database
- Python analysis API or service integration
- Saving, comparing, or loading real analyses from this UI

The **working analyzer** remains the Python CLI and local Streamlit app at the repository root. Use those for real analyses until later branches wire this frontend to a backend.

## Run locally

From this `web/` directory:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other useful commands:

```bash
npm run lint
npm run build
```

## Related docs

Architecture and deployment planning for the hosted version live in the repo root under `docs/` (outside this folder). This README covers only the Next.js frontend scaffold.
