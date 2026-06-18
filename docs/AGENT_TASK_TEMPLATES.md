# Agent Task Templates

Use these templates when creating issues/tasks for Codex Web, Codex CLI, Claude Code, GitHub Copilot coding agent, Cursor agents, or similar tools.

Each task should be small, branch-bound, and reviewable.

---

## 1. Normal coding task issue template

````markdown
# Task: <short task title>

## Branch

Suggested branch:

```bash
git checkout -b <type>/<short-kebab-name>
```

## Goal

<Describe the focused coding change.>

## Context

* Repo: `internship-fit-gap-analyzer`
* Product: Job Fit & Skill-Gap Analyzer
* Read `AGENTS.md` before editing.
* Preserve privacy rules and existing workflow.

## Allowed files

Likely files:

```text
<file/path/1>
<file/path/2>
```

## Forbidden files

Do not edit unless explicitly approved:

```text
.env
.env.local
web/.env.local
data/
api/                      # unless this is an API task
web/database/migrations/  # unless this is a DB task
package.json
package-lock.json
requirements.txt
```

## Requirements

* Keep changes focused.
* Follow existing patterns.
* Do not add broad redesign.
* Do not add dependencies unless approved.
* Do not store raw resume/job text.
* Do not add `resume_text`.
* Do not use service-role keys in browser/client code.

## Checks

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

If an existing web test script exists:

```bash
cd web
npm test
cd ..
```

## Privacy checks

Run:

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

Expected: prints nothing.

## Manual verification

* <manual step 1>
* <manual step 2>
* Confirm no secrets/private raw text/stack traces appear.

## Stop conditions

Stop and ask if:

* secrets/env vars are needed
* Supabase/RLS changes are needed
* tests fail and fix is unclear
* dependencies seem necessary
* task scope expands
* forbidden files need editing

## Expected final agent report

```text
Branch:
Files changed:
Summary:
Checks run:
Privacy checks:
Manual verification needed:
Skipped checks:
Blockers:
Suggested commit/PR title:
```

````

---

## 2. Docs-only task issue template

````markdown
# Docs Task: <short title>

## Branch

```bash
git checkout -b docs/<short-kebab-name>
```

## Goal

<Describe documentation update.>

## Context

* Read `AGENTS.md`.
* This is docs-only.
* Do not edit app/API/frontend code.

## Allowed files

```text
AGENTS.md
README.md
docs/
LEARNING_LOG.md
```

## Forbidden files

```text
api/
web/src/
web/app/
web/components/
web/database/migrations/
streamlit_app.py
run_tests.py
requirements.txt
package.json
package-lock.json
.env
.env.local
web/.env.local
data/
```

## Requirements

* Keep docs accurate.
* Do not overclaim production readiness.
* Do not claim a feature exists unless it exists in code.
* Keep privacy language consistent.
* Do not include secrets or private data.

## Checks

Run:

```bash
git status --short
git diff --stat
git diff
```

Standard checks if requested:

```bash
python3 tests/test_api_service.py
python3 run_tests.py
python3 -m py_compile api/main.py run_tests.py streamlit_app.py

cd web
npm run lint
npm run build
cd ..
```

## Privacy checks

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

Expected: prints nothing.

## Manual verification

* Review rendered Markdown.
* Confirm links/paths are accurate.
* Confirm no secrets/private data.

## Stop conditions

Stop if:

* docs require claiming an unbuilt feature
* docs require production/security claims not yet verified
* secret/private data appears
* task requires code changes

## Expected final agent report

```text
Branch:
Docs changed:
Summary:
Checks run:
Privacy checks:
Manual review needed:
Blockers:
Suggested commit/PR title:
```

````

---

## 3. Supabase/RLS-sensitive task issue template

````markdown
# Supabase/RLS Task: <short title>

## Branch

```bash
git checkout -b db/<short-kebab-name>
```

## Goal

<Describe schema/RLS/helper/database-related goal.>

## Context

* Read `AGENTS.md`.
* Supabase production actions are human-only.
* Agents may draft SQL and verification checks but must not execute production SQL.
* RLS must not be disabled or bypassed.

## Allowed files

Likely allowed:

```text
web/database/migrations/
docs/
web/src/lib/
tests/
LEARNING_LOG.md
```

Only edit relevant files.

## Forbidden files

```text
.env
.env.local
web/.env.local
data/
```

Do not edit unless explicitly approved:

```text
api/
package.json
package-lock.json
requirements.txt
.github/workflows/
```

## Requirements

* Preserve Clerk ownership through `clerk_user_id`.
* Preserve or improve RLS.
* Never use service-role key in browser/client code.
* Do not add raw resume/job text storage.
* Do not add `resume_text`.
* Include pre/post SQL verification queries.
* Include rollback-only test SQL where possible.
* Human must apply production SQL manually.

## Supabase stop conditions

Stop and ask before:

* running production SQL
* applying migrations
* changing RLS policies
* disabling RLS
* dropping/truncating/deleting data
* using service-role credentials
* changing auth assumptions

## Checks

Run standard checks:

```bash
python3 tests/test_api_service.py
python3 run_tests.py
python3 -m py_compile api/main.py run_tests.py streamlit_app.py

cd web
npm run lint
npm run build
cd ..
```

## Privacy checks

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

Also run:

```bash
grep -Rni "service_role\|SERVICE_ROLE\|SUPABASE_SERVICE\|resume_text\|DROP TABLE\|TRUNCATE\|DELETE FROM" web/database docs web/src 2>/dev/null || true
```

## Manual verification

Human should run supplied SQL in Supabase SQL Editor only after review.

Include:

* pre-check SQL
* migration/application instructions
* post-check SQL
* RLS check SQL
* rollback-only user-isolation test
* final row count check

## Expected final agent report

```text
Branch:
Files changed:
SQL drafted:
Human-only actions:
Checks run:
Privacy checks:
RLS/privacy risks:
Manual Supabase steps:
Blockers:
Suggested commit/PR title:
```

````

---

## 4. UI polish task issue template

````markdown
# UI Task: <short title>

## Branch

```bash
git checkout -b ui/<short-kebab-name>
```

## Goal

<Describe focused UI improvement.>

## Context

* Read `AGENTS.md`.
* Keep UI change narrow.
* Do not alter analysis behavior unless explicitly requested.
* Do not add data persistence changes unless explicitly requested.

## Allowed files

Likely files:

```text
web/src/
web/app/
web/components/
web/styles/
docs/                 # only if behavior/copy needs docs
```

## Forbidden files

```text
.env
.env.local
web/.env.local
data/
web/database/migrations/
api/                  # unless explicitly needed
package.json
package-lock.json
```

## Requirements

* Follow existing UI patterns.
* Keep copy accurate.
* Include loading/empty/error states if relevant.
* Do not show raw stack traces or raw API/Supabase errors.
* Do not imply AI/PDF/DOCX/resume-profile analysis exists unless implemented.
* Do not store raw resume/job text.
* Preserve existing core flows.

## Checks

```bash
python3 tests/test_api_service.py
python3 run_tests.py
python3 -m py_compile api/main.py run_tests.py streamlit_app.py

cd web
npm run lint
npm run build
cd ..
```

## Privacy checks

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

Extra:

```bash
grep -Rni "resume_text\|service_role\|SERVICE_ROLE\|sk_live\|password\|private key" web/src web/app web/components docs 2>/dev/null || true
```

## Manual verification

Check:

* landing page
* sign-in
* dashboard
* changed UI area
* analysis flow
* saved analyses
* detail/search/delete/comparison/export if relevant
* responsive/mobile if relevant
* no secrets/private raw text/stack traces

## Stop conditions

Stop if:

* UI change requires backend/schema changes
* behavior change becomes broader than requested
* raw data storage is needed
* dependency is needed
* env vars are needed

## Expected final agent report

```text
Branch:
Files changed:
UI changed:
Behavior unchanged/changed:
Checks run:
Privacy checks:
Manual browser checks:
Blockers:
Suggested commit/PR title:
```

````

---

## 5. Production hardening task issue template

````markdown
# Production Hardening Task: <short title>

## Branch

```bash
git checkout -b hardening/<short-kebab-name>
```

## Goal

<Describe specific hardening goal.>

## Context

* Read `AGENTS.md`.
* Keep scope narrow.
* Do not claim full production readiness unless this task explicitly verifies it.
* Human controls production settings.

## Allowed files

Depends on task, likely:

```text
api/
web/src/
web/app/
web/components/
docs/
tests/
```

## Forbidden files

```text
.env
.env.local
web/.env.local
data/
```

Do not edit unless explicitly approved:

```text
web/database/migrations/
.github/workflows/
package.json
package-lock.json
requirements.txt
```

## Requirements

Examples:

* improve friendly error handling
* reduce stack-trace exposure
* validate payloads
* document rate-limit/env-var requirements
* improve logs without logging private text
* preserve current functionality
* preserve privacy rules

## Checks

```bash
python3 tests/test_api_service.py
python3 run_tests.py
python3 -m py_compile api/main.py run_tests.py streamlit_app.py

cd web
npm run lint
npm run build
cd ..
```

## Privacy checks

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

Extra:

```bash
grep -Rni "traceback\|stack trace\|service_role\|SERVICE_ROLE\|resume_text\|raw job\|raw resume" api web/src web/app web/components docs 2>/dev/null || true
```

## Manual verification

* API health check
* frontend analysis flow
* failure/error states
* no stack traces in UI
* no private text in logs/UI
* saved-analysis flows still work

## Stop conditions

Stop if:

* env vars are needed
* production deploy settings are needed
* provider dashboard action is needed
* database/RLS changes are needed
* dependency is needed
* hardening decision affects privacy/security policy

## Expected final agent report

```text
Branch:
Files changed:
Hardening implemented:
Checks run:
Privacy checks:
Manual verification:
Human-only remaining actions:
Blockers:
Suggested commit/PR title:
```

````

---

## 6. Final deployment/domain task issue template

````markdown
# Deployment/Domain Task: <short title>

## Branch

```bash
git checkout -b launch/<short-kebab-name>
```

## Goal

<Describe launch/deployment/domain goal.>

## Context

* Read `AGENTS.md`.
* This task likely includes human-only steps.
* Agents may prepare documentation and checklists.
* Humans execute DNS, provider dashboard, env var, billing, and production approval actions.

## Allowed files

Usually:

```text
docs/
README.md
LEARNING_LOG.md
```

Possibly:

```text
web/
api/
```

only if explicitly required for URL/copy/config behavior.

## Forbidden files

```text
.env
.env.local
web/.env.local
data/
```

Do not change unless explicitly approved:

```text
Vercel production settings
Render production settings
Supabase production settings
Clerk production settings
DNS records
billing/account settings
```

## Requirements

* Document exact human steps.
* Include rollback considerations.
* Include final smoke-test checklist.
* Do not expose secrets.
* Do not commit env values.
* Do not claim launch complete until human verifies hosted behavior.

## Checks

For docs-only deployment planning:

```bash
git status --short
git diff --stat
git diff
```

For code changes:

```bash
python3 tests/test_api_service.py
python3 run_tests.py
python3 -m py_compile api/main.py run_tests.py streamlit_app.py

cd web
npm run lint
npm run build
cd ..
```

## Privacy checks

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

## Manual verification

* Vercel frontend URL
* Render backend health
* Clerk auth
* Supabase saved data
* dashboard
* analysis
* save/detail/search/delete/comparison/export
* resume profiles if present
* privacy/data-control page
* custom domain if configured
* mobile/responsive spot check

## Stop conditions

Stop if:

* DNS action is required
* env var action is required
* production deploy approval is required
* billing/account action is required
* secret/token is required
* provider dashboard action is required

## Expected final agent report

```text
Branch:
Files changed:
Prepared launch steps:
Human-only actions:
Checks run:
Privacy checks:
Manual verification checklist:
Blockers:
Suggested commit/PR title:
```

````