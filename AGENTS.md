# AGENTS.md

## Project Identity

Repository name: `internship-fit-gap-analyzer`

Public product name: **Job Fit & Skill-Gap Analyzer**

This project is a hosted web app that helps users compare resumes against job descriptions and review:

* matched skills
* missing skills
* recurring gaps
* saved analyses
* saved-analysis detail views
* comparison between saved analyses
* export/download options
* job metadata such as title, company, notes, and source URL
* structured resume-profile groundwork

This is becoming a real hosted public product, not just a local prototype. Treat privacy, user data, and production database boundaries carefully.

---

## Current Stack

### Frontend

* Next.js 16 app router in `web/`
* Hosted on Vercel
* Clerk authentication
* Dashboard includes:

  * analysis input
  * saved analyses
  * saved-analysis detail
  * comparison
  * export/download
  * delete
  * search/filter
  * recurring gap stats
  * privacy/data-control UI
* Resume-profile foundation may exist depending on the current branch state. Inspect the repo before assuming.

### Backend

* FastAPI service in `api/`
* Hosted on Render
* Health endpoint:

```text
https://internship-fit-gap-analyzer.onrender.com/health
```

Expected health response:

```json
{"status":"ok"}
```

### Database

* Supabase Postgres
* Row Level Security enabled
* Clerk user ownership through `clerk_user_id`
* Browser/client code must use only the Supabase publishable/browser-safe key
* Supabase service-role keys must never be used in browser/client code

### Analysis Flow

```text
Browser / Next.js dashboard
→ Next.js /api/analyze
→ Render FastAPI /analyze
→ structured analysis result
→ optional Supabase saved-analysis save
```

---

## Directory Map

Important project areas:

```text
api/                         FastAPI backend
tests/                       Python/backend tests
web/                         Next.js frontend
web/src/                     Frontend source, if present
web/app/ or web/src/app/     Next.js app routes, depending on current structure
web/components/ or web/src/components/
                             Frontend components, depending on current structure
web/database/migrations/     Supabase migration files
docs/                        Product, privacy, roadmap, verification docs
data/                        Local/private/generated data area; treat carefully
LEARNING_LOG.md              Learning/history log
README.md                    Human-facing project overview
```

Always inspect the current repo structure before editing. Do not assume a path exists just because it is listed here.

---

## Product Status Rules

The app has a working hosted foundation, but agents must not overclaim production maturity.

Do not claim the app is fully production-ready or security-audited unless a specific future task explicitly performs and documents that audit.

Current product direction:

* rule-based matching first
* structured saved results and metadata
* structured-skills-first resume profiles
* no AI/semantic matching yet
* no PDF/DOCX parsing yet
* no application tracking yet

---

## Core Privacy and Data Rules

These are hard project rules unless a future human-approved privacy/security review explicitly changes them:

* Do not store raw pasted resume text by default.
* Do not store raw pasted job-description text by default.
* Current saved analyses should store structured results and metadata, not raw resume/job text.
* Persistent resume profiles must be structured-skills-first.
* Do not add a `resume_text` field.
* Do not reintroduce raw resume text storage.
* Uploaded `.txt` resume/job files are transient and client-side only.
* Do not add PDF/DOCX parsing unless explicitly requested in a future approved task.
* Do not add AI/semantic matching unless explicitly requested in a future approved task.
* Do not add application tracking unless explicitly requested in a future approved task.
* Do not commit private resumes, private job descriptions, generated databases, or secrets.
* Do not expose raw stack traces, tokens, SQL errors, secrets, or private text in the UI.

---

## Supabase and RLS Rules

Supabase is production-sensitive.

Agents may:

* inspect existing migration files
* draft new migration files
* draft RLS verification SQL
* draft manual SQL checklists
* add browser-safe helper code that respects RLS and `clerk_user_id`
* add tests/mocks for helper behavior

Agents must stop and ask the human before:

* running production SQL
* applying migrations
* changing RLS policies
* disabling RLS
* dropping tables
* truncating tables
* deleting production data
* editing Supabase dashboard settings
* using Supabase service-role credentials
* changing Clerk/Supabase auth assumptions

Never:

* disable or bypass RLS
* use service-role keys in browser/client code
* commit service-role keys or database credentials
* add destructive SQL without an explicit human-approved task

Expected ownership pattern for user-owned tables:

```sql
clerk_user_id = (select auth.jwt() ->> 'sub'::text)
```

When implementing update/delete helpers, filter by both:

```text
id
clerk_user_id
```

---

## Forbidden Files and Areas Unless Explicitly Requested

Do not edit these unless the task explicitly says to:

```text
.env
.env.local
web/.env.local
data/
data/outputs/analysis_results.db
data/resume/resume.txt
data/jobs/
```

Be very cautious editing these unless the task explicitly requires it:

```text
api/
streamlit_app.py
run_tests.py
requirements.txt
package.json
package-lock.json
web/database/migrations/
.github/workflows/
```

Package/dependency changes require explicit justification and should be avoided unless necessary.

---

## Allowed Behavior for Normal Coding Tasks

For normal bounded coding tasks, agents may:

* create a small branch
* inspect relevant files
* implement the requested change only
* add focused tests if an existing test framework supports them
* update documentation if behavior changes
* update `LEARNING_LOG.md` when requested by the task
* run standard checks
* run privacy checks
* produce a clear final report

Keep changes small and reviewable.

Do not perform broad redesigns unless the task explicitly asks for UI redesign or visual polish.

---

## Standard Test Commands

Run these from the repo root unless the task says otherwise:

```bash
python3 tests/test_api_service.py
python3 run_tests.py
python3 -m py_compile api/main.py run_tests.py streamlit_app.py

cd web
npm run lint
npm run build
cd ..
```

If `web/package.json` already contains a test script, also run:

```bash
cd web
npm test
cd ..
```

Do not add a test framework or dependency unless explicitly requested or clearly justified.

Do not claim a check passed unless it was actually run and passed.

---

## Standard Privacy Checks

Run these before committing:

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

Expected output:

```text
prints nothing
```

For frontend/privacy-sensitive work, also run a focused grep such as:

```bash
grep -Rni "resume_text\|raw_resume\|rawResume\|service_role\|SERVICE_ROLE\|SUPABASE_SERVICE\|sk_live\|password\|private key" web/src web/app web/components docs 2>/dev/null || true
```

Docs may mention that raw resume text is intentionally not stored, but code must not add raw resume-text storage.

---

## Git Workflow Rules

Use small branches.

Do not use:

```bash
git add .
git add -A
```

Stage exact files only.

Preferred flow:

```bash
git status
git checkout main
git pull origin main
git checkout -b <small-branch-name>

# inspect, edit, test

git status --short
git diff --stat
git diff

# run checks and privacy checks

git add <exact-file-1> <exact-file-2>
git commit -m "<type>: <message>"
```

Keep implementation commits and learning-log/docs commits separate when practical.

Merge to `main` only after checks pass:

```bash
git checkout main
git pull origin main
git merge <branch-name>

# retest on main

git push origin main
git branch --delete <branch-name>
```

Agents working in cloud/PR mode should open a PR instead of pushing or merging directly to `main`.

---

## Manual Verification Expectations

For UI changes, include manual verification steps for:

* landing page
* sign-in
* dashboard load
* analysis flow
* saved analyses
* detail view
* search/filter
* delete
* recurring gaps
* comparison
* export/download
* privacy/data-control page or section
* any changed feature area
* no secrets, tokens, stack traces, or private raw text visible

For backend changes, include:

* relevant Python tests
* `/health` check if hosted behavior could be affected
* expected API behavior
* error handling behavior

For Supabase/RLS changes, include:

* pre-change SQL inspection
* post-change schema checks
* RLS policy checks
* rollback-only test SQL where possible
* final row count confirmation
* explicit human execution requirement

---

## Stop Conditions

Stop and ask the human before continuing if any of these happen:

* A task requires secrets, API tokens, or env vars.
* A task requires reading or editing `.env`, `.env.local`, or `web/.env.local`.
* A task requires production SQL execution.
* A task requires Supabase dashboard actions.
* A task requires RLS policy changes.
* A task requires destructive database operations.
* A task requires DNS/custom-domain/billing/account settings.
* A task requires production deploy approval.
* A task requires adding dependencies.
* Tests fail and the fix is not obvious.
* The requested change conflicts with privacy rules.
* The requested change would store raw resume/job text.
* The requested change would disable or bypass RLS.
* The task scope becomes much larger than requested.
* The agent needs to edit forbidden files.

---

## Output Summary Requirements

At the end of each task, report:

* branch name
* files changed
* summary of changes
* tests/checks run
* privacy checks run
* manual verification still needed
* any skipped checks and why
* any blockers
* suggested commit message or PR title
* whether the task changed behavior, docs only, tests only, or infrastructure

Do not claim checks passed unless they were actually run.

Do not claim hosted behavior was verified unless it was actually manually checked or a specific hosted command was run.

---

## Deployment Boundaries

Agents may prepare deployment instructions, but humans must approve or execute:

* Vercel production env var changes
* Render production env var changes
* Clerk production config changes
* Supabase production SQL/migrations
* DNS/custom-domain setup
* billing/account settings
* production deploy approvals
* public launch/share decision

Do not run production deploy commands unless the task explicitly authorizes it.

---

## Documentation and Learning-Log Conventions

Update docs when behavior, architecture, privacy model, or deployment assumptions change.

Use `LEARNING_LOG.md` for concise learning/progress entries when requested by the task.

Learning-log entries should explain what changed and what was learned, not paste large diffs.

Keep documentation accurate. Do not overclaim.

---

## UI Rules

For UI tasks:

* keep changes focused
* preserve existing analysis flow unless the task explicitly changes it
* do not broad redesign during sensitive infrastructure/database/helper tasks
* use clear empty/loading/error states
* use friendly errors; do not show raw stack traces or database internals
* include privacy copy when handling resumes/jobs/profile data
* maintain existing transient paste/upload behavior unless explicitly changed

---

## Resume-Profile Rules

Resume profiles are structured-skills-first.

Allowed structured fields include:

* profile name
* profile description
* extracted skills
* user-added skills
* source type
* created/updated timestamps

Do not add:

* `resume_text`
* raw resume storage
* raw uploaded file persistence
* PDF/DOCX parsing
* AI extraction
* semantic matching

Resume-profile analysis integration must be explicit and user-visible. Do not silently change analysis inputs.

---

## Dependency Rules

Avoid new dependencies.

If a dependency seems necessary:

1. Explain why existing tools are insufficient.
2. Explain the package purpose.
3. Check package impact.
4. Ask for human approval before installing.
5. Update lockfiles only after approval.
6. Run full tests/builds afterward.

---

## Agent Tool Strategy

Recommended operating model:

```text
Primary: Codex Web/Cloud or GitHub Copilot cloud agent for bounded branch/PR tasks.
Secondary: Claude Code or Codex CLI locally for rescue/debug/build failure work.
Daily driver / supervised editing: Cursor.
Human-only: secrets, production SQL, Supabase dashboard actions, RLS changes, env vars, DNS, billing, deploy approvals, destructive operations, and privacy/security decisions.
```

Agents may prepare changes. Humans approve irreversible actions.

Production remains human-controlled.

---

## Final Instruction

When in doubt, choose the safer smaller change and ask for human review.
