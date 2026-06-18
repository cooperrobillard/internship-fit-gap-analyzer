# Agent Tool Prompts

Reusable prompts for agentic coding tools working on the Job Fit & Skill-Gap Analyzer repo.

Always pair these prompts with a specific task issue/brief.

---

## 1. Codex Web / Codex Cloud prompt

````text
You are working in the `internship-fit-gap-analyzer` repo.

Before editing:
1. Read `AGENTS.md`.
2. Read the task issue/brief fully.
3. Inspect the relevant files.
4. Create or use a small branch for this task.
5. Keep changes limited to the task.

Project rules:
- Public product name: Job Fit & Skill-Gap Analyzer.
- Do not store raw pasted resume text by default.
- Do not store raw pasted job-description text by default.
- Do not add `resume_text`.
- Do not add PDF/DOCX parsing.
- Do not add AI/semantic matching.
- Do not use Supabase service-role keys in browser/client code.
- Do not edit `.env`, `.env.local`, or `web/.env.local`.
- Do not touch `data/` private/generated files.
- Do not disable or bypass RLS.
- Do not make broad redesign changes unless the task explicitly asks for redesign.
- Do not add dependencies unless explicitly justified and approved.

Allowed:
- Implement the requested focused change.
- Add focused tests if the existing project setup supports them.
- Update docs if behavior changes.
- Run checks and privacy checks.
- Open a PR or provide a PR-ready diff.

Stop and ask for human input if:
- secrets/env vars are needed
- production SQL is needed
- Supabase dashboard actions are needed
- RLS policies need changes
- destructive DB operations are needed
- Vercel/Render/Clerk/Supabase settings are needed
- dependency installation is needed
- tests fail and the fix is unclear
- task scope expands beyond the issue

Run checks:
```bash
python3 tests/test_api_service.py
python3 run_tests.py
python3 -m py_compile api/main.py run_tests.py streamlit_app.py

cd web
npm run lint
npm run build
cd ..
```

Run privacy checks:

```bash
git ls-files web/.env.local
git ls-files .env
git ls-files .env.local
git ls-files data/outputs/analysis_results.db
git ls-files data/resume/resume.txt
git ls-files data/jobs
git ls-files | grep DS_Store || true
git status --short | grep ".env" || true
```

Expected privacy-check output: prints nothing.

Final output must include:

* branch name
* files changed
* summary of changes
* tests/checks run and results
* privacy checks run and results
* manual verification needed
* skipped checks and why
* blockers
* suggested PR title

````

---

## 2. Codex CLI local prompt

````text
You are running locally in my `internship-fit-gap-analyzer` repo.

First:
1. Read `AGENTS.md`.
2. Read the task brief I provide.
3. Run `git status`.
4. Inspect relevant files before editing.
5. Keep changes small and branch-scoped.

Do not:
- read or edit `.env`, `.env.local`, or `web/.env.local`
- touch private/generated `data/` files
- use `git add .`
- use `git add -A`
- add `resume_text`
- store raw resume/job text
- use service-role keys in frontend/browser code
- run production SQL
- perform destructive shell commands
- install dependencies without asking
- change provider/dashboard settings

You may:
- inspect files with `find`, `grep`, `sed`, `git diff`
- edit files relevant to the task
- run tests/builds
- run privacy checks
- suggest exact staging and commit commands

Ask before:
- `git commit`
- `git merge`
- `git push`
- `npm install`
- deleting files
- database commands
- Supabase CLI commands
- `curl` to production endpoints
- changing package files

Run checks:
```bash
python3 tests/test_api_service.py
python3 run_tests.py
python3 -m py_compile api/main.py run_tests.py streamlit_app.py

cd web
npm run lint
npm run build
cd ..
```

Run privacy checks:

```bash
git ls-files web/.env.local
git ls-files .env
git ls-files .env.local
git ls-files data/outputs/analysis_results.db
git ls-files data/resume/resume.txt
git ls-files data/jobs
git ls-files | grep DS_Store || true
git status --short | grep ".env" || true
```

Report:

* what you inspected
* what you changed
* changed files
* tests/checks run
* privacy checks
* blockers
* exact next commands I should run

````

---

## 3. Claude Code local prompt

````text
You are Claude Code working locally in my `internship-fit-gap-analyzer` repo.

Read `AGENTS.md` first, then read the task brief.

Follow bounded autonomy:
- Work aggressively inside the requested branch and files.
- Stop for secrets, production DB actions, env vars, deployment settings, RLS changes, destructive operations, dependency installs, and ambiguous privacy/security decisions.

Project privacy rules:
- Do not store raw pasted resume text by default.
- Do not store raw pasted job-description text by default.
- Do not add `resume_text`.
- Do not use service-role keys in browser/client code.
- Do not edit `.env`, `.env.local`, or `web/.env.local`.
- Do not touch private/generated `data/` files.
- Do not disable or bypass RLS.

Allowed automatically:
- `git status`
- `git diff`
- `git diff --stat`
- `find`
- `grep`
- `sed`
- safe read-only file inspection
- targeted file edits within task scope
- `python3 tests/test_api_service.py`
- `python3 run_tests.py`
- `python3 -m py_compile api/main.py run_tests.py streamlit_app.py`
- `cd web && npm run lint`
- `cd web && npm run build`

Ask first:
- `git commit`
- `git merge`
- `git push`
- `npm install`
- `npm update`
- `curl` to hosted production endpoints
- database commands
- Supabase CLI commands
- file deletion
- editing package files
- editing migration files
- editing GitHub Actions workflows

Deny / do not do:
- editing env files
- reading secrets
- service-role key usage
- destructive database commands
- `rm -rf`
- `DROP TABLE`
- `TRUNCATE`
- unscoped `DELETE FROM`
- production deploy commands without confirmation
- DNS/custom-domain changes
- billing/account-level actions

Run checks:
```bash
python3 tests/test_api_service.py
python3 run_tests.py
python3 -m py_compile api/main.py run_tests.py streamlit_app.py

cd web
npm run lint
npm run build
cd ..
```

Run privacy checks:

```bash
git ls-files web/.env.local
git ls-files .env
git ls-files .env.local
git ls-files data/outputs/analysis_results.db
git ls-files data/resume/resume.txt
git ls-files data/jobs
git ls-files | grep DS_Store || true
git status --short | grep ".env" || true
```

Final response format:

```text
Branch:
Files changed:
Summary:
Checks run:
Privacy checks:
Manual verification needed:
Skipped checks:
Blockers:
Suggested commit message:
```

````

---

## 4. GitHub Copilot coding agent prompt

````text
You are assigned to this GitHub issue in the `internship-fit-gap-analyzer` repo.

Read `AGENTS.md` before making changes.

Task:
<insert issue goal here>

Rules:
- Work on a branch/PR only. Do not push directly to `main`.
- Keep the PR small and focused.
- Do not edit `.env`, `.env.local`, or `web/.env.local`.
- Do not touch private/generated `data/` files.
- Do not add `resume_text`.
- Do not store raw resume/job text.
- Do not use Supabase service-role keys in browser/client code.
- Do not bypass or disable RLS.
- Do not add dependencies unless explicitly required and explained.
- Do not make broad redesigns unless this issue explicitly asks for redesign.
- Do not edit `.github/workflows/` unless this issue explicitly asks for workflow changes.

Run:
```bash
python3 tests/test_api_service.py
python3 run_tests.py
python3 -m py_compile api/main.py run_tests.py streamlit_app.py

cd web
npm run lint
npm run build
cd ..
```

Run privacy checks:

```bash
git ls-files web/.env.local
git ls-files .env
git ls-files .env.local
git ls-files data/outputs/analysis_results.db
git ls-files data/resume/resume.txt
git ls-files data/jobs
git ls-files | grep DS_Store || true
git status --short | grep ".env" || true
```

Stop and comment instead of continuing if:

* secrets/env vars are needed
* Supabase production SQL is needed
* RLS policies need changes
* destructive DB operations are involved
* Vercel/Render/Clerk/Supabase dashboard settings are needed
* DNS/billing/account actions are needed
* tests fail and the fix is unclear
* scope expands beyond the issue

PR description must include:

* Summary
* Files changed
* Tests/checks run
* Privacy checks run
* Manual verification needed
* Known limitations
* Screenshots if UI changed

````

---

## 5. Cursor / background agent prompt

````text
You are working in my `internship-fit-gap-analyzer` repo.

Read `AGENTS.md` first. If you do not automatically load it, open it manually before editing.

Current task:
<insert task here>

Keep this task small and focused.

Do not:
- edit `.env`, `.env.local`, or `web/.env.local`
- touch private/generated `data/` files
- add `resume_text`
- store raw resume/job text
- add PDF/DOCX parsing
- add AI/semantic matching
- use service-role keys in frontend/browser code
- bypass or disable RLS
- add dependencies unless explicitly approved
- make broad redesigns unless explicitly requested
- run production SQL
- perform destructive operations

Use existing patterns:
- existing Next.js dashboard/component patterns
- existing Supabase helper patterns
- existing Clerk auth/user-id patterns
- existing Python tests and web lint/build commands
- existing docs and learning-log style

Run checks:
```bash
python3 tests/test_api_service.py
python3 run_tests.py
python3 -m py_compile api/main.py run_tests.py streamlit_app.py

cd web
npm run lint
npm run build
cd ..
```

Run privacy checks:

```bash
git ls-files web/.env.local
git ls-files .env
git ls-files .env.local
git ls-files data/outputs/analysis_results.db
git ls-files data/resume/resume.txt
git ls-files data/jobs
git ls-files | grep DS_Store || true
git status --short | grep ".env" || true
```

After editing, summarize:

* files changed
* what changed
* what stayed intentionally out of scope
* checks run
* privacy checks run
* manual verification needed
* blockers
* exact staging commands
* suggested commit message

````